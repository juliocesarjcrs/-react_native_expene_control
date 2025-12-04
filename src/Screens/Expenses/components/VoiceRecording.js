import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Button } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
let recording = new Audio.Recording();
const VoiceRecording = () => {
  const [flatRecording, setFlatRecording] = useState(false);

  async function startRecording() {
    try {
      console.log('Requesting permissions..');
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true
      });
      console.log('Starting recording..');
      await recording.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
      await recording.startAsync();
      console.log('Recording started');
      setFlatRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  }

  // async function stopRecording() {
  //   console.log('Stopping recording..');
  //   // setRecording(undefined);
  //   await recording.stopAndUnloadAsync();
  //   const uri = recording.getURI();
  //   console.log('Recording stopped and stored at', uri);
  // }
  async function stopRecording() {
    console.log('Stopping recording..');
    await recording.stopAndUnloadAsync();
    console.log('my recording', recording);
    const uri = recording.getURI();
    console.log('Recording stopped and stored at', uri);
    getTranscription();
  }

  async function getTranscription() {
    // this.setState({ isFetching: true });
    try {
      const info = await FileSystem.getInfoAsync(recording.getURI());
      console.log(`FILE INFO: ${JSON.stringify(info)}`);
      const uri = info.uri;
      const formData = new FormData();
      formData.append('file', {
        uri,
        type: 'audio/x-wav',
        // could be anything
        name: 'speech2text'
      });
      const { data } = await sendVoice(formData);
      // const response = await fetch(config.CLOUD_FUNCTION_URL, {
      //   method: 'POST',
      //   body: formData
      // });
      // const data = await response.json();
      // this.setState({ query: data.transcript });
    } catch (error) {
      console.log('There was an error', error);
      // this.stopRecording();
      // this.resetRecording();
    }
    // this.setState({ isFetching: false });
  }

  return (
    <View style={styles.container}>
      <Button
        title={flatRecording ? 'Stop Recording' : 'Start Recording'}
        onPress={flatRecording ? stopRecording : startRecording}
      />
    </View>
  );
};
const styles = StyleSheet.create({
  input: {
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding: 10,
    borderRadius: 25,
    borderColor: '#333',
    backgroundColor: '#fff'
  }
});
export default VoiceRecording;
