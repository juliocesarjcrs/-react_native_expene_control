import axios from "~/plugins/axiosConfig";
const PREFIX = "categories";
export const getCategories = async () => {
  return axios.get(PREFIX);
};
export const getCategory = async (idCategory) => {
  return axios.get(`${PREFIX}/${idCategory}`);
};
export const CreateCategory = async (payload) => {
  return axios.post(PREFIX, payload);
};
export const EditCategory = async (idCategory, payload) => {
  return axios.put(`${PREFIX}/${idCategory}`, payload);
};
export const getCategoryWithSubcategories = async () => {
  return axios.get(`${PREFIX}/subcategories`);
};
export const deleteCategory = async (idCategory) => {
  return axios.delete(`${PREFIX}/${idCategory}`);
};
