
import React,{useState} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {COMPLETE_COLOR_PROGRESS_BAR, MISSING_COLOR_PROGRESS_BAR} from '~/styles/colors'
const MyProgressBar = ({
  navigation,
  percentage,
  height,
  backgroundColor = 'grey',
  completedColor = COMPLETE_COLOR_PROGRESS_BAR,
}) => {

  const [getPercentage, setPercentage] = useState(percentage);
  const [getheight, setHeight] = useState(height);
  const [getBackgroundColor, setBackgroundColor] = useState(backgroundColor);
  const [getCompletedColor, setCompletedColor] = useState(completedColor);
  return (
    <View>
      <View style={styles.container}>
        <View
          style={{
            width: '100%',
            height: getheight,
            marginVertical: 10,
            borderRadius: 5,
            borderColor: getBackgroundColor,
            borderWidth: 1,
            backgroundColor: MISSING_COLOR_PROGRESS_BAR
          }}
        />
        <View
          style={{
            width: getPercentage ? getPercentage : 0,
            height: getheight,
            marginVertical: 10,
            borderRadius: 5,
            backgroundColor: getCompletedColor,
            position: 'absolute',
            bottom:20
          }}
        />
        <View
          style={{
            width: getPercentage ? getPercentage : 0,
            height: getheight,
            bottom:10,
          }}>
          <Text style={{textAlign: 'right'}}>{getPercentage}</Text>
        </View>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
  }
})
export default MyProgressBar;