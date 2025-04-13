import { View, Text, StyleSheet } from 'react-native';
import Colors from '../constants/Colors';
import { formatCurrency } from '../utils/formatters';

export default function BudgetSummaryCard({ totalBudget, totalSpent, remaining }) {
  const percentSpent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  
  // Determine color based on remaining budget percentage
  const getProgressColor = () => {
    if (percentSpent > 90) return Colors.danger;
    if (percentSpent > 70) return Colors.warning;
    return Colors.success;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Monthly Budget</Text>
      
      <View style={styles.budgetRow}>
        <Text style={styles.budgetLabel}>Total Budget</Text>
        <Text style={styles.budgetValue}>{formatCurrency(totalBudget)}</Text>
      </View>
      
      <View style={styles.budgetRow}>
        <Text style={styles.budgetLabel}>Spent</Text>
        <Text style={styles.budgetValue}>{formatCurrency(totalSpent)}</Text>
      </View>
      
      <View style={styles.divider} />
      
      <View style={styles.budgetRow}>
        <Text style={styles.remainingLabel}>Remaining</Text>
        <Text style={[styles.remainingValue, { color: getProgressColor() }]}>
          {formatCurrency(remaining)}
        </Text>
      </View>
      
      <View style={styles.progressContainer}>
        <View style={styles.progressBackground}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${Math.min(percentSpent, 100)}%`,
                backgroundColor: getProgressColor()
              }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>{percentSpent.toFixed(0)}% spent</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: 15,
    padding: 20,
    margin: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: Colors.text,
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  budgetLabel: {
    fontSize: 15,
    color: Colors.gray,
  },
  budgetValue: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 10,
  },
  remainingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  remainingValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  progressContainer: {
    marginTop: 15,
  },
  progressBackground: {
    height: 8,
    backgroundColor: Colors.lightBackground,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: Colors.gray,
    marginTop: 5,
    textAlign: 'right',
  },
});