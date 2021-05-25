import axios from '~/plugins/axiosConfig'
const PREFIX = 'expenses'
export const getExpenses = async () => {
  return  axios.get(PREFIX);
}
export const CreateExpense= async (payload) => {
  console.log('AXIOS', payload);
  return  axios.post(PREFIX, payload);
}
export const getExpensesFromSubcategory = async (idSubcategory, month) => {
  return  axios.get(`${PREFIX}/subcategory/${idSubcategory}`,{params: {
    date: month
  }});
}
export const deleteExpense = async (idExpense) => {
  return  axios.delete(`${PREFIX}/${idExpense}`);
}
