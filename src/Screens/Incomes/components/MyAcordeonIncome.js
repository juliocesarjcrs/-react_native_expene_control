import React from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native";
import { NumberFormat, DateFormat } from "~/utils/Helpers";
import { Icon, Divider } from "react-native-elements";
import { ICON, PRIMARY_BLACK } from "~/styles/colors";
import {PRIMARY} from '../../../styles/colors';
import {MEDIUM, SMALL} from '../../../styles/fonts';

const MyAcordeonIncome = ({ data, editCategory }) => {
  const { id, icon, name } = data;
  const [expanded, setExpanded] = React.useState(false);
  const sendEditCategoryScreen = (id) => {
    editCategory(id);
  };
  const togleExpanded = () => {
    setExpanded(!expanded);
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.container}>
        <View style={{ flex: 1 }}>
          <View style={styles.title}>
            <Icon
              type="material-community"
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
              {name} ({data.incomes.length})
            </Text>
            <Icon
              type="material-community"
              name={"pencil-outline"}
              size={20}
              color={ICON}
              onPress={() => sendEditCategoryScreen(id)}
            />
          </View>
          <Text style={{ paddingLeft: 50 }}>{NumberFormat(data.total)}</Text>
          <Divider
            style={{ backgroundColor: PRIMARY_BLACK, marginVertical: 2 }}
          />
        </View>
        <View style={styles.containerIcon}>
          <Icon
            name={expanded ? "chevron-up" : "chevron-down"}
            type="font-awesome"
            onPress={() => togleExpanded()}
          />
        </View>
      </View>
      <View>
        {expanded &&
          data.incomes.map((item, idx2) => (
            <View style={styles.header}  key={idx2}>
              <Text style={styles.titleDate}>{DateFormat(item.date,'DD MMM')} {DateFormat(item.createdAt,'hh:mm a')}</Text>
              <Text style={styles.item}>{NumberFormat(item.amount)}</Text>
          </View>
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
  header: {
    display: "flex",
    flexDirection: "row",
    // width: 300,
    backgroundColor: PRIMARY,
    padding: 5,
    alignItems: "center",
    justifyContent: "space-between",
  },
  item: {
    padding: 2,
    color: "white",
    fontSize: SMALL,
  },
  titleDate: {
    color: "white",
    fontSize: MEDIUM,
    padding: 2,
  },
});
export default MyAcordeonIncome;
