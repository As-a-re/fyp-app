import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { authAPI } from "../services/api";
import { registerForPushNotifications } from "../services/pushNotifications";

const AuthContext = createContext();

const normalizeUser = (user) => {
  if (!user) return user;
  return {
    ...user,
    role: String(user.role || "").trim().toLowerCase(),
  };
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    registerForPushNotifications().catch((error) => {
      console.warn("Push notification registration unavailable:", error.message);
    });
  }, [isAuthenticated, user]);

  const checkAuthStatus = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (token) {
        // Validate token by getting user profile
        try {
          const response = await authAPI.getProfile();
          if (response.user) {
            setUser(normalizeUser(response.user));
            setIsAuthenticated(true);
          } else {
            // Token invalid, clear it
            await AsyncStorage.removeItem("authToken");
          }
        } catch (apiError) {
          // Do not render a dashboard without a validated role. Otherwise an
          // unavailable profile request can fall through to the doctor view.
          console.warn("Could not validate token with API:", apiError.message);
          await AsyncStorage.removeItem("authToken");
          setUser(null);
          setIsAuthenticated(false);
        }
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      await AsyncStorage.removeItem("authToken");
    } finally {
      setLoading(false);
    }
  }, []);

  // Check for existing session on app start
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const login = async (email, password, role = "mother") => {
    try {
      setLoading(true);
      const response = await authAPI.login({ email, password, role });

      if (response.token && response.user) {
        await AsyncStorage.setItem("authToken", response.token);
        setUser(normalizeUser(response.user));
        setIsAuthenticated(true);
        return { success: true, user: response.user };
      }

      return { success: false, error: "Login failed" };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        error: error.message || "Login failed. Please try again.",
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      console.log("AuthContext: Registering user with data:", userData);
      const response = await authAPI.register(userData);
      console.log("AuthContext: API response:", response);

      if (response.success || response.user) {
        // Registration successful, but don't auto-login
        // User will need to login with their new credentials
        console.log("AuthContext: Registration successful");
        return {
          success: true,
          user: response.user,
          message:
            "Registration successful! Please login with your new account.",
        };
      }

      console.log(
        "AuthContext: Registration response not successful:",
        response,
      );
      return { success: false, error: response.error || "Registration failed" };
    } catch (error) {
      console.error("AuthContext: Registration error:", error);
      return {
        success: false,
        error: error.message || "Registration failed. Please try again.",
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem("authToken");
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const updateProfile = async (profileData) => {
    try {
      // This would be implemented if there's an update profile endpoint
      // For now, we'll just update the local state
      setUser((prev) => ({ ...prev, ...profileData }));
      return { success: true };
    } catch (error) {
      console.error("Profile update error:", error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    checkAuthStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
