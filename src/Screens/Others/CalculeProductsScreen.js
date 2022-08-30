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

export default function CalculeProductsScreen() {
    const [generalDiscount, setGeneralDiscount] = useState('5');
    const unit = { id: "1", price: "", realVal: "0", discount: generalDiscount };
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
        changeDiscount();
    }, [generalDiscount]);

    const changeDiscount = () => {
        const copyProducts = products.map((e, idx) => {
            return { ...e, discount: generalDiscount };
        });
        setProducts(copyProducts);
    }

    const addRow = () => {
        let newArray;
        newArray = [...products, { ...unit, id: products.length + 1 }];
        setProducts(newArray);
    };
    const removeRow = (id) => {
        const indexOfObject = products.findIndex((object) => {
            return object.id === id;
        });
        let copyProducts = products;
        if (indexOfObject >= 0) {
            copyProducts.splice(indexOfObject, 1);
            copyProducts = copyProducts.map((e, idx) => {
                return { ...e, id: idx+1 };
            });
        }
        setProducts(copyProducts);
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
    const footerComponent = () => {
        return <Text style={{marginLeft:160, fontSize: 15, fontWeight:'bold'}}>Total: {NumberFormat(realTotal)}</Text>;
    };
    const headerComponent = () => {
        return (
            <View>
                <Input
                    label={"Descuento general"}
                    value={generalDiscount}
                    placeholder="Ej: 20000"
                    onChangeText={(value) => setGeneralDiscount(value)}
                    keyboardType="numeric"
                />
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
                    // extraData={products}
                    initialNumToRender={4}
                    ListHeaderComponent={headerComponent}
                    ListFooterComponent={footerComponent}
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
