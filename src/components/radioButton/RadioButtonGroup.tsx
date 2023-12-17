import React from 'react';
import { View, Text } from 'react-native';
import { RadioButton } from 'react-native-paper';

interface RadioButtonGroupProps {
  selectedValue: number;
  onSelect: (value: number) => void;
}

export const RadioButtonGroup: React.FC<RadioButtonGroupProps> = ({ selectedValue, onSelect }) => {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <RadioButton
        value="Ingreso"
        status={selectedValue === 1 ? 'checked' : 'unchecked'}
        onPress={() => onSelect(1)}
      />
      <Text>Ingreso</Text>

      <RadioButton
        value="Gasto"
        status={selectedValue === 0 ? 'checked' : 'unchecked'}
        onPress={() => onSelect(0)}
      />
      <Text>Gasto</Text>
    </View>
  );
};

export default RadioButtonGroup;
