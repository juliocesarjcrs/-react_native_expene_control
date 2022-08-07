import axios from '~/plugins/axiosConfig'
const PREFIX = 'incomes'

export const getIncomesByDate = async (month) => {
  return  axios.get(`${PREFIX}`,{params: {
    date: month
  }});
}

export const CreateIncome = async (payload) => {
  return  axios.post(PREFIX, payload);
}

export const deleteIncome= async (idIncome) => {
  return  axios.delete(`${PREFIX}/${idIncome}`);
}

export const getLastIncomes = async (params) => {
  return  axios.get(PREFIX, {params});
}

export const getLastIncomesWithPaginate = async (params= {}) => {
  return  axios.get(`${PREFIX}/last`,{params});
}

export const editIncome = async (idIncome, payload) => {
  return  axios.put(`${PREFIX}/${idIncome}`,payload);
}
export const findLastIncomesMonthsFromOnlyCategory = async (idCategory, params) => {
  return  axios.get(`${PREFIX}/category/${idCategory}`,{params});
}
