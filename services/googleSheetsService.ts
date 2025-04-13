import { Platform } from 'react-native';
import axios from 'axios';
import { format, subDays, startOfWeek, startOfMonth } from 'date-fns';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Google Sheets API configuration
const API_KEY = Constants.expoConfig?.extra?.googleSheetsApiKey || '';
const SPREADSHEET_ID = Constants.expoConfig?.extra?.spreadsheetId || '';

// Storage keys
const TRANSACTIONS_STORAGE_KEY = 'budget_tracker_transactions';
const BUDGET_STORAGE_KEY = 'budget_tracker_budget';
const LAST_SYNC_KEY = 'budget_tracker_last_sync';
const OAUTH_TOKEN_KEY = 'budget_tracker_oauth_token';

// Helper function to get the Google Sheets API URL
const getSheetsApiUrl = (range: string) => {
  return `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}?key=${API_KEY}`;
};

// Helper function to get the OAuth token from storage
const getOAuthToken = async () => {
  try {
    const token = await AsyncStorage.getItem(OAUTH_TOKEN_KEY);
    return token;
  } catch (error) {
    console.error('Error getting OAuth token:', error);
    return null;
  }
};

// Helper function to save the OAuth token to storage
export const saveOAuthToken = async (token: string) => {
  try {
    await AsyncStorage.setItem(OAUTH_TOKEN_KEY, token);
    return true;
  } catch (error) {
    console.error('Error saving OAuth token:', error);
    return false;
  }
};

// Helper function to append values to a Google Sheet
const appendToSheet = async (range: string, values: any[][]) => {
  try {
    const token = await getOAuthToken();
    
    if (token) {
      // If we have an OAuth token, use it to write to Google Sheets
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}:append?valueInputOption=USER_ENTERED`;
      
      const response = await axios.post(
        url,
        {
          values: values
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          params: {
            insertDataOption: 'INSERT_ROWS'
          }
        }
      );
      
      // Store the data locally as well for offline access
      const transaction = {
        date: values[0][0],
        description: values[0][1],
        amount: parseFloat(values[0][2]),
        category: values[0][3],
        timestamp: values[0][4]
      };
      
      await addTransactionToStorage(transaction);
      
      return { success: true, message: 'Data successfully added to Google Sheets' };
    } else {
      // If no OAuth token, store locally only
      console.log('No OAuth token available. Storing locally only.');
      
      const transaction = {
        date: values[0][0],
        description: values[0][1],
        amount: parseFloat(values[0][2]),
        category: values[0][3],
        timestamp: values[0][4]
      };
      
      await addTransactionToStorage(transaction);
      
      return { success: true, message: 'Stored locally. OAuth token required for Google Sheets writing.' };
    }
  } catch (error) {
    console.error('Error appending to Google Sheet:', error);
    
    // If API call fails, still store locally
    const transaction = {
      date: values[0][0],
      description: values[0][1],
      amount: parseFloat(values[0][2]),
      category: values[0][3],
      timestamp: values[0][4]
    };
    
    await addTransactionToStorage(transaction);
    
    throw error;
  }
};

// Helper function to get values from a Google Sheet
const getSheetValues = async (range: string) => {
  try {
    const token = await getOAuthToken();
    let url = getSheetsApiUrl(range);
    let response;
    
    if (token) {
      // If we have an OAuth token, use it for better access
      response = await axios.get(
        `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
    } else {
      // Fall back to API key for read-only access
      response = await axios.get(url);
    }
    
    return response.data.values || [];
  } catch (error) {
    console.error('Error fetching from Google Sheet:', error);
    throw error;
  }
};

// Local storage helpers
const addTransactionToStorage = async (transaction: any) => {
  try {
    const storedTransactions = await AsyncStorage.getItem(TRANSACTIONS_STORAGE_KEY);
    let transactions = storedTransactions ? JSON.parse(storedTransactions) : [];
    transactions.unshift(transaction); // Add to beginning of array
    await AsyncStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(transactions));
    return true;
  } catch (error) {
    console.error('Error storing transaction:', error);
    return false;
  }
};

const getTransactionsFromStorage = async () => {
  try {
    const storedTransactions = await AsyncStorage.getItem(TRANSACTIONS_STORAGE_KEY);
    return storedTransactions ? JSON.parse(storedTransactions) : [];
  } catch (error) {
    console.error('Error getting transactions from storage:', error);
    return [];
  }
};

