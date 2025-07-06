import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { BIG } from '../../styles/fonts';
import { StackNavigationProp } from '@react-navigation/stack';

import { Errors } from '../../utils/Errors';

// Services
import { getAllExpensesByRangeDates } from '../../services/categories';

// Utils
import { DateFormat, NumberFormat, cutText } from '../../utils/Helpers';

// Components
import { DateSelector } from '../../components/datePicker';
import MyLoading from '../../components/loading/MyLoading';
import MyTable from '../../components/tables/MyTable';
import MyButton from '../../components/MyButton';
import { SettingsStackParamList } from '../../shared/types';

type ExportExpenseScreenNavigationProp = StackNavigationProp<SettingsStackParamList, 'exportData'>;

interface ExportExpenseScreenProps {
  navigation: ExportExpenseScreenNavigationProp;
}

export default function ExportExpenseScreen({ navigation }: ExportExpenseScreenProps) {
  const [loading, setLoading] = useState(false);
  const [tableData, setTableData] = useState<(string | number)[][]>([]);
  const [tableHead, setTableHead] = useState<string[]>([]);
  const [isEmptyData, setIsEmptyData] = useState(false);

  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDate, setShowStartDate] = useState(false);
  const [showEndDate, setShowEndDate] = useState(false);

  const handleStartDateChange = (selectedDate?: Date) => {
    setShowStartDate(false);
    if (!selectedDate) {
      return;
    }
    setStartDate(selectedDate);
  };

  const handleEndDateChange = (selectedDate?: Date) => {
    setShowEndDate(false);
    if (!selectedDate) {
      return;
    }
    setEndDate(selectedDate);
  };

  const showStartDatePicker = () => {
    setShowStartDate(true);
  };

  const showEndDatePicker = () => {
    setShowEndDate(true);
  };

  const exportDataApi = async () => {
    try {
      setLoading(true);
      const { data } = await getAllExpensesByRangeDates(
        DateFormat(startDate, 'YYYY-MM-DD'),
        DateFormat(endDate, 'YYYY-MM-DD')
      );
      setLoading(false);
      console.log('data.rows.length', data.rows.length);
      if (data.rows.length <= 0) {
        setIsEmptyData(true);
        setTableHead([]);
        setTableData([]);
      } else {
        setIsEmptyData(false);
        setTableHead(data.tableHead);
        const dataFormated = data.rows.map((row) => {
          return row.map((value) => {
            if (typeof value === 'number') {
              return NumberFormat(value);
            } else {
              return cutText(value, 12);
            }
          });
        });
        setTableData(dataFormated);
      }
    } catch (e) {
      setLoading(false);
      Errors(e);
    }
  };

  return (
    <View style={styles.container}>
      <Text>Seleccione un rango de fechas:</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <DateSelector
          label="Fecha Ini"
          date={startDate}
          showDatePicker={showStartDate}
          onPress={showStartDatePicker}
          onDateChange={handleStartDateChange}
          onCancel={() => setShowStartDate(false)}
        />
        <DateSelector
          label="Fecha Fin"
          date={endDate}
          showDatePicker={showEndDate}
          onPress={showEndDatePicker}
          onDateChange={handleEndDateChange}
          onCancel={() => setShowEndDate(false)}
        />
      </View>
      <ScrollView horizontal={true}>
        {isEmptyData && <Text> No existe datos para esas fechas </Text>}
        <MyTable navigation={navigation} tableHead={tableHead} tableData={tableData} />
      </ScrollView>
      {loading ? <MyLoading /> : <MyButton onPress={exportDataApi} title="Crear tabla" />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  fixToText: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  title: {
    fontSize: BIG,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4
  },
  header: {
    backgroundColor: '#D2D1E8',
    borderRadius: 12,
    marginHorizontal: 4
  },
  containerDate: {
    display: 'flex',
    flexDirection: 'row',
    marginVertical: 5
  },
  textDate: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    color: 'white',
    backgroundColor: '#c5c5c5'
  }
});
