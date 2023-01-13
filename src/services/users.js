import axios from '~/plugins/axiosConfig'
const PREFIX = "users";
export  const  getUser = async(idUser) =>{
  return  axios.get(`${PREFIX}/${idUser}`)
}

export  const  changePassword = async(idUser, payload) =>{
  return  axios.put(`${PREFIX}/change-password/${idUser}`, payload)
}

export  const editUser = async(idUser, payload) =>{
  return  axios.put(`${PREFIX}/${idUser}`, payload,  {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

export  const createUser = async(payload) =>{
  return  axios.post(`${PREFIX}`, payload,  {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

export  const  getUsersList = async() =>{
  return  axios.get(`${PREFIX}`)
}