const setBudgetInStorage = async (budget: any) => {
  try {
    await AsyncStorage.setItem(BUDGET_STORAGE_KEY, JSON.stringify(budget));
    return true;
  } catch (error) {
    console.error('Error storing budget:', error);
    return false;
  }
};

const getBudgetFromStorage = async () => {
  try {
    const storedBudget = await AsyncStorage.getItem(BUDGET_STORAGE_KEY);
    return storedBudget ? JSON.parse(storedBudget) : { totalBudget: 0 };
  } catch (error) {
    console.error('Error getting budget from storage:', error);
    return { totalBudget: 0 };
  }
};

// Check if OAuth token is available
export const isOAuthAvailable = async () => {
  const token = await getOAuthToken();
  return !!token;
};

// Fetch recent transactions
export const fetchRecentTransactions = async (useOnlineData = false) => {
  try {
    // First try to get from local storage
    const localTransactions = await getTransactionsFromStorage();
    
    // If we have local data and don't need online data, return it
    if (localTransactions.length > 0 && !useOnlineData) {
      return localTransactions.slice(0, 5); // Return only the 5 most recent
    }
    
    // If we need online data and we're connected, try to fetch
    if (useOnlineData) {
      // Get the last 5 transactions from the Transactions sheet
      const values = await getSheetValues('Transactions!A2:E6');
      
      const onlineTransactions = values.map((row: any[]) => ({
        date: row[0],
        description: row[1],
        amount: parseFloat(row[2]),
        category: row[3],
      }));
      
      // Merge with local data and save
      const mergedTransactions = [...onlineTransactions, ...localTransactions];
      // Remove duplicates (based on timestamp or other unique identifier)
      const uniqueTransactions = Array.from(new Set(mergedTransactions.map(t => JSON.stringify(t))))
        .map(s => JSON.parse(s));
      
      await AsyncStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(uniqueTransactions));
      await AsyncStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
      
      return uniqueTransactions.slice(0, 5);
    }
    
    return localTransactions.slice(0, 5);
  } catch (error) {
    console.error('Error fetching recent transactions:', error);
    // Fallback to local data
    const localTransactions = await getTransactionsFromStorage();
    return localTransactions.slice(0, 5);
  }
};

// Fetch budget summary
export const fetchBudgetSummary = async (useOnlineData = false) => {
  try {
    // First try to get from local storage
    const localBudget = await getBudgetFromStorage();
    const localTransactions = await getTransactionsFromStorage();
    
    // Calculate total spent from local transactions
    const totalSpent = localTransactions.reduce((sum: number, transaction: any) => {
      const amount = parseFloat(transaction.amount) || 0;
      return sum + (amount > 0 ? 0 : Math.abs(amount)); // Only count negative amounts (expenses)
    }, 0);
    
    const localSummary = {
      totalBudget: localBudget.totalBudget || 0,
      totalSpent,
      remaining: (localBudget.totalBudget || 0) - totalSpent,
    };
    
    // If we have local data and don't need online data, return it
    if (!useOnlineData) {
      return localSummary;
    }
    
    // If we need online data and we're connected, try to fetch
    if (useOnlineData) {
      // Get the budget summary from the Budget sheet
      const budgetValues = await getSheetValues('Budget!A2:B2');
      const expensesValues = await getSheetValues('Transactions!C2:C');
      
      const totalBudget = parseFloat(budgetValues[0][1]) || 0;
      
      // Calculate total spent from all expenses
      const onlineTotalSpent = expensesValues.reduce((sum: number, row: any[]) => {
        const amount = parseFloat(row[0]) || 0;
        return sum + (amount > 0 ? 0 : Math.abs(amount)); // Only count negative amounts (expenses)
      }, 0);
      
      const onlineSummary = {
        totalBudget,
        totalSpent: onlineTotalSpent,
        remaining: totalBudget - onlineTotalSpent,
      };
      
      // Save to local storage
      await setBudgetInStorage({ totalBudget });
      
      return onlineSummary;
    }
    
    return localSummary;
  } catch (error) {
    console.error('Error fetching budget summary:', error);
    // Fallback to local data
    const localBudget = await getBudgetFromStorage();
    const localTransactions = await getTransactionsFromStorage();
    
    const totalSpent = localTransactions.reduce((sum: number, transaction: any) => {
      const amount = parseFloat(transaction.amount) || 0;
      return sum + (amount > 0 ? 0 : Math.abs(amount));
    }, 0);
    
    return {
      totalBudget: localBudget.totalBudget || 0,
      totalSpent,
      remaining: (localBudget.totalBudget || 0) - totalSpent,
    };
  }
};

