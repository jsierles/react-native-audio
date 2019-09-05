"use strict";

import React from "react";

import ReactNative, {
  NativeModules,
  NativeEventEmitter,
  NativeAppEventEmitter,
  DeviceEventEmitter,
  PermissionsAndroid,
  Platform
} from "react-native";

const AudioRecorderManager = NativeModules.AudioRecorderManager;
const AudioRecorderManagerEmitter = new NativeEventEmitter(
  AudioRecorderManager
);

var AudioRecorder = {
  prepareRecordingAtPath: function(path, options) {
    if (this.progressSubscription) this.progressSubscription.remove();
    this.progressSubscription = AudioRecorderManagerEmitter.addListener(
      "recordingProgress",
      data => {
        if (this.onProgress) {
          this.onProgress(data);
        }
      }
    );

    if (this.finishedSubscription) this.finishedSubscription.remove();
    this.finishedSubscription = AudioRecorderManagerEmitter.addListener(
      "recordingFinished",
      data => {
        if (this.onFinished) {
          this.onFinished(data);
        }
      }
    );

    var defaultOptions = {
      SampleRate: 44100.0,
      Channels: 2,
      AudioQuality: "High",
      AudioEncoding: "ima4",
      OutputFormat: "mpeg_4",
      MeteringEnabled: false,
      MeasurementMode: false,
      AudioEncodingBitRate: 32000,
      IncludeBase64: false,
      AudioSource: 0,
      ShouldResume: true
    };

    var recordingOptions = { ...defaultOptions, ...options };

    if (Platform.OS === "ios") {
      AudioRecorderManager.prepareRecordingAtPath(
        path,
        recordingOptions.SampleRate,
        recordingOptions.Channels,
        AudioRecorderManager.iOSAudioQuality[recordingOptions.AudioQuality],
        AudioRecorderManager.iOSAudioEncoding[recordingOptions.AudioEncoding],
        recordingOptions.MeteringEnabled,
        recordingOptions.ShouldResume
      );
    } else {
      return AudioRecorderManager.prepareRecordingAtPath(
        path,
        recordingOptions
      );
    }
  },
  startRecording: function() {
    return AudioRecorderManager.startRecording();
  },
  pauseRecording: function() {
    return AudioRecorderManager.pauseRecording();
  },
  resumeRecording: function() {
    return AudioRecorderManager.resumeRecording();
  },
  stopRecording: function() {
    return AudioRecorderManager.stopRecording();
  },
  checkAuthorizationStatus: AudioRecorderManager.checkAuthorizationStatus,
  requestAuthorization: () => {
    if (Platform.OS === "ios")
      return AudioRecorderManager.requestAuthorization();
    else
      return new Promise((resolve, reject) => {
        PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
        ).then(result => {
          if (result == PermissionsAndroid.RESULTS.GRANTED || result == true)
            resolve(true);
          else resolve(false);
        });
      });
  },
  removeListeners: function() {
    if (this.progressSubscription) this.progressSubscription.remove();
    if (this.finishedSubscription) this.finishedSubscription.remove();
  }
};

let AudioUtils = {};
let AudioSource = {};

if (Platform.OS === "ios") {
  AudioUtils = {
    MainBundlePath: AudioRecorderManager.MainBundlePath,
    CachesDirectoryPath: AudioRecorderManager.NSCachesDirectoryPath,
    DocumentDirectoryPath: AudioRecorderManager.NSDocumentDirectoryPath,
    LibraryDirectoryPath: AudioRecorderManager.NSLibraryDirectoryPath
  };
} else if (Platform.OS === "android") {
  AudioUtils = {
    MainBundlePath: AudioRecorderManager.MainBundlePath,
    CachesDirectoryPath: AudioRecorderManager.CachesDirectoryPath,
    DocumentDirectoryPath: AudioRecorderManager.DocumentDirectoryPath,
    LibraryDirectoryPath: AudioRecorderManager.LibraryDirectoryPath,
    PicturesDirectoryPath: AudioRecorderManager.PicturesDirectoryPath,
    MusicDirectoryPath: AudioRecorderManager.MusicDirectoryPath,
    DownloadsDirectoryPath: AudioRecorderManager.DownloadsDirectoryPath
  };
  AudioSource = {
    DEFAULT: 0,
    MIC: 1,
    VOICE_UPLINK: 2,
    VOICE_DOWNLINK: 3,
    VOICE_CALL: 4,
    CAMCORDER: 5,
    VOICE_RECOGNITION: 6,
    VOICE_COMMUNICATION: 7,
    REMOTE_SUBMIX: 8, // added in API 19
    UNPROCESSED: 9 // added in API 24
  };
}

module.exports = { AudioRecorder, AudioUtils, AudioSource };
