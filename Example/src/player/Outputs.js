import React, { PropTypes } from 'react'
import {
  View, 
  Text,
  StyleSheet
} from 'react-native'

import Constants from '../Constants'

export default function Outputs(props) {
  const { outputs, onPressHandler } = props
  if (outputs.length === 0) {
    return <Text style={styles.text}>No available outputs.</Text>
  } 
  return (
    <View style={styles.outputContainer}>
      <Text style={styles.text}>Outputs List</Text>
      <View style={styles.blockContainer}>
        {renderItems(outputs, onPressHandler)}
      </View>
    </View>
  )
}

Outputs.propTypes = {
  outputs: PropTypes.array,
  onPressHandler: PropTypes.func.isRequired,
}

function renderItems(outputs, onPressHandler) {
  const elements = []
  outputs.forEach((output, index) => {
    if (output.active) {
      elements.push(
        <Text 
          key={index} 
          onPress={() => {onPressHandler(output.key)}}
          style={[styles.outputBlock, {backgroundColor: Constants.CUSTOM_RED}]}
        >
          {output.key}
        </Text>
      )
    } else {
      elements.push(
        <Text 
          key={index} 
          style={[styles.outputBlock, {backgroundColor: Constants.ICON_GREY_COLOR}]}
        >
          {output.key}
        </Text>
      )
    }
  })
  return elements
}

const styles = StyleSheet.create({
  text: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Constants.CUSTOM_RED,
    marginTop: 16,
    marginBottom: 36,
    textAlign: 'center',
  },
  outputBlock: {
    padding: 5,
    marginLeft: 5,
    marginRight: 5,
    color: 'white',
  },
  blockContainer: {
    flexDirection: 'row',
  },
})