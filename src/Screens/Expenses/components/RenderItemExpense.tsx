import React from 'react';
import { StackNavigationProp } from '@react-navigation/stack';

// Services
import { deleteExpense } from '~/services/expenses';

// Components
import TransactionItemWithActions from '~/components/card/TransactionItemWithActions';

// Types
import { ExtendedExpenseModel } from '~/shared/types/models/expense.type';
import { ExpenseStackParamList } from '~/shared/types';

type RenderItemNavigationProp = StackNavigationProp<ExpenseStackParamList, 'lastExpenses'>;

interface RenderItemProps {
  item: ExtendedExpenseModel;
  navigation: RenderItemNavigationProp;
  updateList: () => void;
}

export default function RenderItemExpense({ item, navigation, updateList }: RenderItemProps) {
  const handleEdit = (expense: ExtendedExpenseModel): void => {
    navigation.navigate('editExpense', { objectExpense: expense });
  };

  return (
    <TransactionItemWithActions<ExtendedExpenseModel>
      item={item}
      type="expense"
      onEdit={handleEdit}
      onDelete={async (id: number) => {
        await deleteExpense(id);
        updateList();
      }}
      updateList={updateList}
    />
  );
}
