import React from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native";
import { NumberFormat } from "../../../utils/Helpers";
import { Icon, Divider } from "react-native-elements";
import { ICON, PRIMARY_BLACK } from "../../../styles/colors";
import ListSubcategory from "../../../components/card/ListSubcategory";
import MyProgressBar from "~/components/progressBar/MyProgressBar";
import { cutText } from "~/utils/Helpers";

const MyAcordeon = ({ data, editCategory, createSubcategory }) => {
  const { id, icon, name, budget } = data;
  const [expanded, setExpanded] = React.useState(false);
  const sendEditCategoryScreen = (id) => {
    editCategory(id);
  };
  const sendCreateSubategoryScreen = (id) => {
    createSubcategory(id);
  };
  const togleExpanded = () => {
    setExpanded(!expanded);
  };
  const calcultePercentage = (actualyExpense, budget) => {
    let percent = 0;
    if(budget>0){
      percent = (actualyExpense *100) /budget;
    }
    return `${percent.toFixed(2)}%`;
  };
  const percent = calcultePercentage(data.total, budget);
  return (
      <View style={{ flex: 1 }}>
          <View style={styles.container}>
              <View style={{ flex: 1 }}>
                  <View style={styles.containerTitle}>
                      <Icon
                          type="font-awesome"
                          style={{ paddingLeft: 5 }}
                          name={icon ? icon : "home"}
                          size={25}
                          color={expanded ? PRIMARY_BLACK : ICON}
                      />
                      <Text
                          style={{
                              paddingHorizontal: 20,
                              color: expanded ? PRIMARY_BLACK : "black",
                          }}
                      >
                          {cutText(name,18)} ({data.data.length})
                      </Text>
                      <Icon
                          type="material-community"
                          name={"pencil-outline"}
                          size={20}
                          color={ICON}
                          onPress={() => sendEditCategoryScreen(id)}
                      />
                      {budget > 0 && (
                          <View style={styles.containerBudget}>
                              <Text style={styles.budget}>
                                  {NumberFormat(budget)}
                              </Text>
                              <Text style={{color:data.total <= budget ?'gray': 'red'}}>
                                  {NumberFormat(data.total)}
                              </Text>
                          </View>
                      )}
                  </View>
                  {budget <= 0 && (
                      <Text style={{ paddingLeft: 50 }}>
                          {NumberFormat(data.total)}
                      </Text>
                  )}
                  {budget > 0 && (
                      <View style={styles.containerProgressBar}>
                          <MyProgressBar height={15} percentage={percent} />
                      </View>
                  )}

                  <Divider
                      style={{
                          backgroundColor: PRIMARY_BLACK,
                          marginVertical: 2,
                      }}
                  />
              </View>
              <View style={styles.containerIcon}>
                  <View
                      style={{
                          paddingRight: 15,
                          //  backgroundColor: "pink"
                      }}
                  >
                      <Icon
                          type="material-community"
                          name={"plus-circle"}
                          size={30}
                          color={ICON}
                          onPress={() => sendCreateSubategoryScreen(id)}
                      />
                      <Icon
                          name={expanded ? "chevron-up" : "chevron-down"}
                          type="font-awesome"
                          onPress={() => togleExpanded()}
                      />
                  </View>
              </View>
          </View>
          <View>
              {expanded &&
                  data.data.map((item, idx2) => (
                      <ListSubcategory key={idx2} item={item} />
                  ))}
          </View>
      </View>
  );
};
const styles = StyleSheet.create({
  container: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  containerTitle: {
    display: "flex",
    flexDirection: "row",
    paddingVertical: 3,
    justifyContent:'flex-start'
  },
  containerIcon: {
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-start",
    paddingRight: 10,
  },
  budget:{
      fontWeight:'bold'
  },
  containerBudget:{
      alignSelf:'flex-end',
      marginLeft:3,
    //   backgroundColor: '#F9D8D8',
  },
  containerProgressBar: {
    // backgroundColor:'#F2FA7E', 
    // marginHorizontal:6,
    marginLeft:15,
    marginRight:6,
    paddingHorizontal:8
  }
});
export default MyAcordeon;
