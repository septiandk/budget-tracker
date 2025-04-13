import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert, ScrollView } from 'react-native';
import { LogOut, HelpCircle, FileSpreadsheet, Bell, Moon, Shield } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import Colors from '../../constants/Colors';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import GoogleSheetsSetupGuide from '../../components/GoogleSheetsSetupGuide';

export default function SettingsScreen() {
  const { user, logout, connectGoogleSheets, isGoogleSheetsConnected, isOAuthEnabled } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [showSetupGuide, setShowSetupGuide] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: () => logout() },
      ]
    );
  };

  const handleConnectGoogleSheets = async () => {
    try {
      await connectGoogleSheets();
      Alert.alert('Success', 'Successfully connected to Google Sheets!');
    } catch (error) {
      Alert.alert('Connection Error', error.message || 'Failed to connect to Google Sheets. Please check your configuration.');
    }
  };

  const toggleSetupGuide = () => {
    setShowSetupGuide(!showSetupGuide);
  };

  const renderSettingItem = (icon, title, subtitle, action, toggle = null) => (
    <TouchableOpacity style={styles.settingItem} onPress={action}>
      <View style={styles.settingIcon}>{icon}</View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {toggle !== null ? (
        <Switch
          value={toggle}
          onValueChange={action}
          trackColor={{ false: Colors.gray, true: Colors.primary }}
          thumbColor={Colors.white}
        />
      ) : (
        <View style={styles.settingArrow} />
      )}
    </TouchableOpacity>
  );

  if (showSetupGuide) {
    return (
      <SafeAreaView style={styles.container}>
        <GoogleSheetsSetupGuide 
          onConnect={handleConnectGoogleSheets} 
          isConnected={isGoogleSheetsConnected} 
        />
        <TouchableOpacity 
          style={styles.backButton}
          onPress={toggleSetupGuide}
        >
          <Text style={styles.backButtonText}>Back to Settings</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <View style={styles.profileInitial}>
            <Text style={styles.initialText}>{user?.name?.[0] || 'U'}</Text>
          </View>
          <Text style={styles.profileName}>{user?.name || 'User'}</Text>
          <Text style={styles.profileEmail}>{user?.email || 'user@example.com'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          {renderSettingItem(
            <FileSpreadsheet size={22} color={Colors.primary} />,
            'Google Sheets Connection',
            isGoogleSheetsConnected 
              ? isOAuthEnabled 
                ? 'Connected with OAuth (Read/Write)' 
                : 'Connected (Read Only)'
              : 'Not connected',
            toggleSetupGuide
          )}
          {renderSettingItem(
            <Shield size={22} color={Colors.primary} />,
            'Privacy Settings',
            'Manage your data and privacy',
            () => {}
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          {renderSettingItem(
            <Moon size={22} color={Colors.primary} />,
            'Dark Mode',
            'Switch between light and dark themes',
            () => setDarkMode(!darkMode),
            darkMode
          )}
          {renderSettingItem(
            <Bell size={22} color={Colors.primary} />,
            'Notifications',
            'Get alerts for budget limits and reminders',
            () => setNotifications(!notifications),
            notifications
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          {renderSettingItem(
            <HelpCircle size={22} color={Colors.primary} />,
            'Help & Support',
            'Get help with using the app',
            () => {}
          )}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color={Colors.white} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Version 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    alignItems: 'center',
    padding: 20,
    paddingTop: 30,
    paddingBottom: 30,
    backgroundColor: Colors.card,
    marginBottom: 20,
  },
  profileInitial: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  initialText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.white,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  profileEmail: {
    fontSize: 14,
    color: Colors.gray,
    marginTop: 5,
  },
  section: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.gray,
    marginBottom: 10,
    marginLeft: 10,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.lightBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  settingSubtitle: {
    fontSize: 13,
    color: Colors.gray,
    marginTop: 3,
  },
  settingArrow: {
    width: 8,
    height: 8,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: Colors.gray,
    transform: [{ rotate: '45deg' }],
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.danger,
    marginHorizontal: 20,
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    marginBottom: 30,
  },
  logoutText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 10,
  },
  versionText: {
    textAlign: 'center',
    color: Colors.gray,
    marginBottom: 30,
  },
  backButton: {
    backgroundColor: Colors.gray,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  backButtonText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
});