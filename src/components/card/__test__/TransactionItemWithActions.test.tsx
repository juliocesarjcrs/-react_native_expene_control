import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { deleteIncome } from '~/services/incomes';
import RenderItemIncome from '~/Screens/Incomes/components/RenderItemIncome';

jest.mock('~/services/incomes', () => ({
  deleteIncome: jest.fn()
}));

let capturedOnDelete: ((id: number) => Promise<void>) | undefined;

jest.mock('~/components/card/TransactionItemWithActions', () => {
  return ({ onDelete }: { onDelete: (id: number) => Promise<void> }) => {
    capturedOnDelete = onDelete;
    return null;
  };
});

describe('RenderItemIncome', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not refresh list inside onDelete callback', async () => {
    const updateList = jest.fn();

    render(
      <RenderItemIncome
        item={{
          id: 1,
          cost: 1000,
          commentary: '',
          createdAt: new Date().toISOString(),
          dateFormat: new Date().toISOString(),
          date: new Date().toISOString(),
          category: 'Salary',
          idCategory: 1,
          iconCategory: ''
        }}
        navigation={
          {
            navigate: jest.fn()
          } as never
        }
        updateList={updateList}
      />
    );

    expect(capturedOnDelete).toBeDefined();

    (deleteIncome as jest.Mock).mockResolvedValue(undefined);

    await capturedOnDelete!(1);

    await waitFor(() => {
      expect(deleteIncome).toHaveBeenCalledWith(1);
    });

    // Este es el comportamiento correcto esperado
    expect(updateList).not.toHaveBeenCalled();
  });
});
