import { useClipboard } from 'core-react';
import { getErrorMessage } from '@/services/apiError';
import {
  addBoardMember,
  createBoardInvitation,
  removeBoardMember,
  revokeBoardInvitation,
  updateBoardMember,
} from '@/services/budget.api';
import {
  CalculatedBoard,
  CalculatedBoardMember,
  EditableMemberRole,
  InvitationChannel,
} from '@/types/budget.types';
import {
  Alert,
  Avatar,
  Badge,
  Button,
  ChoiceField,
  ConfirmDialog,
  Divider,
  Drawer,
  Flex,
  Icon,
  IconButton,
  Input,
  InputGroup,
  Label,
  ListGroup,
  SegmentedControl,
  TabContent,
  TabList,
  Tabs,
  TabTrigger,
  Text,
  TextField,
  Tooltip,
  useToast,
} from '@/ui/components';
import {
  MEMBER_ROLE_LABELS,
  MEMBER_STATUS_LABELS,
  percentToBasisPoints,
} from '@/utils/budget';
import { zodResolver } from '@hookform/resolvers/zod';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  AddMemberFormValues,
  addMemberSchema,
  InviteMemberFormValues,
  inviteMemberSchema,
} from '../budgetSchemas';

export interface MembersDrawerProps {
  isOpen: boolean;
  board: CalculatedBoard;
  onClose: () => void;
  onRefreshBoard: () => Promise<void>;
}

