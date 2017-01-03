package com.rnim.rn.audio;

import android.content.Context;

import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;

import java.io.File;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

import android.os.Environment;
import android.media.MediaPlayer;
import android.media.AudioManager;

import android.util.Log;

import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.io.FileInputStream;
import java.util.Timer;
import java.util.TimerTask;

class AudioPlayerManager extends ReactContextBaseJavaModule {

  private Context context;
  private MediaPlayer mediaPlayer;
  private Timer timer;
  private String currentFileName;
  private int currentPosition;
  private boolean isPlaying = false;
  private boolean isPaused = false;
  private static final String DocumentDirectoryPath = "DocumentDirectoryPath";
  private static final String PicturesDirectoryPath = "PicturesDirectoryPath";
  private static final String MainBundlePath = "MainBundlePath";
  private static final String CachesDirectoryPath = "CachesDirectoryPath";
  private static final String LibraryDirectoryPath = "LibraryDirectoryPath";
  private static final String MusicDirectoryPath = "MusicDirectoryPath";
  private static final String DownloadsDirectoryPath = "DownloadsDirectoryPath";

  private static final String OUTPUT_PHONE = "Phone";
  private static final String OUTPUT_PHONE_SPAKER = "Phone Speaker";
  private static final String OUTPUT_BLUETOOTH = "Bluetooth";
  private static final String OUTPUT_HEADPHONES = "Headphones";


  public AudioPlayerManager(ReactApplicationContext reactContext) {
    super(reactContext);
    this.context = reactContext;
  }


