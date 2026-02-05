import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Styles
import { SMALL } from '~/styles/fonts';

interface YearCitySelectorProps {
  selectedYear: number;
  setSelectedYear: React.Dispatch<React.SetStateAction<number>>;
  selectedCity: string;
  setSelectedCity: React.Dispatch<React.SetStateAction<string>>;
  onConsult?: () => void;
}

export default function YearCitySelector({
  selectedYear,
  setSelectedYear,
  selectedCity,
  setSelectedCity,
  onConsult
}: YearCitySelectorProps) {
  const colors = useThemeColors();

  const [openYear, setOpenYear] = useState(false);
  const [openCity, setOpenCity] = useState(false);

  const yearItems = [
    { label: '2023', value: 2023 },
    { label: '2024', value: 2024 },
    { label: '2025', value: 2025 },
    { label: '2026', value: 2026 }
    // { label: '2027', value: 2027 },
  ];

  const cityItems = [
    { label: 'Pereira', value: 'Pereira' },
    { label: 'Bucaramanga', value: 'Bucaramanga' },
    { label: 'Pamplona', value: 'Pamplona' }
    // { label: 'Bogotá', value: 'Bogotá' },
    // { label: 'Medellín', value: 'Medellín' },
    // { label: 'Cali', value: 'Cali' },
  ];

  return (
    <View style={styles.container}>
      {/* Selector de Año */}
      <View style={styles.pickerContainer}>
        <Text style={[styles.label, { color: colors.TEXT_PRIMARY }]}>Año:</Text>
        <DropDownPicker
          open={openYear}
          value={selectedYear}
          items={yearItems}
          setOpen={setOpenYear}
          setValue={setSelectedYear}
          setItems={() => {}}
          placeholder="Seleccionar año"
          style={[
            styles.dropdown,
            {
              backgroundColor: colors.CARD_BACKGROUND,
              borderColor: colors.BORDER
            }
          ]}
          textStyle={{
            color: colors.TEXT_PRIMARY,
            fontSize: SMALL + 1
          }}
          dropDownContainerStyle={[
            styles.dropdownContainer,
            {
              backgroundColor: colors.CARD_BACKGROUND,
              borderColor: colors.BORDER
            }
          ]}
          listItemContainerStyle={{
            paddingVertical: 8
          }}
          selectedItemContainerStyle={{
            backgroundColor: colors.PRIMARY + '15'
          }}
          selectedItemLabelStyle={{
            color: colors.PRIMARY,
            fontWeight: '600'
          }}
          arrowIconContainerStyle={{}}
          // tickIconStyle={{ tintColor: colors.PRIMARY }}
          zIndex={3000}
          zIndexInverse={1000}
        />
      </View>

      {/* Selector de Ciudad */}
      <View style={styles.pickerContainer}>
        <Text style={[styles.label, { color: colors.TEXT_PRIMARY }]}>Ciudad:</Text>
        <DropDownPicker
          open={openCity}
          value={selectedCity}
          items={cityItems}
          setOpen={setOpenCity}
          setValue={setSelectedCity}
          setItems={() => {}}
          placeholder="Seleccionar ciudad"
          style={[
            styles.dropdown,
            {
              backgroundColor: colors.CARD_BACKGROUND,
              borderColor: colors.BORDER
            }
          ]}
          textStyle={{
            color: colors.TEXT_PRIMARY,
            fontSize: SMALL + 1
          }}
          dropDownContainerStyle={[
            styles.dropdownContainer,
            {
              backgroundColor: colors.CARD_BACKGROUND,
              borderColor: colors.BORDER
            }
          ]}
          listItemContainerStyle={{
            paddingVertical: 8
          }}
          selectedItemContainerStyle={{
            backgroundColor: colors.PRIMARY + '15'
          }}
          selectedItemLabelStyle={{
            color: colors.PRIMARY,
            fontWeight: '600'
          }}
          // arrowIconContainerStyle={{ tintColor: colors.TEXT_SECONDARY }}
          // tickIconStyle={{ tintColor: colors.PRIMARY }}
          zIndex={2000}
          zIndexInverse={2000}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 12
  },
  pickerContainer: {
    flex: 1,
    minHeight: 50
  },
  label: {
    fontSize: SMALL + 1,
    fontWeight: '600',
    marginBottom: 6
  },
  dropdown: {
    borderWidth: 1.5,
    borderRadius: 8,
    minHeight: 42
  },
  dropdownContainer: {
    borderWidth: 1.5,
    borderRadius: 8,
    marginTop: 4
  }
});
