/**
 * Adaptador: trae los ingresos de UNA categoría en un rango de fechas.
 * Ubicación: src/Screens/Statistics/commentary-analysis/asset/hooks/assetIncomes.adapter.ts
 *
 * Usa findIncomesByCategoryId (GET incomes/by-category/:id). La conversión del ingreso
 * (monto en `cost` o `amount`, fecha, comentario) está en toRawIncome, con tests.
 */
import { findIncomesByCategoryId } from '~/services/incomes';
import { RawRecord, toRawIncome } from '~/utils/commentaryParser/assetData.utils';

export const fetchAssetIncomes = async (
  categoryId: number,
  startDate: Date,
  endDate: Date
): Promise<RawRecord[]> => {
  const { data } = await findIncomesByCategoryId(categoryId, {
    startDate,
    endDate,
    orderBy: 'date',
    order: 'ASC'
  });
  return data.incomes.map(toRawIncome);
};