// Fetch expenses with filter
export const fetchExpenses = async (filter: string = 'all', useOnlineData = false) => {
  try {
    // First try to get from local storage
    const localTransactions = await getTransactionsFromStorage();
    
    // Apply filter to local transactions
    let filteredLocalTransactions = [...localTransactions];
    
    if (filter !== 'all') {
      const today = new Date();
      let startDate;
      
      if (filter === 'week') {
        startDate = startOfWeek(today);
      } else if (filter === 'month') {
        startDate = startOfMonth(today);
      }
      
      filteredLocalTransactions = localTransactions.filter(transaction => {
        const expenseDate = new Date(transaction.date);
        return expenseDate >= startDate && expenseDate <= today;
      });
    }
    
    // If we have local data and don't need online data, return it
    if (!useOnlineData) {
      return filteredLocalTransactions;
    }
    
    // If we need online data and we're connected, try to fetch
    if (useOnlineData) {
      // Get all transactions from the Transactions sheet
      const values = await getSheetValues('Transactions!A2:E');
      
      // Convert to array of expense objects
      const allExpenses = values.map((row: any[]) => ({
        date: row[0],
        description: row[1],
        amount: parseFloat(row[2]),
        category: row[3],
      }));
      
      // Apply filter
      let filteredOnlineExpenses = [...allExpenses];
      
      if (filter !== 'all') {
        const today = new Date();
        let startDate;
        
        if (filter === 'week') {
          startDate = startOfWeek(today);
        } else if (filter === 'month') {
          startDate = startOfMonth(today);
        }
        
        filteredOnlineExpenses = allExpenses.filter(expense => {
          const expenseDate = new Date(expense.date);
          return expenseDate >= startDate && expenseDate <= today;
        });
      }
      
      // Merge with local data and save
      const mergedTransactions = [...allExpenses, ...localTransactions];
      // Remove duplicates
      const uniqueTransactions = Array.from(new Set(mergedTransactions.map(t => JSON.stringify(t))))
        .map(s => JSON.parse(s));
      
      await AsyncStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(uniqueTransactions));
      await AsyncStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
      
      // Apply filter to merged data
      let filteredMergedTransactions = [...uniqueTransactions];
      
      if (filter !== 'all') {
        const today = new Date();
        let startDate;
        
        if (filter === 'week') {
          startDate = startOfWeek(today);
        } else if (filter === 'month') {
          startDate = startOfMonth(today);
        }
        
        filteredMergedTransactions = uniqueTransactions.filter(transaction => {
          const expenseDate = new Date(transaction.date);
          return expenseDate >= startDate && expenseDate <= today;
        });
      }
      
      return filteredMergedTransactions;
    }
    
    return filteredLocalTransactions;
  } catch (error) {
    console.error('Error fetching expenses:', error);
    // Fallback to local data
    const localTransactions = await getTransactionsFromStorage();
    
    // Apply filter to local transactions
    let filteredLocalTransactions = [...localTransactions];
    
    if (filter !== 'all') {
      const today = new Date();
      let startDate;
      
      if (filter === 'week') {
        startDate = startOfWeek(today);
      } else if (filter === 'month') {
        startDate = startOfMonth(today);
      }
      
      filteredLocalTransactions = localTransactions.filter(transaction => {
        const expenseDate = new Date(transaction.date);
        return expenseDate >= startDate && expenseDate <= today;
      });
    }
    
    return filteredLocalTransactions;
  }
};

