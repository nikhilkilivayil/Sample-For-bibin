import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const baseURL =
  Constants?.expoConfig?.extra?.apiBaseUrl ||
  Constants?.manifest?.extra?.apiBaseUrl ||
  'http://localhost:4000';

export const api = axios.create({
  baseURL: `${baseURL}/api`,
  timeout: 10000,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const message =
      err.response?.data?.error || err.message || 'Network error';
    return Promise.reject(new Error(message));
  }
);

export const apiBaseUrl = baseURL;
