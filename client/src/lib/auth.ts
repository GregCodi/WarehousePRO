import { User } from "@shared/schema";
import { apiRequest } from "./queryClient";

// Types
export type AuthUser = Omit<User, "password">;

export type AuthState = {
  user: AuthUser | null;
  token: string | null;
};

// Storage keys
const AUTH_STORAGE_KEY = "warehouse-auth";

// Load auth state from local storage
export function loadAuthFromStorage(): AuthState | null {
  try {
    const authData = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!authData) return null;
    
    return JSON.parse(authData) as AuthState;
  } catch (error) {
    console.error("Failed to load auth data from storage:", error);
    return null;
  }
}

// Save auth state to local storage
export function saveAuthToStorage(authState: AuthState): void {
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authState));
  } catch (error) {
    console.error("Failed to save auth data to storage:", error);
  }
}

// Clear auth state from local storage
export function clearAuthFromStorage(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

// Login function
export async function login(username: string, password: string): Promise<AuthState> {
  const response = await apiRequest("POST", "/api/auth/login", { username, password });
  const data = await response.json();
  
  const authState: AuthState = {
    user: data.user,
    token: data.token
  };
  
  saveAuthToStorage(authState);
  return authState;
}

// Logout function
export function logout(): void {
  clearAuthFromStorage();
  window.location.href = "/login";
}

// Check if user has required role
export function hasRole(user: AuthUser | null, allowedRoles: string[]): boolean {
  if (!user) return false;
  return allowedRoles.includes(user.role);
}

// Get current authentication state
export function getAuthState(): AuthState {
  return loadAuthFromStorage() || { user: null, token: null };
}

// Get auth header for API requests
export function getAuthHeader(): Record<string, string> {
  const { token } = getAuthState();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
