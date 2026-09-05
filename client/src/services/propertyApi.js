import axios from 'axios';

import { API_URL as BASE_API_URL } from '../config/api';

const API_URL = `${BASE_API_URL}/properties`;

export const getProperties = async (params) => {
  const { data } = await axios.get(API_URL, { params });
  return data;
};
