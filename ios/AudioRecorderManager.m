//
//  AudioRecorderManager.m
//  AudioRecorderManager
//
//  Created by Joshua Sierles on 15/04/15.
//  Copyright (c) 2015 Joshua Sierles. All rights reserved.
//

#import "AudioRecorderManager.h"
#import <React/RCTConvert.h>
#import <React/RCTBridge.h>
#import <React/RCTUtils.h>
#import <React/RCTEventDispatcher.h>
#import <AVFoundation/AVFoundation.h>

NSString *const AudioRecorderEventProgress = @"recordingProgress";
NSString *const AudioRecorderEventFinished = @"recordingFinished";

@implementation AudioRecorderManager {

  AVAudioRecorder *_audioRecorder;

  NSTimeInterval _currentTime;
  id _progressUpdateTimer;
  int _progressUpdateInterval;
  NSDate *_prevProgressUpdateTime;
  NSURL *_audioFileURL;
  NSNumber *_audioQuality;
  NSNumber *_audioEncoding;
  NSNumber *_audioChannels;
  NSNumber *_audioSampleRate;
  AVAudioSession *_recordSession;
  BOOL _meteringEnabled;
  BOOL _measurementMode;
}

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE();

- (void)sendProgressUpdate {
  if (_audioRecorder && _audioRecorder.recording) {
    _currentTime = _audioRecorder.currentTime;
  } else {
    return;
  }

  if (_prevProgressUpdateTime == nil ||
   (([_prevProgressUpdateTime timeIntervalSinceNow] * -1000.0) >= _progressUpdateInterval)) {
      NSMutableDictionary *body = [[NSMutableDictionary alloc] init];
      [body setObject:[NSNumber numberWithFloat:_currentTime] forKey:@"currentTime"];
      if (_meteringEnabled) {
          [_audioRecorder updateMeters];
          float _currentMetering = [_audioRecorder averagePowerForChannel: 0];
          [body setObject:[NSNumber numberWithFloat:_currentMetering] forKey:@"currentMetering"];
      }

      [self.bridge.eventDispatcher sendAppEventWithName:AudioRecorderEventProgress body:body];

    _prevProgressUpdateTime = [NSDate date];
  }
}

- (void)stopProgressTimer {
  [_progressUpdateTimer invalidate];
}

- (void)startProgressTimer {
  _progressUpdateInterval = 250;
  _prevProgressUpdateTime = nil;

  [self stopProgressTimer];

  _progressUpdateTimer = [CADisplayLink displayLinkWithTarget:self selector:@selector(sendProgressUpdate)];
  [_progressUpdateTimer addToRunLoop:[NSRunLoop mainRunLoop] forMode:NSDefaultRunLoopMode];
}

- (void)audioRecorderDidFinishRecording:(AVAudioRecorder *)recorder successfully:(BOOL)flag {
  [self.bridge.eventDispatcher sendAppEventWithName:AudioRecorderEventFinished body:@{
      @"status": flag ? @"OK" : @"ERROR",
      @"audioFileURL": [_audioFileURL absoluteString]
    }];
}

- (NSString *) applicationDocumentsDirectory
{
  NSArray *paths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES);
  NSString *basePath = ([paths count] > 0) ? [paths objectAtIndex:0] : nil;
  return basePath;
}

