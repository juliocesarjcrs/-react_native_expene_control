import React from 'react';
import { Modal, View, Text, ScrollView, TextInput, TouchableOpacity, Image } from 'react-native';
import { Icon } from 'react-native-elements';
import { Product } from '~/shared/types/components/receipt-scanner.type';



interface EditProductsModalProps {
  visible: boolean;
  products: Product[];
  onChangeProducts: (products: Product[]) => void;
  onSave: () => void;
  imageUri?: string | null;
}

const EditProductsModal: React.FC<EditProductsModalProps> = ({
  visible,
  products,
  onChangeProducts,
  onSave,
  imageUri,
}) => {
  // Agregar un producto vacío
  const handleAddProduct = () => {
    onChangeProducts([
      ...products,
      { description: '', price: 0 }
    ]);
  };

  // Eliminar producto por índice
  const handleRemoveProduct = (idx: number) => {
    const arr = [...products];
    arr.splice(idx, 1);
    onChangeProducts(arr);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={{
        flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center'
      }}>
        <View style={{ backgroundColor: '#fff', padding: 20, borderRadius: 10, width: '90%' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <Text style={{ fontWeight: 'bold' }}>Edit products</Text>
            <Text style={{ color: '#555', fontSize: 14 }}>
              {products.length} {products.length === 1 ? 'product' : 'products'}
            </Text>
          </View>
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={{ width: 220, height: 220, alignSelf: 'center', marginBottom: 12, borderRadius: 8 }}
              resizeMode="contain"
            />
          ) : null}
          <ScrollView style={{ maxHeight: 300 }}>
            {products.map((prod, idx) => (
              <View key={idx} style={{ marginBottom: 12, flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text>Product {idx + 1}</Text>
                  <TextInput
                    style={{ borderWidth: 1, borderColor: '#ccc', marginBottom: 4, padding: 4 }}
                    value={prod.description}
                    placeholder="Description"
                    onChangeText={txt => {
                      const arr = [...products];
                      arr[idx].description = txt;
                      onChangeProducts(arr);
                    }}
                  />
                  <TextInput
                    style={{ borderWidth: 1, borderColor: '#ccc', marginBottom: 4, padding: 4 }}
                    value={prod.price.toString()}
                    placeholder="Cost"
                    keyboardType="decimal-pad"
                    onChangeText={txt => {
                      const arr = [...products];
                       arr[idx].price = parseInt(txt.replace(/[.,]/g, ''), 10) || 0; // Maneja textos vacíos o inválidos
                      onChangeProducts(arr);
                    }}
                  />
                </View>
                <Icon
                  name="trash"
                  type="font-awesome"
                  color="#d11a2a"
                  containerStyle={{ marginLeft: 8, marginTop: 18 }}
                  onPress={() => handleRemoveProduct(idx)}
                  accessibilityLabel="Delete product"
                />
              </View>
            ))}
          </ScrollView>
          <TouchableOpacity
            style={{
              backgroundColor: '#28a745',
              padding: 10,
              borderRadius: 5,
              marginTop: 10,
              marginBottom: 10,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onPress={handleAddProduct}
          >
            <Icon
              name="plus"
              type="font-awesome"
              color="#fff"
              size={18}
              containerStyle={{ marginRight: 6 }}
            />
            <Text style={{ color: '#fff', textAlign: 'center' }}>Add product</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ backgroundColor: '#007bff', padding: 10, borderRadius: 5 }}
            onPress={onSave}
          >
            <Text style={{ color: '#fff', textAlign: 'center' }}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default EditProductsModal;