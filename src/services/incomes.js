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