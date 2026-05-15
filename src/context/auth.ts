import { createContext } from "react";

export interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "customer";
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoggedIn: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAdmin: boolean;
  isCustomer: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
