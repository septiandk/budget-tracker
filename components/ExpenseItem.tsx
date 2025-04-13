import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ShoppingBag, Coffee, Car, Home, Film, Heart, Book, Plane, Package, MoreVertical } from 'lucide-react-native';
import Colors from '../constants/Colors';
import { formatCurrency } from '../utils/formatters';

const getCategoryIcon = (category) => {
  switch (category.toLowerCase()) {
    case 'food':
      return <Coffee size={24} color={Colors.secondary} />;
    case 'transport':
      return <Car size={24} color="#4CAF50" />;
    case 'shopping':
      return <ShoppingBag size={24} color="#9C27B0" />;
    case 'bills':
      return <Home size={24} color="#F44336" />;
    case 'entertainment':
      return <Film size={24} color="#FF5722" />;
    case 'health':
      return <Heart size={24} color="#E91E63" />;
    case 'education':
      return <Book size={24} color="#2196F3" />;
    case 'travel':
      return <Plane size={24} color="#00BCD4" />;
    default:
      return <Package size={24} color={Colors.gray} />;
  }
};

export default function ExpenseItem({ expense }) {
  const { date, description, amount, category } = expense;
  
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        {getCategoryIcon(category)}
      </View>
      <View style={styles.details}>
        <Text style={styles.description} numberOfLines={1}>
          {description}
        </Text>
        <View style={styles.metaContainer}>
          <Text style={styles.category}>{category}</Text>
          <Text style={styles.date}>{date}</Text>
        </View>
      </View>
      <View style={styles.rightContainer}>
        <Text style={styles.amount}>{formatCurrency(amount)}</Text>
        <TouchableOpacity style={styles.moreButton}>
          <MoreVertical size={16} color={Colors.gray} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.lightBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  details: {
    flex: 1,
  },
  description: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 4,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  category: {
    fontSize: 13,
    color: Colors.primary,
    backgroundColor: `${Colors.primary}20`,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 8,
    textTransform: 'capitalize',
  },
  date: {
    fontSize: 13,
    color: Colors.gray,
  },
  rightContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  moreButton: {
    padding: 4,
  },
});