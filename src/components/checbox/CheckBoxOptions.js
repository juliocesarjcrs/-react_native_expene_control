import React, { useEffect, useState, useRef } from "react";

import { View, StyleSheet, TouchableOpacity } from "react-native";
import { CheckBox, Icon } from "react-native-elements";
import Popover from "react-native-popover-view";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Errors } from "../../utils/Errors";
import { DateFormat, GetInitialMonth } from "../../utils/Helpers";
import {ICON} from '../../styles/colors';
const CheckBoxOptions = ({navigation, updateNum}) => {
    const [numMonths, setNumMonths] = useState(3);
    const [initialMonth, setInitialMonth] = useState(0);
    const [initialDateMonth, setInitialDateMonth] = useState(0);

    useEffect(() => {
        fetchUserLogued();
        return navigation.addListener("focus", () => {
            fetchUserLogued();
        });
    }, []);
    const fetchUserLogued = async () => {
        try {
            const jsonValue = await AsyncStorage.getItem("user");
            const user = jsonValue != null ? JSON.parse(jsonValue) : null;
            let tempInitialMonth = GetInitialMonth(user.createdAt);
            setInitialMonth(tempInitialMonth);
            setInitialDateMonth(user.createdAt);
            let copyCheckboxes = checkboxes;
            copyCheckboxes[3].numMonths = tempInitialMonth;
            copyCheckboxes[3].title = `Hace(${tempInitialMonth}) ${DateFormat(
                user.createdAt,
                "DD MMM YYYY"
            )}`;
            setCheckboxes(copyCheckboxes);
        } catch (error) {
            Errors(error);
        }
    };

    const [checkboxes, setCheckboxes] = useState([
        {
            id: 1,
            title: "Últimos 3 meses",
            checked: true,
            numMonths: 3,
        },
        {
            id: 2,
            title: "Últimos 6 meses",
            checked: false,
            numMonths: 6,
        },
        {
            id: 3,
            title: "Últimos 12 meses",
            checked: false,
            numMonths: 12,
        },
        {
            id: 4,
            title: `Hace(${initialMonth}) ${DateFormat(
                initialDateMonth,
                "DD MMM YYYY"
            )}`,
            checked: false,
            numMonths: initialMonth,
        },
    ]);
    const toggleCheckbox = (id, index) => {
        let checkboxData = [...checkboxes];
        const oldValue = checkboxData[index].checked;
        checkboxData = checkboxData.map((e) => {
            return { ...e, checked: false };
        });
        checkboxData[index].checked = true;
        setCheckboxes(checkboxData);
        if (!oldValue) {
            const newNumMonths = checkboxData[index].numMonths;
            setNumMonths(newNumMonths);
            updateNum(newNumMonths)
        }
    };
    return (
        <View>
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
    );
};
const styles = StyleSheet.create({
  iconHeader: {
      paddingHorizontal: 10,
  },
});

export default CheckBoxOptions;
