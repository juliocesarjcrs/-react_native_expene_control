import LoginScreen from '~/Screens/Auth/LoginScreen';
// import ListSubCategoriesScreen from '~/Screens/Subcategories/ListSubcategoriesScreen';
import CreateSubcategoryScreen from '~/Screens/Subcategories/CreateSubcategoryScreen';
import CreateCategoryScreen from '~/Screens/Categories/CreateCategoryScreen';
import EditCategoryScreen from '~/Screens/Categories/EditCategoryScreen';
// Expenses
import CreateExpenseScreenV2 from '../Screens/Expenses/CreateExpenseScreenV2';
import CreateExpenseScreen from '~/Screens/Expenses/CreateExpenseScreen';
import EditExpenseScreen from '~/Screens/Expenses/EditExpenseScreen';
import MainScreen from '~/Screens/Main/MainScreen';
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
import ChangePasswordScreen from '~/Screens/Users/ChangePasswordScreen';
// incomes
import LastIncomesScreen from '~/Screens/Incomes/LastIncomesScreen';
import EditIncomeScreen from '~/Screens/Incomes/EditIncomeScreen';
// others
import CalculeProductsScreen from '~/Screens/Others/CalculeProductsScreen';
import ExportExpenseScreen from '~/Screens/Expenses/ExportExpenseScreen';
import ManageCSVsScreen from '~/Screens/Others/ManageCsvScreen';
// loans
import CreateLoanScreen from '~/Screens/Loans/CreateLoanScreen';
import AdvancedSearchScreen from '../Screens/common/advance-search';
// budgets
import VirtualBudgetScreen from '../Screens/Budgest/VirtualBudgetScreen';
// Settings
import ManageFeatureFlagsScreen from '~/Screens/Settings/ManageFeatureFlagsScreen';
import { ChatbotConfigScreen } from '~/Screens/Settings/ChatbotConfigScreen';

export interface StackRoutesType {
  LoginScreen: typeof LoginScreen;
  MainScreen: typeof MainScreen;
  // ListSubCategoriesScreen?: typeof ListSubCategoriesScreen;
  CreateSubcategoryScreen: typeof CreateSubcategoryScreen;
  CreateCategoryScreen: typeof CreateCategoryScreen;
  EditCategoryScreen: typeof EditCategoryScreen;
  CreateExpenseScreenV2: typeof CreateExpenseScreenV2;
  CreateExpenseScreen: typeof CreateExpenseScreen;
  SumaryExpenseScreen: typeof SumaryExpenseScreen;
  SumaryIncomesScreen: typeof SumaryIncomesScreen;
  CreateIncomeScreen: typeof CreateIncomeScreen;
  CashFlowScreen: typeof CashFlowScreen;
  GraphBalancesScreen: typeof GraphBalancesScreen;
  LastExpensesScreen: typeof LastExpensesScreen;
  EditExpenseScreen: typeof EditExpenseScreen;
  EditSubcategoryScreen: typeof EditSubcategoryScreen;
  SettingsScreen: typeof SettingsScreen;
  ForgotPasswordScreen: typeof ForgotPasswordScreen;
  CheckCodePasswordScreen: typeof CheckCodePasswordScreen;
  ResetPasswordScreen: typeof ResetPasswordScreen;
  EditUserScreen: typeof EditUserScreen;
  ChangePasswordScreen: typeof ChangePasswordScreen;
  CreateUserScreen: typeof CreateUserScreen;
  LastIncomesScreen: typeof LastIncomesScreen;
  EditIncomeScreen: typeof EditIncomeScreen;
  CalculeProductsScreen: typeof CalculeProductsScreen;
  ExportExpenseScreen: typeof ExportExpenseScreen;
  AdvancedSearchScreen: typeof AdvancedSearchScreen;
  CreateLoanScreen: typeof CreateLoanScreen;
  VirtualBudgetScreen: typeof VirtualBudgetScreen;
  ManageCSVsScreen: typeof ManageCSVsScreen;
  ManageFeatureFlagsScreen: typeof ManageFeatureFlagsScreen;
  ChatbotConfigScreen: typeof ChatbotConfigScreen;
}

const stackRoutes: StackRoutesType = {
  LoginScreen,
  MainScreen,
  // ListSubCategoriesScreen,
  CreateSubcategoryScreen,
  CreateCategoryScreen,
  EditCategoryScreen,
  CreateExpenseScreenV2,
  CreateExpenseScreen,
  SumaryExpenseScreen,
  SumaryIncomesScreen,
  CreateIncomeScreen,
  CashFlowScreen,
  GraphBalancesScreen,
  LastExpensesScreen,
  EditExpenseScreen,
  EditSubcategoryScreen,
  SettingsScreen,
  ForgotPasswordScreen,
  CheckCodePasswordScreen,
  ResetPasswordScreen,
  EditUserScreen,
  ChangePasswordScreen,
  CreateUserScreen,
  LastIncomesScreen,
  EditIncomeScreen,
  CalculeProductsScreen,
  ExportExpenseScreen,
  AdvancedSearchScreen,
  CreateLoanScreen,
  VirtualBudgetScreen,
  ManageCSVsScreen,
  ManageFeatureFlagsScreen,
  ChatbotConfigScreen,
};

export default stackRoutes;
