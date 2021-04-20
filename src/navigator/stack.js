import { createStackNavigator } from "@react-navigation/stack";
import {NavigationContainer} from '@react-navigation/native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getUser } from '~/services/users';
import React, { useEffect } from "react";
import { useSelector, useDispatch } from 'react-redux'
import MainStackNavigator from './MainStack';
import AuthStackNavigator from './AuthStack';
import { setUserAction, setAuthAction } from "~/actions/authActions";

function MyStack() {
  const dispatch = useDispatch();
  const Stack = createStackNavigator();
  const auth = useSelector((state) => state.auth.auth);
  useEffect(()=>{
    getData()
  },[])

  const getData = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('user')
      const user = jsonValue != null ? JSON.parse(jsonValue) : null;
      console.log('user', user);
      if(user && user.id){
        const {data} = await getUser(user.id)
        dispatch(setUserAction(data.user));
        dispatch(setAuthAction(true));
      }
    } catch(e) {
      console.log('errorss', e);
    }
  }

  return (
    <NavigationContainer>
    <Stack.Navigator>
    {
      auth ?  <Stack.Screen name={'MainStack'} component={MainStackNavigator} />  :
          <Stack.Screen name={'AuthStack'} component={AuthStackNavigator} />
    }
    </Stack.Navigator>
    </NavigationContainer>
  );
}
export default MyStack;
