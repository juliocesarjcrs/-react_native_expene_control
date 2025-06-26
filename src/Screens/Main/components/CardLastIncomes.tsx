import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { CheckBox, Icon } from "react-native-elements";
import Popover from "react-native-popover-view";
import { StackNavigationProp } from "@react-navigation/stack";

// Services
import { getLastIncomesWithPaginate } from "../../../services/incomes";

// Components
import MyLoading from "../../../components/loading/MyLoading";

// Types
import { IncomeStackParamList } from "../../../shared/types";
import { LastIncomes } from "../../../shared/types/services/income-service.type";

// Utils
import { DateFormat, NumberFormat } from "../../../utils/Helpers";
import { Errors } from "../../../utils/Errors";

// Styles
import { ICON, MUTED } from "../../../styles/colors";
import { MEDIUM, SMALL } from "../../../styles/fonts";

export type CardLastIncomesNavigationProp = StackNavigationProp<IncomeStackParamList, 'lastIncomes'>;

interface CardLastIncomesProps {
  navigation: CardLastIncomesNavigationProp;
}
const CardLastIncomes = ({ navigation }: CardLastIncomesProps) => {
  const [incomes, setIncomes] = useState<LastIncomes [] | []>([]);
  const [take, setTake] = useState(5);
  const [loading, setLoading] = useState(false);
  const [checkboxes, setCheckboxes] = useState([
    {
      id: 1,
      title: "Últimas 5 transacciones",
      checked: true,
      take: 5,
    },
    {
      id: 2,
      title: "Últimas 10 transacciones",
      checked: false,
      take: 10,
    },
    {
      id: 3,
      title: "Últimas 15 transacciones",
      checked: false,
      take: 15,
    },
  ]);

  useEffect(() => {
    fetchDataLastIncomes();
    return navigation.addListener("focus", () => {
      fetchDataLastIncomes();
    });
  }, [take]);

  const fetchDataLastIncomes = async () => {
    try {
      const params = {
        take,
      };
      setLoading(true);
      const { data } = await getLastIncomesWithPaginate(params);
      setLoading(false);
      setIncomes(data.data);
    } catch (error) {
      setLoading(false);
      Errors(error);
    }
  };
  const toggleCheckbox = (id: number, index: number) => {
    let checkboxData = [...checkboxes];
    const oldValue = checkboxData[index].checked;
    checkboxData = checkboxData.map((e) => {
      return { ...e, checked: false };
    });
    checkboxData[index].checked = true;
    setCheckboxes(checkboxData);
    if (!oldValue) {
      const newTake = checkboxData[index].take;
      setTake(newTake);
    }
  };
  const sendLastIncomesScreen = () => {
    navigation.navigate("lastIncomes");
  };

  return (
    <View style={styles.container}>
      <View
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <Text style={styles.title}>últimos ingresos</Text>
        <View style={{ display: "flex", flexDirection: "row" }}>
          <Icon
            type="font-awesome"
            style={styles.iconHeader}
            name={"expand"}
            size={20}
            color={ICON}
            onPress={sendLastIncomesScreen}
          />
          <Popover
            from={
              <TouchableOpacity>
                <Icon
                  type="font-awesome"
                  style={styles.iconHeader}
                  name={"ellipsis-v"}
                  size={20}
                  color={ICON}
                />
              </TouchableOpacity>
            }
          >
            <View>
              {checkboxes.map((cb, index) => {
                return (
                  <CheckBox
                    center
                    key={cb.id}
                    title={cb.title}
                    iconType="material"
                    checkedIcon="check-box"
                    uncheckedIcon="check-box-outline-blank"
                    checked={cb.checked}
                    onPress={() => toggleCheckbox(cb.id, index)}
                  />
                );
              })}
            </View>
          </Popover>
        </View>
      </View>
      {loading ? (
        <MyLoading />
      ) : (
        <View>
          {incomes.length == 0 ? (
            <Text style={styles.textMuted}>No se registran últimos ingresos</Text>
          ) : (
            incomes.map((item) => (
              <View key={item.id} style={styles.containerCard}>
                <Icon
                  type="font-awesome"
                  style={styles.icon}
                  name={item.iconCategory ? item.iconCategory : "home"}
                  size={20}
                  color={ICON}
                />
                <View style={styles.containerText}>
                  <Text style={styles.title}>{item.category}</Text>
                  <Text style={styles.commentary}>{item.commentary}</Text>
                </View>
                <View style={styles.cardDate}>
                  <Text style={styles.cost}>{NumberFormat(item.cost)}</Text>
                  <Text style={styles.date}>
                    {DateFormat(item.dateFormat, "DD MMM YYYY")}{" "}
                    {DateFormat(item.createdAt, "hh:mm a")}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      )}
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    paddingVertical: 10,
    paddingHorizontal: 5,
    margin: 4,
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 10,
  },
  iconHeader: {
    paddingHorizontal: 10,
  },
  title: {
    fontWeight: "bold",
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

export default CardLastIncomes;