RCT_EXPORT_METHOD(prepareRecordingAtPath:(NSString *)path sampleRate:(float)sampleRate channels:(nonnull NSNumber *)channels quality:(NSString *)quality encoding:(NSString *)encoding meteringEnabled:(BOOL)meteringEnabled measurementMode:(BOOL)measurementMode preferredInput:(NSString *)preferredInput)
{
  _prevProgressUpdateTime = nil;
  [self stopProgressTimer];

  _audioFileURL = [NSURL fileURLWithPath:path];

  // Default options
  _audioQuality = [NSNumber numberWithInt:AVAudioQualityHigh];
  _audioEncoding = [NSNumber numberWithInt:kAudioFormatAppleIMA4];
  _audioChannels = [NSNumber numberWithInt:2];
  _audioSampleRate = [NSNumber numberWithFloat:44100.0];
  _meteringEnabled = NO;

  // Set audio quality from options
  if (quality != nil) {
    if ([quality  isEqual: @"Low"]) {
      _audioQuality =[NSNumber numberWithInt:AVAudioQualityLow];
    } else if ([quality  isEqual: @"Medium"]) {
      _audioQuality =[NSNumber numberWithInt:AVAudioQualityMedium];
    } else if ([quality  isEqual: @"High"]) {
      _audioQuality =[NSNumber numberWithInt:AVAudioQualityHigh];
    }
  }

  // Set channels from options
  if (channels != nil) {
    _audioChannels = channels;
  }

  // Set audio encoding from options
  if (encoding != nil) {
    if ([encoding  isEqual: @"lpcm"]) {
      _audioEncoding =[NSNumber numberWithInt:kAudioFormatLinearPCM];
    } else if ([encoding  isEqual: @"ima4"]) {
      _audioEncoding =[NSNumber numberWithInt:kAudioFormatAppleIMA4];
    } else if ([encoding  isEqual: @"aac"]) {
      _audioEncoding =[NSNumber numberWithInt:kAudioFormatMPEG4AAC];
    } else if ([encoding  isEqual: @"MAC3"]) {
      _audioEncoding =[NSNumber numberWithInt:kAudioFormatMACE3];
    } else if ([encoding  isEqual: @"MAC6"]) {
      _audioEncoding =[NSNumber numberWithInt:kAudioFormatMACE6];
    } else if ([encoding  isEqual: @"ulaw"]) {
      _audioEncoding =[NSNumber numberWithInt:kAudioFormatULaw];
    } else if ([encoding  isEqual: @"alaw"]) {
      _audioEncoding =[NSNumber numberWithInt:kAudioFormatALaw];
    } else if ([encoding  isEqual: @"mp1"]) {
      _audioEncoding =[NSNumber numberWithInt:kAudioFormatMPEGLayer1];
    } else if ([encoding  isEqual: @"mp2"]) {
      _audioEncoding =[NSNumber numberWithInt:kAudioFormatMPEGLayer2];
    } else if ([encoding  isEqual: @"alac"]) {
      _audioEncoding =[NSNumber numberWithInt:kAudioFormatAppleLossless];
    } else if ([encoding  isEqual: @"amr"]) {
      _audioEncoding =[NSNumber numberWithInt:kAudioFormatAMR];
    }
  }

  // Set sample rate from options
  _audioSampleRate = [NSNumber numberWithFloat:sampleRate];

  NSDictionary *recordSettings = [NSDictionary dictionaryWithObjectsAndKeys:
          _audioQuality, AVEncoderAudioQualityKey,
          _audioEncoding, AVFormatIDKey,
          _audioChannels, AVNumberOfChannelsKey,
          _audioSampleRate, AVSampleRateKey,
          nil];

  // Enable metering from options
  if (meteringEnabled != NO) {
    _meteringEnabled = meteringEnabled;
  }

  // Measurement mode to disable mic auto gain and high pass filters
  if (measurementMode != NO) {
    _measurementMode = measurementMode;
  }

  NSError *error = nil;

  _recordSession = [AVAudioSession sharedInstance];

    
  if (preferredInput) {
    for (AVAudioSessionPortDescription *desc in [_recordSession availableInputs]) {
      if ([preferredInput isEqualToString:desc.UID]) {
        [_recordSession setPreferredInput:desc error:nil];
      }
    }
  }

  if (_measurementMode) {
      [_recordSession setCategory:AVAudioSessionCategoryRecord error:nil];
      [_recordSession setMode:AVAudioSessionModeMeasurement error:nil];
  }else{
      [_recordSession setCategory:AVAudioSessionCategoryMultiRoute error:nil];
  }

  _audioRecorder = [[AVAudioRecorder alloc]
                initWithURL:_audioFileURL
                settings:recordSettings
                error:&error];

  _audioRecorder.meteringEnabled = _meteringEnabled;
  _audioRecorder.delegate = self;

  if (error) {
      NSLog(@"error: %@", [error localizedDescription]);
      // TODO: dispatch error over the bridge
    } else {
      [_audioRecorder prepareToRecord];
  }
}

