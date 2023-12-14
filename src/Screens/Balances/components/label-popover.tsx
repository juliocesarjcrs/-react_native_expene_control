import React from 'react';
import { View, Text, ColorValue, StyleSheet, Modal } from 'react-native';
import { Tooltip, TooltipProps } from 'react-native-elements';
import { BACKGROUND_TOOLTIP } from '../../../styles/colors';
import { BIG, SMALL } from '../../../styles/fonts';

interface LabelPopoverProps {
  titleMain: string;
  average: string;
  previousAverage: string;
  total: string;
  colorValue: ColorValue;
}
const LabelPopover: React.FC<LabelPopoverProps> = ({ titleMain, average, previousAverage, total, colorValue }) => {
  const tooltipContent = (
    <View>
      <Text style={styles.contAverage}> {titleMain}</Text>
      <Text style={styles.contAverage}>
        {' '}
        Promedio:
        <Text style={styles.average}> {average}</Text>
      </Text>
      <Text style={styles.contAverage}>
        {' '}
        Prom ant:
        <Text style={styles.average}>{previousAverage}</Text>
      </Text>
    </View>
  );

  const tooltipProps: TooltipProps = {
    withPointer: true,
    popover: tooltipContent,
    toggleOnPress: true,
    toggleAction: 'onPress',
    height: 60,
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
      <Text style={styles.title}>{titleMain}</Text>
      <Tooltip {...tooltipProps}>
        <Text style={{ color: colorValue }}>{total}</Text>
      </Tooltip>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    padding: 10
  },
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
    paddingHorizontal: 10,
    color: 'white',
    fontWeight: '300'
  },
  contAverage: {
    fontSize: SMALL,
    paddingHorizontal: 10,
    color: 'white',
    fontWeight: 'bold'
  }
});

export default LabelPopover;
