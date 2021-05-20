import React from "react";
import { Alert } from "react-native";

export const createAlert = ({
  title = "Eliminar",
  msg = "¿Esta seguro de eliminar?",
}) =>
  Alert.alert({ title }, { msg }, [
    {
      text: "Cancel",
      onPress: () => console.log("Cancel Pressed"),
      style: "cancel",
    },
    { text: "OK", onPress: () => console.log("OK Pressed") },
  ]);
