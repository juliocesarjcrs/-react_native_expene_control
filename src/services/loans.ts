import { GetLoansResponse, Loan } from "../shared/types/services/loans-services.type";
import {
    deleteAsyncStorage,
    getAsyncStorage,
    saveAsyncStorage,
} from "../utils/AsyncStorage";

export const CreateLoan = async (payload: Loan) => {
    const { data } = await GetLoans();
    let newLoans = data;
    newLoans.push(payload);
    await saveAsyncStorage("loans", newLoans);
};

export const GetLoans = async (): Promise<GetLoansResponse> => {
    const jsonValue = await getAsyncStorage("loans");
    const loans = jsonValue ? JSON.parse(jsonValue) : [];
    return { data: loans ? loans : [] };
};

export const deleteLoans = async () => {
     await deleteAsyncStorage("loans");
};

export const deleteOneLoan = async (idLoan: number) => {
    const { data } = await GetLoans();
    const filter = data.filter((e) => e.id !== idLoan);
    await saveAsyncStorage("loans", filter);
};
