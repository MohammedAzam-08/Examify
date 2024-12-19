import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Create axios instance with base configuration
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem('userInfo') || 'null');
    if (user?.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const fetchExams = createAsyncThunk(
  'exam/fetchExams',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get('/exams');
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch exams');
    }
  }
);

export const submitExam = createAsyncThunk(
  'exam/submitExam',
  async ({ examId, answers }: { examId: string; answers: any }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post(`/exams/${examId}/submit`, { answers });
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to submit exam');
    }
  }
);

const examSlice = createSlice({
  name: 'exam',
  initialState: {
    exams: [],
    currentExam: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchExams.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExams.fulfilled, (state, action) => {
        state.loading = false;
        state.exams = action.payload;
      })
      .addCase(fetchExams.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(submitExam.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitExam.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(submitExam.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export default examSlice.reducer;