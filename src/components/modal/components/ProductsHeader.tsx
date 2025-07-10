// ProductsHeader.tsx - Versión simplificada para debug
import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Icon } from 'react-native-elements';

type ProductsHeaderProps = {
  title: string;
  count: number;
  imageUri?: string | null;
  onClose?: () => void;
};

const ProductsHeader: React.FC<ProductsHeaderProps> = ({ title, count, imageUri, onClose }) => {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.rightContainer}>
          <Text style={styles.countText}>
            {count} {count === 1 ? 'producto' : 'productos'}
          </Text>
          {onClose && (
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={20} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {imageUri && (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
            resizeMode="contain"
            onError={(e) => console.log('Error loading image:', e.nativeEvent.error)}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    width: '100%',
    marginBottom: 10
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16
  },
  countText: {
    color: '#555',
    fontSize: 13
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  closeButton: {
    marginLeft: 10
  },
  imageContainer: {
    height: 200,
    width: '100%',
    marginBottom: 8,
    borderRadius: 6,
    backgroundColor: '#f5f5f5', // Color de fondo para debug
    alignItems: 'center',
    justifyContent: 'center'
  },
  image: {
    width: '100%',
    height: '100%'
  }
});

export default ProductsHeader;