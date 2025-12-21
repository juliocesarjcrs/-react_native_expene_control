import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { OcrAccuracy, ReceiptType } from '~/shared/types/components/receipt-scanner.type';

const RECEIPT_TYPES: ReceiptType[] = [
  'D1',
  'Carulla',
  'Exito',
  'DollarCity',
  'Ara',
  'Falabella',
  'CruzVerde',
  'SuperCarnesJH',
  'Otros'
];

interface OcrEvaluationSectionProps {
  ocrAccuracy: OcrAccuracy | '';
  setOcrAccuracy: (accuracy: OcrAccuracy | '') => void;
  receiptType: ReceiptType | '';
  setReceiptType: (type: ReceiptType | '') => void;
  customReceiptType: string;
  setCustomReceiptType: (type: string) => void;
  productCount: number;
}

const OcrEvaluationSection: React.FC<OcrEvaluationSectionProps> = ({
  ocrAccuracy,
  setOcrAccuracy,
  receiptType,
  setReceiptType,
  customReceiptType,
  setCustomReceiptType,
  productCount
}) => {
  return (
    <View style={styles.evaluationSection}>
      <View style={styles.accuracyButtons}>
        <Text style={styles.sectionTitle}>Precisión del OCR (0-4):</Text>
        <View style={styles.buttonRow}>
          {[0, 1, 2, 3, 4].map((score) => (
            <TouchableOpacity
              key={score}
              style={[
                styles.accuracyButton,
                ocrAccuracy === String(score) && styles.selectedAccuracy
              ]}
              onPress={() => setOcrAccuracy(String(score) as OcrAccuracy)}
            >
              <Text>{score}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.accuracyLegend}>
          0=Falló | 1=Malo | 2=Regular | 3=Bueno | 4=Excelente
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Tipo de Factura</Text>
      <View style={styles.receiptTypeContainer}>
        {RECEIPT_TYPES.map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.receiptTypeButton, receiptType === type && styles.selectedReceiptType]}
            onPress={() => setReceiptType(type)}
          >
            <Text>{type}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {receiptType === 'Otros' && (
        <TextInput
          style={styles.input}
          placeholder="Especificar tipo de factura"
          value={customReceiptType}
          onChangeText={setCustomReceiptType}
        />
      )}

      <Text style={styles.productCount}>Productos detectados: {productCount}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  evaluationSection: {
    width: '90%',
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 10,
    fontSize: 16
  },
  receiptTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  receiptTypeButton: {
    padding: 10,
    margin: 5,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    minWidth: '30%',
    alignItems: 'center'
  },
  selectedReceiptType: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3'
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    padding: 10,
    borderRadius: 5,
    marginTop: 10
  },
  accuracyButtons: {
    marginVertical: 15,
    width: '100%'
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8
  },
  accuracyButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center'
  },
  selectedAccuracy: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3'
  },
  accuracyLegend: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    textAlign: 'center'
  },
  productCount: {
    marginTop: 10,
    fontStyle: 'italic'
  }
});

export default OcrEvaluationSection;
