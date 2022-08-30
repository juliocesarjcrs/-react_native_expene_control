import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Icon, Input } from "react-native-elements";
import {ICON} from '../../../styles/colors';
import { NumberFormat } from "~/utils/Helpers";

const RowInput = ({prod,sendRemoveRow, updateTotal}) => {
    const [price, setPrice] = useState(prod.price);
    const [discount, setDiscount] = useState(prod.discount);
    const [realVal, setRealVal] = useState(prod.realVal);

    useEffect(() => {
        calculateRealValue();
      }, [price, discount]);

    const removeRow = () =>{
        sendRemoveRow(prod.id);
      }
    const onChange = (val, item) => {
        if(item == 'price'){
            setPrice(val);
        }
        else if(item=='discount'){
            setDiscount(val);
        }
    };

    const calculateRealValue = () =>{
        let prodDiscont = 0;
        let res = 0;
        if (discount > 0 && price > 0) {
            prodDiscont = (price * discount) / 100;
            res = price - prodDiscont ;
            setRealVal(res);
            updateTotal({...prod, price, realVal: res});
        }
    }
    return (
        <View style={styles.container}>
            <View
                style={{
                    flexDirection: "row"
                }}
            >
                <View style={styles.inputContainer}>
                    <Input
                        value={price}
                        placeholder="Ej: 20000"
                        onChangeText={(text) => onChange(text, 'price')}
                        keyboardType="numeric"
                    />
                </View>
                <View style={styles.inputDiscount}>
                    <Input
                        value={discount}
                        placeholder="Ej: 5 %"
                        onChangeText={(text) => onChange(text, 'discount')}
                        keyboardType="numeric"
                    />
                </View>
                <View style={styles.inputContainer}>
                <Text >{NumberFormat(realVal)}</Text>
                </View>
                <View style={ {flexDirection: 'column'}}>
                     <Icon
                    type="material-community"
                    name={"trash-can-outline"}
                    size={25}
                    color={ICON}
                    onPress={() => removeRow()}
                />

                </View>
            </View>
        </View>
    );
}

export default RowInput;

const styles = StyleSheet.create({
    container: {
        height:45,
        backgroundColor: "#E3DDF6",
    },
    inputContainer: {
        width: 120,
    },
    inputDiscount: {
        width: 80,
    },
});
