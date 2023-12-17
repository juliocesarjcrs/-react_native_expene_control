import React from "react";
import { View, Text } from "react-native";
import { Icon } from "react-native-elements";
import { StyleSheet } from "react-native";
import { MEDIUM, SMALL } from "../../styles/fonts";
import { ICON, MUTED } from "../../styles/colors";
import { DateFormat, NumberFormat } from "../../utils/Helpers";

// Components
import { ListResultSearchProps } from "../../shared/types/components/card";



export const ListResultSearch: React.FC<ListResultSearchProps> = (item ) => {
  return (
    <View key={item.id} style={styles.containerCard}>
      <Icon
        type="font-awesome"
        style={styles.icon}
        name={item.iconCategory ? item.iconCategory : "home"}
        size={20}
        color={ICON}
      />
      <View style={styles.containerText}>
        <Text style={styles.title}>{item.subcategory}</Text>
        <Text style={styles.commentary}>{item.commentary}</Text>
      </View>
      <View style={styles.cardDate}>
        <Text style={styles.cost}>{NumberFormat(item.amount)}</Text>
        <Text style={styles.date}>
          {DateFormat(item.dateFormat, "DD MMM YYYY")}{"   "}
          {DateFormat(item.createdAt, "hh:mm a")}
        </Text>
      </View>
    </View>
  );
};
const styles = StyleSheet.create({
  title: {
    color: "white",
    fontSize: MEDIUM,
    padding: 2,
  },
  item: {
    padding: 2,
    color: "white",
    fontSize: SMALL,
  },
  icon: {
    // backgroundColor: "pink",
    borderRadius: 100,
    padding: 2,
    marginTop: 10,
  },
  containerCard: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  containerText: {
    paddingLeft: 10,
    paddingVertical: 4,
    flex: 1,
  },
  commentary: {
    fontSize: SMALL,
  },
  cardDate: {
    paddingHorizontal: 5,
  },
  date: {
    fontSize: SMALL,
  },
  cost: {
    fontSize: MEDIUM,
    fontWeight: "bold",
    justifyContent: "flex-end",
  },
  textMuted: {
    textAlign: "center",
    color: MUTED,
  },
});
