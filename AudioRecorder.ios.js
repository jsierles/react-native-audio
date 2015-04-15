'use strict';

var AudioRecorderManager = require('NativeModules').AudioRecorderManager;
var RCTDeviceEventEmitter = require('RCTDeviceEventEmitter');

var AudioRecorder = {
  prepareRecordingAtPath: function(path) {
    AudioRecorderManager.prepareRecordingAtPath(path);
    this.subscription = RCTDeviceEventEmitter.addListener('audioProgress',
      (data) => { 
        if (this.onProgress) {
          this.onProgress(data);
        }
      }
    );
  },
  record: function() {
    AudioRecorderManager.record();    
  },
  pause: function() {
    AudioRecorderManager.record();    
  },
  stop: function() {
    AudioRecorderManager.stop();
    if (this.subscription) {
      this.subscription.remove();
    }
  },
  play: function() {
    AudioRecorderManager.play();
  }
};

module.exports = AudioRecorder;