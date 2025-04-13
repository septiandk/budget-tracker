import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Calendar, DollarSign, Tag, FileText } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { addExpense } from '../../services/googleSheetsService';
import Colors from '../../constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { categories } from '../../constants/Categories';
import { formatCurrency } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';

export default function AddExpenseScreen() {
  const { isGoogleSheetsConnected, isOAuthEnabled } = useAuth();
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<string>('');  
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!amount || !description || !category) {
      Alert.alert('Missing Information', 'Please fill in all fields');
      return;
    }

    if (isNaN(parseFloat(amount))) {
      Alert.alert('Invalid Amount', 'Please enter a valid number for the amount');
      return;
    }

    try {
      setLoading(true);
      const result = await addExpense({
        date: date.toISOString().split('T')[0],
        amount: parseFloat(amount),
        description,
        category,
      });
      
      // Reset form
      setAmount('');
      setDescription('');
      setCategory('');
      setDate(new Date());
      
      // Show appropriate message based on where the data was saved
      if (isGoogleSheetsConnected && isOAuthEnabled) {
        Alert.alert('Success', 'Expense added successfully to Google Sheets and saved locally');
      } else if (isGoogleSheetsConnected) {
        Alert.alert('Success', 'Expense saved locally. To save to Google Sheets, please enable OAuth in Settings.');
      } else {
        Alert.alert('Success', 'Expense saved locally. Connect to Google Sheets in Settings to sync your data.');
      }
    } catch (error) {
      console.error('Error adding expense:', error);
      Alert.alert('Error', 'Failed to add expense. Your data has been saved locally.');
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (event.type === 'set' && selectedDate) {
      setDate(selectedDate);
    }
    setShowDatePicker(false);
  };
  

  // Format amount as IDR when displayed
  const formatAmountForDisplay = (value) => {
    if (!value) return '';
    
    // Remove non-numeric characters
    const numericValue = value.replace(/[^0-9]/g, '');
    
    // Format as IDR without the currency symbol
    if (numericValue) {
      return new Intl.NumberFormat('id-ID').format(parseInt(numericValue));
    }
    return '';
  };

  // Handle amount input changes
  const handleAmountChange = (text) => {
    // Remove all non-numeric characters
    const numericValue = text.replace(/[^0-9]/g, '');
    setAmount(numericValue);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.formContainer}>
            <Text style={styles.title}>Add New Expense</Text>
            
            <View style={styles.inputGroup}>
              <View style={styles.inputLabel}>
                <DollarSign size={20} color={Colors.text} />
                <Text style={styles.labelText}>Amount</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="0"
                keyboardType="numeric"
                value={formatAmountForDisplay(amount)}
                onChangeText={handleAmountChange}
                placeholderTextColor={Colors.gray}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <View style={styles.inputLabel}>
                <FileText size={20} color={Colors.text} />
                <Text style={styles.labelText}>Description</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="What did you spend on?"
                value={description}
                onChangeText={setDescription}
                placeholderTextColor={Colors.gray}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <View style={styles.inputLabel}>
                <Tag size={20} color={Colors.text} />
                <Text style={styles.labelText}>Category</Text>
              </View>
              <View style={styles.categoryContainer}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.value}
                    style={[
                      styles.categoryButton,
                      category === cat.value && styles.categoryButtonActive,
                    ]}
                    onPress={() => setCategory(cat.value)}
                  >
                    <Text
                      style={[
                        styles.categoryButtonText,
                        category === cat.value && styles.categoryButtonTextActive,
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <View style={styles.inputLabel}>
                <Calendar size={20} color={Colors.text} />
                <Text style={styles.labelText}>Date</Text>
              </View>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateButtonText}>
                  {date.toLocaleDateString('id-ID')}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="default"
                  onChange={onDateChange}
                />
              )}
            </View>
            
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.submitButtonText}>Add Expense</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  formContainer: {
    backgroundColor: Colors.card,
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: Colors.text,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  labelText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  categoryButton: {
    backgroundColor: Colors.background,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    margin: 4,
  },
  categoryButtonActive: {
    backgroundColor: Colors.primary,
  },
  categoryButtonText: {
    color: Colors.text,
    fontSize: 14,
  },
  categoryButtonTextActive: {
    color: Colors.white,
    fontWeight: 'bold',
  },
  dateButton: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 12,
  },
  dateButtonText: {
    fontSize: 16,
    color: Colors.text,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});