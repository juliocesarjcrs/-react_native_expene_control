import React from "react";
import { StatusBar } from "react-native";
import Navigation from "@navigation";
import {SafeAreaView} from 'react-native-safe-area-context';

const Router = () => {
  // const sessionId = useSelector(state => state.user.session_id);
  // const network = useSelector(state => state.network);

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ backgroundColor: "#fff", flex: 1 }}>
        <Navigation />
      </SafeAreaView>
    </>
  );
};

export default Router;
