import { useClipboard } from 'core-react';
import {
  AddMemberFormValues,
  addMemberSchema,
  InviteMemberFormValues,
  inviteMemberSchema,
} from '@/pages/budget/budgetSchemas';
import { getErrorMessage } from '@/services/apiError';
import {
  addBoardMember,
  createBoardInvitation,
  removeBoardMember,
  revokeBoardInvitation,
} from '@/services/budget.api';
import { BoardMember, InvitationChannel } from '@/types/budget.types';
import { ExpenseGroupDetail } from '@/types/expenseSplitter.types';
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
import { MEMBER_ROLE_LABELS, MEMBER_STATUS_LABELS } from '@/utils/budget';
import { zodResolver } from '@hookform/resolvers/zod';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';

export interface GroupParticipantsDrawerProps {
  isOpen: boolean;
  groupDetail: ExpenseGroupDetail;
  canManage: boolean;
  onClose: () => void;
  onRefreshGroup: () => Promise<void>;
}

export const GroupParticipantsDrawer: React.FC<
  GroupParticipantsDrawerProps
> = ({ isOpen, groupDetail, canManage, onClose, onRefreshGroup }) => {
  const { success } = useToast();
  const { hasCopied, copy } = useClipboard();

  const [serverError, setServerError] = useState<string | null>(null);
  const [generatedLink, setGeneratedLink] = useState<{
    invitationId: string;
    url: string;
  } | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<BoardMember | null>(
    null
  );
  const [isRemoving, setIsRemoving] = useState(false);

  const activeMembers = groupDetail.members.filter((m) => m.status !== 'left');

  const addForm = useForm<AddMemberFormValues>({
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

  const handleAddParticipant = async (values: AddMemberFormValues) => {
    setServerError(null);
    try {
      const response = await addBoardMember(groupDetail.group.id, {
        displayName: values.displayName.trim(),
        email: values.email.trim() || null,
        role: values.role,
      });
      success(
        response.invitationSent
          ? `Participant « ${response.member.displayName} » ajouté et invité par e-mail.`
          : `Participant « ${response.member.displayName} » ajouté au groupe.`
      );
      addForm.reset({ displayName: '', email: '', role: 'editor' });
      await onRefreshGroup();
    } catch (err) {
      setServerError(
        getErrorMessage(err, "Impossible d'ajouter ce participant.")
      );
    }
  };

  const handleConfirmRemove = async () => {
    if (!memberToRemove) return;
    setServerError(null);
    try {
      setIsRemoving(true);
      await removeBoardMember(groupDetail.group.id, memberToRemove.id);
      success(`Participant « ${memberToRemove.displayName} » retiré.`);
      setMemberToRemove(null);
      await onRefreshGroup();
    } catch (err) {
      setMemberToRemove(null);
      setServerError(
        getErrorMessage(err, 'Impossible de retirer ce participant.')
      );
    } finally {
      setIsRemoving(false);
    }
  };

  const handleCreateInvitation = async (values: InviteMemberFormValues) => {
    setServerError(null);
    setGeneratedLink(null);
    try {
      const response = await createBoardInvitation(groupDetail.group.id, {
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
        success('Lien de partage généré.');
      } else {
        success(`Invitation envoyée à ${values.email}.`);
      }

      await onRefreshGroup();
    } catch (err) {
      setServerError(
        getErrorMessage(err, 'Impossible de générer cette invitation.')
      );
    }
  };

  const handleRevokeLink = async () => {
    if (!generatedLink) return;
    try {
      await revokeBoardInvitation(
        groupDetail.group.id,
        generatedLink.invitationId
      );
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
      <Drawer isOpen={isOpen} onClose={onClose} placement="right" width="460px">
        <Drawer.Header
          title="Participants & Invitations"
          onClose={onClose}
        />
        <Drawer.Body>
          {serverError && (
            <div style={{ marginBottom: '1rem' }}>
              <Alert variant="danger" onClose={() => setServerError(null)}>
                {serverError}
              </Alert>
            </div>
          )}

          <Tabs defaultValue="participants">
            <TabList>
              <TabTrigger value="participants">
                <Icon name="account-group-outline" size={16} />
                <span>Participants ({activeMembers.length})</span>
              </TabTrigger>
              {canManage && (
                <TabTrigger value="invite">
                  <Icon name="account-plus-outline" size={16} />
                  <span>Inviter</span>
                </TabTrigger>
              )}
            </TabList>

            <TabContent value="participants">
              <ListGroup>
                {activeMembers.map((member) => {
                  const isOwner = member.role === 'owner';
                  const isMe = member.id === groupDetail.myMemberId;

                  return (
                    <ListGroup.Item key={member.id}>
                      <Flex
                        align="center"
                        justify="space-between"
                        gap="0.75rem"
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

                        {canManage && !isOwner && (
                          <Tooltip content="Retirer du groupe" placement="top">
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
                    </ListGroup.Item>
                  );
                })}
              </ListGroup>

              {canManage && (
                <>
                  <Divider margin="1.25rem 0" />
                  <form
                    onSubmit={addForm.handleSubmit(handleAddParticipant)}
                    noValidate
                  >
                    <Text weight="semibold" size="sm">
                      Ajouter un participant
                    </Text>
                    <div style={{ marginTop: '0.75rem' }}>
                      <TextField
                        label="Prénom ou surnom"
                        placeholder="Ex : Camille"
                        required
                        error={addForm.formState.errors.displayName?.message}
                        {...addForm.register('displayName')}
                      />
                      <TextField
                        label="Adresse e-mail (optionnel)"
                        type="email"
                        placeholder="camille@example.com"
                        error={addForm.formState.errors.email?.message}
                        {...addForm.register('email')}
                      />
                      <Button
                        type="submit"
                        variant="primary"
                        fullWidth
                        loading={addForm.formState.isSubmitting}
                      >
                        Ajouter au groupe
                      </Button>
                    </div>
                  </form>
                </>
              )}
            </TabContent>

            {canManage && (
              <TabContent value="invite">
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
                    label="Rattacher à un participant existant"
                    hint="Permet à un ami de reprendre son profil déjà créé dans le groupe."
                    {...inviteForm.register('memberId')}
                  >
                    <option value="">Créer un nouveau participant</option>
                    {activeMembers
                      .filter((m) => !m.isLinked)
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.displayName} (invité local)
                        </option>
                      ))}
                  </ChoiceField>

                  <TextField
                    label="Nom affiché (si nouveau participant)"
                    placeholder="Ex : Alex"
                    error={inviteForm.formState.errors.displayName?.message}
                    {...inviteForm.register('displayName')}
                  />

                  {inviteChannel === 'email' && (
                    <TextField
                      label="E-mail du destinataire"
                      type="email"
                      required
                      placeholder="alex@example.com"
                      error={inviteForm.formState.errors.email?.message}
                      {...inviteForm.register('email')}
                    />
                  )}

                  <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    loading={inviteForm.formState.isSubmitting}
                  >
                    {inviteChannel === 'link'
                      ? 'Générer le lien de partage'
                      : 'Envoyer l’invitation'}
                  </Button>
                </form>

                {generatedLink && (
                  <div style={{ marginTop: '1.25rem' }}>
                    <Alert variant="success" title="Lien prêt à partager">
                      Copiez ce lien et envoyez-le aux participants du groupe.
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
                        onClick={handleRevokeLink}
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
        onConfirm={handleConfirmRemove}
        title="Retirer ce participant ?"
        message={
          memberToRemove
            ? `Voulez-vous vraiment retirer « ${memberToRemove.displayName} » de ce groupe de dépenses ?`
            : ''
        }
        confirmLabel="Retirer"
        variant="danger"
        loading={isRemoving}
      />
    </>
  );
};
