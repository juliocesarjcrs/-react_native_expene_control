import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Text,
  Modal,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';
import iconsFontAwesome from 'react-native-vector-icons/glyphmaps/FontAwesome.json';
import { useThemeColors } from '~/customHooks/useThemeColors';

interface ModalIconProps {
  icon: string;
  setIcon: (icon: string) => void;
}

type IconItem = {
  key: number;
  value: string;
};

const ICON_ITEM_SIZE = 72;
const HORIZONTAL_PADDING = 16; // 8px each side from listContent
const NUM_COLUMNS = Math.floor(
  (Dimensions.get('window').width - HORIZONTAL_PADDING) / ICON_ITEM_SIZE
);

// Built outside component so it's computed once at module load
const ALL_ICONS: IconItem[] = Object.entries(iconsFontAwesome).map(([key, value]) => ({
  key: value as number,
  value: key
}));

export default function ModalIcon({ icon, setIcon }: ModalIconProps) {
  const colors = useThemeColors();
  const [isVisible, setIsVisible] = useState(false);
  const [search, setSearch] = useState('');

  const filteredIcons = useMemo<IconItem[]>(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ALL_ICONS;
    return ALL_ICONS.filter((item) => item.value.includes(q));
  }, [search]);

  const handleIconSelect = useCallback(
    (iconValue: string) => {
      setIsVisible(false);
      setSearch('');
      setIcon(iconValue);
    },
    [setIcon]
  );

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setSearch('');
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: IconItem }) => (
      <TouchableOpacity
        style={[
          styles.iconWrapper,
          item.value === icon && {
            backgroundColor: colors.PRIMARY + '22',
            borderColor: colors.PRIMARY
          }
        ]}
        onPress={() => handleIconSelect(item.value)}
        activeOpacity={0.7}
      >
        <Icon name={item.value} size={24} color={item.value === icon ? colors.PRIMARY : '#555'} />
        <Text style={styles.iconLabel} numberOfLines={1}>
          {item.value}
        </Text>
      </TouchableOpacity>
    ),
    [icon, colors.PRIMARY, handleIconSelect]
  );

  const keyExtractor = useCallback((item: IconItem) => String(item.key), []);

  return (
    <View>
      {/* Trigger button */}
      <TouchableOpacity
        style={[styles.triggerButton, { borderColor: colors.PRIMARY }]}
        onPress={() => setIsVisible(true)}
        activeOpacity={0.8}
      >
        <Icon name={icon} size={20} color={colors.PRIMARY} />
        <Text style={[styles.triggerText, { color: colors.PRIMARY }]}>Seleccionar un icono</Text>
      </TouchableOpacity>

      {/* Modal */}
      <Modal
        visible={isVisible}
        animationType="slide"
        onRequestClose={handleClose}
        statusBarTranslucent
      >
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Seleccionar icono</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Icon name="times" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={styles.searchContainer}>
            <Icon name="search" size={16} color="#888" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar icono..."
              placeholderTextColor="#aaa"
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
              autoCapitalize="none"
              clearButtonMode="while-editing"
            />
          </View>

          <Text style={styles.resultCount}>{filteredIcons.length} iconos</Text>

          {/* Icon grid */}
          <FlatList
            data={filteredIcons}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            numColumns={NUM_COLUMNS}
            initialNumToRender={40}
            maxToRenderPerBatch={40}
            windowSize={5}
            removeClippedSubviews
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.listContent}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  // Trigger
  triggerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14
  },
  triggerText: {
    fontSize: 14,
    fontWeight: '500'
  },

  // Modal
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#333',
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  headerTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600'
  },
  closeBtn: {
    padding: 4
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 12,
    borderRadius: 10,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2
  },
  searchIcon: {
    marginRight: 8
  },
  searchInput: {
    flex: 1,
    height: 42,
    fontSize: 15,
    color: '#333'
  },
  resultCount: {
    paddingHorizontal: 16,
    paddingBottom: 4,
    fontSize: 12,
    color: '#999'
  },

  // Grid
  listContent: {
    paddingHorizontal: 8,
    paddingBottom: 20
  },
  iconWrapper: {
    width: ICON_ITEM_SIZE,
    height: ICON_ITEM_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    margin: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: '#fff'
  },
  iconLabel: {
    marginTop: 4,
    fontSize: 8,
    color: '#666',
    textAlign: 'center'
  }
});
