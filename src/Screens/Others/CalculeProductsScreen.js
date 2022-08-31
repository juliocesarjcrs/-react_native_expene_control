import React, { useEffect, useState } from "react";
import {
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import RowInput from "./components/RowInput";
import { NumberFormat } from "~/utils/Helpers";
import {Button, Icon, Input} from 'react-native-elements';
import uuid from 'react-native-uuid';

export default function CalculeProductsScreen() {
    const [generalDiscount, setGeneralDiscount] = useState('15');
    const unit = { id: uuid.v4(), price: "", realVal: "0", discount: generalDiscount };
    const [products, setProducts] = useState([unit]);
    const [realTotal, setRealTotal] = useState(0);
    const [isScrollEnabled, setIsScrollEnabled] = useState(false);

    useEffect(() => {
        setTimeout(() => {
          setIsScrollEnabled(true);
        }, 3000);
      }, []);

    useEffect(() => {
        calculateTotal();
    }, [products]);

    useEffect(() => {
        setTimeout(() => {
            changeDiscount();
          }, 2000);
    }, [generalDiscount]);

    const changeDiscount = () => {
        console.log('generalDiscount', generalDiscount);
        // const copyProducts = products.map((e, idx) => {
        //     return { ...e, discount: generalDiscount };
        // });
        // setProducts([]);
        // setTimeout(() => {
        //     setProducts(copyProducts);
        //   }, 1000);
        setProducts(products.map(a => {return {...a, discount:generalDiscount }}))

        // setProducts(copyProducts);
    }

    const addRow = () => {
        let newArray;
        newArray = [...products, { ...unit, id: uuid.v4() }];
        setProducts(newArray);
    };
    const removeRow = (id) => {
        const newArr = [...products];
        newArr.splice(newArr.findIndex(item => item.id === id), 1)
        setProducts(newArr)

    };
    const calculateTotal = () => {
        const total = products.reduce((acu, val) => acu + val.realVal, 0);
        setRealTotal(total);
    };
    const updateTotal = (prod) => {
        const indexArray = products.findIndex((e) => {
            return e.id === prod.id;
        });
        let copyProducts = products;
        if (indexArray >= 0) {
            copyProducts[indexArray] = prod;
        }
        setProducts(copyProducts);
        calculateTotal();
    };
    const onChange = (val) => {
        setGeneralDiscount(val);
    };

    const footerComponent = () => {
        return <Text style={{marginLeft:160, fontSize: 15, fontWeight:'bold'}}>Total: {NumberFormat(realTotal)}</Text>;
    };
    const headerComponent = () => {
        return (
            <View>
                <Button
                    icon={
                        <Icon
                            type="font-awesome"
                            name="plus"
                            size={25}
                            color="white"
                        />
                    }
                    iconLeft
                    title="  Agregar "
                    onPress={addRow}
                />
                <View style={{ flexDirection: "row", padding:4 }}>
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontWeight:'bold'}}>Precio</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontWeight:'bold', marginLeft:15}}>Descuento</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontWeight:'bold'}}>Valor final</Text>
                    </View>
                    <View style={{ flex: 1 }} />
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.container}>
            <Input
                    label={"Descuento general"}
                    value={generalDiscount}
                    placeholder="Ej: 20000"
                    onChangeText={(text) => onChange(text)}
                    keyboardType="numeric"
                />
                <FlatList
                    data={products}
                    scrollEnabled={isScrollEnabled}
                    renderItem={({ item }) => (
                        <RowInput
                            prod={item}
                            sendRemoveRow={removeRow}
                            updateTotal={updateTotal}
                        />
                    )}
                    keyExtractor={(item) => item.id.toString()}
                    extraData={products}
                    ListHeaderComponent={headerComponent}
                    ListFooterComponent={footerComponent}
                    removeClippedSubviews={false}
                />
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    }
});
