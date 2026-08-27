import axios from 'axios';

const API_URL = 'http://localhost:5000/api/properties';

export const getProperties = async (params) => {
  const { data } = await axios.get(API_URL, { params });
  return data;
};
