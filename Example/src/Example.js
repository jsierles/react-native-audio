import React, { Component } from 'react'
import {
  ScrollView,
  View,
  StyleSheet
} from 'react-native'
import { 
  AudioPlayer, 
  AudioRecorder, 
  AudioUtils
} from 'react-native-audio-player-recorder'

import Constants from './Constants'
import RecordButton from './RecordButton'
import IconButton from './IconButton'

const AUDIO_PATH = AudioUtils.DocumentDirectoryPath + '/example.aac'
const MAX_AUDIO_LENGTH = 60

export default class Example extends Component {
  constructor(props) {
    super(props)
    this.state = {
      isRecording: false,
      isFinishRecorded: false,
      isPlaying: false,
      isPaused: false,
      currentTime: 0,
      durationSeconds: MAX_AUDIO_LENGTH,
      isSliding: false,
    }
    this.timer = null
  }
  
  componentDidMount() {
    this.setCallbacks()
  }

  setCallbacks() {
    AudioPlayer.onFinished = () => {
      this.setState({isPlaying: false})
    }
    AudioPlayer.setFinishedSubscription()
    
    AudioPlayer.onProgress = (data) => {
      if (!this.state.isSliding && this.state.isPlaying) {
        this.setState({currentTime: Math.round(data.currentTime)})
      }
    }
    AudioPlayer.setProgressSubscription()
  }

  prepareRecordingPath(){
    AudioRecorder.prepareRecordingAtPath(AUDIO_PATH, {
      SampleRate: 22050,
      Channels: 1,
      AudioQuality: 'Low',
      AudioEncoding: 'aac',
      AudioEncodingBitRate: 32000
    })
  }

  record = () => {
    const { isFinishRecorded, isPlaying } = this.state
    if (isFinishRecorded) {
      this.setState({durationSeconds: MAX_AUDIO_LENGTH, isFinishRecorded: false})
    }
    if (isPlaying) {
      this.stopPlaying()
    }

    this.prepareRecordingPath()
    AudioRecorder.startRecording()
    this.setState({
      isPlaying: false,
      isRecording: true,
      isFinishRecorded: false,
      currentTime: 0
    })

    this.timer = setInterval(() => {
      const time = this.state.currentTime + 1
      this.setState({currentTime: time})
      if (time === MAX_AUDIO_LENGTH) {
        this.stopRecording()
      }
    }, 1000)
  }

  stopRecording = () => {
    const { isRecording, currentTime } = this.state
    if (!isRecording) return

    AudioRecorder.stopRecording()
    clearInterval(this.timer)
    this.setState({durationSeconds: currentTime + 1})
    this.setState({ isRecording: false, isFinishRecorded: true, currentTime: 0})
  }

  startPlaying = () => {
    if (this.state.isPaused) {
      AudioPlayer.unpause()      
      this.setState({isPlaying: true, isPaused: false})
      return
    }
    AudioPlayer.play(AUDIO_PATH, { output: 'Phone Speaker' })
    this.setState({isPlaying: true})
  }

  pausePlaying = () => {
    AudioPlayer.pause()
    this.setState({isPaused: true})
  }

  stopPlaying() {
    AudioPlayer.stop()
    this.setState({isPlaying: false})
  }

  renderActionButtons() {
    const { 
      isRecording, 
      isFinishRecorded, 
      isPlaying 
    } = this.state
    const playPauseIcon = isPlaying ? 'pause-circle-o' : 'play-circle-o'
    const playPauseHandler = isPlaying ? this.pausePlaying : this.startPlaying

    return (
      <View style={styles.buttonGroup}>
        <IconButton 
          iconName='stop-circle-o' 
          isDisabled={isFinishRecorded || !isRecording} 
          onPressHandler={this.stopRecording} 
        />
        <IconButton 
          iconName={playPauseIcon}
          isDisabled={!isFinishRecorded || isRecording} 
          onPressHandler={playPauseHandler} 
        />
      </View>
    )
  }

  render() {
    const { isRecording, isFinishRecorded } = this.state
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <RecordButton 
          isRecording={isRecording} 
          isFinishRecorded={isFinishRecorded}
          onPressHandler={this.record} 
        />
        {this.renderActionButtons()}
      </ScrollView>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    marginTop: Constants.marginTop,
    flex: 1,
  },
  content: {
    alignItems: 'center'
  },
  buttonGroup: {
    flex: 1,
    flexDirection: 'row',
  },
})