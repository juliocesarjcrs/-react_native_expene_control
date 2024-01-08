// YearCitySelector.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';

interface YearCitySelectorProps {
  selectedYear: number;
  setSelectedYear: React.Dispatch<React.SetStateAction<number>>;
  selectedCity: string;
  setSelectedCity: React.Dispatch<React.SetStateAction<string>>;
}

const YearCitySelector: React.FC<YearCitySelectorProps> = ({
  selectedYear,
  setSelectedYear,
  selectedCity,
  setSelectedCity,
}) => {
  const [openYear, setOpenYear] = useState(false);
  const [openCity, setOpenCity] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.pickerContainer}>
        <Text style={styles.pickerLabel}>Año:</Text>
        <DropDownPicker
          open={openYear} // Modifica según sea necesario
          value={selectedYear.toString()}
          items={[
            { label: '2023', value: '2023' },
            { label: '2024', value: '2024' },
            // Agrega más elementos según sea necesario
          ]}
          setOpen={setOpenYear}
          setValue={setSelectedYear}
         // setValue={(value) => {
           // console.log('value', value)
            //if (typeof value === 'string') {
             // setSelectedYear(parseInt(value, 10));
           // }
          //}}
          setItems={() => {}} // Puedes dejarlo vacío ya que los elementos están fijos
          containerStyle={styles.picker}
          zIndex={2000}
        />
      </View>

      <View style={styles.pickerContainer}>
        <Text style={styles.pickerLabel}>Ciudad:</Text>
        <DropDownPicker
          open={openCity} // Modifica según sea necesario
          value={selectedCity}
          items={[
            { label: 'Pereira', value: 'Pereira' },
            { label: 'Bucaramanga', value: 'Bucaramanga' },
            // Agrega más elementos según sea necesario
          ]}
          setOpen={setOpenCity}
          setValue={setSelectedCity}
          setItems={() => {}} // Puedes dejarlo vacío ya que los elementos están fijos
          containerStyle={styles.pickerCity}
          zIndex={3000}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({

  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around', // Puedes ajustar según sea necesario
    //backgroundColor: 'pink'
    //marginBottom: 10,
  },
  pickerLabel: {
    fontSize: 16,
    marginRight: 10,
  },
  picker: {
    height: 40,
    width: '48%', // Puedes ajustar el ancho según sea necesario
  },
  pickerCity:{
    height: 40,
    width: '55%'  }
});

export default YearCitySelector;
