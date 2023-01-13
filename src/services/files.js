import axios from "~/plugins/axiosConfig";
const PREFIX = "files";

export const getUrlSignedAws = async (params) => {
  return axios.get(`${PREFIX}/load`, {params});
};