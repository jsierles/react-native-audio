import React, { PropTypes } from 'react'
import {
  View,
  StyleSheet
} from 'react-native'

import IconButton from './IconButton'

export default function ActionButtons(props) {
  const {
    isFinishRecorded, 
    isRecording, 
    playPauseIcon, 
    playPauseHandler, 
    stopRecording
  } = props
  return (
    <View style={styles.buttonGroup}>
      <IconButton 
        iconName='stop-circle-o' 
        isDisabled={isFinishRecorded || !isRecording} 
        onPressHandler={stopRecording} 
      />
      <IconButton 
        iconName={playPauseIcon}
        isDisabled={!isFinishRecorded || isRecording} 
        onPressHandler={playPauseHandler} 
      />
    </View>
  )
}

ActionButtons.propTypes = {
  isFinishRecorded: PropTypes.bool.isRequired,
  isRecording: PropTypes.bool.isRequired,
  playPauseIcon: PropTypes.string.isRequired,
  playPauseHandler: PropTypes.func.isRequired,
  stopRecording: PropTypes.func.isRequired,
}

const styles = StyleSheet.create({
  buttonGroup: {
    flex: 1,
    flexDirection: 'row',
  },
})