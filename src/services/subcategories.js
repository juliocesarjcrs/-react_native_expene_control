import axios from "~/plugins/axiosConfig";
const PREFIX = "subcategories";
export const getSubategoriesByCategory = async (idCategory) => {
  return await axios.get(`${PREFIX}/category/${idCategory}`);
};

export const CreateSubcategory = async (payload) => {
  return await axios.post(`${PREFIX}`, payload);
};

export const deleteSubategory = async (idSubcategory) => {
  return axios.delete(`${PREFIX}/${idSubcategory}`);
};