  @Override
  public String getName() {
    return "AudioPlayerManager";
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


  @ReactMethod
  public void getDurationFromPath(String path, Promise promise ) {
    if (path == null) {
      Log.e("PATH_NOT_SET", "Please add path");
      promise.reject("PATH_NOT_SET", "Please add path");
      return;
    }
    boolean mediaPlayerReady = preparePlaybackAtPath("local", path, promise);
    if (!mediaPlayerReady){
      return;
    }
    promise.resolve(mediaPlayer.getDuration());
  }

  @ReactMethod
  public void getDuration(Promise promise) {
    if (mediaPlayer == null) {
      Log.e("PLAYER_NOT_PREPARED", "Please call startPlaying before stopping playback");
      promise.reject("PLAYER_NOT_PREPARED", "Please call startPlaying before stopping playback");
      return;
    }
    promise.resolve(mediaPlayer.getDuration());
  }

  @ReactMethod
  public void getOutputs(Callback callback) {
    WritableArray outputsArray = Arguments.createArray();

    AudioManager audioManager = (AudioManager)context.getSystemService(Context.AUDIO_SERVICE);
    if (audioManager.isWiredHeadsetOn()) {
      outputsArray.pushString(AudioPlayerManager.OUTPUT_HEADPHONES);
    } else if (audioManager.isBluetoothA2dpOn() || audioManager.isBluetoothScoOn()) {
      outputsArray.pushString(AudioPlayerManager.OUTPUT_PHONE);
      outputsArray.pushString(AudioPlayerManager.OUTPUT_PHONE_SPAKER);
      outputsArray.pushString(AudioPlayerManager.OUTPUT_BLUETOOTH);
    } else {
      outputsArray.pushString(AudioPlayerManager.OUTPUT_PHONE);
      outputsArray.pushString(AudioPlayerManager.OUTPUT_PHONE_SPAKER);
    }
    callback.invoke(outputsArray);
  }

  @ReactMethod
  public void stop(Promise promise) {
    if (!isPlaying) {
      Log.e("INVALID_STATE", "Please call play or playWithURL before stopping playback");
      promise.reject("INVALID_STATE", "Please call play or playWithURL before stopping playback");
      return;
    }
    mediaPlayer.stop();
    mediaPlayer.release();
    isPlaying = false;
    isPaused = false;
    stopTimer();
    promise.resolve(currentFileName);
  }

  @ReactMethod
  public void pause(Promise promise) {
    if (!isPlaying) {
      Log.e("INVALID_STATE", "Please call play or playWithURL before pausing playback");
      promise.reject("INVALID_STATE", "Please call play or playWithURL before pausing playback");
      return;
    }

    mediaPlayer.pause();
    currentPosition = mediaPlayer.getCurrentPosition();
    isPaused = true;
    isPlaying = false;
    stopTimer();
    promise.resolve(currentFileName);
  }

  @ReactMethod
  public void unpause(Promise promise) {
    if (!isPaused) {
      Log.e("INVALID_STATE", "Please call pause before unpausing playback");
      promise.reject("INVALID_STATE", "Please call pause before unpausing playback");
      return;
    }
    mediaPlayer.seekTo(currentPosition);
    mediaPlayer.start();
    isPaused = false;
    isPlaying = true;
    startTimer();
    promise.resolve(currentFileName);
  }

  @ReactMethod
  public void play(String path, ReadableMap playbackSettings, final Promise promise) {
    if (path == null) {
      Log.e("INVALID_PATH", "Please set valid path");
      promise.reject("INVALID_PATH", "Please set valid path");
      return;
    }
    if (isPlaying) {
      /* Comment by Grace Han 2016-12-23
         Can not replace the code below to stop(promise)
         In stop(promise) method, it will resolve the promise,
         and then when the audio complete playing, it will resolve the same promise again!
         Reject same promise twice will lead to error: ...only one callback may be registered to a function in a native module
         Same issue refers to: https://github.com/facebook/react-native/issues/7522
      */
      mediaPlayer.stop();
      mediaPlayer.release();
      isPlaying = false;
      isPaused = false;
      stopTimer();
    }
    mediaPlayer = new MediaPlayer();
    mediaPlayer.setAudioStreamType(AudioManager.STREAM_MUSIC);
    setAudioOutput(playbackSettings);
    playMedia("local", path, promise);
    isPlaying = true;
    isPaused = false;
    return;
  }

  @ReactMethod
  public void setCurrentTime(int position, final Promise promise) {
    Log.d("NOT_SUPPORTED","Not supported in android using skipToSeconds method");
    skipToSeconds(position, promise);
  }

  @ReactMethod
  public void skipToSeconds(int position, final Promise promise) {
    if (mediaPlayer == null) {
      Log.e("INVALID_STATE", "No playback");
      promise.reject("INVALID_STATE", "No playback");
      return;
    }
    mediaPlayer.seekTo(position*1000);
  }

  @ReactMethod
  public void playWithUrl(String url, ReadableMap playbackOptions, final Promise promise) {
    if (isPlaying) {
      Log.e("INVALID_STATE", "Please wait for previous playback to finish.");
      promise.reject("INVALID_STATE", "Please set valid path");
      return;
    }
    if (isPaused) {
      unpause(promise);
      return;
    }
    playMedia("remote", url, promise);
    sendEvent("playerFinished", null);
    isPlaying = true;
    isPaused = false;
    return;
  }

  private void playMedia(String type, final String path, final Promise promise) {
    boolean playbackReady = preparePlaybackAtPath(type, path, promise);
    if (!playbackReady) {
      return;
    }

    mediaPlayer.setOnCompletionListener(new MediaPlayer.OnCompletionListener() {
      public void onCompletion(MediaPlayer mp) {
        promise.resolve(path);
        mediaPlayer.stop();
        mediaPlayer.release();
        mediaPlayer = null;
        isPlaying = false;
        isPaused = false;
        sendEvent("playerFinished", null);
        stopTimer();
      }
    });
    mediaPlayer.start();
    startTimer();
  }

  private void startTimer()
  {
    timer = new Timer();
    TimerTask task = new TimerTask() {
      @Override
      public void run() {
        if (mediaPlayer != null && isPlaying) {
          WritableMap map = Arguments.createMap();
          map.putDouble("currentTime", mediaPlayer.getCurrentPosition()/1000.0);
          sendEvent("playerProgress", map);
        }
      }
    };
    timer.schedule(task, 0, 250);
  }

  private void stopTimer()
  {
    if(timer != null)
    {
      timer.cancel();
      timer.purge();
    }
  }

  private boolean preparePlaybackAtPath(String pathType, String path, Promise promise) {
    if (mediaPlayer == null) {
      mediaPlayer = new MediaPlayer();
    } else {
      mediaPlayer.reset();
    }

    mediaPlayer.setAudioStreamType(AudioManager.STREAM_MUSIC);
    try {
      if (pathType == "local") {
        FileInputStream fis = new FileInputStream(new File(path));
        mediaPlayer.setDataSource(fis.getFD());
      } else if (pathType == "remote") {
        mediaPlayer.setDataSource(path);
      }

    } catch (IllegalArgumentException e) {
      promise.reject("COULDNT_PREPARE_MEDIAPLAYER", e.getMessage());
      e.printStackTrace();
    } catch (SecurityException e) {
      promise.reject("COULDNT_PREPARE_MEDIAPLAYER", e.getMessage());
      e.printStackTrace();
    } catch (IllegalStateException e) {
      promise.reject("COULDNT_PREPARE_MEDIAPLAYER", e.getMessage());
    } catch (IOException e) {
      promise.reject("COULDNT_PREPARE_MEDIAPLAYER", e.getMessage());
      e.printStackTrace();
    }
    try {
      mediaPlayer.prepare();
      return true;

    } catch (IllegalStateException e) {
      promise.reject("COULDNT_PREPARE_MEDIAPLAYER", e.getMessage());
      e.printStackTrace();
    } catch (IOException e) {
      promise.reject("COULDNT_PREPARE_MEDIAPLAYER", e.getMessage());
      e.printStackTrace();
    }
    return false;
  }

  private void sendEvent(String eventName, Object params) {
    getReactApplicationContext()
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
            .emit(eventName, params);
  }

  private void setAudioOutput(ReadableMap playbackSettings)
  {
    if(playbackSettings != null && playbackSettings.hasKey("output"))
    {
      String audioPort = playbackSettings.getString("output");
      AudioManager audioManager = (AudioManager)context.getSystemService(Context.AUDIO_SERVICE);
      switch (audioPort){
        case AudioPlayerManager.OUTPUT_BLUETOOTH:
          audioManager.setMode(AudioManager.MODE_IN_COMMUNICATION);
          audioManager.startBluetoothSco();
          audioManager.setBluetoothScoOn(true);
          break;
        case AudioPlayerManager.OUTPUT_PHONE_SPAKER:
          if (audioManager.isBluetoothScoOn() || audioManager.isBluetoothA2dpOn()) {
            audioManager.setMode(AudioManager.MODE_IN_CALL);
          } else {
            audioManager.setMode(AudioManager.MODE_NORMAL);
          }
          audioManager.stopBluetoothSco();
          audioManager.setBluetoothScoOn(false);
          audioManager.setSpeakerphoneOn(true);
          break;
        case AudioPlayerManager.OUTPUT_PHONE:
          audioManager.setMode(AudioManager.MODE_IN_CALL);
          //break;
        case "None":
          audioManager.setMode(AudioManager.MODE_IN_COMMUNICATION);
          audioManager.stopBluetoothSco();
          audioManager.setSpeakerphoneOn(false);
          audioManager.setBluetoothScoOn(false);
          break;
        default:
          //audioManager.setSpeakerphoneOn(true);
          break;
      }
    }
  }
}
