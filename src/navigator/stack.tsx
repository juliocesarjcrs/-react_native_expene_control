import { createStackNavigator } from "@react-navigation/stack";
import {NavigationContainer} from '@react-navigation/native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect } from "react";
import { useSelector, useDispatch } from 'react-redux'
import AuthStackNavigator from './AuthStack';

// Redux
import { setIsAuth, setLoadingAuth, setUser } from "../features/auth/authSlice";
import Routes from './stackRoutes'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {Icon} from 'react-native-elements'
import {Errors} from '../utils/Errors';
import { BalanceStackParamList, ExpenseStackParamList, IncomeStackParamList, SettingsStackParamList, UserModel } from "../shared/types";

// Services
import { getUser } from "../services/users";

// Types
import { RootState } from "../shared/types/reducers";
import { AppDispatch } from "../shared/types/reducers/root-state.type";
import { FeatureFlagsProvider } from "~/contexts/FeatureFlagsContext";
import { ThemeProvider } from "~/contexts/ThemeContext";

export default function MyStack() {
  const dispatch: AppDispatch = useDispatch();
  const isAuth = useSelector((state: RootState) => state.auth.isAuth);
  useEffect(()=>{
    getData()
  },[])

  const getData = async () => {
    try {
      dispatch(setLoadingAuth(true));
      const jsonValue = await AsyncStorage.getItem('user')
      const user: UserModel| null = jsonValue != null ? JSON.parse(jsonValue) : null;
      if(user && user.id){
        const {data} = await getUser(user.id)
        dispatch(setLoadingAuth(false));
        dispatch(setUser(data.user));
        dispatch(setIsAuth(true));
      }
      dispatch(setLoadingAuth(false));
    } catch(e) {
      dispatch(setLoadingAuth(false));
      Errors(e)
    }
  }
  const Stack = createStackNavigator();


const ExpenseStack = createStackNavigator<ExpenseStackParamList>();
const IncomeStack = createStackNavigator<IncomeStackParamList>();
const BalanceStack = createStackNavigator<BalanceStackParamList>();
const SettingsStack = createStackNavigator<SettingsStackParamList>();
// const MainStack = createDrawerNavigator();

function ExpenseStackScreen() {
  return (
    <ExpenseStack.Navigator>
       <ExpenseStack.Screen name="main" component={Routes.MainScreen} options={{ title: 'Resumen gastos del mes' }}/>
        <ExpenseStack.Screen name="sumary" component={Routes.SumaryExpenseScreen} options={{ title: 'Resumen' }}/>
        <ExpenseStack.Screen name="createExpense" component={Routes.CreateExpenseScreen} options={{ title: 'Ingresar gasto' }}  />
        <ExpenseStack.Screen name="scanInvoiceExpense" component={Routes.CreateExpenseScreenV2} options={{ title: 'Scanear facturas' }}  />
        <ExpenseStack.Screen name="createSubcategory" component={Routes.CreateSubcategoryScreen} options={{ title: 'Crear Subcategoría' }}/>
        <ExpenseStack.Screen name="createCategory" component={Routes.CreateCategoryScreen} options={{ title: 'Crear Categoría' }} />
        <ExpenseStack.Screen name="editCategory" component={Routes.EditCategoryScreen} options={{ title: 'Editar Categoría' }}/>
        <ExpenseStack.Screen name="lastExpenses" component={Routes.LastExpensesScreen} options={{ title: 'Últimos gastos' }}/>
        <ExpenseStack.Screen name="editExpense" component={Routes.EditExpenseScreen} options={{ title: 'Editar gasto' }}  />
        <ExpenseStack.Screen name="editSubcategory" component={Routes.EditSubcategoryScreen} options={{ title: 'Editar Subcategoría' }}/>

    </ExpenseStack.Navigator>
  );
}
// //screenOptions={{headerShown: false}}
function IncomeStackScreen() {
  return (
    <IncomeStack.Navigator>
            <IncomeStack.Screen name="sumaryIncomes" component={Routes.SumaryIncomesScreen} options={{ title: 'Resumen ingresos del mes' }}/>
            <IncomeStack.Screen name="createIncome" component={Routes.CreateIncomeScreen} options={{ title: 'Agregar ingreso' }}/>
            <IncomeStack.Screen name="createCategory" component={Routes.CreateCategoryScreen} options={{ title: 'Crear Categoría' }} />
            <IncomeStack.Screen name="lastIncomes" component={Routes.LastIncomesScreen} options={{ title: 'Últimos ingresos' }} />
            <IncomeStack.Screen name="editIncome" component={Routes.EditIncomeScreen} options={{ title: 'Editar ingreso' }} />

    </IncomeStack.Navigator>
  );
}

function BalanceStackScreen() {
  return (
    <BalanceStack.Navigator>
            <BalanceStack.Screen name="cashFlow" component={Routes.CashFlowScreen} options={{ title: 'Balance' }}/>
            <BalanceStack.Screen name="graphBalances" component={Routes.GraphBalancesScreen} options={{ title: 'Graficas Balance' }}/>
    </BalanceStack.Navigator>
  );
}

function SettingsStackScreen() {
  return (
    <SettingsStack.Navigator>
            <SettingsStack.Screen name="settings" component={Routes.SettingsScreen} options={{ title: 'Ajustes' }}/>
            <SettingsStack.Screen name="editUser" component={Routes.EditUserScreen} options={{ title: 'Editar perfil' }}/>
            <SettingsStack.Screen name="createUser" component={Routes.CreateUserScreen} options={{ title: 'Crear usuario' }}/>
            <SettingsStack.Screen name="changePassword" component={Routes.ChangePasswordScreen} options={{ title: 'Cambiar contraseña' }}/>
            <SettingsStack.Screen name="calculeProducts" component={Routes.CalculeProductsScreen} options={{ title: 'Calcular productos' }}/>
            <SettingsStack.Screen name="createLoan" component={Routes.CreateLoanScreen} options={{ title: 'Crear préstamo' }}/>
            <SettingsStack.Screen name="exportData" component={Routes.ExportExpenseScreen} options={{ title: 'Gastos rango fechas' }}/>
            <SettingsStack.Screen name="advancedSearch" component={Routes.AdvancedSearchScreen} options={{ title: 'Busqueda avanzada' }}/>
            <SettingsStack.Screen name="virtualBudget" component={Routes.VirtualBudgetScreen} options={{ title: 'Presupuesto virtual' }}/>
            <SettingsStack.Screen name="manageCSV" component={Routes.ManageCSVsScreen} options={{ title: 'Gestionar Csv' }}/>
            <SettingsStack.Screen name="manageFeatureFlags" component={Routes.ManageFeatureFlagsScreen} options={{ title: 'Gestionar Funcionalidades' }}/>
            <SettingsStack.Screen name="chatbotConfig" component={Routes.ChatbotConfigScreen} options={{ title: 'Configurar Chatbot' }}/>
            <SettingsStack.Screen name="manageThemes" component={Routes.ManageThemesScreen} options={{ title: 'Gestionar Temas' }}/>
            <SettingsStack.Screen name="editTheme" component={Routes.EditThemeScreen} options={{ title: 'Editar Tema' }}/>
            <SettingsStack.Screen name="adminDashboard" component={Routes.AdminDashboardScreen} options={{ title: 'Panel de Administración' }} />

    </SettingsStack.Navigator>
  );
}
const StatisticsStack = createStackNavigator();
function StatisticsStackScreen() {
  return (
    <StatisticsStack.Navigator>
      {/* <StatisticsStack.Screen name="overview" component={Routes.StatisticsOverviewScreen} options={{ title: 'Estadísticas generales' }}/> */}
      <StatisticsStack.Screen name="comparePeriods" component={Routes.ComparePeriodsScreen} options={{ title: 'Comparar períodos' }}/>
    </StatisticsStack.Navigator>
  );
}

const Tab = createBottomTabNavigator();
return (
  <ThemeProvider>
    <FeatureFlagsProvider>
      <NavigationContainer>
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
                  iconName = focused ? 'bullseye-arrow' : 'bullseye-arrow';
                }

                // You can return any component that you like here!
                return <Icon type="material-community" color={color} name={iconName} size={size} />;
              },
              tabBarActiveTintColor: 'tomato',
              tabBarInactiveTintColor: 'gray'
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
  </ThemeProvider>
);
}

