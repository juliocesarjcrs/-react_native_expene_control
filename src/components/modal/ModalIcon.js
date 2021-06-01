import React, {useState} from 'react';
import {View} from 'react-native';
import {BottomSheet, Button, Icon} from 'react-native-elements';
import iconsFontAwesome from "../../../node_modules/react-native-vector-icons/glyphmaps/FontAwesome.json";

const ModalIcon = ({icon, setIcon})=>{
  const [isVisible, setIsVisible] = useState(false);
  var result = [];

  for (const key in iconsFontAwesome) {
    let temp = { key: iconsFontAwesome[key], value: key };
    result.push(temp);
  }

  return (
    <View>
          <Button
        icon={<Icon type="font-awesome" name={icon} size={20} color="white" />}
        iconRight
        title="Seleccionar un icono "
        onPress={() => {
          setIsVisible(true);
        }}
      />
      <BottomSheet
      isVisible={isVisible}
      containerStyle={{
        //  backgroundColor: "rgba(0.5, 0.25, 0, 0.2)"
         backgroundColor: "gray"
         }}
    >
      {
        <View
          style={{
            paddingHorizontal: 5,
            margin: 4,
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
          }}
        >
            <Icon
                    type="font-awesome"
                    style={{ paddingLeft: 15 }}
                    name='close'
                    size={50}
                    color='red'
                    onPress={() => {
                      setIsVisible(false);
                    }}
                  />
          {result.map((l, i) => {
            {
              return (
                <View
                  key={i}
                  style={{
                    padding: 5,
                  }}
                >
                  <Icon
                    type="font-awesome"
                    style={{ paddingLeft: 15 }}
                    name={l.value}
                    size={25}
                    underlayColor="green"
                    onPress={() => {
                      setIsVisible(false);
                      setIcon(l.value);
                    }}
                  />
                </View>
              );
            }
          })}
        </View>
      }
    </BottomSheet>

    </View>
  )


}


export default ModalIcon;