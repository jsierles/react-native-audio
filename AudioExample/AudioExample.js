import React, { Component } from 'react';

import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  TouchableHighlight,
  Platform,
  PermissionsAndroid
} from 'react-native';

import Sound from 'react-native-sound';
import { AudioRecorder, AudioUtils } from './react-native-audio/';

class AudioExample extends Component {
  state = {
    secondsElapsed: 0,
    isRecording: false,
    filePathOnSystem: '',
    hasRecording: false
  };
  startRecording = async () => {
    this.setState({ isRecording: true });
    const filePath = await AudioRecorder.startRecording({
      recordingPath: `${AudioUtils.DocumentDirectoryPath}/test.aac`,
      recordingOptions: {
        SampleRate: 22050,
        Channels: 1,
        AudioQuality: 'Low',
        AudioEncoding: 'aac',
        AudioEncodingBitRate: 32000
      }
    });
    this.setState({ filePathOnSystem: filePath });
  };
  stopRecording = async () => {
    this.setState({ isRecording: false, hasRecording: true });
    try {
      AudioRecorder.stopRecording();
    } catch (e) {
      alert('ERROR ');
    }
    this.setState({ hasRecording: true });
  };
  playRecording = () => {
    console.warn('playing recording ' + this.state.filePathOnSystem);
    const sound = new Sound(this.state.filePathOnSystem, '', error => {
      if (error) {
        console.log('failed to load the sound', error);
      }
    });
    setTimeout(() => {
      sound.play(success => {
        if (success) {
          console.warn('successfully finished playing');
        } else {
          console.warn('playback failed due to audio decoding errors');
        }
      });
    }, 100);
  };

  render() {
    return (
      <View style={styles.container}>
        <View style={styles.controls}>
          <TouchableHighlight
            title={'RECORD'}
            onPress={
              this.state.isRecording ? this.stopRecording : this.startRecording
            }
          >
            <Text>
              {this.state.isRecording ? 'Stop Recording' : 'Record'}
            </Text>
          </TouchableHighlight>

          <Text style={styles.progressText}>
            {this.state.secondsElapsed}
          </Text>

          {this.state.hasRecording
            ? <TouchableHighlight
                onPress={() => {
                  this.playRecording();
                }}
              >
                <Text>Play Recording</Text>
              </TouchableHighlight>
            : null}
        </View>
      </View>
    );
  }
}

var styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2b608a'
  },
  controls: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1
  },
  progressText: {
    paddingTop: 50,
    fontSize: 50,
    color: '#fff'
  },
  button: {
    padding: 20
  },
  disabledButtonText: {
    color: '#eee'
  },
  buttonText: {
    fontSize: 20,
    color: '#fff'
  },
  activeButtonText: {
    fontSize: 20,
    color: '#B81F00'
  }
});

export default AudioExample;
