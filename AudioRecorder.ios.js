'use strict';

/**
 * @providesModule AudioRecorder
 *
 *
 * This module is a thin layer over the native module. It's aim is to obscure
 * implementation details for registering callbacks, changing recording settings, etc.
*/

var AudioRecorderManager = require('NativeModules').AudioRecorderManager;
var RCTDeviceEventEmitter = require('RCTDeviceEventEmitter');

var AudioRecorder = {
  prepareRecordingAtPath: function(path) {
    AudioRecorderManager.prepareRecordingAtPath(path);
    this.subscription = RCTDeviceEventEmitter.addListener('recordingProgress',
      (data) => { 
        if (this.onProgress) {
          this.onProgress(data);
        }
      }
    );

    this.subscription = RCTDeviceEventEmitter.addListener('recordingFinished',
      (data) => { 
        if (this.onFinished) {
          this.onFinished(data);
        }
      }
    );
  },
  record: function() {
    AudioRecorderManager.record();    
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
  }
};

module.exports = AudioRecorder;