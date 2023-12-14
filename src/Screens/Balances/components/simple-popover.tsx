import React from 'react';
import { View, Text, StyleSheet, Modal } from 'react-native';
import { Tooltip, TooltipProps } from 'react-native-elements';
import { BACKGROUND_TOOLTIP } from '../../../styles/colors';
import { BIG, SMALL } from '../../../styles/fonts';

type SimplePopoverProps = {
  sumPreviousSavings: string;
  totalSavingsHistory: string;
  totalSavings: string;
  totalSavingsWithLoansHistory: string;
};

const SimplePopover: React.FC<SimplePopoverProps> = ({
  sumPreviousSavings,
  totalSavingsHistory,
  totalSavings,
  totalSavingsWithLoansHistory
}) => {
  const tooltipProps: TooltipProps = {
    withPointer: true,
    popover: (
      <View>
        {/* <Text style={styles.contAverage}>
          Ahorro:
          <Text style={styles.average}>
              {NumberFormat(sumSavings)}
          </Text>
      </Text> */}
        <Text style={styles.contAverage}>
          Ahorro anterior:
          <Text style={styles.average}>{sumPreviousSavings}</Text>
        </Text>
        <Text style={styles.contAverage}>
          {/* {' '} */}
          Histórico real :<Text style={styles.average}> {totalSavingsHistory}</Text>
        </Text>
        <Text style={styles.contAverage}>
          {/* {' '} */}
          Con préstamos:
          <Text style={styles.average}> {totalSavingsWithLoansHistory}</Text>
        </Text>
      </View>
    ),
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
    <View style={styles.item}>
      <Text style={styles.title}>Saldo</Text>
      <Tooltip {...tooltipProps}>
        <Text style={{ color: '#87CEFA' }}>{totalSavings}</Text>
      </Tooltip>
    </View>
  );
};

const styles = StyleSheet.create({
  item: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  title: {
    fontSize: BIG
  },
  average: {
    fontSize: SMALL,
    paddingHorizontal: 5,
    color: 'white',
    fontWeight: '300'
  },
  contAverage: {
    fontSize: SMALL,
    paddingHorizontal: 5,
    color: 'white',
    fontWeight: 'bold'
  }
});

export default SimplePopover;
