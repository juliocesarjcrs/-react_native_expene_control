import axios from '../plugins/axiosConfig'
import { CreateCategoryPayload, EditCategoryPayload, GetAllSubcategoriesExpensesByMonthResponse, GetCategoriesParams, GetCategoriesResponse } from "../shared/types/services";
import { AxiosResponse } from "axios";
const PREFIX = "categories";
export const getCategories = async (params: GetCategoriesParams): Promise<AxiosResponse<GetCategoriesResponse>> => {
    return axios.get(PREFIX, { params });
};
export const getCategory = async (idCategory: number) => {
    return axios.get(`${PREFIX}/${idCategory}`);
};
export const CreateCategory = async (payload: CreateCategoryPayload) => {
    return axios.post(PREFIX, payload);
};
export const EditCategory = async (idCategory: number, payload: EditCategoryPayload) => {
    return axios.put(`${PREFIX}/${idCategory}`, payload);
};
// export const getCategoryWithSubcategories = async (month: string) => { // deprecated
//     return axios.get(`${PREFIX}/subcategories`, {
//         params: {
//             date: month,
//         },
//     });
// };
export const deleteCategory = async (idCategory: number) => {
    return axios.delete(`${PREFIX}/${idCategory}`);
};
export const getCategoryTypeIncome = async (month: string) => {
    return axios.get(`${PREFIX}/incomes`, {
        params: {
            date: month,
        },
    });
};
export const getAllExpensesByMonth = async (month: string) => {
    return axios.get(`${PREFIX}/expenses/month`, {
        params: {
            date: month,
        },
    });
};

export const getAllSubcategoriesExpensesByMonth = async (month: string): Promise<AxiosResponse<GetAllSubcategoriesExpensesByMonthResponse>> =>  {
    return axios.get(`${PREFIX}/subcategories/expenses/month`, {
        params: {
            date: month,
        },
    });
};

