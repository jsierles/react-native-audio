import React, { Component, PropTypes } from 'react'
import {
  ScrollView,
  View,
  Text,
  StyleSheet
} from 'react-native'
import { 
  AudioPlayer, 
} from 'react-native-audio-player-recorder'

import Slider from 'react-native-slider'
import Outputs from './Outputs'
import { secondsToTime } from '../timeConverter'
import Constants from '../Constants'

export default class Player extends Component {
  static propTypes = {
    durationSeconds: PropTypes.number.isRequired,
  }

  constructor(props) {
    super(props)
    this.state = {
      currentTime: 0,
      outputs: [
        {key: 'Phone', active: false}, 
        {key: 'Phone Speaker', active: false}, 
        {key: 'Bluetooth', active: false}, 
        {key: 'Headphones', active: false}
      ],
      selectedOutput: 'Phone Speaker',
      isSliding: false,
    }
  }

  componentWillMount() {
    this.setOutputs()
    this.setCallbacks()
  }

  setOutputs() {
    AudioPlayer.getOutputs(outputs => {
      outputs.forEach((availableOutput) => {
        this.state.outputs.forEach((output) => {
          if (output.key === availableOutput) {
            output.active = true
          }
        })  
      })
    })
  }

  setCallbacks() {
    AudioPlayer.onFinished = () => {
      const duration = this.props.durationSeconds
      this.setState({isPlaying: false, currentTime: duration})
    }
    AudioPlayer.setFinishedSubscription()
    
    AudioPlayer.onProgress = (data) => {
      if (!this.state.isSliding && this.state.isPlaying) {
        this.setState({currentTime: Math.round(data.currentTime)})
      }
    }
    AudioPlayer.setProgressSubscription()
  }

  sliderValueChange = (value) => {
    const { durationSeconds } = this.props
    const newCurrentTime = value * durationSeconds
    this.setState({currentTime: newCurrentTime, isSliding: true})
  }
  
  sliderComplete = (value) => {
    const { durationSeconds } = this.props
    const { isPlaying, isPaused } = this.state
    if (!isPaused && !isPlaying) {
      this.playViaOutput(this.state.selectedOutput)
    } else if (isPaused) {
      AudioPlayer.unpause()
    }
    this.setState({isSliding: false})
    AudioPlayer.skipToSeconds(value * durationSeconds)
  }

  sliderStart = () => {
    this.setState({isSliding: true})
  }

  playViaOutput = (output) => {
    AudioPlayer.play(Constants.AUDIO_PATH, { output: output })
    this.setState({isPlaying: true, selectedOutput: output})
  }

  render() {
    const { durationSeconds } = this.props
    const {
      outputs,
      currentTime,
    } = this.state

    let songPercentage = durationSeconds ? currentTime / durationSeconds : 0
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Outputs outputs={outputs} onPressHandler={this.playViaOutput} />
        <View style={styles.sliderContainer}>
          <Text style={styles.indicatorText}>{secondsToTime(currentTime)}</Text>
          <Slider
            value={songPercentage}
            onValueChange={this.sliderValueChange}
            onSlidingStart={this.sliderStart}
            onSlidingComplete={this.sliderComplete}
            style={styles.slider}
            minimumTrackTintColor={Constants.CUSTOM_RED}
            thumbTintColor={Constants.CUSTOM_RED}
          />
          <Text style={styles.indicatorText}>{secondsToTime(durationSeconds)}</Text>
        </View>
      </ScrollView>
    )
  }
}
const styles = StyleSheet.create({
  container: {
    marginTop: Constants.marginTop + 16,
    flex: 1,
  },
  content: {
    alignItems: 'center'
  },
  sliderContainer: {
    height: 150,
    flexDirection: 'row',
    paddingLeft: 16,
    paddingRight: 16,
  },
  indicatorText: {
    marginTop: 10,
    marginLeft: 5,
    marginRight: 5,
    color: Constants.ICON_GREY_COLOR,
    fontSize: 14,
  },
  slider: {
    flex: 1,
  },
})