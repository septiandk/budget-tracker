import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Platform, Alert } from 'react-native';
import { initializeGoogleSheets, saveOAuthToken, isOAuthAvailable } from '../services/googleSheetsService';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const USER_STORAGE_KEY = 'budget_tracker_user';
const SHEETS_CONNECTED_KEY = 'budget_tracker_sheets_connected';

// Mock user data for demo purposes
const MOCK_USER = {
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
};

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isGoogleSheetsConnected: boolean;
  isOAuthEnabled: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  connectGoogleSheets: () => Promise<void>;
  connectWithOAuth: (token: string) => Promise<void>;
  checkOAuthStatus: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isGoogleSheetsConnected, setIsGoogleSheetsConnected] = useState(false);
  const [isOAuthEnabled, setIsOAuthEnabled] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const checkLoginStatus = async () => {
      try {
        const userJson = await AsyncStorage.getItem(USER_STORAGE_KEY);
        if (userJson) {
          setUser(JSON.parse(userJson));
        }
        
        const sheetsConnected = await AsyncStorage.getItem(SHEETS_CONNECTED_KEY);
        if (sheetsConnected === 'true') {
          setIsGoogleSheetsConnected(true);
        }
        
        // Check if OAuth is available
        const oauthStatus = await isOAuthAvailable();
        setIsOAuthEnabled(oauthStatus);
      } catch (error) {
        console.error('Error checking login status:', error);
      }
    };
    
    checkLoginStatus();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // In a real app, you would validate credentials with a server
      // For demo purposes, we'll just set the mock user
      const newUser = {
        ...MOCK_USER,
        email
      };
      
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
      setUser(newUser);
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      // In a real app, you would register the user with a server
      // For demo purposes, we'll just create a new user object
      const newUser = {
        id: '1',
        name,
        email,
      };
      
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
      setUser(newUser);
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      setUser(null);
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const connectGoogleSheets = async () => {
    try {
      // Check if API key and spreadsheet ID are configured
      const apiKey = Constants.expoConfig?.extra?.googleSheetsApiKey;
      const spreadsheetId = Constants.expoConfig?.extra?.spreadsheetId;
      
      if (!apiKey || !spreadsheetId) {
        throw new Error('Google Sheets API key or Spreadsheet ID not configured');
      }
      
      // Test the connection
      await initializeGoogleSheets();
      
      // Save connection status
      await AsyncStorage.setItem(SHEETS_CONNECTED_KEY, 'true');
      setIsGoogleSheetsConnected(true);
      
      // Check OAuth status
      const oauthStatus = await isOAuthAvailable();
      setIsOAuthEnabled(oauthStatus);
      
      if (!oauthStatus) {
        // Show OAuth warning
        Alert.alert(
          'Connection Successful',
          'Basic read access is now enabled. For full functionality including writing to Google Sheets, please connect with OAuth.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Connection Successful',
          'Full access to Google Sheets is enabled with OAuth. You can now read and write data to your spreadsheet.',
          [{ text: 'OK' }]
        );
      }
      
      return { success: true };
    } catch (error) {
      console.error('Google Sheets connection error:', error);
      throw error;
    }
  };

  const connectWithOAuth = async (token: string) => {
    try {
      // Save the OAuth token
      await saveOAuthToken(token);
      
      // Update OAuth status
      setIsOAuthEnabled(true);
      
      // Also ensure Google Sheets is connected
      await AsyncStorage.setItem(SHEETS_CONNECTED_KEY, 'true');
      setIsGoogleSheetsConnected(true);
      
      Alert.alert(
        'OAuth Connected',
        'Your Google account is now connected. You can now read and write data to your spreadsheet.',
        [{ text: 'OK' }]
      );
      
      return { success: true };
    } catch (error) {
      console.error('OAuth connection error:', error);
      throw error;
    }
  };

  const checkOAuthStatus = async () => {
    try {
      const oauthStatus = await isOAuthAvailable();
      setIsOAuthEnabled(oauthStatus);
      return oauthStatus;
    } catch (error) {
      console.error('Error checking OAuth status:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isGoogleSheetsConnected,
        isOAuthEnabled,
        login,
        register,
        logout,
        connectGoogleSheets,
        connectWithOAuth,
        checkOAuthStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}