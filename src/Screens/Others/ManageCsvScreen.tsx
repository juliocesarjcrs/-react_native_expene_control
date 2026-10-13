import React, { useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Icon } from 'react-native-elements';

// Components
import { ScreenHeader } from '~/components/ScreenHeader';

// Configs
import { screenConfigs } from '~/config/screenConfigs';

// Theme
import { useThemeColors } from '~/customHooks/useThemeColors';

// Utils
import { showError } from '~/utils/showError';

// Styles
import { commonStyles } from '~/styles/common';

const VIEW_ICON_COLOR = '#007bff';
const DELETE_ICON_COLOR = '#d11a2a';
const BORDER_COLOR = '#eee';

interface CsvListState {
  files: string[];
  failed: boolean;
}

const listCsvFiles = (): CsvListState => {
  try {
    const documentDir = new Directory(Paths.document);
    const files = documentDir
      .list()
      .filter((item): item is File => item instanceof File) // Solo archivos, no directorios
      .map((file) => file.name)
      .filter((name) => name.endsWith('.csv'));
    return { files, failed: false };
  } catch (error: unknown) {
    showError(error);
    return { files: [], failed: true };
  }
};

export default function ManageCSVsScreen(): React.JSX.Element {
  const config = screenConfigs.manageCSV;
  const colors = useThemeColors();

  // La lectura es síncrona: se hace en el estado inicial y en los handlers,
  // sin useEffect (evita setState dentro de un efecto).
  const [csvList, setCsvList] = useState<CsvListState>(listCsvFiles);

  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        screen: { backgroundColor: colors.BACKGROUND }
      }),
    [colors]
  );

  const refreshCsvFiles = (): void => {
    const next = listCsvFiles();
    setCsvList(next);
    if (next.failed) {
      Alert.alert('Error', 'No se pudieron listar los archivos CSV');
    }
  };

  const handleDelete = (fileName: string): void => {
    Alert.alert('Eliminar archivo', `¿Seguro que deseas eliminar "${fileName}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          try {
            const file = new File(Paths.document, fileName);
            file.delete();
            refreshCsvFiles();
          } catch {
            Alert.alert('Error', 'No se pudo eliminar el archivo');
          }
        }
      }
    ]);
  };

  const handleShare = async (fileName: string): Promise<void> => {
    try {
      const file = new File(Paths.document, fileName);
      await Sharing.shareAsync(file.uri);
    } catch (error) {
      showError(error);
      Alert.alert('Error', 'No se pudo compartir el archivo');
    }
  };

  const renderItem = ({ item }: { item: string }): React.JSX.Element => (
    <View style={styles.row}>
      <Text style={styles.fileName}>{item}</Text>
      <View style={styles.actions}>
        <Icon
          name="eye"
          type="font-awesome"
          color={VIEW_ICON_COLOR}
          containerStyle={styles.viewIcon}
          onPress={() => {
            void handleShare(item);
          }}
        />
        <Icon
          name="trash"
          type="font-awesome"
          color={DELETE_ICON_COLOR}
          onPress={() => handleDelete(item)}
        />
      </View>
    </View>
  );

  return (
    <View style={[commonStyles.screenContentWithPadding, dynamicStyles.screen]}>
      <ScreenHeader title={config.title} subtitle={config.subtitle} />
      <Text style={styles.title}>Archivos CSV guardados</Text>
      <FlatList
        data={csvList.files}
        keyExtractor={(item) => item}
        refreshing={false}
        onRefresh={refreshCsvFiles}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {csvList.failed ? 'No se pudieron listar los archivos CSV' : 'No hay archivos CSV'}
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: BORDER_COLOR
  },
  fileName: { fontSize: 16, flex: 1 },
  actions: { flexDirection: 'row' },
  viewIcon: { marginRight: 16 },
  emptyText: { textAlign: 'center', marginTop: 20 }
});
