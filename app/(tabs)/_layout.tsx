import { Tabs, useRouter, useRootNavigationState } from 'expo-router';
import { Platform } from 'react-native';
import { Home, PieChart, Plus, Settings, TrendingUp, Wallet } from 'lucide-react-native';
import Colors from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { useEffect } from 'react';

export default function TabLayout() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const rootNavigation = useRootNavigationState();

  // ⏳ Tunggu sampai RootLayout sudah mount
  useEffect(() => {
    if (!rootNavigation?.key) return; // masih null = belum siap

    if (!isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [rootNavigation?.key, isAuthenticated]);

  // 🚫 Sembunyikan Tabs saat redirect
  if (!isAuthenticated) return null;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.gray,
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 90 : 70,
          paddingBottom: Platform.OS === 'ios' ? 30 : 10,
          paddingTop: 10,
        },
        headerShown: true,
        headerStyle: {
          backgroundColor: Colors.background,
        },
        headerTitleStyle: {
          color: Colors.text,
          fontWeight: 'bold',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="budget"
        options={{
          title: 'Budget',
          tabBarIcon: ({ color }) => <Wallet size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: 'Expenses',
          tabBarIcon: ({ color }) => <TrendingUp size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: 'Add',
          tabBarIcon: ({ color }) => <Plus size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reports',
          tabBarIcon: ({ color }) => <PieChart size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <Settings size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
