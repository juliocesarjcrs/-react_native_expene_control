import axios from "~/plugins/axiosConfig";
const PREFIX = "categories";
export const getCategories = async (params) => {
    return axios.get(PREFIX, { params });
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
export const getCategoryWithSubcategories = async (month) => {
    return axios.get(`${PREFIX}/subcategories`, {
        params: {
            date: month,
        },
    });
};
export const deleteCategory = async (idCategory) => {
    return axios.delete(`${PREFIX}/${idCategory}`);
};
export const getCategoryTypeIncome = async (month) => {
    return axios.get(`${PREFIX}/incomes`, {
        params: {
            date: month,
        },
    });
};
export const getAllExpensesByMonth = async (month) => {
    return axios.get(`${PREFIX}/expenses/month`, {
        params: {
            date: month,
        },
    });
};

export const getAllSubcategoriesExpensesByMonth = async (month) => {
    console.log(month)
    return axios.get(`${PREFIX}/subcategories/expenses/month`, {
        params: {
            date: month,
        },
    });
};
