import { useBudget } from '@/hooks/useBudget';
import { getErrorMessage, getFieldErrors } from '@/services/apiError';
import { createTag, deleteTag, updateTag } from '@/services/budget.api';
import { Tag } from '@/types/budget.types';
import {
  Alert,
  Badge,
  Button,
  Card,
  ChoiceField,
  Col,
  ConfirmDialog,
  EmptyState,
  Flex,
  Icon,
  IconButton,
  Lead,
  Modal,
  Row,
  Table,
  Tbody,
  Td,
  Text,
  TextField,
  Th,
  Thead,
  Title,
  Tooltip,
  TRow,
  useToast,
} from '@/ui/components';
import { TAG_COLOR_PALETTE } from '@/utils/budget';
import { zodResolver } from '@hookform/resolvers/zod';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { TagFormValues, tagFormSchema } from './budgetSchemas';

export const TagsPage: React.FC = () => {
  const { success } = useToast();
  const { sharedBoards, tags, loadBoards, loadTags } = useBudget();

  const [selectedBoardId, setSelectedBoardId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [deletingTag, setDeletingTag] = useState<Tag | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const createForm = useForm<TagFormValues>({
    resolver: zodResolver(tagFormSchema),
    defaultValues: {
      name: '',
      color: 'blue',
    },
  });

  const editForm = useForm<TagFormValues>({
    resolver: zodResolver(tagFormSchema),
    defaultValues: {
      name: '',
      color: 'blue',
    },
  });

  useEffect(() => {
    void loadBoards();
  }, [loadBoards]);

  useEffect(() => {
    setError(null);
    loadTags(selectedBoardId || undefined).catch((err) => {
      setError(getErrorMessage(err, 'Impossible de charger les tags.'));
    });
  }, [selectedBoardId, loadTags]);

  const displayedTags = selectedBoardId
    ? tags.filter((t) => t.boardId === selectedBoardId || t.scope === 'user')
    : tags.filter((t) => t.scope === 'user');

  const currentScopeTags = selectedBoardId
    ? tags.filter((t) => t.boardId === selectedBoardId)
    : tags.filter((t) => t.scope === 'user');

  const usedColors = new Set(currentScopeTags.map((t) => t.color));

  const handleCreateTag = async (values: TagFormValues) => {
    setError(null);
    try {
      const created = await createTag({
        name: values.name.trim(),
        color: values.color,
        boardId: selectedBoardId || null,
      });
      success(`Tag « ${created.name} » créé.`);
      createForm.reset({ name: '', color: 'blue' });
      await loadTags(selectedBoardId || undefined);
    } catch (err) {
      const fieldErrors = getFieldErrors(err);
      if (fieldErrors.name) {
        createForm.setError('name', { message: fieldErrors.name });
      }
      if (fieldErrors.color) {
        createForm.setError('color', { message: fieldErrors.color });
      }
      setError(getErrorMessage(err, 'Impossible de créer ce tag.'));
    }
  };

  const openEditModal = (tag: Tag) => {
    setEditingTag(tag);
    editForm.reset({
      name: tag.name,
      color: tag.color,
    });
  };

  const handleUpdateTag = async (values: TagFormValues) => {
    if (!editingTag) return;
    setError(null);
    try {
      const updated = await updateTag(editingTag.id, {
        name: values.name.trim(),
        color: values.color,
      });
      success(`Tag « ${updated.name} » mis à jour.`);
      setEditingTag(null);
      await loadTags(selectedBoardId || undefined);
    } catch (err) {
      setError(getErrorMessage(err, 'Impossible de modifier ce tag.'));
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingTag) return;
    setError(null);
    try {
      setIsDeleting(true);
      await deleteTag(deletingTag.id);
      success(`Tag « ${deletingTag.name} » supprimé.`);
      setDeletingTag(null);
      await loadTags(selectedBoardId || undefined);
    } catch (err) {
      setDeletingTag(null);
      setError(getErrorMessage(err, 'Impossible de supprimer ce tag.'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Flex direction="column" gap="1.5rem">
      <Flex align="center" justify="space-between" gap="1rem" wrap="wrap">
        <div>
          <Title as="h2">Tags & Catégories</Title>
          <Lead>
            Organisez vos postes budgétaires avec jusqu'à 13 couleurs distinctes par espace.
          </Lead>
        </div>

        {sharedBoards.length > 0 && (
          <div style={{ minWidth: '260px' }}>
            <ChoiceField
              label="Périmètre des tags"
              value={selectedBoardId}
              onChange={(e) => setSelectedBoardId(e.target.value)}
            >
              <option value="">Mes tags personnels</option>
              {sharedBoards.map((board) => (
                <option key={board.id} value={board.id}>
                  Budget partagé : {board.name}
                </option>
              ))}
            </ChoiceField>
          </div>
        )}
      </Flex>

      {error && (
        <Alert variant="danger" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Row gutter="1.5rem">
        {/* Formulaire de création */}
        <Col span={12} lg={4}>
          <Card bordered elevation="sm">
            <Card.Header>
              <Card.Title>Nouveau tag</Card.Title>
            </Card.Header>
            <Card.Body>
              <form
                onSubmit={createForm.handleSubmit(handleCreateTag)}
                noValidate
              >
                <TextField
                  label="Nom du tag"
                  placeholder="Ex : Logement, Loisirs, Abonnements…"
                  required
                  maxLength={50}
                  error={createForm.formState.errors.name?.message}
                  {...createForm.register('name')}
                />

                <ChoiceField
                  label="Couleur (13 couleurs disponibles)"
                  required
                  error={createForm.formState.errors.color?.message}
                  {...createForm.register('color')}
                >
                  {TAG_COLOR_PALETTE.map((c) => (
                    <option
                      key={c.value}
                      value={c.value}
                      disabled={usedColors.has(c.value)}
                    >
                      {c.label} {usedColors.has(c.value) ? '(déjà utilisée)' : ''}
                    </option>
                  ))}
                </ChoiceField>

                <Flex gap="0.35rem" wrap="wrap" style={{ marginBottom: '1rem' }}>
                  {TAG_COLOR_PALETTE.map((c) => (
                    <Badge key={c.value} color={c.hex} pill>
                      {c.label}
                    </Badge>
                  ))}
                </Flex>

                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  loading={createForm.formState.isSubmitting}
                  disabled={currentScopeTags.length >= 13}
                >
                  <Icon name="plus" size={16} />
                  <span>Créer le tag ({currentScopeTags.length}/13)</span>
                </Button>
              </form>
            </Card.Body>
          </Card>
        </Col>

        {/* Liste des tags */}
        <Col span={12} lg={8}>
          <Card bordered elevation="sm">
            <Card.Header>
              <Card.Title>
                Tags disponibles ({displayedTags.length})
              </Card.Title>
            </Card.Header>
            <Card.Body>
              {displayedTags.length === 0 ? (
                <EmptyState
                  icon="tag-multiple-outline"
                  title="Aucun tag créé"
                  description="Créez votre premier tag à gauche pour catégoriser vos postes et visualiser la répartition par catégorie."
                />
              ) : (
                <Table hoverable bordered>
                  <Thead>
                    <TRow>
                      <Th>Aperçu</Th>
                      <Th>Portée</Th>
                      <Th>Couleur</Th>
                      <Th align="right" width="110px">
                        Actions
                      </Th>
                    </TRow>
                  </Thead>
                  <Tbody>
                    {displayedTags.map((tag) => {
                      const paletteEntry = TAG_COLOR_PALETTE.find(
                        (p) => p.value === tag.color
                      );
                      return (
                        <TRow key={tag.id}>
                          <Td>
                            <Badge color={tag.hex} pill>
                              {tag.name}
                            </Badge>
                          </Td>
                          <Td>
                            <Badge
                              variant={
                                tag.scope === 'board' ? 'info' : 'neutral'
                              }
                              pill
                            >
                              {tag.scope === 'board'
                                ? 'Budget partagé'
                                : 'Personnel'}
                            </Badge>
                          </Td>
                          <Td>
                            <Text size="xs" color="muted">
                              {paletteEntry?.label ?? tag.color} ({tag.hex})
                            </Text>
                          </Td>
                          <Td align="right">
                            <Flex justify="flex-end" gap="0.25rem">
                              <Tooltip content="Modifier" placement="top">
                                <IconButton
                                  name="pencil-outline"
                                  size="sm"
                                  variant="ghost"
                                  aria-label={`Modifier le tag ${tag.name}`}
                                  onClick={() => openEditModal(tag)}
                                />
                              </Tooltip>
                              <Tooltip content="Supprimer" placement="top">
                                <IconButton
                                  name="trash-can-outline"
                                  size="sm"
                                  variant="danger"
                                  aria-label={`Supprimer le tag ${tag.name}`}
                                  onClick={() => setDeletingTag(tag)}
                                />
                              </Tooltip>
                            </Flex>
                          </Td>
                        </TRow>
                      );
                    })}
                  </Tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modale d'édition */}
      <Modal
        isOpen={Boolean(editingTag)}
        onClose={() => setEditingTag(null)}
        maxWidth="440px"
      >
        <Modal.Header
          title="Modifier le tag"
          onClose={() => setEditingTag(null)}
        />
        <form onSubmit={editForm.handleSubmit(handleUpdateTag)} noValidate>
          <Modal.Body>
            <TextField
              label="Nom du tag"
              required
              maxLength={50}
              error={editForm.formState.errors.name?.message}
              {...editForm.register('name')}
            />
            <ChoiceField
              label="Couleur"
              required
              error={editForm.formState.errors.color?.message}
              {...editForm.register('color')}
            >
              {TAG_COLOR_PALETTE.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </ChoiceField>
          </Modal.Body>
          <Modal.Footer>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setEditingTag(null)}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={editForm.formState.isSubmitting}
            >
              Enregistrer
            </Button>
          </Modal.Footer>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deletingTag)}
        onClose={() => setDeletingTag(null)}
        onConfirm={handleConfirmDelete}
        title="Supprimer ce tag ?"
        message={
          deletingTag
            ? `Voulez-vous vraiment supprimer le tag « ${deletingTag.name} » ? Il sera retiré de tous les postes associés.`
            : ''
        }
        confirmLabel="Supprimer"
        variant="danger"
        loading={isDeleting}
      />
    </Flex>
  );
};