RCT_EXPORT_METHOD(startRecording)
{
  if (!_audioRecorder.recording) {
    [self startProgressTimer];
    [_recordSession setActive:YES error:nil];
    [_audioRecorder record];

  }
}

RCT_EXPORT_METHOD(stopRecording)
{
  [_audioRecorder stop];
  [_recordSession setCategory:AVAudioSessionCategoryPlayback error:nil];
  _prevProgressUpdateTime = nil;
}

RCT_EXPORT_METHOD(pauseRecording)
{
  if (_audioRecorder.recording) {
    [self stopProgressTimer];
    [_audioRecorder pause];
  }
}

RCT_EXPORT_METHOD(checkAuthorizationStatus:(RCTPromiseResolveBlock)resolve reject:(__unused RCTPromiseRejectBlock)reject)
{
  AVAudioSessionRecordPermission permissionStatus = [[AVAudioSession sharedInstance] recordPermission];
  switch (permissionStatus) {
    case AVAudioSessionRecordPermissionUndetermined:
      resolve(@("undetermined"));
    break;
    case AVAudioSessionRecordPermissionDenied:
      resolve(@("denied"));
      break;
    case AVAudioSessionRecordPermissionGranted:
      resolve(@("granted"));
      break;
    default:
      reject(RCTErrorUnspecified, nil, RCTErrorWithMessage(@("Error checking device authorization status.")));
      break;
  }
}

RCT_EXPORT_METHOD(requestAuthorization:(RCTPromiseResolveBlock)resolve
                  rejecter:(__unused RCTPromiseRejectBlock)reject)
{
  [[AVAudioSession sharedInstance] requestRecordPermission:^(BOOL granted) {
    if(granted) {
      resolve(@YES);
    } else {
      resolve(@NO);
    }
  }];
}

RCT_EXPORT_METHOD(getAvailableInputs:(RCTPromiseResolveBlock)resolve
                  rejecter:(__unused RCTPromiseRejectBlock)reject)
{
    NSDictionary *const AudioRecorderPortTypes = [[NSDictionary alloc] initWithObjectsAndKeys:@"builtInMic",AVAudioSessionPortBuiltInMic,@"bluetoothHFP",AVAudioSessionPortBluetoothHFP,@"bluetoothA2DP",AVAudioSessionPortBluetoothA2DP,@"bluetoothLE",AVAudioSessionPortBluetoothLE,@"lineIn",AVAudioSessionPortLineIn,@"airPlay",AVAudioSessionPortAirPlay,@"carAudio",AVAudioSessionPortCarAudio,@"USBAudio",AVAudioSessionPortUSBAudio,@"headsetMic",AVAudioSessionPortHeadsetMic,@"builtInReceiver",AVAudioSessionPortBuiltInReceiver, nil];
    
    // Enable bluetooth
    [[AVAudioSession sharedInstance] setCategory:AVAudioSessionCategoryRecord withOptions:kAudioSessionProperty_OverrideCategoryEnableBluetoothInput error:nil];
    
    NSArray<AVAudioSessionPortDescription *> *availableInputs = [[AVAudioSession sharedInstance] availableInputs];
    
    NSMutableArray *result = [NSMutableArray array];
    
    for (AVAudioSessionPortDescription *desc in availableInputs) {
        [result addObject:@{
            @"id": desc.UID,
            @"type": AudioRecorderPortTypes[desc.portType],
            @"name": desc.portName
        }];
    }

    resolve(result);
}

- (NSString *)getPathForDirectory:(int)directory
{
  NSArray *paths = NSSearchPathForDirectoriesInDomains(directory, NSUserDomainMask, YES);
  return [paths firstObject];
}

- (NSDictionary *)constantsToExport
{
  return @{
    @"MainBundlePath": [[NSBundle mainBundle] bundlePath],
    @"NSCachesDirectoryPath": [self getPathForDirectory:NSCachesDirectory],
    @"NSDocumentDirectoryPath": [self getPathForDirectory:NSDocumentDirectory],
    @"NSLibraryDirectoryPath": [self getPathForDirectory:NSLibraryDirectory]
  };
}

@end
