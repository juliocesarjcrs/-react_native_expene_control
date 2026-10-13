/* prettier-ignore-file */
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Icon } from 'react-native-elements';
import AuthStackNavigator from './AuthStack';

// Redux
import { setIsAuth, setLoadingAuth, setUser } from '../features/auth/authSlice';
import Routes from './stackRoutes';

// Services
import { getUser } from '../services/users';

// Contexts
import { FeatureFlagsProvider } from '~/contexts/FeatureFlagsContext';

// Navigation
import { minimalHeaderOptions } from './navigationTheme';

// Types
import {
  BalanceStackParamList,
  ExpenseStackParamList,
  IncomeStackParamList,
  SettingsStackParamList,
  UserModel
} from '../shared/types';
import { RootState } from '../shared/types/reducers';
import { AppDispatch } from '../shared/types/reducers/root-state.type';

// Utils
import { showError } from '~/utils/showError';

// Theme
import { useNavigationTheme } from '~/customHooks/useNavigationTheme';
import { useThemeColors } from '~/customHooks/useThemeColors';

// ====================================
// Navegadores (a nivel de módulo)
// ====================================

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const ExpenseStack = createStackNavigator<ExpenseStackParamList>();
const IncomeStack = createStackNavigator<IncomeStackParamList>();
const BalanceStack = createStackNavigator<BalanceStackParamList>();
const SettingsStack = createStackNavigator<SettingsStackParamList>();
const StatisticsStack = createStackNavigator();

// Íconos de las tabs: [seleccionada, no seleccionada]
const TAB_ICONS: Record<string, [string, string]> = {
  Gastos: ['cash', 'cash-multiple'],
  Ingresos: ['account-cash', 'account-cash-outline'],
  Balance: ['scale-balance', 'scale-balance'],
  Estadísticas: ['chart-line', 'chart-line'],
  Ajustes: ['cog', 'cog-outline']
};

const getTabIconName = (routeName: string, focused: boolean): string => {
  const icons = TAB_ICONS[routeName];
  if (!icons) return 'home';
  return focused ? icons[0] : icons[1];
};

// ====================================
// Stacks de cada tab
// ====================================

function ExpenseStackScreen() {
  return (
    <ExpenseStack.Navigator screenOptions={minimalHeaderOptions}>
      <ExpenseStack.Screen
        name="main"
        component={Routes.MainScreen}
        options={{ title: 'Resumen gastos del mes' }}
      />
      <ExpenseStack.Screen
        name="sumary"
        component={Routes.SumaryExpenseScreen}
        options={{ title: 'Resumen' }}
      />
      <ExpenseStack.Screen
        name="createExpense"
        component={Routes.CreateExpenseScreen}
        options={{ title: 'Ingresar gasto' }}
      />
      <ExpenseStack.Screen
        name="scanInvoiceExpense"
        component={Routes.ScanReceiptScreen}
        options={{ title: 'Scanear facturas' }}
      />
      <ExpenseStack.Screen
        name="createSubcategory"
        component={Routes.CreateSubcategoryScreen}
        options={{ title: 'Crear Subcategoría' }}
      />
      <ExpenseStack.Screen
        name="createCategory"
        component={Routes.CreateCategoryScreen}
        options={{ title: 'Crear Categoría' }}
      />
      <ExpenseStack.Screen
        name="editCategory"
        component={Routes.EditCategoryScreen}
        options={{ title: 'Editar Categoría' }}
      />
      <ExpenseStack.Screen
        name="lastExpenses"
        component={Routes.LastExpensesScreen}
        options={{ title: 'Últimos gastos' }}
      />
      <ExpenseStack.Screen
        name="editExpense"
        component={Routes.EditExpenseScreen}
        options={{ title: 'Editar gasto' }}
      />
      <ExpenseStack.Screen
        name="editSubcategory"
        component={Routes.EditSubcategoryScreen}
        options={{ title: 'Editar Subcategoría' }}
      />
    </ExpenseStack.Navigator>
  );
}

function IncomeStackScreen() {
  return (
    <IncomeStack.Navigator screenOptions={minimalHeaderOptions}>
      <IncomeStack.Screen
        name="sumaryIncomes"
        component={Routes.SumaryIncomesScreen}
        options={{ title: 'Resumen ingresos del mes' }}
      />
      <IncomeStack.Screen
        name="createIncome"
        component={Routes.CreateIncomeScreen}
        options={{ title: 'Agregar ingreso' }}
      />
      <IncomeStack.Screen
        name="createCategory"
        component={Routes.CreateCategoryScreen}
        options={{ title: 'Crear Categoría' }}
      />
      <IncomeStack.Screen
        name="editCategory"
        component={Routes.EditCategoryScreen}
        options={{ title: 'Editar Categoría' }}
      />
      <IncomeStack.Screen
        name="lastIncomes"
        component={Routes.LastIncomesScreen}
        options={{ title: 'Últimos ingresos' }}
      />
      <IncomeStack.Screen
        name="editIncome"
        component={Routes.EditIncomeScreen}
        options={{ title: 'Editar ingreso' }}
      />
    </IncomeStack.Navigator>
  );
}

