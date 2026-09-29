import React, { useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Icon } from 'react-native-elements';
import { useMutation } from '@apollo/client/react';

// Graphql
import { DELETE_LOAN } from '../../../graphql/mutations';

// Types
import { Loan } from '../../../shared/types/graphql/loan-query.type';

// Components
import MyIconButton from '~/components/buttons/MyIconButton';

// Utils
import { showError } from '~/utils/showError';
import { ShowToast } from '~/utils/toastUtils';
import { DateFormat, NumberFormat } from '../../../utils/Helpers';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { MEDIUM, SMALL } from '../../../styles/fonts';

interface LoanItemProps {
  item: Loan;
  isDeleting: boolean;
  onDelete: (id: string) => void;
}

const LoanItem: React.FC<LoanItemProps> = ({ item, isDeleting, onDelete }) => {
  const colors = useThemeColors();
  const [expanded, setExpanded] = useState<boolean>(false);

  const isLoan = item.type === 0;
  const typeColor = isLoan ? colors.PRIMARY : colors.INFO;
  const typeLabel = isLoan ? 'Préstamo' : 'Desfase';
  const typeIcon = isLoan ? 'cash-multiple' : 'swap-horizontal';
  const hasCommentary = Boolean(item.commentary?.trim());

  const confirmDelete = (): void => {
    Alert.alert('Confirmar eliminación', '¿Estás seguro de eliminar este préstamo?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => onDelete(String(item.id))
      }
    ]);
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.CARD_BACKGROUND,
          borderColor: colors.BORDER,
          borderLeftColor: typeColor
        }
      ]}
    >
      <View style={styles.row}>
        <View style={[styles.iconContainer, { backgroundColor: typeColor + '15' }]}>
          <Icon type="material-community" name={typeIcon} size={20} color={typeColor} />
        </View>

        <View style={styles.content}>
          <Text style={[styles.amount, { color: colors.TEXT_PRIMARY }]}>
            {NumberFormat(item.amount)}
          </Text>
          <View style={styles.metaRow}>
            <View style={[styles.badge, { backgroundColor: typeColor + '20' }]}>
              <Text style={[styles.badgeText, { color: typeColor }]}>{typeLabel}</Text>
            </View>
            <Text style={[styles.date, { color: colors.TEXT_SECONDARY }]}>
              {DateFormat(item.createdAt, 'DD MMM')} · {DateFormat(item.createdAt, 'hh:mm a')}
            </Text>
          </View>
        </View>

        <MyIconButton variant="delete" onPress={confirmDelete} loading={isDeleting} />
      </View>

      {hasCommentary && (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setExpanded((prev) => !prev)}
          style={[styles.commentaryContainer, { borderTopColor: colors.BORDER }]}
        >
          <Icon
            type="material-community"
            name="text"
            size={16}
            color={colors.TEXT_SECONDARY}
            containerStyle={styles.commentaryIcon}
          />
          <Text
            style={[styles.commentary, { color: colors.TEXT_SECONDARY }]}
            numberOfLines={expanded ? undefined : 2}
          >
            {item.commentary}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

interface FlatListLoansProps {
  loans: Loan[] | undefined;
  updateList: () => void;
}

const FlatListLoans: React.FC<FlatListLoansProps> = ({ loans, updateList }) => {
  const colors = useThemeColors();
  const [deleteLoanMutation] = useMutation(DELETE_LOAN);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const deleteItem = async (idLoan: string): Promise<void> => {
    try {
      setDeletingId(idLoan);
      await deleteLoanMutation({ variables: { deleteLoanId: Number(idLoan) } });
      updateList();
      ShowToast('Préstamo eliminado');
    } catch (e) {
      showError(e);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <FlatList
      data={loans}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <LoanItem item={item} isDeleting={deletingId === String(item.id)} onDelete={deleteItem} />
      )}
      contentContainerStyle={styles.listContent}
      keyboardShouldPersistTaps="handled"
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Icon
            type="material-community"
            name="cash-remove"
            size={48}
            color={colors.TEXT_SECONDARY}
          />
          <Text style={[styles.emptyText, { color: colors.TEXT_SECONDARY }]}>
            No hay préstamos registrados
          </Text>
        </View>
      }
    />
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingTop: 8,
    paddingBottom: 20
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderLeftWidth: 3,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  content: {
    flex: 1,
    gap: 4
  },
  amount: {
    fontSize: MEDIUM,
    fontWeight: '600'
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8
  },
  badge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2
  },
  badgeText: {
    fontSize: SMALL - 1,
    fontWeight: '600'
  },
  date: {
    fontSize: SMALL
  },
  commentaryContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth
  },
  commentaryIcon: {
    marginTop: 2
  },
  commentary: {
    flex: 1,
    fontSize: SMALL + 1
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40
  },
  emptyText: {
    fontSize: SMALL + 2,
    marginTop: 12,
    textAlign: 'center'
  }
});

export default FlatListLoans;
