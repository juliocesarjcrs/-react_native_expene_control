import React, { useState } from "react";
import { View, StyleSheet, TextInput, Text } from "react-native";
import { Icon } from "react-native-elements";
import {Colors, Fonts } from "~/styles";

export default function Input({
  style = { marginTop: 35 },
  focusVal = true,
  ...props
}) {
  const [focus, setFocus] = useState(focusVal);
  const [secure, setSecure] = useState(props.secure || false);
  return (
    <View
      style={[
        styles.container,
        style,
        focus ? styles.focused : styles.notFocused,
      ]}
    >
      <TextInput
        style={styles.textInput}
        {...props}
        secureTextEntry={secure}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
      />

      {props.secure && (
        <Icon
          type="material-community"
          style={{ paddingRight: 15 }}
          name={secure ? "eye" : "eye-off"}
          size={20}
          color="gray"
          onPress={() => setSecure(!secure)}
        />
      )}
         {props.errorText && (
           <View style={{
             paddingTop: props.secure ? 5:30
           }}>
             <Text style={styles.errorText}>{props.errorText}</Text>

           </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  focused: {
    // fontFamily: INTER_SEMIBOLD,
    // fontSize: SMALL,
    color: Colors.HEADER_GRAY,
    backgroundColor: "white",
    borderColor: Colors.GREEN_BLUE,
    borderWidth: 1,
  },
  textInput: {
    marginBottom:0,
    borderRadius: 5,
    paddingLeft: 15,
    // fontFamily: INTER_REGULAR,
    width: 290,
  },
  notFocused: {
    // fontFamily: INTER_REGULAR,
    // fontSize: SMALL,
    color: Colors.HEADER_GRAY,
    backgroundColor: Colors.SECUNDARY,
  },
  container: {
    flexDirection: "row",
    borderRadius: 5,
    width: 312,
    justifyContent: "flex-end",
    padding: 3,
    alignItems: "center",
    height: 50,
    flexWrap: "wrap"
  },
  inputStyle: {
    flex: 1,
  },
  errorText:{
    // flex: 1,
    width: 312,
    color: Colors.RED,
    fontSize: Fonts.SMALL,
  }
});
// const styles = StyleSheet.create({
//   input: {
//     ...Inputs.base,
//   },
// });
