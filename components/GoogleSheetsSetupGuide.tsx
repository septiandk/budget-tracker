import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Linking, Platform } from 'react-native';
import { Check, ChevronRight, FileSpreadsheet, Key, Lock, RefreshCw } from 'lucide-react-native';
import Colors from '../constants/Colors';

interface GoogleSheetsSetupGuideProps {
  onConnect: () => Promise<void>;
  isConnected: boolean;
}

export default function GoogleSheetsSetupGuide({ onConnect, isConnected }: GoogleSheetsSetupGuideProps) {
  const [expandedStep, setExpandedStep] = useState<number | null>(isConnected ? null : 0);
  const [connecting, setConnecting] = useState(false);

  const handleConnect = async () => {
    try {
      setConnecting(true);
      await onConnect();
    } catch (error) {
      console.error('Connection error:', error);
    } finally {
      setConnecting(false);
    }
  };

  const steps = [
    {
      title: 'Create a Google Cloud Project',
      icon: <FileSpreadsheet size={24} color={Colors.primary} />,
      content: (
        <View>
          <Text style={styles.stepText}>
            1. Go to the Google Cloud Console
          </Text>
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => Linking.openURL('https://console.cloud.google.com')}
          >
            <Text style={styles.linkButtonText}>Open Google Cloud Console</Text>
            <ChevronRight size={16} color={Colors.primary} />
          </TouchableOpacity>
          
          <Text style={styles.stepText}>
            2. Create a new project or select an existing one
          </Text>
          
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80' }}
            style={styles.helpImage}
          />
          
          <Text style={styles.stepText}>
            3. Enable the Google Sheets API for your project
          </Text>
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => Linking.openURL('https://console.cloud.google.com/apis/library/sheets.googleapis.com')}
          >
            <Text style={styles.linkButtonText}>Enable Google Sheets API</Text>
            <ChevronRight size={16} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      ),
    },
    {
      title: 'Get API Credentials',
      icon: <Key size={24} color={Colors.primary} />,
      content: (
        <View>
          <Text style={styles.stepText}>
            1. Go to the Credentials page in your Google Cloud Console
          </Text>
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => Linking.openURL('https://console.cloud.google.com/apis/credentials')}
          >
            <Text style={styles.linkButtonText}>Open Credentials Page</Text>
            <ChevronRight size={16} color={Colors.primary} />
          </TouchableOpacity>
          
          <Text style={styles.stepText}>
            2. Click "Create Credentials" and select "API Key"
          </Text>
          
          <Text style={styles.stepText}>
            3. Copy your API key and add it to your .env file as EXPO_PUBLIC_GOOGLE_SHEETS_API_KEY
          </Text>
          
          <View style={styles.codeBlock}>
            <Text style={styles.codeText}>
              EXPO_PUBLIC_GOOGLE_SHEETS_API_KEY=your_api_key_here
            </Text>
          </View>
        </View>
      ),
    },
    {
      title: 'Prepare Your Spreadsheet',
      icon: <Lock size={24} color={Colors.primary} />,
      content: (
        <View>
          <Text style={styles.stepText}>
            1. Create a new Google Spreadsheet or use an existing one
          </Text>
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => Linking.openURL('https://docs.google.com/spreadsheets')}
          >
            <Text style={styles.linkButtonText}>Create New Spreadsheet</Text>
            <ChevronRight size={16} color={Colors.primary} />
          </TouchableOpacity>
          
          <Text style={styles.stepText}>
            2. Set up the following sheets with headers:
          </Text>
          
          <View style={styles.sheetStructure}>
            <Text style={styles.sheetTitle}>Transactions</Text>
            <Text style={styles.sheetHeaders}>Date | Description | Amount | Category</Text>
            
            <Text style={styles.sheetTitle}>Budget</Text>
            <Text style={styles.sheetHeaders}>Category | Amount | Period</Text>
          </View>
          
          <Text style={styles.stepText}>
            3. Copy your spreadsheet ID from the URL and add it to your .env file
          </Text>
          
          <View style={styles.codeBlock}>
            <Text style={styles.codeText}>
              EXPO_PUBLIC_SPREADSHEET_ID=your_spreadsheet_id_here
            </Text>
          </View>
          
          <Text style={styles.stepNote}>
            The spreadsheet ID is the long string of characters in your spreadsheet URL between /d/ and /edit
          </Text>
        </View>
      ),
    },
  ];

  const renderStep = (step, index) => (
    <View key={index} style={styles.step}>
      <TouchableOpacity
        style={[
          styles.stepHeader,
          expandedStep === index && styles.stepHeaderActive,
        ]}
        onPress={() => setExpandedStep(expandedStep === index ? null : index)}
      >
        <View style={styles.stepHeaderLeft}>
          {step.icon}
          <Text style={[
            styles.stepTitle,
            expandedStep === index && styles.stepTitleActive,
          ]}>
            {step.title}
          </Text>
        </View>
        {index < steps.length - 1 && (
          <View style={[
            styles.stepIndicator,
            expandedStep > index && styles.stepIndicatorCompleted,
          ]}>
            {expandedStep > index ? (
              <Check size={16} color={Colors.white} />
            ) : (
              <Text style={styles.stepNumber}>{index + 1}</Text>
            )}
          </View>
        )}
      </TouchableOpacity>
      
      {expandedStep === index && (
        <View style={styles.stepContent}>
          {step.content}
        </View>
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <FileSpreadsheet size={40} color={Colors.primary} />
        <Text style={styles.title}>Google Sheets Setup</Text>
        <Text style={styles.subtitle}>
          Connect your Google Spreadsheet to track your expenses
        </Text>
      </View>

      {isConnected ? (
        <View style={styles.connectedContainer}>
          <View style={styles.connectedHeader}>
            <Check size={24} color={Colors.success} />
            <Text style={styles.connectedText}>Connected to Google Sheets</Text>
          </View>
          <TouchableOpacity
            style={styles.reconnectButton}
            onPress={handleConnect}
          >
            <RefreshCw size={20} color={Colors.primary} />
            <Text style={styles.reconnectText}>Reconnect</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.stepsContainer}>
          {steps.map(renderStep)}
          
          <TouchableOpacity
            style={[styles.connectButton, connecting && styles.connectButtonDisabled]}
            onPress={handleConnect}
            disabled={connecting}
          >
            {connecting ? (
              <RefreshCw size={20} color={Colors.white} />
            ) : (
              <Text style={styles.connectButtonText}>Connect to Google Sheets</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
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
    backgroundColor: Colors.card,
    borderRadius: 16,
    margin: 16,
    marginTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.gray,
    textAlign: 'center',
    marginTop: 8,
  },
  stepsContainer: {
    padding: 16,
  },
  step: {
    marginBottom: 16,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
  },
  stepHeaderActive: {
    backgroundColor: Colors.primary,
  },
  stepHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
    color: Colors.text,
  },
  stepTitleActive: {
    color: Colors.white,
  },
  stepIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.lightBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepIndicatorCompleted: {
    backgroundColor: Colors.success,
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  stepContent: {
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  stepText: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 12,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightBackground,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  linkButtonText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
    flex: 1,
  },
  helpImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
  },
  codeBlock: {
    backgroundColor: Colors.lightBackground,
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  codeText: {
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace' }),
    fontSize: 12,
    color: Colors.text,
  },
  sheetStructure: {
    backgroundColor: Colors.lightBackground,
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  sheetTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  sheetHeaders: {
    fontSize: 12,
    color: Colors.gray,
    marginBottom: 12,
  },
  stepNote: {
    fontSize: 12,
    color: Colors.gray,
    fontStyle: 'italic',
    marginTop: 8,
  },
  connectButton: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  connectButtonDisabled: {
    opacity: 0.6,
  },
  connectButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  connectedContainer: {
    padding: 16,
    backgroundColor: Colors.card,
    borderRadius: 12,
    margin: 16,
    alignItems: 'center',
  },
  connectedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  connectedText: {
    marginLeft: 10,
    fontSize: 16,
    color: Colors.success,
    fontWeight: '600',
  },
  reconnectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightBackground,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  reconnectText: {
    marginLeft: 8,
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
});
