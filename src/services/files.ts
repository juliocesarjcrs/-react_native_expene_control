import axios from "~/plugins/axiosConfig";
import { GetUrlSignedAwsQuery, GetUrlSignedAwsResponse } from "~/shared/types/services/files-servicess.type";
const FILES_PREFIX = "files";

/**
 * Obtiene una URL firmada de AWS S3 para acceder a un archivo
 */
export const getUrlSignedAws = async (
  params: GetUrlSignedAwsQuery
): Promise<GetUrlSignedAwsResponse> => {
  return axios.get<string>(`${FILES_PREFIX}/load`, { params });
};