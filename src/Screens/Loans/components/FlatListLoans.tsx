import React from 'react';

import { Alert, FlatList, Modal, StyleSheet, Text, View } from 'react-native';
import { Icon, Tooltip, TooltipProps } from 'react-native-elements';
import { useMutation } from '@apollo/client/react';

// Graphql
import { DELETE_LOAN } from '../../../graphql/mutations';

// Types
import { Loan } from '../../../shared/types/graphql/loan-query.type';

// Utils
import { DateFormat, NumberFormat } from '../../../utils/Helpers';
import { Errors } from '../../../utils/Errors';

// Styles
import { BACKGROUND_TOOLTIP, ICON, PRIMARY } from '../../../styles/colors';
import { MEDIUM, SMALL } from '../../../styles/fonts';

interface FlatListLoansProps {
  loans: Loan[] | undefined;
  updateList: () => void;
}

const FlatListLoans: React.FC<FlatListLoansProps> = ({ loans, updateList }) => {
  const [deleteLoanMutation] = useMutation(DELETE_LOAN);
  const ListLoan = ({ item }: { item: Loan }) => {

    const deleteItem = async (idLoan: string) => {
      try {
        const { data } = await deleteLoanMutation({
          variables: { deleteLoanId: parseInt(idLoan) }
        });
        updateList();
      } catch (e) {
        Errors(e);
      }
    };
    const createTwoButtonAlert = (id: string) =>
      Alert.alert('Eliminar', '¿Desea eliminar este préstamo?', [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        { text: 'OK', onPress: () => deleteItem(id) }
      ]);

    const tooltipProps: TooltipProps = {
      withPointer: true,
      popover: <Text>{item.commentary}</Text>,
      toggleOnPress: true,
      toggleAction: 'onPress',
      height: 80,
      width: 200,
      containerStyle: {
        // Estilos para el contenedor del Tooltip
      },
      pointerColor: 'white',
      onClose: () => {},
      onOpen: () => {},
      overlayColor: 'transparent',
      withOverlay: true,
      backgroundColor: BACKGROUND_TOOLTIP,
      highlightColor: 'transparent',
      skipAndroidStatusBar: false,
      ModalComponent: Modal,
      closeOnlyOnBackdropPress: false
    };
    return (
      <View style={styles.header}>
        <Tooltip {...tooltipProps}>
          <Text style={styles.title}>{NumberFormat(item.amount)}</Text>
        </Tooltip>

        <Text style={styles.title}>{item.type === 0 ? 'Préstamo' : 'Desfase'}</Text>

        <Text style={styles.item}>
          {DateFormat(item.createdAt, 'DD MMM')} {DateFormat(item.createdAt, 'hh:mm a')}
        </Text>
        <Icon
          type="material-community"
          style={{ paddingRight: 15 }}
          name="trash-can"
          size={20}
          color={ICON}
          onPress={() => createTwoButtonAlert(String(item.id))}
        />
      </View>
    );
  };
  const styles = StyleSheet.create({
    header: {
      display: 'flex',
      flexDirection: 'row',
      // width: 300,
      backgroundColor: PRIMARY,
      padding: 5,
      // alignItems: "center",
      justifyContent: 'space-between'
    },
    title: {
      color: 'white',
      fontSize: MEDIUM,
      padding: 2
    },
    item: {
      padding: 2,
      color: 'white',
      fontSize: SMALL
    }
  });
  return <FlatList keyExtractor={(item) => item.id.toString()} data={loans} renderItem={ListLoan}></FlatList>;
};

export default FlatListLoans;
