import React, {useEffect, useState} from 'react';
import {StyleSheet, Text, View, Image} from 'react-native';
import { useForm, Controller } from "react-hook-form";
import MyButton from "~/components/MyButton";
import { Input } from "react-native-elements";
import {Errors} from '../../utils/Errors';
import AsyncStorage from "@react-native-async-storage/async-storage";
import {editUser, getUser} from '../../services/users';
import ShowToast from '../../utils/toastUtils';
import { useDispatch } from "react-redux";
import * as ImagePicker from 'expo-image-picker';
import {getUrlSignedAws} from '../../services/files';
import MyLoading from "~/components/loading/MyLoading";
import {setUser} from '../../features/auth/authSlice';
export default function EditUserScreen ({navigation}) {

  const EMAIL_REGEX =
  /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

  const {
      handleSubmit,
      control,
      setValue,

      formState: {
          errors,
      },
  } = useForm({
    defaultValues: {email: '', name: ''}
  });

  const [idUser, setIdUser] = useState(null);
  const [image, setImage] = useState(null);
  const [saveImage, setSaveImage] = useState(null);
  const [type, setType] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [loading, setLoading] = useState(false);


  useEffect(() => {
    fetchData();
    const unsubscribe = navigation.addListener("focus", () => {
      fetchData();
    });
    return unsubscribe;
  }, []);

  const fetchData = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('user')
      const user = jsonValue != null ? JSON.parse(jsonValue) : null;
      const {data} = await getUser(user.id);
      setValue("email", data.email);
      setValue("name", data.name);
      if(data.image){
        getUrlAws(data.image);
      }
      setIdUser(data.id)
    } catch (error) {
      Errors(error);
    }
  };
    // get url signed AWS
    const getUrlAws = async (keyImg) => {
      try {
          if (keyImg) {
              setLoading(true);
              const query = {
                  file: keyImg,
              };
              const { data } = await getUrlSignedAws(query);
              setLoading(false);
              setSaveImage(data);
          }
      } catch (error) {
          setLoading(false);
          Errors(error);
      }
  };

  const dispatch = useDispatch();
  const onSubmit = async (payload) => {
    try {
      let formData = new FormData();
      formData.append('email',payload.email);
      formData.append('name',payload.name);
      if(image){
        formData.append('image', {type:type, uri:image, name:fileName});
      }
      setLoading(true);
      const { data } = await editUser(idUser, formData);
      setLoading(false);
      dispatch(setUser(data));
      ShowToast();
    } catch (error) {
      setLoading(false);
      Errors(error);
    }
  };
  // add images


  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          alert('Sorry, we need camera roll permissions to make this work!');
        }
      }
    })();
  }, []);
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });


    if (!result.cancelled) {
      setImage(result.uri);
      let localUri = result.uri;
      let nameImagen = localUri.split('/').pop();

      // Infer the type of the image
      let match = /\.(\w+)$/.exec(nameImagen);
      let type = match ? `image/${match[1]}` : `image`;
      setType(type);
      setFileName(nameImagen)
    }
  };

  return (
      <View style={styles.container}>
          <Text>Editar usuario</Text>
          <View style={styles.container2}>
              <Controller
                  name="email"
                  control={control}
                  rules={{
                      required: {
                          value: true,
                          message: "Email es obligatorio",
                      },
                      pattern: {
                          value: EMAIL_REGEX,
                          message: "Not a valid email",
                      },
                  }}
                  render={({ field: { onChange , value  } }) => (
                      <Input
                          value={value}
                          placeholder="Email"
                          onChangeText={(text) => onChange(text)}
                          errorStyle={{ color: "red" }}
                          errorMessage={errors?.email?.message}
                      />
                  )}
                  defaultValue=""
              />
              <Controller
                  name="name"
                  control={control}
                  rules={{
                      required: {
                          value: true,
                          message: "El nombre es obligatorio",
                      },
                  }}
                  render={({ field: { onChange , value  } }) => (
                      <Input
                          value={value}
                          placeholder="Nombre"
                          onChangeText={(text) => onChange(text)}
                          errorStyle={{ color: "red" }}
                          errorMessage={errors?.name?.message}
                      />
                  )}
                  defaultValue=""
              />
                 {loading ? (
        <MyLoading />
      ) : (
        <MyButton title="Editar perfil" onPress={handleSubmit(onSubmit)} />
      )}
          </View>
          <View
              style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
              }}
          >
              <MyButton
                  title="Seleccione una imágen"
                  onPress={pickImage}
              />
              {/* <Text>{saveImage}</Text> */}
              {image && (
                  <Image
                      source={{ uri: image }}
                      style={{ width: 200, height: 200 }}
                  />
              )}
              {saveImage && !image && (
                  <Image
                      source={{uri:saveImage}}
                      style={{ width: 200, height: 200 }}
                  />
              )}
          </View>
      </View>
  );


}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    padding: 10,
  },
  container2: {
    flexDirection: "column",
    backgroundColor: "#fff",
  },
});