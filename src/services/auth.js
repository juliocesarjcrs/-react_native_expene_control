import axios from '~/plugins/axiosConfig'

export  const  login = async(payload) =>{
  return await axios.post('auth/login', payload)

}
