/**
 * Audio Recorder Sample App
 * https://github.com/jsierles/react-native-audiorecorder
 */
'use strict';

var React = require('react-native');
var {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  TouchableHighlight
} = React;

var {AudioRecorder, AudioUtils} = require('react-native-audio');

var AudioExample = React.createClass({

  getInitialState() {
    return {
      currentTime: 0.0,
      recording: false,
      stoppedRecording: false,
      stoppedPlaying: false,
      playing: false,
      finished: false
    }
  },
  componentDidMount() {
    var audioPath = AudioUtils.MainBundlePath + '/test.caf';
    AudioRecorder.prepareRecordingAtPath(audioPath);
    AudioRecorder.onProgress = (data) => {
      this.setState({currentTime: Math.floor(data.currentTime)});
    };
    AudioRecorder.onFinished = (data) => {
      this.setState({finished: data.finished});
      console.log(`Finished recording: ${data.finished}`);
    };
  },

  _renderButton: function(title, onPress, active) {
    var style = (active) ? styles.activeButtonText : styles.buttonText;

    return (<TouchableHighlight style={styles.button} onPress={onPress}>
      <Text style={style}>
        {title}
      </Text>
    </TouchableHighlight>);
  },

  _pause: function() {
    if (this.state.recording)
      AudioRecorder.pauseRecording();
    else if (this.state.playing) {
      AudioRecorder.pausePlaying();
    }
  },

  _stop: function() {
    if (this.state.recording) {
      AudioRecorder.stopRecording();
      this.setState({stoppedRecording: true, recording: false});
    } else if (this.state.playing) {
      AudioRecorder.stopPlaying();
      this.setState({playing: false, stoppedPlaying: true});
    }
  },

  _record: function() {
    AudioRecorder.startRecording();
    this.setState({recording: true, playing: false});
  },

 _play: function() {
    if (this.state.recording) {
      this._stop();
      this.setState({recording: false});
    }
    AudioRecorder.playRecording();
    this.setState({playing: true});
  },

  render: function() {

    return (
      <View style={styles.container}>
        <View style={styles.controls}>
          {this._renderButton("RECORD", () => {this._record()}, this.state.recording )}
          {this._renderButton("STOP", () => {this._stop()} )}
          {this._renderButton("PAUSE", () => {this._pause()} )}
          {this._renderButton("PLAY", () => {this._play()}, this.state.playing )}
          <Text style={styles.progressText}>{this.state.currentTime}s</Text>
        </View>
      </View>
    );
  }
});

var styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#2b608a",
  },
  controls: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  progressText: {
    paddingTop: 50,
    fontSize: 50,
    color: "#fff"
  },
  button: {
    padding: 20
  },
  disabledButtonText: {
    color: '#eee'
  },
  buttonText: {
    fontSize: 20,
    color: "#fff"
  },
  activeButtonText: {
    fontSize: 20,
    color: "#B81F00"
  }

});

AppRegistry.registerComponent('AudioExample', () => AudioExample);
