// customHooks/useDeleteCategory.ts
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { deleteCategory, getCategoryUsage } from '~/services/categories';
import { showError } from '~/utils/showError';
import { ShowToast } from '~/utils/toastUtils';
import { CategoryModel } from '~/shared/types';

const confirm = (title: string, message: string): Promise<boolean> =>
  new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Eliminar', style: 'destructive', onPress: () => resolve(true) }
      ],
      { cancelable: true, onDismiss: () => resolve(false) }
    );
  });

export function useDeleteCategory(onDeleted: () => void) {
  const [busyId, setBusyId] = useState<number | null>(null);

  const requestDelete = useCallback(
    async (category: CategoryModel): Promise<void> => {
      if (busyId !== null) return;
      setBusyId(category.id);

      try {
        const { data: usage } = await getCategoryUsage(category.id);

        if (usage.expenses > 0 || usage.incomes > 0) {
          const parts = [
            usage.expenses > 0 && `${usage.expenses} gasto(s)`,
            usage.incomes > 0 && `${usage.incomes} ingreso(s)`
          ].filter(Boolean);
          Alert.alert(
            'No se puede eliminar',
            `"${category.name}" tiene ${parts.join(' y ')} asociados. ` +
              'Elimínalos o muévelos a otra categoría primero.'
          );
          return;
        }

        const extra =
          usage.subcategories > 0
            ? `\n\nTambién se eliminarán sus ${usage.subcategories} subcategoría(s) vacías.`
            : '';

        const accepted = await confirm(
          'Eliminar categoría',
          `¿Eliminar "${category.name}"?${extra}`
        );
        if (!accepted) return;

        await deleteCategory(category.id);
        ShowToast('Categoría eliminada');
        onDeleted();
      } catch (error) {
        showError(error); // cubre el 409 si alguien creó datos entre la consulta y el borrado
      } finally {
        setBusyId(null);
      }
    },
    [busyId, onDeleted]
  );

  return { requestDelete, busyId };
}