// Add a new expense
export const addExpense = async (expense: any) => {
  try {
    const { date, description, amount, category } = expense;

    const transaction = {
      date,
      description,
      amount,
      category,
      timestamp: new Date().toISOString()
    };

    try {
      // Coba simpan ke Google Sheets dulu
      await appendToSheet('Transactions!A:E', [
        [date, description, amount, category, transaction.timestamp]
      ]);

      // Kalau berhasil, return langsung (GAK perlu simpan lokal)
      return {
        success: true,
        message: 'Expense added to Google Sheets'
      };
    } catch (error) {
      console.error('Error saving to Google Sheets:', error);

      // Kalau gagal, baru simpan lokal
      await addTransactionToStorage(transaction);

      return {
        success: true,
        message: 'Expense saved locally only. Google Sheets update failed.'
      };
    }
  } catch (error) {
    console.error('Error adding expense:', error);
    throw error;
  }
};


// Fetch category breakdown for pie chart
export const fetchCategoryBreakdown = async (useOnlineData = false) => {
  try {
    // First try to get from local storage
    const localTransactions = await getTransactionsFromStorage();
    
    // Group expenses by category
    const categoryMap = new Map();
    
    localTransactions.forEach((transaction: any) => {
      const category = transaction.category;
      const amount = parseFloat(transaction.amount) || 0;
      
      // Only count expenses (negative amounts)
      if (amount < 0) {
        const absAmount = Math.abs(amount);
        if (categoryMap.has(category)) {
          categoryMap.set(category, categoryMap.get(category) + absAmount);
        } else {
          categoryMap.set(category, absAmount);
        }
      }
    });
    
    // Convert to format needed for pie chart
    const colors = [
      '#FF9F1C', '#4CAF50', '#9C27B0', '#F44336', 
      '#FF5722', '#E91E63', '#2196F3', '#00BCD4'
    ];
    
    let colorIndex = 0;
    const localCategoryData = Array.from(categoryMap.entries()).map(([name, value]) => ({
      name,
      value,
      color: colors[colorIndex++ % colors.length],
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    }));
    
    // If we have local data and don't need online data, return it
    if (localCategoryData.length > 0 && !useOnlineData) {
      return localCategoryData;
    }
    
    // If we need online data and we're connected, try to fetch
    if (useOnlineData) {
      // Get all transactions from the Transactions sheet
      const values = await getSheetValues('Transactions!A2:E');
      
      // Group expenses by category
      const onlineCategoryMap = new Map();
      
      values.forEach((row: any[]) => {
        const category = row[3];
        const amount = parseFloat(row[2]) || 0;
        
        // Only count expenses (negative amounts)
        if (amount < 0) {
          const absAmount = Math.abs(amount);
          if (onlineCategoryMap.has(category)) {
            onlineCategoryMap.set(category, onlineCategoryMap.get(category) + absAmount);
          } else {
            onlineCategoryMap.set(category, absAmount);
          }
        }
      });
      
      // Merge category maps
      const mergedCategoryMap = new Map([...categoryMap, ...onlineCategoryMap]);
      
      // Convert to format needed for pie chart
      colorIndex = 0;
      const mergedCategoryData = Array.from(mergedCategoryMap.entries()).map(([name, value]) => ({
        name,
        value,
        color: colors[colorIndex++ % colors.length],
        legendFontColor: '#7F7F7F',
        legendFontSize: 12,
      }));
      
      return mergedCategoryData;
    }
    
    return localCategoryData;
  } catch (error) {
    console.error('Error fetching category breakdown:', error);
    // Fallback to local data
    const localTransactions = await getTransactionsFromStorage();
    
    // Group expenses by category
    const categoryMap = new Map();
    
    localTransactions.forEach((transaction: any) => {
      const category = transaction.category;
      const amount = parseFloat(transaction.amount) || 0;
      
      // Only count expenses (negative amounts)
      if (amount < 0) {
        const absAmount = Math.abs(amount);
        if (categoryMap.has(category)) {
          categoryMap.set(category, categoryMap.get(category) + absAmount);
        } else {
          categoryMap.set(category, absAmount);
        }
      }
    });
    
    // Convert to format needed for pie chart
    const colors = [
      '#FF9F1C', '#4CAF50', '#9C27B0', '#F44336', 
      '#FF5722', '#E91E63', '#2196F3', '#00BCD4'
    ];
    
    let colorIndex = 0;
    return Array.from(categoryMap.entries()).map(([name, value]) => ({
      name,
      value,
      color: colors[colorIndex++ % colors.length],
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    }));
  }
};

