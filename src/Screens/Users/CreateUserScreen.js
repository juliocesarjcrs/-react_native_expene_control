import React, {useEffect, useState} from 'react';
import {StyleSheet, Text, View, Image, FlatList, SafeAreaView} from 'react-native';
import { useForm, Controller } from "react-hook-form";
import MyButton from "~/components/MyButton";
import { Input } from "react-native-elements";
import {Errors} from '../../utils/Errors';
import {getUsersList, createUser} from '../../services/users';
import ShowToast from '../../utils/toastUtils';
import {MEDIUM} from '~/styles/fonts';

export default function CreateUserScreen ({navigation}) {


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
    defaultValues: {email: '', name: '', password: ''}
  });

  const [image, setImage] = useState(null);
  const [type, setType] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [listUsers, setListUsers] = useState([]);
  useEffect(() => {
    fetchData();
    const unsubscribe = navigation.addListener("focus", () => {
      fetchData();
    });
    return unsubscribe;
  }, []);

  const fetchData = async () => {
    try {
      const {data} = await getUsersList();
      setListUsers(data)
    } catch (error) {
      Errors(error);
    }
  };

  const onSubmit = async (payload) => {
    try {
      let formData = new FormData();
      formData.append('email',payload.email);
      formData.append('name',payload.name);
      formData.append('password',payload.password);
      formData.append('role',0);
      if(image){
        formData.append('image', {type:type, uri:image, name:fileName});
      }
      const { data } = await createUser(formData);
      ShowToast();
      fetchData();
    } catch (error) {
      Errors(error);
    }
  };
  const renderItem = ({ item }) => (
    <Item name={item.name} image={item.image} role={item.role} />
  );

  return (
    <View style={styles.container}>
      <Text>Nuevo usuario</Text>
      <View style={styles.container2}>
        <Controller
        name="email"
        control={control}
        rules={{
          required: { value: true, message: "Email es obligatorio" },
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
          required: { value: true, message: "El nombre es obligatorio" },
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
               <Controller
                    name="password"
                    control={control}
                    rules={{
                        required: {
                            value: true,
                            message: "La contraseña es obligatorio",
                        },
                        minLength: {
                            value: true,
                            message:
                                "La contraseña tiene que ser mayor a 2 caracteres",
                        },
                    }}
                    render={({ field: { onChange , value  } }) => (
                        <Input
                            value={value}
                            placeholder="Contraseña"
                            onChangeText={(text) => onChange(text)}
                            secureTextEntry={true}
                            errorStyle={{ color: "red" }}
                            errorMessage={errors?.password?.message}
                        />
                    )}
                    defaultValue=""
                />
      <MyButton title="Crear usuario" onPress={handleSubmit(onSubmit)} />
      </View>
      <SafeAreaView style={styles.container}>
      <FlatList
        data={listUsers}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
      />
    </SafeAreaView>

    </View>
  )


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
  item: {
    backgroundColor: '#f9c2ff',
    padding: 2,
    marginVertical: 2,
    marginHorizontal: 16,
  },
  title: {
    fontSize: MEDIUM,
  },
});
const Item = ({ name, image, role }) => (
  <View style={styles.item}>
    <Text style={{fontWeight: 'bold'}}>{name}</Text>
    <Text style={styles.title}>{image ?image.slice(0,20): image}</Text>
    <Text style={{fontWeight: 'bold'}}>{role==1 ? 'Admin': 'Normal'}</Text>
  </View>
);