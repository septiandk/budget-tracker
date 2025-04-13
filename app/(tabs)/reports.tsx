type Transaction = {
  date: string;
  amount: number;
  description: string;
  category: string;
};

type CategoryChartData = {
  name: string;
  value: number;
  percentage: string;
  color: string;
  legendFontColor: string;
  legendFontSize: number;
};

import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { PieChart, LineChart } from 'react-native-chart-kit';
import { fetchCategoryBreakdown, fetchMonthlyTrends, fetchRecentTransactions } from '../../services/googleSheetsService';
import Colors from '../../constants/Colors';
import { formatCurrency } from '../../utils/formatters';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { ChevronDown, TrendingUp, PieChart as PieChartIcon } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ReportsScreen() {
  const { isGoogleSheetsConnected } = useAuth();
  const [loading, setLoading] = useState(true);
  const [categoryData, setCategoryData] = useState([]);
  const [monthlyData, setMonthlyData] = useState({
    labels: [],
    datasets: [{ data: [] }],
  });
  const [selectedTimeframe, setSelectedTimeframe] = useState('month');
  const [showTimeframeDropdown, setShowTimeframeDropdown] = useState(false);
  const screenWidth = Dimensions.get('window').width;

  const timeframes = [
    { label: 'This Month', value: 'month' },
    { label: 'Last 3 Months', value: '3months' },
    { label: 'Last 6 Months', value: '6months' },
    { label: 'This Year', value: 'year' },
  ];
  function buildCategoryBreakdown(transactions: Transaction[]) {
    const map = {};
    let total = 0;
  
    for (let tx of transactions) {
      if (!tx.category || isNaN(tx.amount)) continue;
  
      const amount = parseFloat(tx.amount);
      map[tx.category] = (map[tx.category] || 0) + amount;
      total += amount;
    }
  
    return Object.entries(map).map(([name, value], i) => {
      const percent = ((value / total) * 100).toFixed(1); // Format 1 angka di belakang koma
      return {
        name,
        value,
        percentage: percent,
        color: Colors.pieColors?.[i % (Colors.pieColors?.length || 6)] || '#ccc',
        legendFontColor: Colors.text,
        legendFontSize: 12,
      };
    });    
  }  
  
  function buildMonthlyTrends(transactions: Transaction[]) {
    const map = {};
  
    for (let tx of transactions) {
      if (!tx.date || isNaN(tx.amount)) continue;
  
      const date = new Date(tx.date);
      const key = date.toLocaleString('id-ID', {
        month: 'short',
        year: 'numeric',
      });
  
      map[key] = (map[key] || 0) + parseFloat(tx.amount);
    }
  
    const labels = Object.keys(map);
    const data = labels.map((key) => map[key]);
  
    return {
      labels,
      datasets: [{ data }],
    };
  }  
  const loadData = async () => {
    try {
      setLoading(true);
  
      let transactions = [];
  
      if (isGoogleSheetsConnected) {
        // Kalo lo udah punya fetchAllTransactionsFromGoogleSheets, pake ini
        const googleData = await fetchRecentTransactions(true); // atau getExpensesFromSheets()
        transactions = googleData || [];
      } else {
        const local = await AsyncStorage.getItem('budget_tracker_transactions');
        transactions = local ? JSON.parse(local) : [];
      }
  
      const categories = buildCategoryBreakdown(transactions);
      const trends = buildMonthlyTrends(transactions);
  
      setCategoryData(categories);
      setMonthlyData(trends);
  
      await AsyncStorage.setItem('localReportsData', JSON.stringify({
        categories,
        trends,
      }));
    } catch (error) {
      console.error('Error loading report data:', error);
      setCategoryData([]);
      setMonthlyData({ labels: [], datasets: [{ data: [] }] });
    } finally {
      setLoading(false);
    }
  };  

  useEffect(() => {
    loadData();
  }, [isGoogleSheetsConnected]);

  const chartConfig = {
    backgroundGradientFrom: Colors.card,
    backgroundGradientTo: Colors.card,
    color: (opacity = 1) => `rgba(81, 92, 230, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: Colors.primary,
    },
  };

  const renderTimeframeSelector = () => (
    <View style={styles.timeframeContainer}>
      <TouchableOpacity
        style={styles.timeframeButton}
        onPress={() => setShowTimeframeDropdown(!showTimeframeDropdown)}
      >
        <Text style={styles.timeframeText}>
          {timeframes.find(t => t.value === selectedTimeframe)?.label}
        </Text>
        <ChevronDown size={20} color={Colors.text} />
      </TouchableOpacity>

      {showTimeframeDropdown && (
        <View style={styles.timeframeDropdown}>
          {timeframes.map((timeframe) => (
            <TouchableOpacity
              key={timeframe.value}
              style={styles.timeframeOption}
              onPress={() => {
                setSelectedTimeframe(timeframe.value);
                setShowTimeframeDropdown(false);
              }}
            >
              <Text style={[
                styles.timeframeOptionText,
                selectedTimeframe === timeframe.value && styles.timeframeOptionTextSelected
              ]}>
                {timeframe.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {renderTimeframeSelector()}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <PieChartIcon size={24} color={Colors.text} />
            <Text style={styles.sectionTitle}>Spending by Category</Text>
          </View>

          {categoryData.length > 0 ? (
            <View style={styles.chartContainer}>
              <PieChart
                data={categoryData}
                width={screenWidth - 32}
                height={220}
                chartConfig={chartConfig}
                accessor="value"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
                hasLegend={false}
              />

              <View style={styles.categoryBreakdown}>
                {categoryData.map((category, index) => (
                  <View key={index} style={styles.categoryItem}>
                    <View style={styles.categoryHeader}>
                      <View style={[styles.categoryDot, { backgroundColor: category.color }]} />
                      <Text style={styles.categoryName}>
                        {category.name} ({category.percentage}%)
                      </Text>
                    </View>
                    <Text style={styles.categoryValue}>{formatCurrency(category.value)}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No category data available</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <TrendingUp size={24} color={Colors.text} />
            <Text style={styles.sectionTitle}>Monthly Trends</Text>
          </View>

          {monthlyData.labels.length > 0 ? (
            <View style={styles.chartContainer}>
              <LineChart
                data={monthlyData}
                width={screenWidth - 32}
                height={220}
                chartConfig={chartConfig}
                bezier
                style={styles.lineChart}
                formatYLabel={(value) => formatCurrency(parseInt(value))}
              />
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No trend data available</Text>
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
  timeframeContainer: {
    padding: 16,
    zIndex: 1,
  },
  timeframeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timeframeText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  timeframeDropdown: {
    position: 'absolute',
    top: 70,
    left: 16,
    right: 16,
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 2,
  },
  timeframeOption: {
    padding: 12,
    borderRadius: 6,
  },
  timeframeOptionText: {
    fontSize: 16,
    color: Colors.text,
  },
  timeframeOptionTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  section: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    margin: 16,
    marginTop: 0,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginLeft: 8,
  },
  chartContainer: {
    alignItems: 'center',
  },
  categoryBreakdown: {
    width: '100%',
    marginTop: 20,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  categoryName: {
    fontSize: 14,
    color: Colors.text,
  },
  categoryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  lineChart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.gray,
    textAlign: 'center',
  },
});

