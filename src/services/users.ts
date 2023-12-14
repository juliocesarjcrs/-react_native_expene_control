import { AxiosResponse } from 'axios';
import axios from '../plugins/axiosConfig'
import { ChangePasswordPayload, CreateUserPayload, EditUserPayload } from '../shared/types/services';

const PREFIX = "users";
export  const  getUser = async(idUser: number) =>{
  return  axios.get(`${PREFIX}/${idUser}`)
}

export  const  changePassword = async(idUser: number, payload: ChangePasswordPayload) =>{
  return  axios.put(`${PREFIX}/change-password/${idUser}`, payload)
}

export  const editUser = async(idUser: number, payload: EditUserPayload) =>{
  return  axios.put(`${PREFIX}/${idUser}`, payload,  {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

export  const createUser = async(payload: CreateUserPayload) =>{
  return  axios.post(`${PREFIX}`, payload,  {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

export  const  getUsersList = async() =>{
  return  axios.get(`${PREFIX}`)
}