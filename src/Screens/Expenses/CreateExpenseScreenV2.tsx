import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import ReceiptScanner from '../../components/ReceiptScanner';

const CreateExpenseScreenV2: React.FC = () => {
  const [extracted, setExtracted] = useState<{
    price: string;
    category?: string;
    subcategory?: string;
    rawText: string;
  } | null>(null);


  return (
    <View style={styles.container}>
      <Text style={styles.title}>Crear Gasto (con OCR)</Text>
      <ReceiptScanner onExtractedData={setExtracted} />
      {/* {extracted && (
        <View style={styles.resultBox}>
          <Text style={styles.label}>Precio detectado: <Text style={styles.value}>{extracted.price || 'No detectado'}</Text></Text>
          <Text style={styles.label}>Categoría sugerida: <Text style={styles.value}>{extracted.category || 'No detectada'}</Text></Text>
          <Text style={styles.label}>Subcategoría sugerida: <Text style={styles.value}>{extracted.subcategory || 'No detectada'}</Text></Text>
          <Text style={styles.label}>Texto completo extraído:</Text>
          <ScrollView style={styles.textScroll}>
            <Text style={styles.text}>{extracted.rawText}</Text>
          </ScrollView>
        </View>
      )} */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  resultBox: { marginTop: 24, padding: 12, backgroundColor: '#f2f2f2', borderRadius: 8 },
  label: { fontWeight: 'bold', marginTop: 8 },
  value: { fontWeight: 'normal', color: '#333' },
  textScroll: { maxHeight: 250, marginTop: 8, backgroundColor: '#fff', borderRadius: 8, padding: 8 },
  text: {},
});

export default CreateExpenseScreenV2;
