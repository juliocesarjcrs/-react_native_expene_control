import React, { useState } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { FAB } from 'react-native-elements';
import { useDispatch } from 'react-redux';
import { setQuery } from '../../features/searchExpenses/searchExpensesSlice';
// Types
import { AppDispatch } from '../../shared/types/reducers/root-state.type';
interface BarSearchProps {
  shouldDispatch?: boolean;
  onQueryChange?: (query: string) => void;
}

export const BarSearch: React.FC<BarSearchProps> = ({ shouldDispatch = true, onQueryChange }) => {
  const [queryState, setQueryState] = useState('');
  const dispatch: AppDispatch = useDispatch();

  const handleSearch = async (text: string) => {
    setQueryState(text);
    //if (onQueryChange) {
    //onQueryChange(text);
    // }
  };
  const handleSubmit = () => {
    if (shouldDispatch) {
      dispatch(setQuery(queryState));
    } else if (onQueryChange) {
      onQueryChange(queryState);
    }
  };

  return (
    <View style={styles.content}>
      <TextInput style={styles.input} onChangeText={handleSearch} value={queryState} placeholder="Buscador ..." />
      <FAB title="Buscar" onPress={handleSubmit} />
    </View>
  );
};
const styles = StyleSheet.create({
  content: {
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'space-between', // Espacio entre los hijos
    flexDirection: 'row',
    paddingHorizontal: 10,
  },
  input: {
    height: 40,
    borderWidth: 1,
    padding: 10,
    borderRadius: 25,
    borderColor: '#333',
    backgroundColor: '#fff',
    flex: 1, // Hace que el input ocupe todo el espacio disponible
    marginRight: 10, // Espaciado entre el input y el botón
  }
});
export default BarSearch;
