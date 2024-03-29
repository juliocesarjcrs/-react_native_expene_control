import LoginScreen from '~/Screens/Auth/LoginScreen';
// import ListSubCategoriesScreen from '~/Screens/Subcategories/ListSubcategoriesScreen';
import CreateSubcategoryScreen from '~/Screens/Subcategories/CreateSubcategoryScreen';
import CreateCategoryScreen from '~/Screens/Categories/CreateCategoryScreen';
import EditCategoryScreen from '~/Screens/Categories/EditCategoryScreen';
import CreateExpenseScreen from '~/Screens/Expenses/CreateExpenseScreen';
import EditExpenseScreen from '~/Screens/Expenses/EditExpenseScreen';
import MainScreen from '~/Screens/Main/MainScreen'
import SumaryExpenseScreen from '~/Screens/Expenses/SumaryExpenseScreen';
import SumaryIncomesScreen from '~/Screens/Incomes/SumaryIncomesScreen';
import CreateIncomeScreen from '~/Screens/Incomes/CreateIncomeScreen';
// balances
import CashFlowScreen from '~/Screens/Balances/CashFlowScreen';
import GraphBalancesScreen from '~/Screens/Balances/GraphBalancesScreen';
import LastExpensesScreen from '~/Screens/Expenses/LastExpensesScreen';
import EditSubcategoryScreen from '~/Screens/Subcategories/EditSubcategoryScreen';
import SettingsScreen from '~/Screens/Settings/SettingsScreen';
// auth
import ForgotPasswordScreen from '~/Screens/Auth/ForgotPasswordScreen';
import CheckCodePasswordScreen from '~/Screens/Auth/CheckCodePasswordScreen';
import ResetPasswordScreen from '~/Screens/Auth/ResetPasswordScreen';
// user
import EditUserScreen from '~/Screens/Users/EditUserScreen';
import CreateUserScreen from '~/Screens/Users/CreateUserScreen';

import ChangePasswordScreen from  '~/Screens/Users/ChangePasswordScreen';
// incomes
import LastIncomesScreen from '~/Screens/Incomes/LastIncomesScreen';
import EditIncomeScreen from '~/Screens/Incomes/EditIncomeScreen';

// others
import CalculeProductsScreen from '~/Screens/Others/CalculeProductsScreen';

import ExportExpenseScreen from '~/Screens/Expenses/ExportExpenseScreen';
// loands
import CreateLoanScreen from '~/Screens/Loans/CreateLoanScreen';

import AdvancedSearchScreen from  '../Screens/common/advance-search';

// budgets
import  VirtualBudgetScreen from '../Screens/Budgest/VirtualBudgetScreen';

export default {
  LoginScreen,
  MainScreen,
  // ListSubCategoriesScreen,
  CreateSubcategoryScreen,
  CreateCategoryScreen,
  EditCategoryScreen,
  CreateExpenseScreen,
  SumaryExpenseScreen,
  SumaryIncomesScreen,
  CreateIncomeScreen,
  // balances
  CashFlowScreen,
  GraphBalancesScreen,
  LastExpensesScreen,
  EditExpenseScreen,
  EditSubcategoryScreen,
  SettingsScreen,
  ForgotPasswordScreen,
  CheckCodePasswordScreen,
  ResetPasswordScreen,
  // Users
  EditUserScreen,
  ChangePasswordScreen,
  CreateUserScreen,
  // incomes
  LastIncomesScreen,
  EditIncomeScreen,
  // others
  CalculeProductsScreen,
  ExportExpenseScreen,
  AdvancedSearchScreen,
  // loans
  CreateLoanScreen,
  // budgets
  VirtualBudgetScreen
}