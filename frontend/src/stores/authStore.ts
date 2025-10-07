import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      token: null,

      login: async (email: string, password: string) => {
        // TODO: Implement actual AWS Cognito authentication
        // For demo purposes, using mock authentication
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const mockUser: User = {
            id: '1',
            email,
            name: email.split('@')[0],
          };

          set({
            user: mockUser,
            isAuthenticated: true,
            token: 'mock-jwt-token',
          });
        } catch (error) {
          console.error('Login failed:', error);
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          token: null,
        });
      },

      setUser: (user: User) => {
        set({ user, isAuthenticated: true });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
