import axios from '~/plugins/axiosConfig'
const PREFIX = 'expenses'
export const getLastExpenses = async (params) => {
  return  axios.get(PREFIX,{params});
}
export const CreateExpense= async (payload) => {
  return  axios.post(PREFIX, payload);
}
export const getExpensesFromSubcategory = async (idSubcategory, month) => {
  return  axios.get(`${PREFIX}/subcategory/${idSubcategory}`,{params: {
    date: month
  }});
}
export const getExpensesLastMonthsFromSubcategory = async (idSubcategory,params) => {
  return  axios.get(`${PREFIX}/subcategory/${idSubcategory}/last`,{params});
}

export const findLastMonthsFromOnlyCategory = async (idCategory, params) => {
  return  axios.get(`${PREFIX}/category/${idCategory}`,{params});
}

export const deleteExpense = async (idExpense) => {
  return  axios.delete(`${PREFIX}/${idExpense}`);
}

export const getLastExpensesWithPaginate = async (params= {}) => {
  return  axios.get(`${PREFIX}/last`,{params});
}

export const getOneExpense = async (idExpense) => {
  return  axios.get(`${PREFIX}/${idExpense}`);
}

export const editExpense = async (idExpense, payload) => {
  return  axios.put(`${PREFIX}/${idExpense}`,payload);
}


