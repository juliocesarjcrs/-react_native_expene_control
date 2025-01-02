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
            { label: '2025', value: '2025' },
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

      <View style={styles.pickerContainerCity}>
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
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center'
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '41%',
    paddingHorizontal: 5
  },
  pickerContainerCity: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '65%',
    paddingHorizontal: 5
  },
  pickerLabel: {
    fontSize: 16,
    marginRight: 2
  },
  picker: {
    height: 40,
    flex: 1
  },
  pickerCity:{
    height: 40,
    flex: 1
   }
});

export default YearCitySelector;
