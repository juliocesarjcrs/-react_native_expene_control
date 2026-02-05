/* prettier-ignore-file */
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import AuthStackNavigator from './AuthStack';

// Redux
import { setIsAuth, setLoadingAuth, setUser } from '../features/auth/authSlice';
import Routes from './stackRoutes';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Icon } from 'react-native-elements';
import { showError } from '~/utils/showError';
import {
  BalanceStackParamList,
  ExpenseStackParamList,
  IncomeStackParamList,
  SettingsStackParamList,
  UserModel
} from '../shared/types';

// Services
import { getUser } from '../services/users';

// Types
import { RootState } from '../shared/types/reducers';
import { AppDispatch } from '../shared/types/reducers/root-state.type';
import { FeatureFlagsProvider } from '~/contexts/FeatureFlagsContext';
import { minimalHeaderOptions } from './navigationTheme';
import { useNavigationTheme } from '~/customHooks/useNavigationTheme';
import { useThemeColors } from '~/customHooks/useThemeColors';

export default function MyStack() {
  const navigationTheme = useNavigationTheme();
  const colors = useThemeColors();
  const dispatch: AppDispatch = useDispatch();
  const isAuth = useSelector((state: RootState) => state.auth.isAuth);
  useEffect(() => {
    getData();
  }, []);

  const getData = async () => {
    try {
      dispatch(setLoadingAuth(true));
      const jsonValue = await AsyncStorage.getItem('user');
      const user: UserModel | null = jsonValue != null ? JSON.parse(jsonValue) : null;
      if (user && user.id) {
        const { data } = await getUser(user.id);
        dispatch(setLoadingAuth(false));
        dispatch(setUser(data));
        dispatch(setIsAuth(true));
      }
      dispatch(setLoadingAuth(false));
    } catch (e) {
      dispatch(setLoadingAuth(false));
      showError(e);
    }
  };
  const Stack = createStackNavigator();

  const ExpenseStack = createStackNavigator<ExpenseStackParamList>();
  const IncomeStack = createStackNavigator<IncomeStackParamList>();
  const BalanceStack = createStackNavigator<BalanceStackParamList>();
  const SettingsStack = createStackNavigator<SettingsStackParamList>();
  // const MainStack = createDrawerNavigator();

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
          component={Routes.CreateExpenseScreenV2}
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
  // //screenOptions={{headerShown: false}}
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
      </SettingsStack.Navigator>
    );
  }
  const StatisticsStack = createStackNavigator();
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

        {/* Comparar períodos (ya existente) */}
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
      </StatisticsStack.Navigator>
    );
  }

  const Tab = createBottomTabNavigator();
  return (
    <FeatureFlagsProvider>
      <NavigationContainer theme={navigationTheme}>
        {isAuth ? (
          <Tab.Navigator
            screenOptions={({ route }) => ({
              tabBarIcon: ({ focused, color, size }) => {
                let iconName = 'home';

                if (route.name === 'Gastos') {
                  iconName = focused ? 'cash' : 'cash-multiple';
                } else if (route.name === 'Ingresos') {
                  iconName = focused ? 'account-cash' : 'account-cash-outline';
                } else if (route.name === 'Balance') {
                  iconName = focused ? 'scale-balance' : 'scale-balance';
                } else if (route.name === 'Ajustes') {
                  iconName = focused ? 'cog' : 'cog-outline';
                } else if (route.name === 'Estadísticas') {
                  iconName = focused ? 'chart-line' : 'chart-line';
                }

                // You can return any component that you like here!
                return <Icon type="material-community" color={color} name={iconName} size={size} />;
              },
              tabBarActiveTintColor: colors.PRIMARY, // ← CAMBIA AQUÍ
              tabBarInactiveTintColor: colors.TEXT_SECONDARY, // ← CAMBIA AQUÍ
              tabBarStyle: {
                // ← AGREGA ESTO
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
        ) : (
          <Stack.Navigator>
            <Stack.Screen name={'AuthStack'} component={AuthStackNavigator} />
          </Stack.Navigator>
        )}
      </NavigationContainer>
    </FeatureFlagsProvider>
  );
}
