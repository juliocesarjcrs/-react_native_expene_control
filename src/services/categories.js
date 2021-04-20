import axios from '~/plugins/axiosConfig'

export  const  getCategories = async() =>{

  return await axios.get('categories')

}