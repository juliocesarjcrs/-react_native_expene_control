import React, { useEffect, useState } from "react";
import { FlatList, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { Errors } from "../../utils/Errors";
import { MUTED } from "../../styles/colors";
import RenderItem from "./components/RenderItem";
import { useDispatch, useSelector } from "react-redux";
import usePrevious from "../../customHooks/usePrevious";
import { setQuery } from "../../features/searchExpenses/searchExpensesSlice";

// Services
import { getLastExpensesWithPaginate } from "../../services/expenses";

// Components
import MyLoading from "../../components/loading/MyLoading";
import { BarSearch } from "../../components/search";

// Types
import { ExpenseStackParamList } from "../../shared/types";
import { RootState } from "../../shared/types/reducers";

// Utils
import { handlerDataSearch } from "../../utils/Helpers";
import { ExtendedExpenseModel } from "../../shared/types/models/expense.type";
import { AppDispatch } from "../../shared/types/reducers/root-state.type";

export type LastExpenseScreenNavigationProp = StackNavigationProp<ExpenseStackParamList, 'lastExpenses'>;

interface LastExpenseScreenProps {
  navigation: LastExpenseScreenNavigationProp;
}


export default function LastExpensesScreen({ navigation } : LastExpenseScreenProps) {
    const [lastExpenses, setLastExpenses] = useState<ExtendedExpenseModel[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingFooter, setLoadingFotter] = useState(false);
    const [page, setPage] = useState(1);
    const [stopeFetch, setStopeFetch] = useState(false);
    // PARA EL BUSCADOR
    const dispatch: AppDispatch = useDispatch();
    const query = useSelector((state: RootState) => state.search.query);
    const prevQuery = usePrevious(query);
    // la primera vez resetea el buscador
    useEffect(() => {
        dispatch(setQuery(null));
    }, []);

    useEffect(() => {
        fetchData();
        return navigation.addListener("focus", () => {
            fetchData();
        });
    }, [page]);
    /**Solo se lanza la primera vez cuando se contruye el component y al dar click boton buscar */
    useEffect(() => {
        setLastExpenses([]);
        setPage(1);
        setStopeFetch(false);
        if (page === 1 && query !== null) {
            fetchData();
        }
    }, [query]);

    const fetchData = async () => {
        try {
            const params = {
                take: 15,
                page,
                query,
                orderBy: "date",
            };
            setLoadingFotter(true);
            const { data } = await getLastExpensesWithPaginate(params);
            setLoadingFotter(false);
            if (data.data.length <= 0) {
                setStopeFetch(true);
            }
            const concatPages: ExtendedExpenseModel[] = handlerDataSearch(
                data.data,
                lastExpenses,
                params.query,
                prevQuery,
                params.page
            );
            setLastExpenses(concatPages);
        } catch (e) {
            setLoadingFotter(false);
            Errors(e);
        }
    };
    const loadMoreData = () => {
        if (!stopeFetch) {
            if (!loadingFooter) {
                // si no esta cargando datos aumente la página
                setPage(page + 1);
            }
        }
    };

    const renderFooter = () => {
        return <View>{loadingFooter ? <MyLoading /> : null}</View>;
    };

    return (
        <SafeAreaView style={styles.container}>
            {loading ? (
                <MyLoading />
            ) : (
                <FlatList
                    data={lastExpenses}
                    renderItem={({ item }) => (
                        <RenderItem
                            item={item}
                            navigation={navigation}
                            updateList={fetchData}
                        />
                    )}
                    keyExtractor={(item) => item.id.toString()}
                    ListEmptyComponent={() => (
                        <Text style={styles.textMuted}>
                            No se registran últimos gastos
                        </Text>
                    )}
                    initialNumToRender={10}
                    onEndReached={loadMoreData}
                    onEndReachedThreshold={0.1}
                    ListHeaderComponent={BarSearch}
                    ListFooterComponent={renderFooter}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
        paddingHorizontal: 15,
    },
    textMuted: {
        textAlign: "center",
        color: MUTED,
    },
});
