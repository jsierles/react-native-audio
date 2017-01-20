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

import PlayButton from './PlayButton'
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
      isPlaying: true,
      isPaused: false,
      currentTime: 0,
      outputs: [
        {key: 'Phone', active: false}, 
        {key: 'Phone Speaker', active: false}, 
        {key: 'Bluetooth', active: false}, 
        {key: 'Headphones', active: false}
      ],
      selectedOutput: 'Phone',
      isSliding: false,
    }
  }

  componentWillMount() {
    this.setCallbacks()
  }

  componentDidMount() {
    this.playViaOutput()
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

  playViaOutput = () => {
    this.setOutputs()
    const { isPaused } = this.state
    if (isPaused) {
      AudioPlayer.unpause()
      this.setState({isPaused: false})      
    } else {
      AudioPlayer.play(Constants.AUDIO_PATH, { output: this.state.selectedOutput })
    }
    this.setState({isPlaying: true})
  }

  selectOutput = (output) => {
    this.setState({selectedOutput: output})
  }

  pause = () => {
    AudioPlayer.pause()
    this.setState({isPaused: true, isPlaying: false})
  }

  render() {
    const { durationSeconds } = this.props
    const {
      isPlaying,
      outputs,
      currentTime,
      selectedOutput,
    } = this.state

    let percentage = durationSeconds ? currentTime / durationSeconds : 0
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <PlayButton 
          iconName={isPlaying ? 'pause-circle-o' : 'play-circle-o'}
          onPressHandler={isPlaying ? this.pause : this.playViaOutput}
        />
        <Text style={styles.outputText}>
          Playing audio via 
          <Text style={styles.defaultOutput}> {selectedOutput}</Text>
        </Text>
        <Outputs outputs={outputs} onPressHandler={this.selectOutput} />
        <View style={styles.sliderContainer}>
          <Text style={styles.indicatorText}>{secondsToTime(currentTime)}</Text>
          <Slider
            value={percentage}
            onValueChange={this.sliderValueChange}
            onSlidingStart={this.sliderStart}
            onSlidingComplete={this.sliderComplete}
            style={styles.slider}
            trackStyle={styles.track}
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
    marginTop: Constants.PLATFORM_MARGIN_TOP + 26,
    flex: 1,
  },
  content: {
    alignItems: 'center'
  },
  sliderContainer: {
    flexDirection: 'row',
    marginTop: 50,
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
  track: {
    marginTop: -4,
  },
  defaultOutput: {
    color: Constants.CUSTOM_RED,
    fontWeight: 'bold',
  },
  outputText: {
    marginTop: 26,
    marginBottom: 10,
    fontSize: 16,
  },
})
