import axios from '~/plugins/axiosConfig'
const PREFIX = 'saving'


export const getSavingsByUser = async (params) => {
  return  axios.get(PREFIX, {params});
}

export const getUpdateAllSavingsByUser = async (params) => {
  return  axios.get(`${PREFIX}/update`, {params});
}
