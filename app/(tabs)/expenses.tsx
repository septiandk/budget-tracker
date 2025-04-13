import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Calendar, Filter } from 'lucide-react-native';
import { fetchExpenses } from '../../services/googleSheetsService';
import Colors from '../../constants/Colors';
import ExpenseItem from '../../components/ExpenseItem';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';

export default function ExpensesScreen() {
  const { isGoogleSheetsConnected } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, week, month
  const [refreshing, setRefreshing] = useState(false);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const data = await fetchExpenses(filter, isGoogleSheetsConnected);
      setExpenses(data);
    } catch (error) {
      console.error('Error loading expenses:', error);
      Alert.alert('Error', 'Failed to load expenses. Using local data only.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadExpenses();
    setRefreshing(false);
  };

  useEffect(() => {
    loadExpenses();
  }, [filter, isGoogleSheetsConnected]);

  const renderFilterButton = (label, value) => (
    <TouchableOpacity
      style={[styles.filterButton, filter === value && styles.filterButtonActive]}
      onPress={() => setFilter(value)}
    >
      <Text style={[styles.filterButtonText, filter === value && styles.filterButtonTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.filterContainer}>
        <View style={styles.filterHeader}>
          <Filter size={20} color={Colors.text} />
          <Text style={styles.filterTitle}>Filter</Text>
        </View>
        <View style={styles.filterButtons}>
          {renderFilterButton('All', 'all')}
          {renderFilterButton('This Week', 'week')}
          {renderFilterButton('This Month', 'month')}
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={expenses}
          keyExtractor={(item, index) => `expense-${index}`}
          renderItem={({ item }) => <ExpenseItem expense={item} />}
          contentContainerStyle={styles.listContent}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Calendar size={50} color={Colors.gray} />
              <Text style={styles.emptyText}>No expenses found</Text>
              <Text style={styles.emptySubtext}>Add an expense to get started</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    padding: 15,
    backgroundColor: Colors.card,
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 10,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    color: Colors.text,
  },
  filterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: Colors.background,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
  },
  filterButtonText: {
    color: Colors.text,
    fontSize: 14,
  },
  filterButtonTextActive: {
    color: Colors.white,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 15,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 50,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.gray,
    marginTop: 8,
  },
});