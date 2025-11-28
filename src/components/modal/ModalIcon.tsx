import React, { useState, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Overlay, Button, Icon } from 'react-native-elements';
import { useThemeColors } from '~/customHooks/useThemeColors';
import iconsFontAwesome from 'react-native-vector-icons/glyphmaps/FontAwesome.json';

interface ModalIconProps {
  icon: string;
  setIcon: (icon: string) => void;
}

type IconItem = {
  key: number;
  value: string;
};

export default function ModalIcon({ icon, setIcon }: ModalIconProps) {
  const colors = useThemeColors();
  const [isVisible, setIsVisible] = useState<boolean>(false);

  const iconList = useMemo<IconItem[]>(() => {
    const result: IconItem[] = [];
    for (const key in iconsFontAwesome) {
      result.push({
        key: iconsFontAwesome[key as keyof typeof iconsFontAwesome],
        value: key
      });
    }
    return result;
  }, []);

  const handleIconSelect = (iconValue: string): void => {
    setIsVisible(false);
    setIcon(iconValue);
  };

  const handleClose = (): void => {
    setIsVisible(false);
  };

  return (
    <View>
      <Button
        icon={<Icon type="font-awesome" name={icon} size={20} color="white" />}
        iconRight
        title="Seleccionar un icono"
        onPress={() => setIsVisible(true)}
      />

      <Overlay
        isVisible={isVisible}
        overlayStyle={styles.bottomSheetContainer}
        onBackdropPress={handleClose}
      >
        <View>
          <Button
            title="Close"
            onPress={handleClose}
            buttonStyle={{ backgroundColor: 'red', marginBottom: 10 }}
          />
          <View style={styles.iconContainer}>
            {iconList.map((item) => (
              <Button
                key={item.key}
                title={item.value}
                type="clear"
                onPress={() => handleIconSelect(item.value)}
                buttonStyle={styles.iconWrapper}
              />
            ))}
          </View>
        </View>
      </Overlay>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomSheetContainer: {
    backgroundColor: 'gray'
  },
  iconContainer: {
    paddingHorizontal: 5,
    margin: 4,
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  iconWrapper: {
    padding: 5
  }
});