export const MembersDrawer: React.FC<MembersDrawerProps> = ({
  isOpen,
  board,
  onClose,
  onRefreshBoard,
}) => {
  const { success } = useToast();
  const { hasCopied, copy } = useClipboard();

  const [serverError, setServerError] = useState<string | null>(null);
  const [generatedLink, setGeneratedLink] = useState<{
    invitationId: string;
    url: string;
  } | null>(null);
  const [memberToRemove, setMemberToRemove] =
    useState<CalculatedBoardMember | null>(null);
  const [isRemovingMember, setIsRemovingMember] = useState(false);
  const [editingShareMemberId, setEditingShareMemberId] = useState<
    string | null
  >(null);
  const [sharePercentInput, setSharePercentInput] = useState('');
  const [isUpdatingMember, setIsUpdatingMember] = useState(false);

  const canManage = board.board.permissions.canManageMembers;
  const activeMembers = board.members.filter((m) => m.status !== 'left');

  const addMemberForm = useForm<AddMemberFormValues>({
    resolver: zodResolver(addMemberSchema),
    defaultValues: {
      displayName: '',
      email: '',
      role: 'editor',
    },
  });

  const inviteForm = useForm<InviteMemberFormValues>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: {
      channel: 'link',
      email: '',
      displayName: '',
      memberId: '',
      maxUses: 1,
      ttlDays: 7,
    },
  });

  const inviteChannel = inviteForm.watch('channel');

  const handleAddMember = async (values: AddMemberFormValues) => {
    setServerError(null);
    try {
      const response = await addBoardMember(board.boardId, {
        displayName: values.displayName.trim(),
        email: values.email.trim() || null,
        role: values.role,
      });
      success(
        response.invitationSent
          ? `Membre « ${response.member.displayName} » ajouté et invité par e-mail.`
          : `Membre « ${response.member.displayName} » ajouté au budget.`
      );
      addMemberForm.reset({ displayName: '', email: '', role: 'editor' });
      await onRefreshBoard();
    } catch (err) {
      setServerError(
        getErrorMessage(err, "Impossible d'ajouter ce membre au budget.")
      );
    }
  };

  const handleRoleChange = async (
    member: CalculatedBoardMember,
    nextRole: EditableMemberRole
  ) => {
    setServerError(null);
    try {
      await updateBoardMember(board.boardId, member.id, { role: nextRole });
      success(`Rôle de ${member.displayName} mis à jour.`);
      await onRefreshBoard();
    } catch (err) {
      setServerError(
        getErrorMessage(err, 'Impossible de modifier le rôle de ce membre.')
      );
    }
  };

  const handleSaveMemberShare = async (member: CalculatedBoardMember) => {
    setServerError(null);
    const parsed = Number(sharePercentInput.replace(',', '.'));
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
      setServerError('Veuillez saisir un pourcentage compris entre 0 et 100.');
      return;
    }

    try {
      setIsUpdatingMember(true);
      await updateBoardMember(board.boardId, member.id, {
        shareBasisPoints: percentToBasisPoints(parsed),
        effectiveFrom: board.period,
      });
      success(
        `Part de ${member.displayName} ajustée à ${parsed} % (reste redistribué).`
      );
      setEditingShareMemberId(null);
      await onRefreshBoard();
    } catch (err) {
      setServerError(
        getErrorMessage(err, 'Impossible de modifier la part de ce membre.')
      );
    } finally {
      setIsUpdatingMember(false);
    }
  };

  const handleConfirmRemoveMember = async () => {
    if (!memberToRemove) return;
    setServerError(null);
    try {
      setIsRemovingMember(true);
      await removeBoardMember(board.boardId, memberToRemove.id);
      success(`Le membre « ${memberToRemove.displayName} » a été retiré.`);
      setMemberToRemove(null);
      await onRefreshBoard();
    } catch (err) {
      setMemberToRemove(null);
      setServerError(
        getErrorMessage(err, 'Impossible de retirer ce membre du budget.')
      );
    } finally {
      setIsRemovingMember(false);
    }
  };

  const handleCreateInvitation = async (values: InviteMemberFormValues) => {
    setServerError(null);
    setGeneratedLink(null);
    try {
      const response = await createBoardInvitation(board.boardId, {
        channel: values.channel,
        email: values.channel === 'email' ? values.email.trim() : null,
        memberId: values.memberId || null,
        displayName: values.displayName.trim() || null,
        maxUses: values.maxUses,
        ttlDays: values.ttlDays,
      });

      if (response.url) {
        setGeneratedLink({
          invitationId: response.invitation.id,
          url: response.url,
        });
        success('Lien d’invitation généré.');
      } else {
        success(`Invitation envoyée à ${values.email}.`);
      }

      await onRefreshBoard();
    } catch (err) {
      setServerError(
        getErrorMessage(err, 'Impossible de créer cette invitation.')
      );
    }
  };

  const handleRevokeGeneratedLink = async () => {
    if (!generatedLink) return;
    try {
      await revokeBoardInvitation(board.boardId, generatedLink.invitationId);
      setGeneratedLink(null);
      success("L'invitation a été révoquée.");
    } catch (err) {
      setServerError(
        getErrorMessage(err, "Impossible de révoquer l'invitation.")
      );
    }
  };

  return (
    <>
      <Drawer isOpen={isOpen} onClose={onClose} placement="right" width="480px">
        <Drawer.Header title="Membres & Invitations" onClose={onClose} />
        <Drawer.Body>
          {serverError && (
            <div style={{ marginBottom: '1rem' }}>
              <Alert variant="danger" onClose={() => setServerError(null)}>
                {serverError}
              </Alert>
            </div>
          )}

          <Tabs defaultValue="members">
            <TabList>
              <TabTrigger value="members">
                <Icon name="account-multiple-outline" size={16} />
                <span>Membres ({activeMembers.length})</span>
              </TabTrigger>
              {canManage && (
                <TabTrigger value="invitations">
                  <Icon name="account-plus-outline" size={16} />
                  <span>Inviter</span>
                </TabTrigger>
              )}
            </TabList>

            <TabContent value="members">
              <ListGroup>
                {activeMembers.map((member) => {
                  const isOwner = member.role === 'owner';
                  const isMe = member.id === board.board.myMemberId;
                  const isEditingShare = editingShareMemberId === member.id;

                  return (
                    <ListGroup.Item key={member.id}>
                      <Flex
                        align="center"
                        justify="space-between"
                        gap="0.75rem"
                        wrap="wrap"
                      >
                        <Flex align="center" gap="0.75rem">
                          <Avatar name={member.displayName} size="sm" />
                          <div>
                            <Flex align="center" gap="0.5rem">
                              <Text weight="semibold" size="sm">
                                {member.displayName}
                              </Text>
                              {isMe && (
                                <Badge variant="primary" pill>
                                  Moi
                                </Badge>
                              )}
                            </Flex>
                            <Flex align="center" gap="0.5rem">
                              <Badge
                                variant={
                                  member.status === 'active'
                                    ? 'success'
                                    : 'warning'
                                }
                                pill
                              >
                                {MEMBER_STATUS_LABELS[member.status]}
                              </Badge>
                              <Text size="xs" color="muted">
                                {MEMBER_ROLE_LABELS[member.role]}
                              </Text>
                            </Flex>
                          </div>
                        </Flex>

                        {canManage && (
                          <Flex align="center" gap="0.25rem">
                            {!isOwner && (
                              <ChoiceField
                                aria-label={`Rôle de ${member.displayName}`}
                                value={member.role}
                                onChange={(e) =>
                                  handleRoleChange(
                                    member,
                                    e.target.value as EditableMemberRole
                                  )
                                }
                              >
                                <option value="editor">Éditeur</option>
                                <option value="viewer">Lecteur</option>
                              </ChoiceField>
                            )}

                            <Tooltip
                              content="Ajuster la part (%)"
                              placement="top"
                            >
                              <IconButton
                                name="percent-outline"
                                size="sm"
                                variant="ghost"
                                aria-label={`Ajuster la part de ${member.displayName}`}
                                onClick={() => {
                                  setEditingShareMemberId(
                                    isEditingShare ? null : member.id
                                  );
                                  setSharePercentInput('50');
                                }}
                              />
                            </Tooltip>

                            {!isOwner && (
                              <Tooltip
                                content="Retirer du budget"
                                placement="top"
                              >
                                <IconButton
                                  name="trash-can-outline"
                                  size="sm"
                                  variant="danger"
                                  aria-label={`Retirer ${member.displayName}`}
                                  onClick={() => setMemberToRemove(member)}
                                />
                              </Tooltip>
                            )}
                          </Flex>
                        )}
                      </Flex>

                      {isEditingShare && (
                        <div style={{ marginTop: '0.75rem' }}>
                          <Flex align="center" gap="0.5rem">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              placeholder="Part en %"
                              value={sharePercentInput}
                              onChange={(e) =>
                                setSharePercentInput(e.target.value)
                              }
                            />
                            <Button
                              type="button"
                              size="sm"
                              variant="primary"
                              loading={isUpdatingMember}
                              onClick={() => handleSaveMemberShare(member)}
                            >
                              Appliquer
                            </Button>
                          </Flex>
                        </div>
                      )}
                    </ListGroup.Item>
                  );
                })}
              </ListGroup>

              {canManage && (
                <>
                  <Divider margin="1.25rem 0" />
                  <form
                    onSubmit={addMemberForm.handleSubmit(handleAddMember)}
                    noValidate
                  >
                    <Text weight="semibold" size="sm">
                      Ajouter un membre local ou par e-mail
                    </Text>
                    <div style={{ marginTop: '0.75rem' }}>
                      <TextField
                        label="Prénom ou surnom"
                        placeholder="Ex : Camille"
                        required
                        error={
                          addMemberForm.formState.errors.displayName?.message
                        }
                        {...addMemberForm.register('displayName')}
                      />
                      <TextField
                        label="Adresse e-mail (optionnel)"
                        type="email"
                        placeholder="camille@example.com"
                        hint="Si renseignée, une invitation sera envoyée immédiatement."
                        error={addMemberForm.formState.errors.email?.message}
                        {...addMemberForm.register('email')}
                      />
                      <ChoiceField
                        label="Rôle"
                        error={addMemberForm.formState.errors.role?.message}
                        {...addMemberForm.register('role')}
                      >
                        <option value="editor">
                          Éditeur (peut gérer les postes)
                        </option>
                        <option value="viewer">
                          Lecteur (consultation seule)
                        </option>
                      </ChoiceField>
                      <Button
                        type="submit"
                        variant="primary"
                        fullWidth
                        loading={addMemberForm.formState.isSubmitting}
                      >
                        Ajouter au budget
                      </Button>
                    </div>
                  </form>
                </>
              )}
            </TabContent>

            {canManage && (
              <TabContent value="invitations">
                <form
                  onSubmit={inviteForm.handleSubmit(handleCreateInvitation)}
                  noValidate
                >
                  <div style={{ marginBottom: '1rem' }}>
                    <Label>Canal d'invitation</Label>
                    <SegmentedControl<InvitationChannel>
                      aria-label="Canal d'invitation"
                      fullWidth
                      size="sm"
                      options={[
                        {
                          value: 'link',
                          label: 'Lien partageable',
                          icon: 'link-variant',
                        },
                        {
                          value: 'email',
                          label: 'Par e-mail',
                          icon: 'email-outline',
                        },
                      ]}
                      value={inviteChannel}
                      onChange={(val) =>
                        inviteForm.setValue('channel', val, {
                          shouldValidate: true,
                        })
                      }
                    />
                  </div>

                  <ChoiceField
                    label="Rattacher à un membre existant (optionnel)"
                    hint="Permet de lier un membre local déjà présent dans le budget."
                    {...inviteForm.register('memberId')}
                  >
                    <option value="">Créer un nouveau membre</option>
                    {activeMembers
                      .filter((m) => !m.userId)
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.displayName} (non lié)
                        </option>
                      ))}
                  </ChoiceField>

                  <TextField
                    label="Nom affiché (si nouveau membre)"
                    placeholder="Ex : Bob"
                    error={inviteForm.formState.errors.displayName?.message}
                    {...inviteForm.register('displayName')}
                  />

                  {inviteChannel === 'email' && (
                    <TextField
                      label="E-mail du destinataire"
                      type="email"
                      required
                      placeholder="bob@example.com"
                      error={inviteForm.formState.errors.email?.message}
                      {...inviteForm.register('email')}
                    />
                  )}

                  <Flex gap="0.75rem">
                    <TextField
                      label="Utilisations max"
                      type="number"
                      min={1}
                      max={50}
                      error={inviteForm.formState.errors.maxUses?.message}
                      {...inviteForm.register('maxUses', {
                        valueAsNumber: true,
                      })}
                    />
                    <TextField
                      label="Validité (jours)"
                      type="number"
                      min={1}
                      max={30}
                      error={inviteForm.formState.errors.ttlDays?.message}
                      {...inviteForm.register('ttlDays', {
                        valueAsNumber: true,
                      })}
                    />
                  </Flex>

                  <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    loading={inviteForm.formState.isSubmitting}
                  >
                    {inviteChannel === 'link'
                      ? 'Générer le lien d’invitation'
                      : 'Envoyer l’invitation'}
                  </Button>
                </form>

                {generatedLink && (
                  <div style={{ marginTop: '1.25rem' }}>
                    <Alert variant="success" title="Lien d'invitation prêt">
                      Partagez ce lien avec votre proche. Pour des raisons de
                      sécurité, il ne sera affiché qu'une seule fois.
                    </Alert>
                    <div style={{ marginTop: '0.75rem' }}>
                      <InputGroup
                        rightAddon={
                          <IconButton
                            name={hasCopied ? 'check' : 'content-copy'}
                            size="sm"
                            variant="ghost"
                            aria-label="Copier le lien"
                            onClick={() => void copy(generatedLink.url)}
                          />
                        }
                      >
                        <Input readOnly value={generatedLink.url} />
                      </InputGroup>
                    </div>
                    <div style={{ marginTop: '0.5rem' }}>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleRevokeGeneratedLink}
                      >
                        Révoquer ce lien
                      </Button>
                    </div>
                  </div>
                )}
              </TabContent>
            )}
          </Tabs>
        </Drawer.Body>
        <Drawer.Footer>
          <Button type="button" variant="ghost" onClick={onClose}>
            Fermer
          </Button>
        </Drawer.Footer>
      </Drawer>

      <ConfirmDialog
        isOpen={Boolean(memberToRemove)}
        onClose={() => setMemberToRemove(null)}
        onConfirm={handleConfirmRemoveMember}
        title="Retirer ce membre ?"
        message={
          memberToRemove
            ? `Voulez-vous vraiment retirer « ${memberToRemove.displayName} » du budget ? Sa part sera redistribuée entre les membres restants.`
            : ''
        }
        confirmLabel="Retirer du budget"
        variant="danger"
        loading={isRemovingMember}
      />
    </>
  );
};
