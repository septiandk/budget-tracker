import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Preferences = {
  darkMode: boolean;
  notifications: boolean;
  toggleDarkMode: () => void;
  toggleNotifications: () => void;
};

const PreferencesContext = createContext<Preferences | undefined>(undefined);

export const PreferencesProvider = ({ children }: { children: React.ReactNode }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    const loadPreferences = async () => {
      const dark = await AsyncStorage.getItem('darkMode');
      const notifs = await AsyncStorage.getItem('notifications');
      setDarkMode(dark === 'true');
      setNotifications(notifs !== 'false');
    };
    loadPreferences();
  }, []);

  const toggleDarkMode = async () => {
    await AsyncStorage.setItem('darkMode', (!darkMode).toString());
    setDarkMode(!darkMode);
  };

  const toggleNotifications = async () => {
    await AsyncStorage.setItem('notifications', (!notifications).toString());
    setNotifications(!notifications);
  };

  return (
    <PreferencesContext.Provider
      value={{ darkMode, notifications, toggleDarkMode, toggleNotifications }}
    >
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
};
