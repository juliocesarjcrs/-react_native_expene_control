import React from 'react';
import { StackNavigationProp } from '@react-navigation/stack';

// Services
import { getLastIncomesWithPaginate } from '~/services/incomes';

// Components
import LastTransactionsCard from './LastTransactionsCard';

// Types
import { IncomeStackParamList } from '~/shared/types';
import { LastIncomes } from '~/shared/types/services/income-service.type';

export type CardLastIncomesNavigationProp = StackNavigationProp<IncomeStackParamList, 'lastIncomes'>;

interface CardLastIncomesProps {
  navigation: CardLastIncomesNavigationProp;
}

export default function CardLastIncomes({ navigation }: CardLastIncomesProps) {
  return (
    <LastTransactionsCard<LastIncomes>
      title="Últimos ingresos"
      type="income"
      navigation={navigation}
      navigationScreen="lastIncomes"
      fetchFunction={getLastIncomesWithPaginate}
    />
  );
}