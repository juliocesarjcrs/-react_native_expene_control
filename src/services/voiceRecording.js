import axios from '~/plugins/axiosConfig';
const PREFIX = 'voice';

export const sendVoice = async (payload) => {
  return await axios.put(`${PREFIX}/${idUser}`, payload, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};
