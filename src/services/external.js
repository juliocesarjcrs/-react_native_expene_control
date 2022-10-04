
import axios from "axios";
const axiosInstance = axios.create({
});
axiosInstance.interceptors.request.use(
  async function (config) {
    config.headers.common.apikey = `Mk6NFKacar7Ie3aOzPALpNW9jgF1c9zk`;
    return config;
  },
  function (error) {
    return Promise.reject(error);
  }
);


export const getExchangeCurrency= async (values) => {
  return  axiosInstance.get(`https://api.apilayer.com/fixer/convert?to=${values.to}&from=${values.from}&amount=${values.amount}`);
}
