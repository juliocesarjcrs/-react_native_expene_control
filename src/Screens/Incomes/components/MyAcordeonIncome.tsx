import React from 'react';
import { Alert, Modal, StyleSheet, View } from 'react-native';
import { Text } from 'react-native';
import { Icon, Divider, Tooltip, TooltipProps } from 'react-native-elements';

// Services
import { deleteIncome } from '../../../services/incomes';

// Types
import { Errors } from '../../../utils/Errors';
import { CategoryIncomesSumary } from '~/shared/types/services';

// Utils
import { NumberFormat, DateFormat } from '~/utils/Helpers';

// Styles
import { ICON, PRIMARY_BLACK } from '~/styles/colors';
import { PRIMARY } from '../../../styles/colors';
import { MEDIUM, SMALL } from '../../../styles/fonts';

interface MyAcordeonIncomeProps {
  data: CategoryIncomesSumary;
  editCategory: (id: number) => void;
  updateList: () => void;
}
const MyAcordeonIncome: React.FC<MyAcordeonIncomeProps> = ({ data, editCategory, updateList }) => {
  const { id, icon, name } = data;
  const [expanded, setExpanded] = React.useState(false);
  const sendEditCategoryScreen = (id: number) => {
    editCategory(id);
  };
  const togleExpanded = () => {
    setExpanded(!expanded);
  };
  const createTwoButtonAlert = (id: number) =>
    Alert.alert('Eliminar', '¿Desea eliminar este ingreso?', [
      {
        text: 'Cancelar',
        onPress: () => console.log('Cancel Pressed'),
        style: 'cancel'
      },
      { text: 'OK', onPress: () => deleteItem(id) }
    ]);
  const deleteItem = async (idIncome: number) => {
    try {
      console.log('idIncome', idIncome, typeof idIncome);
      await deleteIncome(idIncome);
      updateList();
    } catch (e) {
      Errors(e);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.container}>
        <View style={{ flex: 1 }}>
          <View style={styles.title}>
            <Icon
              type="font-awesome"
              style={{ paddingLeft: 5 }}
              name={icon ? icon : 'home'}
              size={25}
              color={expanded ? PRIMARY_BLACK : ICON}
            />
            <Text
              style={{
                paddingHorizontal: 20,
                color: expanded ? PRIMARY_BLACK : 'black'
              }}
            >
              {name} ({data.incomes.length})
            </Text>
            <Icon
              type="material-community"
              name={'pencil-outline'}
              size={20}
              color={ICON}
              onPress={() => sendEditCategoryScreen(id)}
            />
          </View>
          <Text style={{ paddingLeft: 50 }}>{NumberFormat(data.total)}</Text>
          <Divider style={{ backgroundColor: PRIMARY_BLACK, marginVertical: 2 }} />
        </View>
        <View style={styles.containerIcon}>
          <Icon name={expanded ? 'chevron-up' : 'chevron-down'} type="font-awesome" onPress={() => togleExpanded()} />
        </View>
      </View>
      <View>
        {expanded &&
          data.incomes.map((item, idx2) => {
            const tooltipProps: TooltipProps = {
              withPointer: true,
              popover: <Text>{item.commentary}</Text>,
              toggleOnPress: true,
              toggleAction: 'onPress',
              height: 80,
              width: 200,
              containerStyle: {},
              pointerColor: 'white',
              onClose: () => {},
              onOpen: () => {},
              overlayColor: 'transparent',
              withOverlay: true,
              backgroundColor: '#333',
              highlightColor: 'transparent',
              skipAndroidStatusBar: false,
              ModalComponent: Modal,
              closeOnlyOnBackdropPress: false
            };
            return (
              <View style={styles.header} key={idx2}>
                <Text style={styles.titleDate}>
                  {DateFormat(item.date, 'DD MMM')} {DateFormat(item.createdAt ?? '', 'hh:mm a')}
                </Text>
                <Tooltip {...tooltipProps}>
                  <Text style={styles.item}>{NumberFormat(item.amount)}</Text>
                </Tooltip>
                <Icon name="trash" type="font-awesome" onPress={() => createTwoButtonAlert(item.id)} />
              </View>
            );
          })}
      </View>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  title: {
    display: 'flex',
    flexDirection: 'row',
    paddingVertical: 3
  },
  containerIcon: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingRight: 10
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    // width: 300,
    backgroundColor: PRIMARY,
    padding: 5,
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  item: {
    padding: 2,
    color: 'white',
    fontSize: SMALL
  },
  titleDate: {
    color: 'white',
    fontSize: MEDIUM,
    padding: 2
  }
});
export default MyAcordeonIncome;
