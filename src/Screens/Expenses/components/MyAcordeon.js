import React from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native";
import { NumberFormat } from "../../../utils/Helpers";
import { Icon, Divider } from "react-native-elements";
import { ICON, PRIMARY_BLACK } from "../../../styles/colors";
import ListSubcategory from "../../../components/card/ListSubcategory";
import MyProgressBar from "~/components/progressBar/MyProgressBar";

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
                  <View style={styles.title}>
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
                          {name} ({data.data.length})
                      </Text>
                      <Icon
                          type="material-community"
                          name={"pencil-outline"}
                          size={20}
                          color={ICON}
                          onPress={() => sendEditCategoryScreen(id)}
                      />
                  </View>
                  <Text style={{ paddingLeft: 50 }}>
                      {NumberFormat(data.total)}
                  </Text>
                  {budget > 0 && (
                      <MyProgressBar height={20} percentage={percent} />
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
                  </View>
                  <Icon
                      name={expanded ? "chevron-up" : "chevron-down"}
                      type="font-awesome"
                      onPress={() => togleExpanded()}
                  />
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
  title: {
    display: "flex",
    flexDirection: "row",
    paddingVertical: 3,
  },
  containerIcon: {
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-start",
    paddingRight: 10
  },
});
export default MyAcordeon;