function BalanceStackScreen() {
  return (
    <BalanceStack.Navigator screenOptions={minimalHeaderOptions}>
      <BalanceStack.Screen
        name="cashFlow"
        component={Routes.CashFlowScreen}
        options={{ title: 'Balance' }}
      />
      <BalanceStack.Screen
        name="graphBalances"
        component={Routes.GraphBalancesScreen}
        options={{ title: 'Graficas Balance' }}
      />
      <BalanceStack.Screen
        name="savingsAnalysis"
        component={Routes.SavingsAnalysisScreen}
        options={{ title: 'Análisis de Ahorros' }}
      />
    </BalanceStack.Navigator>
  );
}

function SettingsStackScreen() {
  return (
    <SettingsStack.Navigator screenOptions={minimalHeaderOptions}>
      <SettingsStack.Screen
        name="settings"
        component={Routes.SettingsScreen}
        options={{ title: 'Ajustes' }}
      />
      <SettingsStack.Screen
        name="editUser"
        component={Routes.EditUserScreen}
        options={{ title: 'Editar perfil' }}
      />
      <SettingsStack.Screen
        name="createUser"
        component={Routes.CreateUserScreen}
        options={{ title: 'Crear usuario' }}
      />
      <SettingsStack.Screen
        name="changePassword"
        component={Routes.ChangePasswordScreen}
        options={{ title: 'Cambiar contraseña' }}
      />
      <SettingsStack.Screen
        name="calculeProducts"
        component={Routes.CalculeProductsScreen}
        options={{ title: 'Calcular productos' }}
      />
      <SettingsStack.Screen
        name="createLoan"
        component={Routes.CreateLoanScreen}
        options={{ title: 'Crear préstamo' }}
      />
      <SettingsStack.Screen
        name="exportData"
        component={Routes.ExportExpenseScreen}
        options={{ title: 'Gastos rango fechas' }}
      />
      <SettingsStack.Screen
        name="advancedSearch"
        component={Routes.AdvancedSearchScreen}
        options={{ title: 'Busqueda avanzada' }}
      />
      <SettingsStack.Screen
        name="virtualBudget"
        component={Routes.VirtualBudgetScreen}
        options={{ title: 'Presupuesto virtual' }}
      />
      <SettingsStack.Screen
        name="manageCSV"
        component={Routes.ManageCSVsScreen}
        options={{ title: 'Gestionar Csv' }}
      />
      <SettingsStack.Screen
        name="manageFeatureFlags"
        component={Routes.ManageFeatureFlagsScreen}
        options={{ title: 'Gestionar Funcionalidades' }}
      />
      <SettingsStack.Screen
        name="chatbotConfig"
        component={Routes.ChatbotConfigScreen}
        options={{ title: 'Configurar Chatbot' }}
      />
      <SettingsStack.Screen
        name="manageThemes"
        component={Routes.ManageThemesScreen}
        options={{ title: 'Gestionar Temas' }}
      />
      <SettingsStack.Screen
        name="editTheme"
        component={Routes.EditThemeScreen}
        options={{ title: 'Editar Tema' }}
      />
      <SettingsStack.Screen
        name="adminDashboard"
        component={Routes.AdminDashboardScreen}
        options={{ title: 'Panel de Administración' }}
      />
      <SettingsStack.Screen
        name="aiModels"
        component={Routes.AIModelsScreen}
        options={{ title: 'Modelos de IA' }}
      />
      <SettingsStack.Screen name="userThemeSettings" component={Routes.UserThemeSettingsScreen} />
      <SettingsStack.Screen
        name="customizeThemeColors"
        component={Routes.CustomizeThemeColorsScreen}
      />
      <SettingsStack.Screen
        name="manageUserPermissions"
        component={Routes.ManageUserPermissionsScreen}
      />
      <SettingsStack.Screen
        name="createEditFeatureFlag"
        component={Routes.CreateEditFeatureFlagScreen}
        options={({ route }) => ({
          title: route.params?.featureKey ? 'Editar Funcionalidad' : 'Nueva Funcionalidad',
          headerBackTitle: 'Volver'
        })}
      />
      <SettingsStack.Screen
        name="investmentComparisonHome"
        component={Routes.InvestmentComparisonHomeScreen}
        options={{ headerShown: false }}
      />
      <SettingsStack.Screen
        name="scenarioConfig"
        component={Routes.ScenarioConfigScreen}
        options={{ headerShown: false }}
      />
      <SettingsStack.Screen
        name="comparisonResults"
        component={Routes.ComparisonResultsScreen}
        options={{ headerShown: false }}
      />
      <SettingsStack.Screen
        name="commentaryTemplates"
        component={Routes.CommentaryTemplatesScreen}
        options={{ title: 'Plantillas de Comentarios' }}
      />
    </SettingsStack.Navigator>
  );
}

