import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { fetchRecentTransactions, fetchBudgetSummary } from '../../services/googleSheetsService';
import { formatCurrency } from '../../utils/formatters';
import Colors from '../../constants/Colors';
import RecentTransactionCard from '../../components/RecentTransactionCard';
import BudgetSummaryCard from '../../components/BudgetSummaryCard';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Dashboard() {
  const { user, isGoogleSheetsConnected } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [budgetSummary, setBudgetSummary] = useState({
    totalBudget: 0,
    totalSpent: 0,
    remaining: 0,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      // Only try to fetch online data if Google Sheets is connected
      const transactions = await fetchRecentTransactions(isGoogleSheetsConnected);
      const summary = await fetchBudgetSummary(isGoogleSheetsConnected);
      
      setRecentTransactions(transactions);
      setBudgetSummary(summary);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert('Error', 'Failed to load data. Using local data only.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, [isGoogleSheetsConnected]);

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>Hello, {user?.name || 'User'}</Text>
          <Text style={styles.date}>{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
        </View>

        <BudgetSummaryCard
          totalBudget={budgetSummary.totalBudget}
          totalSpent={budgetSummary.totalSpent}
          remaining={budgetSummary.remaining}
        />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          {recentTransactions.length > 0 ? (
            recentTransactions.map((transaction, index) => (
              <RecentTransactionCard key={index} transaction={transaction} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No recent transactions</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  date: {
    fontSize: 14,
    color: Colors.gray,
    marginTop: 4,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: Colors.text,
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 10,
  },
  emptyStateText: {
    color: Colors.gray,
    fontSize: 16,
  },
});