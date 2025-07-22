// types/auth.ts
export interface User {
  userId: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface SignupData {
  name: string;
  email: string;
}

export interface LoginData {
  email: string;
}
