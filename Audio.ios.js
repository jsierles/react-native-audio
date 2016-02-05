'use strict';

/**
 * This module is a thin layer over the native module. It's aim is to obscure
 * implementation details for registering callbacks, changing settings, etc.
*/

var React, {NativeModules, NativeAppEventEmitter, DeviceEventEmitter} = require('react-native');

var AudioPlayerManager = NativeModules.AudioPlayerManager;
var AudioRecorderManager = NativeModules.AudioRecorderManager;

var AudioPlayer = {
  play: function(path, options) {
    var playbackOptions = null;

    if (!options) {
      playbackOptions = {
        sessionCategory: 'SoloAmbient'
      };
    } else {
      playbackOptions = options;
    }
    AudioPlayerManager.play(path, playbackOptions);
  },
  playWithUrl: function(url, options) {
    var playbackOptions = null;
    if (!options) {
      playbackOptions = {
        sessionCategory: 'SoloAmbient'
      };
    } else {
      playbackOptions = options;
    }
    AudioPlayerManager.playWithUrl(url, playbackOptions);
  },
  pause: function() {
    AudioPlayerManager.pause();
  },
  unpause: function() {
    AudioPlayerManager.unpause();
  },
  stop: function() {
    AudioPlayerManager.stop();
    if (this.subscription) {
      this.subscription.remove();
    }
  },
  setCurrentTime: function(time) {
    AudioPlayerManager.setCurrentTime(time);
  },
  skipToSeconds: function(position) {
    AudioPlayerManager.skipToSeconds(position);
  },
  setProgressSubscription: function() {
    this.progressSubscription = DeviceEventEmitter.addListener('playerProgress',
      (data) => {
        if (this.onProgress) {
          this.onProgress(data);
        }
      }
    );
  },
  setFinishedSubscription: function() {
    this.progressSubscription = DeviceEventEmitter.addListener('playerFinished',
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

    this.progressSubscription = NativeAppEventEmitter.addListener('recordingProgress',
      (data) => {
        if (this.onProgress) {
          this.onProgress(data);
        }
      }
    );

    this.FinishedSubscription = NativeAppEventEmitter.addListener('recordingFinished',
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
    if (this.subscription) {
      this.subscription.remove();
    }
  },
  playRecording: function() {
    AudioRecorderManager.playRecording();
  },
  stopPlaying: function() {
    AudioRecorderManager.stopPlaying();
  }
};

module.exports = {AudioPlayer, AudioRecorder};
