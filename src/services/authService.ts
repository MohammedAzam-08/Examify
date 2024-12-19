import axiosInstance from '../utils/axiosConfig';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  role: string;
}

export const loginUser = async (credentials: LoginCredentials) => {
  try {
    const { data } = await axiosInstance.post('/users/login', credentials);
    localStorage.setItem('userInfo', JSON.stringify(data));
    return data;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Login failed. Please try again.';
    throw new Error(message);
  }
};

export const registerUser = async (credentials: RegisterCredentials) => {
  try {
    const { data } = await axiosInstance.post('/users', credentials);
    localStorage.setItem('userInfo', JSON.stringify(data));
    return data;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Registration failed. Please try again.';
    throw new Error(message);
  }
};