function StatisticsStackScreen() {
  return (
    <StatisticsStack.Navigator screenOptions={minimalHeaderOptions}>
      {/* Pantalla principal (hub) */}
      <StatisticsStack.Screen
        name="statisticsHome"
        component={Routes.StatisticsScreen}
        options={{ title: 'Estadísticas' }}
      />
      {/* Pantalla principal de análisis */}
      <StatisticsStack.Screen
        name="commentaryAnalysis"
        component={Routes.CommentaryAnalysisScreen}
        options={{ title: 'Análisis de Comentarios' }}
      />
      {/* Comparar períodos */}
      <StatisticsStack.Screen
        name="comparePeriods"
        component={Routes.ComparePeriodsScreen}
        options={{ title: 'Comparar períodos' }}
      />
      {/* Análisis de servicios públicos */}
      <StatisticsStack.Screen
        name="utilityAnalysis"
        component={Routes.UtilityAnalysisScreen}
        options={{ title: 'Servicios Públicos' }}
      />
      {/* Comparación de precios */}
      <StatisticsStack.Screen
        name="productPrices"
        component={Routes.ProductPricesScreen}
        options={{ title: 'Precios de Productos' }}
      />
      {/* Análisis de retenciones */}
      <StatisticsStack.Screen
        name="retentionAnalysis"
        component={Routes.RetentionAnalysisScreen}
        options={{ title: 'Retenciones' }}
      />
      <StatisticsStack.Screen name="copagoAnalysis" component={Routes.CopagoAnalysisScreen} />
      <StatisticsStack.Screen name="vacationAnalysis" component={Routes.VacationAnalysisScreen} />
      <StatisticsStack.Screen name="assetAnalysis" component={Routes.AssetAnalysisScreen} />
      <StatisticsStack.Screen name="expenseAnalysis" component={Routes.ExpenseAnalysisScreen} />
    </StatisticsStack.Navigator>
  );
}

// ====================================
// Tabs principales (usuario autenticado)
// ====================================

function MainTabs() {
  const colors = useThemeColors();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => (
          <Icon
            type="material-community"
            color={color}
            name={getTabIconName(route.name, focused)}
            size={size}
          />
        ),
        tabBarActiveTintColor: colors.PRIMARY,
        tabBarInactiveTintColor: colors.TEXT_SECONDARY,
        tabBarStyle: {
          backgroundColor: colors.CARD_BACKGROUND,
          borderTopColor: colors.BORDER
        },
        headerShown: false
      })}
    >
      <Tab.Screen name="Gastos" component={ExpenseStackScreen} />
      <Tab.Screen name="Ingresos" component={IncomeStackScreen} />
      <Tab.Screen name="Balance" component={BalanceStackScreen} />
      <Tab.Screen name="Estadísticas" component={StatisticsStackScreen} />
      <Tab.Screen name="Ajustes" component={SettingsStackScreen} />
    </Tab.Navigator>
  );
}

// ====================================
// Raíz de la navegación
// ====================================

export default function MyStack() {
  const navigationTheme = useNavigationTheme();
  const dispatch: AppDispatch = useDispatch();
  const isAuth = useSelector((state: RootState) => state.auth.isAuth);

  // Restaura la sesión guardada al abrir la app
  useEffect(() => {
    const restoreSession = async () => {
      try {
        dispatch(setLoadingAuth(true));
        const jsonValue = await AsyncStorage.getItem('user');
        const storedUser: UserModel | null = jsonValue ? JSON.parse(jsonValue) : null;

        if (storedUser?.id) {
          const { data } = await getUser(storedUser.id);
          dispatch(setUser(data));
          dispatch(setIsAuth(true));
        }
      } catch (error) {
        showError(error);
      } finally {
        dispatch(setLoadingAuth(false));
      }
    };

    restoreSession();
  }, [dispatch]);

  return (
    <FeatureFlagsProvider>
      <NavigationContainer theme={navigationTheme}>
        {isAuth ? (
          <MainTabs />
        ) : (
          <Stack.Navigator>
            <Stack.Screen name="AuthStack" component={AuthStackNavigator} />
          </Stack.Navigator>
        )}
      </NavigationContainer>
    </FeatureFlagsProvider>
  );
}
