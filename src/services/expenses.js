import axios from '~/plugins/axiosConfig'
const PREFIX = 'expenses'
export const getExpenses = async () => {
  return  axios.get(PREFIX);
}
export const CreateExpense= async (payload) => {
  return  axios.post(PREFIX, payload);
}
export const getExpensesFromSubcategory = async (idSubcategory) => {
  return  axios.get(`${PREFIX}/subcategory/${idSubcategory}`);
}
export const deleteExpense = async (idExpense) => {
  return  axios.delete(`${PREFIX}/${idExpense}`);
}
