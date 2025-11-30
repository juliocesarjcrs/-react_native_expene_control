import React from 'react';
import { StackNavigationProp } from '@react-navigation/stack';

// Services
import { getLastExpensesWithPaginate } from '~/services/expenses';

// Components

// Types
import { LastExpense } from '~/shared/types/services/expense-service.type';
import { ExpenseStackParamList } from '~/shared/types';
import LastTransactionsCard from './LastTransactionsCard';

export type CardLastExpensesNavigationProp = StackNavigationProp<ExpenseStackParamList, 'lastExpenses'>;

interface CardLastExpensesProps {
  navigation: CardLastExpensesNavigationProp;
}

export default function CardLastExpenses({ navigation }: CardLastExpensesProps) {
  return (
    <LastTransactionsCard<LastExpense>
      title="Últimos gastos"
      type="expense"
      navigation={navigation}
      navigationScreen="lastExpenses"
      fetchFunction={getLastExpensesWithPaginate}
    />
  );
}