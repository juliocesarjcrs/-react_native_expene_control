import React from 'react';

import { Alert, FlatList, Modal, StyleSheet, Text, View } from 'react-native';
import { Icon, Tooltip, TooltipProps } from 'react-native-elements';
import { useMutation } from '@apollo/client/react';

// Graphql
import { DELETE_LOAN } from '../../../graphql/mutations';

// Types
import { Loan } from '../../../shared/types/graphql/loan-query.type';

// Utils
import { showError } from '~/utils/showError';
import { DateFormat, NumberFormat } from '../../../utils/Helpers';

// Styles
import { MEDIUM, SMALL } from '../../../styles/fonts';
import { useThemeColors } from '~/customHooks/useThemeColors';

interface FlatListLoansProps {
  loans: Loan[] | undefined;
  updateList: () => void;
}

const FlatListLoans: React.FC<FlatListLoansProps> = ({ loans, updateList }) => {
  const colors = useThemeColors();
  const [deleteLoanMutation] = useMutation(DELETE_LOAN);
  const ListLoan = ({ item }: { item: Loan }) => {
    const deleteItem = async (idLoan: string) => {
      try {
        const { data } = await deleteLoanMutation({
          variables: { deleteLoanId: parseInt(idLoan) }
        });
        updateList();
      } catch (e) {
        showError(e);
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
      backgroundColor: colors.PRIMARY,
      highlightColor: 'transparent',
      skipAndroidStatusBar: false,
      ModalComponent: Modal,
      closeOnlyOnBackdropPress: false
    };
    return (
      <View style={[styles.header, { backgroundColor: colors.PRIMARY }]}>
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
          color={colors.PRIMARY}
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
  return (
    <FlatList
      keyExtractor={(item) => item.id.toString()}
      data={loans}
      renderItem={ListLoan}
    ></FlatList>
  );
};

export default FlatListLoans;
