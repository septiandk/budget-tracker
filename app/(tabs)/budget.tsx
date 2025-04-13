import { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '../../constants/Colors';

export default function BudgetScreen() {
  const [income, setIncome] = useState('');
  const [budget, setBudget] = useState('');

  useEffect(() => {
    const loadData = async () => {
      const data = await AsyncStorage.getItem('budgetData');
      if (data) {
        const parsed = JSON.parse(data);
        setIncome(parsed.income.toString());
        setBudget(parsed.budget.toString());
      }
    };
    loadData();
  }, []);

  const saveData = async () => {
    try {
      await AsyncStorage.setItem('budgetData', JSON.stringify({
        income: parseFloat(income),
        budget: parseFloat(budget)
      }));
      Alert.alert('Success', 'Budget & Income saved!');
    } catch (err) {
      Alert.alert('Error', 'Failed to save data.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Set Your Monthly Budget</Text>

      <Text style={styles.label}>Income</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={income}
        onChangeText={setIncome}
        placeholder="0"
      />

      <Text style={styles.label}>Budget</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={budget}
        onChangeText={setBudget}
        placeholder="0"
      />

      <TouchableOpacity style={styles.button} onPress={saveData}>
        <Text style={styles.buttonText}>Save</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: Colors.background },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, color: Colors.text },
  label: { marginTop: 20, marginBottom: 8, color: Colors.text },
  input: {
    backgroundColor: Colors.card,
    padding: 12,
    borderRadius: 8,
    color: Colors.text
  },
  button: {
    backgroundColor: Colors.primary,
    padding: 15,
    borderRadius: 8,
    marginTop: 30,
    alignItems: 'center'
  },
  buttonText: { color: 'white', fontWeight: 'bold' }
});
