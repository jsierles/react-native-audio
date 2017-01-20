import React, { PropTypes } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet
} from 'react-native'

import Constants from '../Constants'

export default function Button(props) {
  const { text, isDisabled, onPressHandler } = props
  const bgColor = isDisabled ? Constants.ICON_GREY_COLOR : Constants.CUSTOM_RED
  
  if (isDisabled) {
    return (
      <View style={styles.actionBtn}>
        <Text style={[styles.text, {backgroundColor: bgColor}]}>{text}</Text>
      </View>
    )
  }
  return (
    <TouchableOpacity style={styles.actionBtn} onPress={onPressHandler}>
      <Text style={[styles.text, {backgroundColor: bgColor}]}>{text}</Text>
    </TouchableOpacity>
  )
}

Button.propTypes = {
  text: PropTypes.string.isRequired,
  isDisabled: PropTypes.bool.isRequired,
  onPressHandler: PropTypes.func.isRequired,
}

const styles = StyleSheet.create({
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    marginTop: 16,
    alignItems: 'center',
  },
  text: {
    width: 150,
    padding: 10,
    textAlign: 'center',
    color: 'white',
  }
})