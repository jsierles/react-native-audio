import React, { PropTypes } from 'react'
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet
} from 'react-native'
import Icon from 'react-native-vector-icons/FontAwesome'

import Constants from './Constants'

export default function RecordButton(props) {
  const { isRecording, isFinishRecorded, onPressHandler} = props
  
  let text = 'Tap to record'
  if (isRecording) {
    text = 'Recording...'
  } 
  if (isFinishRecorded) {
    text = 'Tap to renew'
  }
  
  if (isRecording) {
    return (
      <View style={styles.button}>
        <Icon name='microphone' size={105} color={Constants.CUSTOM_RED}/>
        <Text style={styles.text}>{ text }</Text>
      </View>
    )
  }
  return (
    <TouchableOpacity style={styles.button} onPress={onPressHandler}>
      <Icon name='microphone' size={105} color={Constants.CUSTOM_RED}/>
      <Text style={styles.text}>{ text }</Text>
    </TouchableOpacity>
  )
}

RecordButton.propTypes = {
  isRecording: PropTypes.bool.isRequired,
  isFinishRecorded: PropTypes.bool.isRequired,
  onPressHandler: PropTypes.func,
}

const styles = StyleSheet.create({
  button: {
    width: 180,
    height: 180,
    borderRadius: 90,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderWidth: 2,
    borderColor: Constants.CUSTOM_RED,
    marginBottom: 10,
  },
  text: {
    paddingTop: 5,
    fontSize: 16,
    color: '#bbbbbb',
  },
})