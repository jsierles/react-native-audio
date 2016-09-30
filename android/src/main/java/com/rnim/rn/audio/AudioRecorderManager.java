package com.rnim.rn.audio;

import android.Manifest;
import android.content.Context;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReadableMap;

import java.io.File;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

import android.content.pm.PackageManager;
import android.os.Environment;
import android.media.MediaRecorder;
import android.media.MediaPlayer;
import android.media.AudioManager;
import android.support.v4.app.ActivityCompat;
import android.support.v4.content.ContextCompat;
import android.util.Log;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.io.FileInputStream;

class AudioRecorderManager extends ReactContextBaseJavaModule {
  private static final String DocumentDirectoryPath = "DocumentDirectoryPath";
  private static final String PicturesDirectoryPath = "PicturesDirectoryPath";
  private static final String MainBundlePath = "MainBundlePath";
  private static final String CachesDirectoryPath = "CachesDirectoryPath";
  private static final String LibraryDirectoryPath = "LibraryDirectoryPath";
  private static final String MusicDirectoryPath = "MusicDirectoryPath";
  private static final String DownloadsDirectoryPath = "DownloadsDirectoryPath";
  private Context context;
  private MediaRecorder recorder;
  private String currentOutputFile;
  private boolean isRecording = false;
  private AudioPlayerManager audioPlayerManager;


  public AudioRecorderManager(ReactApplicationContext reactContext) {
    super(reactContext);
    this.context = reactContext;
    this.audioPlayerManager = new AudioPlayerManager(reactContext);
  }

