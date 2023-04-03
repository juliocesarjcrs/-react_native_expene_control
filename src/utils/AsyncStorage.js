import AsyncStorage from "@react-native-async-storage/async-storage";

export const saveAsyncStorage = async (key, values) =>{
  const jsonValue = JSON.stringify(values);
  return AsyncStorage.setItem(key, jsonValue);
}

export const deleteAsyncStorage = async (key) =>{
  await AsyncStorage.removeItem(key);
}

export const getAsyncStorage = async (key) =>{
  return AsyncStorage.getItem(key);
}