import React, { PropTypes } from 'react'
import {
  TouchableOpacity,
  StyleSheet
} from 'react-native'
import Icon from 'react-native-vector-icons/FontAwesome'

import Constants from '../Constants'

export default function PlayButton(props) {
  const { iconName, onPressHandler } = props
  return (
    <TouchableOpacity style={styles.button} onPress={onPressHandler}>
      <Icon name={iconName} size={105} color={Constants.CUSTOM_RED}/>
    </TouchableOpacity>
  )
}

PlayButton.propTypes = {
  iconName: PropTypes.string.isRequired,
  onPressHandler: PropTypes.func.isRequired,
}

const styles = StyleSheet.create({
  button: {
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginBottom: 10,
  },
})
