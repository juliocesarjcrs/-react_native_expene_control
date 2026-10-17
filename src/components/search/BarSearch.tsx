import React, { useEffect, useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Icon } from 'react-native-elements';

// Redux
import { clearQuery, setQuery, type SearchScope } from '~/features/search/searchSlice';

// Components
import MyButton from '~/components/MyButton';

// Hooks
import { useAppDispatch, useAppSelector } from '~/store/hooks';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { SMALL } from '~/styles/fonts';

interface BarSearchProps {
  scope?: SearchScope; // necesario cuando shouldDispatch es true
  shouldDispatch?: boolean;
  onQueryChange?: (query: string) => void;
  placeholder?: string;
  loading?: boolean;
}

export default function BarSearch({
  scope,
  shouldDispatch = true,
  onQueryChange,
  placeholder = 'Buscar...',
  loading = false
}: BarSearchProps) {
  const colors = useThemeColors();
  const dispatch = useAppDispatch();

  // Solo hay scope activo si se conecta al store; así TS estrecha el tipo
  const activeScope = shouldDispatch ? scope : undefined;

  const queryFromStore = useAppSelector((state) =>
    activeScope ? state.search.queries[activeScope] : null
  );
  const storeValue = activeScope ? (queryFromStore ?? '') : null;

  const [queryState, setQueryState] = useState<string>(storeValue ?? '');
  const [prevStoreValue, setPrevStoreValue] = useState(storeValue);

  // Sincroniza con el store cuando cambia externamente (durante el render, sin efecto)
  if (storeValue !== prevStoreValue) {
    setPrevStoreValue(storeValue);
    if (storeValue !== null) {
      setQueryState(storeValue);
    }
  }

  // Al desmontarse, limpia solo la búsqueda de su propio scope
  useEffect(() => {
    if (!activeScope) return;
    return () => {
      dispatch(clearQuery(activeScope));
    };
  }, [dispatch, activeScope]);

  // Envía la búsqueda al store o al callback del padre
  const submitQuery = (text: string): void => {
    if (activeScope) {
      dispatch(setQuery({ scope: activeScope, query: text || null }));
    } else if (onQueryChange) {
      onQueryChange(text);
    }
  };

  // El texto se mantiene en el input después de buscar
  const handleSubmit = (): void => {
    submitQuery(queryState.trim());
  };

  const handleClear = (): void => {
    setQueryState('');
    submitQuery('');
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.searchContainer,
          { backgroundColor: colors.CARD_BACKGROUND, shadowColor: colors.BLACK }
        ]}
      >
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
          style={[styles.input, { color: colors.TEXT_PRIMARY }]}
          onChangeText={setQueryState}
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
        <MyButton title="Buscar" onPress={handleSubmit} variant="primary" loading={loading} />
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
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  searchIcon: {
    marginRight: 8
  },
  input: {
    flex: 1,
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
