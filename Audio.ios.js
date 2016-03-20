'use strict';

/**
 * This module is a thin layer over the native module. Its aim is to obscure
 * implementation details for registering callbacks, changing settings, etc.
*/

import React, {
  NativeModules,
  NativeAppEventEmitter,
  DeviceEventEmitter
} from 'react-native';

const AudioPlayerManager = NativeModules.AudioPlayerManager;
const AudioRecorderManager = NativeModules.AudioRecorderManager;

let AudioPlayer = {
  defaultOptions:  {
    sessionCategory: 'SoloAmbient',
    numberOfLoops: 0
  },
  play(path, options) {
    AudioPlayerManager.play(path, {...this.defaultOptions, ...options});
  },
  playWithUrl(url, options) {
    AudioPlayerManager.playWithUrl(url, {...this.defaultOptions, ...options});
  },
  pause() {
    AudioPlayerManager.pause();
  },
  unpause() {
    AudioPlayerManager.unpause();
  },
  stop() {
    AudioPlayerManager.stop();
  },
  setCurrentTime(time) {
    AudioPlayerManager.setCurrentTime(time);
  },
  skipToSeconds(position) {
    AudioPlayerManager.skipToSeconds(position);
  },
  setProgressSubscription() {
    if (this.progressSubscription) this.progressSubscription.remove();
    this.progressSubscription = DeviceEventEmitter.addListener('playerProgress',
      (data) => {
        if (this.onProgress) {
          this.onProgress(data);
        }
      }
    );
  },
  setFinishedSubscription() {
    if (this.finishedSubscription) this.finishedSubscription.remove();
    this.finishedSubscription = DeviceEventEmitter.addListener('playerFinished',
      (data) => {
        if (this.onFinished) {
          this.onFinished(data);
        }
      }
    );
  },
  getDuration(callback) {
    AudioPlayerManager.getDuration((error, duration) => {
      callback(duration);
    })
  },
  getCurrentTime(callback) {
    AudioPlayerManager.getCurrentTime((error, currentTime) => {
      callback(currentTime);
    })
  },
};

let AudioRecorder = {
  prepareRecordingAtPath(path, options) {
    const defaultOptions = {
      SampleRate: 44100.0,
      Channels: 2,
      AudioQuality: 'High',
      AudioEncoding: 'ima4'
    };
    const recordingOptions = {...defaultOptions, ...options};

    AudioRecorderManager.prepareRecordingAtPath(
      path,
      recordingOptions.SampleRate,
      recordingOptions.Channels,
      recordingOptions.AudioQuality,
      recordingOptions.AudioEncoding
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
  startRecording() {
    AudioRecorderManager.startRecording();
  },
  pauseRecording() {
    AudioRecorderManager.pauseRecording();
  },
  stopRecording() {
    AudioRecorderManager.stopRecording();
  },
  playRecording() {
    AudioRecorderManager.playRecording();
  },
  stopPlaying() {
    AudioRecorderManager.stopPlaying();
  },
  checkAuthorizationStatus: AudioRecorderManager.checkAuthorizationStatus,
  requestAuthorization: AudioRecorderManager.requestAuthorization,
};

let AudioUtils = {
  MainBundlePath: AudioPlayerManager.MainBundlePath,
  CachesDirectoryPath: AudioPlayerManager.NSCachesDirectoryPath,
  DocumentDirectoryPath: AudioPlayerManager.NSDocumentDirectoryPath,
  LibraryDirectoryPath: AudioPlayerManager.NSLibraryDirectoryPath,
};

module.exports = {AudioPlayer, AudioRecorder, AudioUtils};
