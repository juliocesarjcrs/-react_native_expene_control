import axios from '~/plugins/axiosConfig'

export  const  getUser = async(idUser) =>{
  return await axios.get(`users/${idUser}`)
}