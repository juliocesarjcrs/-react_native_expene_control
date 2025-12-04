import React from 'react';
import { StackNavigationProp } from '@react-navigation/stack';

// Services
import { deleteIncome } from '~/services/incomes';

// Components
import TransactionItemWithActions from '~/components/card/TransactionItemWithActions';

// Types
import { LastIncomes } from '~/shared/types/services/income-service.type';
import { IncomeStackParamList } from '~/shared/types';

type RenderItemNavigationProp = StackNavigationProp<IncomeStackParamList, 'lastIncomes'>;

interface RenderItemProps {
  item: LastIncomes;
  navigation: RenderItemNavigationProp;
  updateList: () => void;
}

export default function RenderItemIncome({ item, navigation, updateList }: RenderItemProps) {
  const handleEdit = (income: LastIncomes): void => {
    navigation.navigate('editIncome', { objectIncome: income });
  };

  return (
    <TransactionItemWithActions<LastIncomes>
      item={item}
      type="income"
      onEdit={handleEdit}
      onDelete={async (id: number) => {
        await deleteIncome(id);
        updateList();
      }}
      updateList={updateList}
    />
  );
}