// Fetch monthly trends for line chart
export const fetchMonthlyTrends = async (useOnlineData = false) => {
  try {
    // First try to get from local storage
    const localTransactions = await getTransactionsFromStorage();
    
    // Group expenses by month
    const monthlyMap = new Map();
    
    localTransactions.forEach((transaction: any) => {
      const date = new Date(transaction.date);
      const month = format(date, 'MMM');
      const amount = parseFloat(transaction.amount) || 0;
      
      // Only count expenses (negative amounts)
      if (amount < 0) {
        const absAmount = Math.abs(amount);
        if (monthlyMap.has(month)) {
          monthlyMap.set(month, monthlyMap.get(month) + absAmount);
        } else {
          monthlyMap.set(month, absAmount);
        }
      }
    });
    
    // Sort months chronologically
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const sortedMonths = Array.from(monthlyMap.keys()).sort(
      (a, b) => months.indexOf(a) - months.indexOf(b)
    );
    
    // Convert to format needed for line chart
    const localMonthlyData = {
      labels: sortedMonths,
      datasets: [
        {
          data: sortedMonths.map(month => monthlyMap.get(month)),
        },
      ],
    };
    
    // If we have local data and don't need online data, return it
    if (sortedMonths.length > 0 && !useOnlineData) {
      return localMonthlyData;
    }
    
    // If we need online data and we're connected, try to fetch
    if (useOnlineData) {
      // Get all transactions from the Transactions sheet
      const values = await getSheetValues('Transactions!A2:C');
      
      // Group expenses by month
      const onlineMonthlyMap = new Map();
      
      values.forEach((row: any[]) => {
        const date = new Date(row[0]);
        const month = format(date, 'MMM');
        const amount = parseFloat(row[2]) || 0;
        
        // Only count expenses (negative amounts)
        if (amount < 0) {
          const absAmount = Math.abs(amount);
          if (onlineMonthlyMap.has(month)) {
            onlineMonthlyMap.set(month, onlineMonthlyMap.get(month) + absAmount);
          } else {
            onlineMonthlyMap.set(month, absAmount);
          }
        }
      });
      
      // Merge monthly maps
      const mergedMonthlyMap = new Map();
      
      // Add all months from both maps
      for (const [month, amount] of [...monthlyMap, ...onlineMonthlyMap]) {
        if (mergedMonthlyMap.has(month)) {
          mergedMonthlyMap.set(month, mergedMonthlyMap.get(month) + amount);
        } else {
          mergedMonthlyMap.set(month, amount);
        }
      }
      
      // Sort months chronologically
      const mergedSortedMonths = Array.from(mergedMonthlyMap.keys()).sort(
        (a, b) => months.indexOf(a) - months.indexOf(b)
      );
      
      // Convert to format needed for line chart
      const mergedMonthlyData = {
        labels: mergedSortedMonths,
        datasets: [
          {
            data: mergedSortedMonths.map(month => mergedMonthlyMap.get(month)),
          },
        ],
      };
      
      return mergedMonthlyData;
    }
    
    return localMonthlyData;
  } catch (error) {
    console.error('Error fetching monthly trends:', error);
    // Fallback to local data
    const localTransactions = await getTransactionsFromStorage();
    
    // Group expenses by month
    const monthlyMap = new Map();
    
    localTransactions.forEach((transaction: any) => {
      const date = new Date(transaction.date);
      const month = format(date, 'MMM');
      const amount = parseFloat(transaction.amount) || 0;
      
      // Only count expenses (negative amounts)
      if (amount < 0) {
        const absAmount = Math.abs(amount);
        if (monthlyMap.has(month)) {
          monthlyMap.set(month, monthlyMap.get(month) + absAmount);
        } else {
          monthlyMap.set(month, absAmount);
        }
      }
    });
    
    // Sort months chronologically
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const sortedMonths = Array.from(monthlyMap.keys()).sort(
      (a, b) => months.indexOf(a) - months.indexOf(b)
    );
    
    // Convert to format needed for line chart
    return {
      labels: sortedMonths,
      datasets: [
        {
          data: sortedMonths.map(month => monthlyMap.get(month)),
        },
      ],
    };
  }
};

// Initialize Google Sheets connection
export const initializeGoogleSheets = async () => {
  try {
    // Verify connection by fetching a small range
    await getSheetValues('A1:A1');
    return { success: true };
  } catch (error) {
    console.error('Error initializing Google Sheets:', error);
    throw error;
  }
};