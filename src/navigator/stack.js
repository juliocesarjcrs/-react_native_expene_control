import { createStackNavigator } from "@react-navigation/stack";
// import { createDrawerNavigator } from '@react-navigation/drawer';
import {NavigationContainer} from '@react-navigation/native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getUser } from '~/services/users';
import React, { useEffect } from "react";
import { useSelector, useDispatch } from 'react-redux'
// import MainStackNavigator from './MainStack';
import AuthStackNavigator from './AuthStack';
import { setUserAction, setAuthAction } from "~/actions/authActions";
import {setLoadingAuthAction} from '../actions/authActions';
import Routes from './stackRoutes'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {Icon} from 'react-native-elements'
import {Errors} from '../utils/Errors';

function MyStack() {
  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth.auth);
  useEffect(()=>{
    getData()
  },[])

  const getData = async () => {
    try {
      dispatch(setLoadingAuthAction(true));
      const jsonValue = await AsyncStorage.getItem('user')
      const user = jsonValue != null ? JSON.parse(jsonValue) : null;
      if(user && user.id){
        const {data} = await getUser(user.id)
        dispatch(setLoadingAuthAction(false));
        dispatch(setUserAction(data.user));
        dispatch(setAuthAction(true));
      }
      dispatch(setLoadingAuthAction(false));
    } catch(e) {
      dispatch(setLoadingAuthAction(false));
      Errors(e)
    }
  }
  const Stack = createStackNavigator();
  // const Stack =  createDrawerNavigator();
//   return (
//     <NavigationContainer>
//       <Stack.Navigator>
//       {
//         auth ?  <Stack.Screen name={'MainStack'} component={MainStackNavigator} options={{ title: 'App Control gastos' }} />  :
//             <Stack.Screen name={'AuthStack'} component={AuthStackNavigator} />
//       }
//       </Stack.Navigator>
//     </NavigationContainer>
//   );





const MainStack = createStackNavigator();
const ExpenseStack = createStackNavigator();
const IncomeStack = createStackNavigator();
const BalanceStack = createStackNavigator();
// const MainStack = createDrawerNavigator();

function ExpenseStackScreen() {
  return (
    <ExpenseStack.Navigator>
       <ExpenseStack.Screen name="main" component={Routes.MainScreen} options={{ title: 'Resumen gastos del mes' }}/>
        <ExpenseStack.Screen name="sumary" component={Routes.SumaryExpenseScreen} options={{ title: 'Resumen' }}/>
        <ExpenseStack.Screen name="createExpense" component={Routes.CreateExpenseScreen} options={{ title: 'Ingresar gasto' }}  />
        <ExpenseStack.Screen name="createSubcategory" component={Routes.CreateSubcategoryScreen} options={{ title: 'Crear Subcategoría' }}/>
        <ExpenseStack.Screen name="createCategory" component={Routes.CreateCategoryScreen} options={{ title: 'Crear Categoría' }} />
        <ExpenseStack.Screen name="editCategory" component={Routes.EditCategoryScreen} options={{ title: 'Editar Categoría' }}/>
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

    </IncomeStack.Navigator>
  );
}

function BalanceStackScreen() {
  return (
    <BalanceStack.Navigator>
            <BalanceStack.Screen name="cashFlow" component={Routes.CashFlowScreen} options={{ title: 'Balance' }}/>
    </BalanceStack.Navigator>
  );
}
const Tab = createBottomTabNavigator();
return (
  <NavigationContainer>
      {
        auth ?
    <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;

        if (route.name === 'Gastos') {
          iconName = focused ? 'cash' : 'cash-multiple';
        } else if (route.name === 'Ingresos') {
          iconName = focused ? 'account-cash' : 'account-cash-outline';
        }
        else if (route.name === 'Balance') {
          iconName = focused ? 'scale-balance' : 'scale-balance';
        }

        // You can return any component that you like here!
        return <Icon
        type="material-community"
        color={color}
        name={iconName}
        size={size}

      />
      },
    })}
    tabBarOptions={{
      activeTintColor: 'tomato',
      inactiveTintColor: 'gray',
    }}
    
    >
      <Tab.Screen name="Gastos" component={ExpenseStackScreen} />
      <Tab.Screen name="Ingresos" component={IncomeStackScreen} />
      <Tab.Screen name="Balance" component={BalanceStackScreen} />
    </Tab.Navigator>
    :
      <Stack.Navigator>
            <Stack.Screen name={'AuthStack'} component={AuthStackNavigator} />
      </Stack.Navigator>
      }
  </NavigationContainer>

);
}



export default MyStack;
