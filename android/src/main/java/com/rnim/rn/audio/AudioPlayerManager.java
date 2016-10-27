package com.rnim.rn.audio;

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

import android.os.Environment;
import android.media.MediaPlayer;
import android.media.AudioManager;

import android.util.Log;

import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.io.FileInputStream;

class AudioPlayerManager extends ReactContextBaseJavaModule {

  private Context context;
  private MediaPlayer mediaPlayer;
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
    mediaPlayer = null;
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
    promise.resolve(currentFileName);
  }

  @ReactMethod
  public void play(String path, ReadableMap playbackSettings, final Promise promise) {
    if (isPlaying) {
      Log.e("INVALID_STATE", "Please wait for previous playback to finish.");
      promise.reject("INVALID_STATE", "Please set valid path");
      return;
    }
    if (isPaused) {
      unpause(promise);
      return;
    }
    if (path == null) {
      Log.e("INVALID_PATH", "Please set valid path");
      promise.reject("INVALID_PATH", "Please set valid path");
      return;
    }

    mediaPlayer = new MediaPlayer();
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
    mediaPlayer.seekTo(position);
  }

  @ReactMethod
  public void playFromURL(String url, final Promise promise) {
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
      }
    });

    mediaPlayer.start();
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

}
