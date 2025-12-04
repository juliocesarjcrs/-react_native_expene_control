import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Icon } from 'react-native-elements';
import { useDispatch } from 'react-redux';

// Redux
import { setQuery } from '~/features/searchExpenses/searchExpensesSlice';

// Components
import MyButton from '~/components/MyButton';

// Types
import { AppDispatch } from '~/shared/types/reducers/root-state.type';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { SMALL } from '~/styles/fonts';

interface BarSearchProps {
  shouldDispatch?: boolean;
  onQueryChange?: (query: string) => void;
  placeholder?: string;
}

export default function BarSearch({
  shouldDispatch = true,
  onQueryChange,
  placeholder = 'Buscar...'
}: BarSearchProps) {
  const colors = useThemeColors();
  const dispatch: AppDispatch = useDispatch();
  const [queryState, setQueryState] = useState<string>('');

  const handleSearch = (text: string): void => {
    setQueryState(text);
  };

  const handleSubmit = (): void => {
    if (shouldDispatch) {
      dispatch(setQuery(queryState));
    } else if (onQueryChange) {
      onQueryChange(queryState);
    }
  };

  const handleClear = (): void => {
    setQueryState('');
    if (shouldDispatch) {
      dispatch(setQuery(''));
    } else if (onQueryChange) {
      onQueryChange('');
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.searchContainer, { backgroundColor: colors.CARD_BACKGROUND }]}>
        {/* Icono de búsqueda */}
        <Icon
          type="material-community"
          name="magnify"
          size={20}
          color={colors.TEXT_SECONDARY}
          containerStyle={styles.searchIcon}
        />

        {/* Input */}
        <TextInput
          style={[
            styles.input,
            {
              color: colors.TEXT_PRIMARY,
              flex: 1
            }
          ]}
          onChangeText={handleSearch}
          value={queryState}
          placeholder={placeholder}
          placeholderTextColor={colors.TEXT_SECONDARY}
          onSubmitEditing={handleSubmit}
          returnKeyType="search"
        />

        {/* Botón limpiar */}
        {queryState.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <Icon
              type="material-community"
              name="close-circle"
              size={18}
              color={colors.TEXT_SECONDARY}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Botón Buscar */}
      <View style={styles.buttonContainer}>
        <MyButton title="Buscar" onPress={handleSubmit} variant="primary" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 10
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  searchIcon: {
    marginRight: 8
  },
  input: {
    fontSize: SMALL + 1,
    padding: 0
  },
  clearButton: {
    marginLeft: 8,
    padding: 4
  },
  buttonContainer: {
    minWidth: 90
  }
});
