import AsyncStorage from "@react-native-async-storage/async-storage";
import { Loan } from "../shared/types/services/loans-services.type";

export const saveAsyncStorage = async (key: string, values: Loan[]) =>{
  const jsonValue = JSON.stringify(values);
  return AsyncStorage.setItem(key, jsonValue);
}

export const deleteAsyncStorage = async (key: string) =>{
  await AsyncStorage.removeItem(key);
}

export const getAsyncStorage = async (key: string) =>{
  return AsyncStorage.getItem(key);
}