'use strict';

/**
 * This module is a thin layer over the native module. It's aim is to obscure
 * implementation details for registering callbacks, changing settings, etc.
*/

var React, {NativeModules, NativeAppEventEmitter, DeviceEventEmitter} = require('react-native');

var AudioPlayerManager = NativeModules.AudioPlayerManager;
var AudioRecorderManager = NativeModules.AudioRecorderManager;

var AudioPlayer = {
  play: function(path) {
    AudioPlayerManager.play(path);
  },
  playWithUrl: function(url) {
    AudioPlayerManager.playWithUrl(url);
  },
  pause: function() {
    AudioPlayerManager.pause();
  },
  unpause: function() {
    AudioPlayerManager.unpause();
  },
  stop: function() {
    AudioPlayerManager.stop();
  },
  setCurrentTime: function(time) {
    AudioPlayerManager.setCurrentTime(time);
  },
  skipToSeconds: function(position) {
    AudioPlayerManager.skipToSeconds(position);
  },
  setProgressSubscription: function() {
    if (this.progressSubscription) this.progressSubscription.remove();
    this.progressSubscription = DeviceEventEmitter.addListener('playerProgress',
      (data) => {
        if (this.onProgress) {
          this.onProgress(data);
        }
      }
    );
  },
  setFinishedSubscription: function() {
    if (this.finishedSubscription) this.finishedSubscription.remove();
    this.finishedSubscription = DeviceEventEmitter.addListener('playerFinished',
      (data) => {
        if (this.onFinished) {
          this.onFinished(data);
        }
      }
    );
  },
  getDuration: function(callback) {
    AudioPlayerManager.getDuration((error, duration) => {
      callback(duration);
    })
  },
  getCurrentTime: function(callback) {
    AudioPlayerManager.getCurrentTime((error, currentTime) => {
      callback(currentTime);
    })
  },
};

var AudioRecorder = {
  prepareRecordingAtPath: function(path, options) {

    var recordingOptions = null;

    if (!options) {
      recordingOptions = {
        SampleRate: 44100.0,
        Channels: 2,
        AudioQuality: 'High'
      };
    } else {
      recordingOptions = options;
    }

    AudioRecorderManager.prepareRecordingAtPath(
      path,
      recordingOptions.SampleRate,
      recordingOptions.Channels,
      recordingOptions.AudioQuality
    );

    if (this.progressSubscription) this.progressSubscription.remove();
    this.progressSubscription = NativeAppEventEmitter.addListener('recordingProgress',
      (data) => {
        if (this.onProgress) {
          this.onProgress(data);
        }
      }
    );

    if (this.finishedSubscription) this.finishedSubscription.remove();
    this.finishedSubscription = NativeAppEventEmitter.addListener('recordingFinished',
      (data) => {
        if (this.onFinished) {
          this.onFinished(data);
        }
      }
    );
  },
  startRecording: function() {
    AudioRecorderManager.startRecording();
  },
  pauseRecording: function() {
    AudioRecorderManager.pauseRecording();
  },
  stopRecording: function() {
    AudioRecorderManager.stopRecording();
  },
  playRecording: function() {
    AudioRecorderManager.playRecording();
  },
  stopPlaying: function() {
    AudioRecorderManager.stopPlaying();
  },
  checkAuthorizationStatus: AudioRecorderManager.checkAuthorizationStatus,
  requestAuthorization: function() {
    AudioRecorderManager.requestAuthorization();
  },
};

module.exports = {AudioPlayer, AudioRecorder};
