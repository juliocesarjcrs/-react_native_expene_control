import axios from '~/plugins/axiosConfig'
const PREFIX = "auth";

export  const  login = async(payload) =>{
  return await axios.post(`${PREFIX}/login`, payload)
}

export  const  forgotPassword = async(payload) =>{
  return await axios.post(`${PREFIX}/forgot-password`, payload)
}

export  const  checkRecoverycode = async(idUser, params) =>{
  return await axios.get(`${PREFIX}/check-recovery-code/${idUser}`, { params } )
}

export  const  passwordRecovery = async(idUser,payload) =>{
  return await axios.put(`${PREFIX}/password-recovery/${idUser}`, payload)
}
