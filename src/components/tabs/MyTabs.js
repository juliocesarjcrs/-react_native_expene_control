import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Tab } from 'react-native-elements';

const MyTabs = ({ navigation }) => {
  const onChangeHandle = (val) => {
    if (val === 0) {
      navigation.navigate('main');
    } else if (val === 1) {
      navigation.navigate('sumaryIncomes');
    } else {
      navigation.navigate('cashFlow');
    }
  };

  return (
    <View style={styles.container}>
      <Tab onChange={onChangeHandle}>
        <Tab.Item title="Gastos" value="Gatos" />
        <Tab.Item title="Ingresos" value="Ingresos" />
        <Tab.Item title="Vs" value="cashFlow" />
      </Tab>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    // backgroundColor: 'red',
    paddingBottom: 10
  }
});

export default MyTabs;
