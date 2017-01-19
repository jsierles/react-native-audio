import React, { Component } from 'react'
import {
  ScrollView,
  StyleSheet
} from 'react-native'
import { 
  AudioPlayer, 
  AudioRecorder, 
  AudioUtils
} from 'react-native-audio-player-recorder'

import Constants from './Constants'
import RecordButton from './RecordButton'
import ActionButtons from './ActionButtons'
import Outputs from './Outputs'

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
      outputs: [
        {key: 'Phone', active: false}, 
        {key: 'Phone Speaker', active: false}, 
        {key: 'Bluetooth', active: false}, 
        {key: 'Headphones', active: false}
      ],
      selectedOutput: 'Phone Speaker',
      isSliding: false,
    }
    this.timer = null
  }
  
  componentDidMount() {
    this.setCallbacks()
    this.setOutputs()
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
    AudioPlayer.play(AUDIO_PATH, { output: this.state.selectedOutput })
    this.setState({isPlaying: true})
  }

  playViaOutput = (output) => {
    AudioPlayer.play(AUDIO_PATH, { output: output })
    this.setState({isPlaying: true, selectedOutput: output})
  }

  pausePlaying = () => {
    AudioPlayer.pause()
    this.setState({isPaused: true})
  }

  stopPlaying() {
    AudioPlayer.stop()
    this.setState({isPlaying: false})
  }

  render() {
    const { isRecording, isFinishRecorded, isPlaying, outputs } = this.state
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
        <Outputs outputs={outputs} audioExist={isFinishRecorded} onPressHandler={this.playViaOutput} />
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
})