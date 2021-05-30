import { createStackNavigator } from "@react-navigation/stack";
import { createDrawerNavigator } from '@react-navigation/drawer';
import {NavigationContainer} from '@react-navigation/native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getUser } from '~/services/users';
import React, { useEffect } from "react";
import { useSelector, useDispatch } from 'react-redux'
import MainStackNavigator from './MainStack';
import AuthStackNavigator from './AuthStack';
import { setUserAction, setAuthAction } from "~/actions/authActions";
import {setLoadingAuthAction} from '../actions/authActions';

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
      console.log('errorsA', e);
    }
  }
  const Stack = createStackNavigator();
  // const Stack =  createDrawerNavigator();
  return (
    <NavigationContainer>
      <Stack.Navigator>
      {
        auth ?  <Stack.Screen name={'MainStack'} component={MainStackNavigator} options={{ title: 'App Control gastos' }} />  :
            <Stack.Screen name={'AuthStack'} component={AuthStackNavigator} />
      }
      </Stack.Navigator>
    </NavigationContainer>
  );
}
export default MyStack;
