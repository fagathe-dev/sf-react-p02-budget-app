import { getErrorMessage, getFieldErrors } from '@/services/apiError';
import {
  closeExpenseGroup,
  updateExpenseGroup,
} from '@/services/expenseSplitter.api';
import { ExpenseGroupDetail } from '@/types/expenseSplitter.types';
import {
  Alert,
  Button,
  ConfirmDialog,
  Divider,
  Flex,
  Icon,
  Modal,
  Text,
  TextField,
  useToast,
} from '@/ui/components';
import { zodResolver } from '@hookform/resolvers/zod';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  UpdateExpenseGroupFormValues,
  updateExpenseGroupSchema,
} from '../expenseSplitterSchemas';

export interface GroupSettingsModalProps {
  isOpen: boolean;
  groupDetail: ExpenseGroupDetail;
  canCloseGroup: boolean;
  onClose: () => void;
  onUpdated: (updated: ExpenseGroupDetail) => void;
  onClosedGroup: () => void;
}

export const GroupSettingsModal: React.FC<GroupSettingsModalProps> = ({
  isOpen,
  groupDetail,
  canCloseGroup,
  onClose,
  onUpdated,
  onClosedGroup,
}) => {
  const { success } = useToast();
  const [serverError, setServerError] = useState<string | null>(null);
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<UpdateExpenseGroupFormValues>({
    resolver: zodResolver(updateExpenseGroupSchema),
    defaultValues: {
      name: groupDetail.group.name,
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    setServerError(null);
    reset({ name: groupDetail.group.name });
  }, [isOpen, groupDetail.group.name, reset]);

  const onSubmit = async (values: UpdateExpenseGroupFormValues) => {
    setServerError(null);
    try {
      const updated = await updateExpenseGroup(groupDetail.group.id, {
        name: values.name.trim(),
      });
      success('Nom du groupe mis à jour.');
      onUpdated(updated);
      onClose();
    } catch (err) {
      const fieldErrors = getFieldErrors(err);
      if (fieldErrors.name) {
        setError('name', { message: fieldErrors.name });
      }
      setServerError(
        getErrorMessage(err, 'Impossible de modifier ce groupe de dépenses.')
      );
    }
  };

  const handleConfirmClose = async () => {
    setServerError(null);
    try {
      setIsClosing(true);
      await closeExpenseGroup(groupDetail.group.id);
      success(`Le groupe « ${groupDetail.group.name} » a été clôturé.`);
      setConfirmCloseOpen(false);
      onClose();
      onClosedGroup();
    } catch (err) {
      setConfirmCloseOpen(false);
      setServerError(
        getErrorMessage(err, 'Impossible de clôturer ce groupe de dépenses.')
      );
    } finally {
      setIsClosing(false);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} maxWidth="500px">
        <Modal.Header title="Paramètres du groupe" onClose={onClose} />
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <Modal.Body>
            {serverError && (
              <div style={{ marginBottom: '1rem' }}>
                <Alert variant="danger" onClose={() => setServerError(null)}>
                  {serverError}
                </Alert>
              </div>
            )}

            <TextField
              label="Nom du groupe"
              required
              error={errors.name?.message}
              {...register('name')}
            />

            {canCloseGroup && (
              <>
                <Divider margin="1.25rem 0" />
                <Flex
                  align="center"
                  justify="space-between"
                  gap="1rem"
                  wrap="wrap"
                >
                  <div>
                    <Text weight="semibold" size="sm" color="danger">
                      Clôturer ce groupe de dépenses
                    </Text>
                    <Text as="p" size="xs">
                      Archive le groupe une fois les comptes soldés.
                    </Text>
                  </div>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => setConfirmCloseOpen(true)}
                  >
                    <Icon name="archive-outline" size={16} />
                    <span>Clôturer</span>
                  </Button>
                </Flex>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button type="submit" variant="primary" loading={isSubmitting}>
              Enregistrer
            </Button>
          </Modal.Footer>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={confirmCloseOpen}
        onClose={() => setConfirmCloseOpen(false)}
        onConfirm={handleConfirmClose}
        title="Clôturer ce groupe de dépenses ?"
        message={`Voulez-vous vraiment clôturer « ${groupDetail.group.name} » ? Il sera archivé pour tous les participants.`}
        confirmLabel="Clôturer le groupe"
        variant="danger"
        loading={isClosing}
      />
    </>
  );
};
