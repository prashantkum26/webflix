export interface User {
  _id: string;
  name: string;
  email: string;
  myList: string[];
  isAdmin: boolean;
  token?: string;
}

export interface Movie {
  _id: string;
  title: string;
  description: string;
  thumbnail: string;
  videoUrl: string;
  genre: string[];
  rating: number;
  year: number;
  duration: number; // in minutes
  cast: string[];
  director: string;
  featured: boolean;
  trending: boolean;
  topRated: boolean;
  views: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  error: string | null;
}

export interface MovieCategory {
  featured: Movie[];
  trending: Movie[];
  topRated: Movie[];
  action: Movie[];
  comedy: Movie[];
  drama: Movie[];
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  count?: number;
  total?: number;
  pages?: number;
  currentPage?: number;
}