  @Override
  public Map<String, Object> getConstants() {
    Map<String, Object> constants = new HashMap<>();
    constants.put(DocumentDirectoryPath, this.getReactApplicationContext().getFilesDir().getAbsolutePath());
    constants.put(PicturesDirectoryPath, Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES).getAbsolutePath());
    constants.put(MainBundlePath, "");
    constants.put(CachesDirectoryPath, this.getReactApplicationContext().getCacheDir().getAbsolutePath());
    constants.put(LibraryDirectoryPath, "");
    constants.put(MusicDirectoryPath, Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_MUSIC).getAbsolutePath());
    constants.put(DownloadsDirectoryPath, Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS).getAbsolutePath());
    return constants;
  }

  @Override
  public String getName() {
    return "AudioRecorderManager";
  }

  @ReactMethod
  public void checkAuthorizationStatus(Promise promise) {
    int permissionCheck = ContextCompat.checkSelfPermission(getCurrentActivity(),
            Manifest.permission.RECORD_AUDIO);
    boolean permissionGranted = permissionCheck == PackageManager.PERMISSION_GRANTED;
    promise.resolve(permissionGranted);
  }

  @ReactMethod
  public void prepareRecordingAtPath(String recordingPath, ReadableMap recordingSettings, Promise promise) {
    if (isRecording){
      Log.e("INVALID_STATE", "Please call stopRecording before starting recording");
      promise.reject("INVALID_STATE", "Please call stopRecording before starting recording");
    }

    recorder = new MediaRecorder();
    try {
      recorder.setAudioSource(MediaRecorder.AudioSource.MIC);
      int outputFormat = getOutputFormatFromString(recordingSettings.getString("OutputFormat"));
      recorder.setOutputFormat(outputFormat);
      int audioEncoder = getAudioEncoderFromString(recordingSettings.getString("AudioEncoding"));
      recorder.setAudioEncoder(audioEncoder);
      recorder.setAudioSamplingRate(recordingSettings.getInt("SampleRate"));
      recorder.setAudioChannels(recordingSettings.getInt("Channels"));
      recorder.setAudioEncodingBitRate(recordingSettings.getInt("AudioEncodingBitRate"));
      recorder.setOutputFile(recordingPath);
    }
    catch(final Exception e) {
      promise.reject("COULDNT_CONFIGURE_MEDIA_RECORDER" , "Make sure you've added RECORD_AUDIO permission to your AndroidManifest.xml file "+e.getMessage());
      return;
    }

    currentOutputFile = recordingPath;
    try {
      recorder.prepare();
      promise.resolve(currentOutputFile);
    } catch (final Exception e) {
      promise.reject("COULDNT_PREPARE_RECORDING_AT_PATH "+recordingPath, e.getMessage());
    }

  }

  private int getAudioEncoderFromString(String audioEncoder) {
   switch (audioEncoder) {
     case "aac":
       return MediaRecorder.AudioEncoder.AAC;
     case "aac_eld":
       return MediaRecorder.AudioEncoder.AAC_ELD;
     case "amr_nb":
       return MediaRecorder.AudioEncoder.AMR_NB;
     case "amr_wb":
       return MediaRecorder.AudioEncoder.AMR_WB;
     case "he_aac":
       return MediaRecorder.AudioEncoder.HE_AAC;
     case "vorbis":
      return MediaRecorder.AudioEncoder.VORBIS;
     default:
       Log.d("INVALID_AUDIO_ENCODER", "USING MediaRecorder.AudioEncoder.DEFAULT instead of "+audioEncoder+": "+MediaRecorder.AudioEncoder.DEFAULT);
       return MediaRecorder.AudioEncoder.DEFAULT;
   }
  }

  private int getOutputFormatFromString(String outputFormat) {
    switch (outputFormat) {
      case "mpeg_4":
        return MediaRecorder.OutputFormat.MPEG_4;
      case "aac_adts":
        return MediaRecorder.OutputFormat.AAC_ADTS;
      case "amr_nb":
        return MediaRecorder.OutputFormat.AMR_NB;
      case "amr_wb":
        return MediaRecorder.OutputFormat.AMR_WB;
      case "three_gpp":
        return MediaRecorder.OutputFormat.THREE_GPP;
      case "webm":
        return MediaRecorder.OutputFormat.WEBM;
      default:
        Log.d("INVALID_OUPUT_FORMAT", "USING MediaRecorder.OutputFormat.DEFAULT : "+MediaRecorder.OutputFormat.DEFAULT);
        return MediaRecorder.OutputFormat.DEFAULT;

    }
  }

  @ReactMethod
  public void startRecording(Promise promise){
    if (recorder == null){
      Log.e("RECORDING_NOT_PREPARED", "Please call prepareRecordingAtPath before starting recording");
      promise.reject("RECORDING_NOT_PREPARED", "Please call prepareRecordingAtPath before starting recording");
      return;
    }
    if (isRecording){
      Log.e("INVALID_STATE", "Please call stopRecording before starting recording");
      promise.reject("INVALID_STATE", "Please call stopRecording before starting recording");
      return;
    }
    recorder.start();
    isRecording = true;
    promise.resolve(currentOutputFile);
  }

  @ReactMethod
  public void stopRecording(Promise promise){
    if (!isRecording){
      Log.e("INVALID_STATE", "Please call startRecording before stopping recording");
      promise.reject("INVALID_STATE", "Please call startRecording before stopping recording");
      return;
    }
    recorder.stop();
    isRecording = false;
    recorder.release();
    promise.resolve(currentOutputFile);
    sendEvent("recordingFinished", null);
  }

  @ReactMethod
  public void pauseRecording(Promise promise){
    // Added this function to have the same api for android and iOS, stops recording now
    stopRecording(promise);
  }

  @ReactMethod
  public void stopPlaying(Promise promise){
    audioPlayerManager.stop(promise);
  }

  @ReactMethod
  public void pausePlaying(Promise promise){
    audioPlayerManager.pause(promise);
  }

  @ReactMethod
  public void unpausePlaying(Promise promise){
    audioPlayerManager.unpause(promise);
  }

  @ReactMethod
  public void playRecording(final Promise promise) {
    audioPlayerManager.play(currentOutputFile, null, promise);
  }


  private void sendEvent(String eventName, Object params) {
    getReactApplicationContext()
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
            .emit(eventName, params);
  }


}
