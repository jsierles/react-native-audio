import { NativeAppEventEmitter } from 'react-native';

import AudioRecorderManager from './AudioRecorderManager';
import nativeAppEventNames from './constants/nativeAppEventNames';
import getNativePrepareRecordingAtPathArguments from './getNativePrepareRecordingAtPathArguments';

const nativeEventListeners = {
  recordingProgressSubscription: null,
  recordingFinishedSubscription: null
};

const recordingState = {
  isRecording: false
};

const AudioRecorder = {
  onRecordingProgress: () => null,
  onRecordingFinished: () => null,
  init({ onRecordingProgress, onRecordingFinished }) {
    this.onRecordingProgress = onRecordingProgress;
    this.onRecordingFinished = onRecordingFinished;
  },
  bindNativeEventListeners() {
    this.unbindNativeEventListeners();
    // alert(nativeAppEventNames.recordingProgress);
    nativeEventListeners.recordingProgressSubscription = NativeAppEventEmitter.addListener(
      nativeAppEventNames.recordingProgress,
      () => {
        alert('prog');
      }
      // this.onRecordingProgress
    );
    nativeEventListeners.recordingFinishedSubscription = NativeAppEventEmitter.addListener(
      nativeAppEventNames.recordingFinished,
      this.onRecordingFinished
    );
  },
  unbindNativeEventListeners() {
    if (nativeEventListeners.recordingProgressSubscription !== null) {
      nativeEventListeners.recordingProgressSubscription.remove();
    }
    if (nativeEventListeners.recordingFinishedSubscription !== null) {
      nativeEventListeners.recordingProgressSubscription.remove();
    }
  },
  startRecording({ recordingPath, recordingOptions }) {
    if (!recordingState.isRecording) {
      recordingState.isRecording = true;
      this.bindNativeEventListeners();
      const preparRecordingAtPathArgs = getNativePrepareRecordingAtPathArguments(
        {
          recordingPath,
          recordingOptions: { recordingOptions }
        }
      );
      return AudioRecorderManager.prepareRecordingAtPath(
        ...preparRecordingAtPathArgs
      ).then(() => {
        return AudioRecorderManager.startRecording();
      });
    }
  },
  stopRecording: function() {
    if (recordingState.isRecording) {
      recordingState.isRecording = false;
      this.unbindNativeEventListeners();
      return AudioRecorderManager.stopRecording();
    }
  },
  pauseRecording: function() {
    return AudioRecorderManager.pauseRecording();
  },
  checkAuthorizationStatus: AudioRecorderManager.checkAuthorizationStatus,
  requestAuthorization: AudioRecorderManager.requestAuthorization,
  removeListeners: function() {
    if (this.progressSubscription) this.progressSubscription.remove();
    if (this.finishedSubscription) this.finishedSubscription.remove();
  }
};

export default AudioRecorder;
