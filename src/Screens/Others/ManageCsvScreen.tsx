import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Alert, StyleSheet } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Icon } from 'react-native-elements';

export default function ManageCSVsScreen(): React.JSX.Element {
  const [csvFiles, setCsvFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCsvFiles();
  }, []);

  const fetchCsvFiles = async () => {
    setLoading(true);
    try {
      const files = await FileSystem.readDirectoryAsync(FileSystem.documentDirectory || '');
      const csvs = files.filter((f) => f.endsWith('.csv'));
      setCsvFiles(csvs);
    } catch (error: unknown) {
      console.log('Error fetching CSV files:', error);
      Alert.alert('Error', 'No se pudieron listar los archivos CSV');
    }
    setLoading(false);
  };

  const handleDelete = (fileName: string) => {
    Alert.alert('Eliminar archivo', `¿Seguro que deseas eliminar "${fileName}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await FileSystem.deleteAsync(FileSystem.documentDirectory + fileName);
            fetchCsvFiles();
          } catch (error) {
            console.log('Error deleted CSV files:', error);
            Alert.alert('Error', 'No se pudo eliminar el archivo');
          }
        }
      }
    ]);
  };

  const handleShare = async (fileName: string) => {
    try {
      await Sharing.shareAsync(FileSystem.documentDirectory + fileName);
    } catch (e) {
      console.log('Error sharing CSV file:', e);
      Alert.alert('Error', 'No se pudo compartir el archivo');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Archivos CSV guardados</Text>
      <FlatList
        data={csvFiles}
        keyExtractor={(item) => item}
        refreshing={loading}
        onRefresh={fetchCsvFiles}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.fileName}>{item}</Text>
            <View style={{ flexDirection: 'row' }}>
              <Icon
                name="eye"
                type="font-awesome"
                color="#007bff"
                containerStyle={{ marginRight: 16 }}
                onPress={() => handleShare(item)}
              />
              <Icon name="trash" type="font-awesome" color="#d11a2a" onPress={() => handleDelete(item)} />
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20 }}>No hay archivos CSV</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#eee'
  },
  fileName: { fontSize: 16, flex: 1 }
});
