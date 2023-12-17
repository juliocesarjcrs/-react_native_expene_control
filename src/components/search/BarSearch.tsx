import React, { useState } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { FAB } from 'react-native-elements';
import { useDispatch } from 'react-redux';
import { setQueryAction } from '../../actions/SearchActions';

interface BarSearchProps {
  shouldDispatch?: boolean;
  onQueryChange?: (query: string) => void;
}

export const BarSearch: React.FC<BarSearchProps> = ({ shouldDispatch = true, onQueryChange }) => {
  const [query, setQuery] = useState('');
  const dispatch = useDispatch();

  const handleSearch = async (text: string) => {
    setQuery(text);
    //if (onQueryChange) {
    //onQueryChange(text);
    // }
  };
  const handleSubmit = () => {
    if (shouldDispatch) {
      dispatch(setQueryAction(query));
    } else if (onQueryChange) {
      onQueryChange(query);
    }
  };

  return (
    <View style={styles.content}>
      <TextInput style={styles.input} onChangeText={handleSearch} value={query} placeholder="Buscador ..." />
      <FAB title="Buscar" onPress={handleSubmit} />
    </View>
  );
};
const styles = StyleSheet.create({
  content: {
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row'
  },
  input: {
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding: 10,
    borderRadius: 25,
    borderColor: '#333',
    backgroundColor: '#fff'
  }
});
export default BarSearch;
