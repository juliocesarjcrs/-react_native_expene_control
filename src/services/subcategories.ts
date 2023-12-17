import { AxiosResponse } from 'axios';
import axios from '../plugins/axiosConfig'
import { CreateSubcategoryPayload, EditSubcategoryPayload, GetSubategoriesByCategoryQuery, GetSubategoriesByCategoryResponse } from '../shared/types/services/subcategories-services.type';
const PREFIX = "subcategories";
export const getSubategoriesByCategory = async (idCategory: number, params: GetSubategoriesByCategoryQuery = { withExpenses: true }): Promise<AxiosResponse<GetSubategoriesByCategoryResponse>> => {
  return await axios.get(`${PREFIX}/category/${idCategory}`, { params });
};

export const CreateSubcategory = async (payload: CreateSubcategoryPayload) => {
  return await axios.post(`${PREFIX}`, payload);
};

export const EditSubcategory = async (idSubcategory: number, payload: EditSubcategoryPayload) => {
  return axios.put(`${PREFIX}/${idSubcategory}`, payload);
};

export const deleteSubategory = async (idSubcategory: number) => {
  return axios.delete(`${PREFIX}/${idSubcategory}`);
};
