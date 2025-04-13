import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { fetchRecentTransactions, fetchBudgetSummary } from '../../services/googleSheetsService';
import { formatCurrency } from '../../utils/formatters';
import Colors from '../../constants/Colors';
import RecentTransactionCard from '../../components/RecentTransactionCard';
import BudgetSummaryCard from '../../components/BudgetSummaryCard';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  const [income, setIncome] = useState(0);

  const loadData = async () => {
    try {
      setLoading(true);

      let transactions = [];
      let summary = {
        totalBudget: 0,
        totalSpent: 0,
        remaining: 0,
      };

      if (isGoogleSheetsConnected) {
        transactions = await fetchRecentTransactions(true);
        summary = await fetchBudgetSummary(true);
        setIncome(summary.totalBudget); // optional: kalau income = budget dari Sheets
      } else {
        const localExpenses = await AsyncStorage.getItem('budget_tracker_transactions');
        transactions = localExpenses ? JSON.parse(localExpenses) : [];

        const local = await AsyncStorage.getItem('budgetData');
        const parsed = local ? JSON.parse(local) : { income: 0, budget: 0 };
        setIncome(parsed.income || 0);

        summary = {
          totalBudget: parsed.budget || 0,
          totalSpent: transactions.reduce((sum, tx) => sum + Number(tx.amount || 0), 0),
          remaining: (parsed.budget || 0) - transactions.reduce((sum, tx) => sum + Number(tx.amount || 0), 0),
        };
      }

      setRecentTransactions(transactions.slice().reverse().slice(0, 5));
      setBudgetSummary(summary);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert('Error', 'Failed to load data. Showing local fallback.');
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
          <Text style={styles.date}>
            {new Date().toLocaleDateString('id-ID', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>

          {income > 0 && (
            <Text style={styles.incomeText}>
              Income this month: {formatCurrency(income)}
            </Text>
          )}
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
  incomeText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: 8,
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
