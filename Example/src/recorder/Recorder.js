import React, { Component } from 'react'
import {
  ScrollView,
  StyleSheet
} from 'react-native'
import { 
  AudioPlayer, 
  AudioRecorder, 
} from 'react-native-audio-player-recorder'
import { Actions } from 'react-native-router-flux'

import RecordButton from './RecordButton'
import ActionButtons from './ActionButtons'
import Button from './Button'
import Constants from '../Constants'

export default class Recorder extends Component {
  constructor(props) {
    super(props)
    this.state = {
      isRecording: false,
      isFinishRecorded: false,
      isPlaying: false,
      isPaused: false,
      currentTime: 0,
      audioLength: 0
    }
    this.timer = null
  }

  prepareRecordingPath(){
    AudioRecorder.prepareRecordingAtPath(Constants.AUDIO_PATH, {
      SampleRate: 22050,
      Channels: 1,
      AudioQuality: 'Low',
      AudioEncoding: 'aac',
      AudioEncodingBitRate: 32000
    })
  }

  record = () => {
    const { isPlaying } = this.state
    if (isPlaying) {
      this.stopPlaying()
    }

    this.prepareRecordingPath()
    AudioRecorder.startRecording()
    this.setState({
      isPlaying: false,
      isRecording: true,
      isFinishRecorded: false,
      audioLength: 0,
      currentTime: 0
    })

    this.timer = setInterval(() => {
      const time = this.state.currentTime + 1
      this.setState({currentTime: time})
      if (time === Constants.MAX_AUDIO_LENGTH) {
        this.stopRecording()
      }
    }, 1000)
  }

  stopRecording = () => {
    const { isRecording } = this.state
    if (!isRecording) return

    AudioRecorder.stopRecording()
    this.setState({audioLength: this.state.currentTime + 1})
    clearInterval(this.timer)
    this.setState({ isRecording: false, isFinishRecorded: true, currentTime: 0})
  }

  startPlaying = () => {
    if (this.state.isPaused) {
      AudioPlayer.unpause()      
      this.setState({isPlaying: true, isPaused: false})
      return
    }
    AudioPlayer.play(Constants.AUDIO_PATH)
    this.setState({isPlaying: true})
  }

  pausePlaying = () => {
    AudioPlayer.pause()
    this.setState({isPaused: true, isPlaying: false})
  }

  stopPlaying() {
    AudioPlayer.stop()
    this.setState({isPlaying: false})
  }

  playAudio = () => {
    Actions.player({durationSeconds: this.state.audioLength})
  }

  render() {
    const { 
      isRecording, 
      isFinishRecorded, 
      isPlaying, 
    } = this.state
    const playPauseIcon = isPlaying ? 'pause-circle-o' : 'play-circle-o'
    const playPauseHandler = isPlaying ? this.pausePlaying : this.startPlaying
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <RecordButton 
          isRecording={isRecording} 
          isFinishRecorded={isFinishRecorded}
          onPressHandler={this.record} 
        />
        <ActionButtons 
          isFinishRecorded={isFinishRecorded} 
          isRecording={isRecording}
          playPauseIcon={playPauseIcon}
          playPauseHandler={playPauseHandler}
          stopRecording={this.stopRecording}
        />
        <Button text='Play' isDisabled={!isFinishRecorded} onPressHandler={this.playAudio} />
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
})