import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { BIG } from '../../styles/fonts';
import MyButton from '../../components/MyButton';
import { useState } from 'react';
import { Errors } from '../../utils/Errors';

// Services
import { getAllExpensesByRangeDates } from '../../services/expenses2';
import MyLoading from '../../components/loading/MyLoading';
import MyTable from '../../components/tables/MyTable';
import { StackNavigationProp } from '@react-navigation/stack';
import { DateFormat, NumberFormat, cutText } from '../../utils/Helpers';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Button, Icon } from 'react-native-elements';
type RootStackParamList = {
  Home: undefined; // Puedes ajustar esto según tus rutas y parámetros
  ExportExpense: undefined; // Asegúrate de que coincida con el nombre de tu pantalla
  // Otras pantallas...
};
type ExportExpenseScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ExportExpense'>;

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

  const handleStartDateChange = (event: Event, selectedDate?: Date) => {
    setShowStartDate(false);
    if (selectedDate) {
      setStartDate(selectedDate);
    }
  };

  const handleEndDateChange = (event: Event, selectedDate?: Date) => {
    setShowEndDate(false);
    if (selectedDate) {
      setEndDate(selectedDate);
    }
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
          return row.map((value, index) => {
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
      <View style={styles.containerDate}>
        <Button
          icon={<Icon type="material-community" name="calendar" size={25} color="white" />}
          title=" Fecha inicial"
          onPress={showStartDatePicker}
        />
        <Text style={styles.textDate}>{DateFormat(startDate, 'YYYY MMM DD')}</Text>
      </View>

      <View style={styles.containerDate}>
        <Button
          icon={<Icon type="material-community" name="calendar" size={25} color="white" />}
          title=" Fecha Fin"
          onPress={showEndDatePicker}
        />
        <Text style={styles.textDate}>{DateFormat(endDate, 'YYYY MMM DD')}</Text>
      </View>
      {showStartDate && <DateTimePicker value={startDate} mode="date" onChange={handleStartDateChange} />}

      {showEndDate && <DateTimePicker value={endDate} mode="date" onChange={handleEndDateChange} />}
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
