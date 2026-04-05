import axios, { type AxiosResponse } from 'axios';
import type { User, Movie, MovieCategory, ApiResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('webflix_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('webflix_token');
      localStorage.removeItem('webflix_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: async (name: string, email: string, password: string): Promise<User> => {
    const response: AxiosResponse<ApiResponse<User>> = await api.post('/auth/register', {
      name,
      email,
      password,
    });
    return response.data.data;
  },

  login: async (email: string, password: string): Promise<User> => {
    const response: AxiosResponse<ApiResponse<User>> = await api.post('/auth/login', {
      email,
      password,
    });
    return response.data.data;
  },

  getProfile: async (): Promise<User> => {
    const response: AxiosResponse<ApiResponse<User>> = await api.get('/auth/profile');
    return response.data.data;
  },
};

// Movie API
export const movieAPI = {
  getMovies: async (params?: {
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<Movie[]>> => {
    const response: AxiosResponse<ApiResponse<Movie[]>> = await api.get('/movies', {
      params,
    });
    return response.data;
  },

  getMovie: async (id: string): Promise<Movie> => {
    const response: AxiosResponse<ApiResponse<Movie>> = await api.get(`/movies/${id}`);
    return response.data.data;
  },

  getCategories: async (): Promise<MovieCategory> => {
    const response: AxiosResponse<ApiResponse<MovieCategory>> = await api.get('/movies/categories');
    return response.data.data;
  },

  createMovie: async (movieData: Partial<Movie>): Promise<Movie> => {
    const response: AxiosResponse<ApiResponse<Movie>> = await api.post('/movies', movieData);
    return response.data.data;
  },

  updateMovie: async (id: string, movieData: Partial<Movie>): Promise<Movie> => {
    const response: AxiosResponse<ApiResponse<Movie>> = await api.put(`/movies/${id}`, movieData);
    return response.data.data;
  },

  deleteMovie: async (id: string): Promise<void> => {
    await api.delete(`/movies/${id}`);
  },
};

// User API
export const userAPI = {
  getMyList: async (): Promise<Movie[]> => {
    const response: AxiosResponse<ApiResponse<Movie[]>> = await api.get('/users/mylist');
    return response.data.data;
  },

  addToMyList: async (movieId: string): Promise<Movie[]> => {
    const response: AxiosResponse<ApiResponse<Movie[]>> = await api.post(`/users/mylist/${movieId}`);
    return response.data.data;
  },

  removeFromMyList: async (movieId: string): Promise<Movie[]> => {
    const response: AxiosResponse<ApiResponse<Movie[]>> = await api.delete(`/users/mylist/${movieId}`);
    return response.data.data;
  },

  toggleMyList: async (movieId: string): Promise<{ isInList: boolean; data: Movie[] }> => {
    const response = await api.put(`/users/mylist/${movieId}`);
    return {
      isInList: response.data.isInList,
      data: response.data.data,
    };
  },

  updateProfile: async (profileData: { name?: string; email?: string }): Promise<User> => {
    const response: AxiosResponse<ApiResponse<User>> = await api.put('/users/profile', profileData);
    return response.data.data;
  },
};

// Upload movie with files
export const uploadMovie = (formData: FormData) =>
  api.post('/movies/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

export default api;
