import axios from '~/plugins/axiosConfig'
const PREFIX = "users";
export  const  getUser = async(idUser) =>{
  return await axios.get(`${PREFIX}/${idUser}`)
}

export  const  changePassword = async(idUser, payload) =>{
  return await axios.put(`${PREFIX}/change-password/${idUser}`, payload)
}

export  const editUser = async(idUser, payload) =>{
  return await axios.put(`${PREFIX}/${idUser}`, payload,  {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}