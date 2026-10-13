import { create } from 'axios';
import { FIXER_API_KEY } from '@env';

const axiosInstance = create({
  baseURL: 'https://api.apilayer.com/fixer',
  headers: { apikey: FIXER_API_KEY }
});

export const getExchangeCurrency = async ({ to, from, amount }) => {
  return axiosInstance.get('/convert', { params: { to, from, amount } });
};
