import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Alert, StyleSheet } from 'react-native';
import { Directory, File, Paths } from 'expo-file-system';
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
      const documentDir = new Directory(Paths.document);
      const files = await documentDir.list();
      const csvs = files
        .filter((item) => item instanceof File) // Solo archivos, no directorios
        .map((file) => file.name) // Obtener el nombre del archivo
        .filter((name) => name.endsWith('.csv'));
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
            const file = new File(Paths.document, fileName);
            await file.delete();
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
      const file = new File(Paths.document, fileName);
      await Sharing.shareAsync(file.uri);
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
