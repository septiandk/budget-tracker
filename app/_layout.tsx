import { Slot } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from '../context/AuthContext';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <Slot /> 
        <StatusBar style="auto" />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
