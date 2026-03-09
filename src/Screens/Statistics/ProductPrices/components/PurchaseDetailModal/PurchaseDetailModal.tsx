import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Icon } from 'react-native-elements';
import { ProductPrice } from '~/shared/types/utils/commentaryParser/commentary-analysis.types';
import { PurchaseEditForm } from './PurchaseEditForm';
import { PurchaseDetailView } from './PurchaseDetailView';
import { useThemeColors } from '~/customHooks/useThemeColors';
import { MEDIUM } from '~/styles/fonts';

interface PurchaseDetailModalProps {
  visible: boolean;
  purchase: ProductPrice | null;
  onClose: () => void;
  onSave: (updated: ProductPrice) => Promise<void>;
}

export const PurchaseDetailModal: React.FC<PurchaseDetailModalProps> = ({
  visible,
  purchase,
  onClose,
  onSave
}) => {
  const colors = useThemeColors();

  if (!purchase) return null;

  const isIncomplete = purchase.isIncomplete;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.modalContainer, { backgroundColor: colors.BACKGROUND }]}>
        {/* Header */}
        <View style={[styles.modalHeader, { borderBottomColor: colors.BORDER }]}>
          <Text style={[styles.modalTitle, { color: colors.TEXT_PRIMARY }]}>
            {isIncomplete ? 'Completar Datos' : 'Detalle de Compra'}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Icon type="material-community" name="close" size={24} color={colors.TEXT_PRIMARY} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
          {isIncomplete ? (
            <PurchaseEditForm purchase={purchase} onSave={onSave} onCancel={onClose} />
          ) : (
            <PurchaseDetailView purchase={purchase} />
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1
  },
  modalTitle: {
    fontSize: MEDIUM + 2,
    fontWeight: '700'
  },
  closeButton: {
    padding: 4
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16
  }
});
