
import React,{useState} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {COMPLETE_COLOR_PROGRESS_BAR, MISSING_COLOR_PROGRESS_BAR} from '~/styles/colors';
import { Badge} from 'react-native-elements';
import { dayMonth } from '../../utils/Helpers';
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
  const [getPercentageReal, setPercentageReal] = useState(percentage);

  const day = dayMonth();
  const  today = day.day <= 9 ? '9%' : day.percentage;
  const tempPercentage= parseFloat(getPercentage.substring());

  if(tempPercentage > 100){
    setPercentage('100%');
    setCompletedColor('#FA7E87')
  }
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
            bottom:15
          }}
        />
        <View
          style={{
            width: getPercentage ? getPercentage : 0,
            height: getheight,
            bottom:25,
          }}>
          <Text style={{textAlign: 'right', fontWeight:'bold', color:'white',fontSize:11, paddingRight:4}}>{getPercentageReal}</Text>
        </View>
        <View
          style={{
            width: today,
            flexDirection: 'row',
            justifyContent: 'flex-end',
            position:'absolute',
            bottom: 5,
            // backgroundColor:'red'
          }}>
            <View style={styles.verticalLine} />
            <Badge value="Hoy" status="success" />
        </View>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    marginLeft:10
  },
  verticalLine: {
    backgroundColor:'gray',
    width:1,
    height:15,
    position:'relative',
    bottom: 17,
    left:15,
    opacity:0.6
  }

})
export default MyProgressBar;