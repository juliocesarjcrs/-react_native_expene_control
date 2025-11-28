import React, { useState } from "react";
import { StyleSheet, View, Text } from "react-native";
import { Icon, Divider } from "react-native-elements";
import { NumberFormat, cutText } from "~/utils/Helpers";
import { ICON, PRIMARY_BLACK } from "~/styles/colors";
import { useThemeColors } from "~/customHooks/useThemeColors";
import ListSubcategory from "~/components/card/ListSubcategory";
import MyProgressBar from "~/components/progressBar/MyProgressBar";
import { Category } from "~/shared/types/services";


interface MyAcordeonProps {
  data: Category & { data: Category['subcategories'] };
  editCategory: (id: number) => void;
  createSubcategory: (id: number) => void;
}

export default function MyAcordeon({ 
  data, 
  editCategory, 
  createSubcategory 
}: MyAcordeonProps) {
  const colors = useThemeColors();
  const { id, icon, name, budget } = data;
  const [expanded, setExpanded] = useState<boolean>(false);

  const sendEditCategoryScreen = (categoryId: number): void => {
    editCategory(categoryId);
  };

  const sendCreateSubcategoryScreen = (categoryId: number): void => {
    createSubcategory(categoryId);
  };

  const toggleExpanded = (): void => {
    setExpanded(!expanded);
  };

  const calculatePercentage = (actualExpense: number, budgetAmount: number): string => {
    let percent = 0;
    if (budgetAmount > 0) {
      percent = (actualExpense * 100) / budgetAmount;
    }
    return `${percent.toFixed(2)}%`;
  };

  const percent = calculatePercentage(data.total, budget);
  const isOverBudget = data.total > budget;

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.container}>
        <View style={{ flex: 1 }}>
          <View style={styles.containerTitle}>
            <Icon
              type="font-awesome"
              style={{ paddingLeft: 5 }}
              name={icon || "home"}
              size={25}
              color={expanded ? PRIMARY_BLACK : ICON}
            />
            <Text
              style={{
                paddingHorizontal: 20,
                color: expanded ? PRIMARY_BLACK : colors.TEXT_PRIMARY,
              }}
            >
              {cutText(name, 18)} ({data.data.length})
            </Text>
            <Icon
              type="material-community"
              name="pencil-outline"
              size={20}
              color={ICON}
              onPress={() => sendEditCategoryScreen(id)}
            />
            {budget > 0 && (
              <View style={styles.containerBudget}>
                <Text style={styles.budget}>
                  {NumberFormat(budget)}
                </Text>
                <Text style={{ color: isOverBudget ? 'red' : 'gray' }}>
                  {NumberFormat(data.total)}
                </Text>
              </View>
            )}
          </View>
          
          {budget <= 0 && (
            <Text style={{ paddingLeft: 50, color: colors.TEXT_PRIMARY }}>
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
          <View style={{ paddingRight: 15 }}>
            <Icon
              type="material-community"
              name="plus-circle"
              size={30}
              color={ICON}
              onPress={() => sendCreateSubcategoryScreen(id)}
            />
            <Icon
              name={expanded ? "chevron-up" : "chevron-down"}
              type="font-awesome"
              onPress={toggleExpanded}
            />
          </View>
        </View>
      </View>
      
      <View>
        {expanded &&
          data.data.map((item, idx) => (
            <ListSubcategory key={item.id || idx} item={item} />
          ))}
      </View>
    </View>
  );
}

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
    justifyContent: "flex-start",
  },
  containerIcon: {
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-start",
    paddingRight: 10,
  },
  budget: {
    fontWeight: "bold",
  },
  containerBudget: {
    alignSelf: "flex-end",
    marginLeft: 3,
  },
  containerProgressBar: {
    marginLeft: 15,
    marginRight: 6,
    paddingHorizontal: 8,
  },
});