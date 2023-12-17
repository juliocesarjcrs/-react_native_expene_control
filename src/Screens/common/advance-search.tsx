import React, { useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';

// Services
import { getSubategoriesByCategory } from '../../services/subcategories';
import { findIncomesByCategoryId } from '../../services/incomes';

// Types
import { IncomeModel, SettingsStackParamList, SubcategoryModel } from '../../shared/types';
import { DropDownSelectFormat } from '../../shared/types/components';
import { Checkbox } from 'react-native-paper';
import { Errors } from '../../utils/Errors';
import { ListResultSearchProps } from '../../shared/types/components/card';
import { IncomeSearchOptionsQuery } from '../../shared/types/services/income-service.type';

// Components
import SelectOnlyCategory from '../../components/dropDown/SelectOnlyCategory';
import { RadioButtonGroup } from '../../components/radioButton';
import { DateSelector } from '../../components/datePicker';
import { BarSearch } from '../../components/search';
import { ListResultSearch } from '../../components/card';

// Styles
import { PRIMARY } from '../../styles/colors';
import { MEDIUM, SMALL } from '../../styles/fonts';

// Utils
import { DateFormat, NumberFormat } from '../../utils/Helpers';

type AdvancedSearchNavigationProp = StackNavigationProp<SettingsStackParamList, 'exportData'>;

interface AdvancedSearchProps {
  navigation: AdvancedSearchNavigationProp;
}

export default function AdvancedSearchScreen({ navigation }: AdvancedSearchProps) {
  const selectOnlyCategoryRef = useRef();
  const [selectedCategory, setSelectedCategory] = useState<DropDownSelectFormat | null>(null);
  const [subcategories, setSubcategories] = useState<SubcategoryModel[]>([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState<number[]>([]);
  // const [startDate, setStartDate] = useState<string>('');
  // const [endDate, setEndDate] = useState<string>('');
  const [searchType, setSearchType] = useState<number>(1); // Default: Ingreso
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDate, setShowStartDate] = useState(false);
  const [showEndDate, setShowEndDate] = useState(false);

  const [resultSearch, setResultSearch] = useState<ListResultSearchProps[]>([]);
  const [sumResultSearch, setSumResultSearch] = useState(0);


  const handleCategoryChange = async (categorySelectFormat: DropDownSelectFormat) => {
    const categoryId = categorySelectFormat.id;
    try {
      const { data } = await getSubategoriesByCategory(categoryId, { withExpenses: false });
      setSubcategories(data);
      setSelectedCategory(categorySelectFormat);
    } catch (error) {
      Errors(error);
    }
  };

  const handleSearch = async (text: string) => {
    if(searchType===1 && selectedCategory){
      const queryParams: IncomeSearchOptionsQuery = {
        startDate,
        endDate,
        searchValue: text,
        orderBy: 'date'
      }
      console.log('queryParams:', queryParams);
      const {data} = await findIncomesByCategoryId(selectedCategory.id, queryParams);
      const dataResultSearchFormated: ListResultSearchProps [] = data.incomes.map( e =>{
        return {id:  e.id,
          iconCategory: selectedCategory.iconName,
          //subcategory: 'string',
          commentary: e.commentary,
          amount: e.amount,
          dateFormat: e.date,
          createdAt: e.createdAt}
      })

      setResultSearch(dataResultSearchFormated)
      setSumResultSearch(data.sum)
    }
  };

  const showStartDatePicker = () => {
    setShowStartDate(true);
  };

  const showEndDatePicker = () => {
    setShowEndDate(true);
  };

  const handleStartDateChange = (selectedDate: Date) => {
    setShowStartDate(false);
    setStartDate(selectedDate);
  };

  const handleEndDateChange = (selectedDate: Date) => {
    setShowEndDate(false);
    setEndDate(selectedDate);
  };



  return (
    <View>
      <Text>Seleccione un tipo de búsqueda:</Text>
      <RadioButtonGroup selectedValue={searchType} onSelect={setSearchType} />
      <SelectOnlyCategory
        handleCategoryChange={handleCategoryChange}
        ref={selectOnlyCategoryRef}
        searchType={searchType}
      />

      {selectedCategory && (
        <>
          <Text>Seleccione subcategorías:</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {subcategories.map((subcategory) => (
              <Checkbox.Item
                key={subcategory.id}
                label={subcategory.name}
                status={selectedSubcategories.includes(subcategory.id) ? 'checked' : 'unchecked'}
                onPress={() =>
                  setSelectedSubcategories((prev) =>
                    prev.includes(subcategory.id)
                      ? prev.filter((id) => id !== subcategory.id)
                      : [...prev, subcategory.id]
                  )
                }
              />
            ))}
          </View>
        </>
      )}

      <Text>Seleccione un rango de fechas:</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <DateSelector
          label="Fecha Ini"
          date={startDate}
          showDatePicker={showStartDate}
          onPress={showStartDatePicker}
          onDateChange={handleStartDateChange}
        />
        <DateSelector
          label="Fecha Fin"
          date={endDate}
          showDatePicker={showEndDate}
          onPress={showEndDatePicker}
          onDateChange={handleEndDateChange}
        />
      </View>
      <BarSearch shouldDispatch={false} onQueryChange={handleSearch}/>
      <FlatList
        keyExtractor={(item) => item.id.toString()}
        data={resultSearch}
        renderItem={({ item }: { item: ListResultSearchProps }) => (
          <ListResultSearch {...item} />
        )}
        ListHeaderComponent={<Text>{NumberFormat(sumResultSearch)}</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    display: "flex",
    flexDirection: "row",
    // width: 300,
    backgroundColor: PRIMARY,
    padding: 5,
    // alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    color: "white",
    fontSize: MEDIUM,
    padding: 2,
  },
  item: {
    padding: 2,
    color: "white",
    fontSize: SMALL,
  },
  icon: {
    // backgroundColor: "pink",
    borderRadius: 100,
    padding: 2,
    marginTop: 10,
  }
});
