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

@implementation AudioRecorderManager {

  AVAudioSession *recordSession;
  AVAudioRecorder *audioRecorder;

  BOOL hasProgressListener;
  BOOL meteringEnabled;
  BOOL shouldResume;

  NSURL *audioFileURL;
  NSTimer *progressTimer;
}

RCT_EXPORT_MODULE();

+ (BOOL)requiresMainQueueSetup {
  return YES;
}

- (void)progressTick {
  if (!hasProgressListener) {
    return;
  }

  NSMutableDictionary *body = [[NSMutableDictionary alloc] init];
  [body setValue:audioRecorder.currentTime forKey:@"currentTime"]

  if(audioRecorder.meteringEnabled){
    [audioRecorder updateMeters];
    [body setValue:[_audioRecorder averagePowerForChannel: 0] forKey:@"currentMetering"]
    [body setValue:[_audioRecorder peakPowerForChannel: 0] forKey:@"currentPeakMetering"]
  }

  [self sendEventWithName:@"recordingProgress" body];
}

- (void)audioRecorderDidFinishRecording:(AVAudioRecorder *)recorder successfully:(BOOL)flag {
  
  uint64_t audioFileSize = [[[NSFileManager defaultManager] attributesOfItemAtPath:[_audioFileURL path] error:nil] fileSize];
  
  [self sendEventWithName:@"recordingFinished" body:@{
    @"duration":@(_audioRecorder.currentTime),
    @"status": flag ? @"OK" : @"ERROR",
    @"audioFileURL": [_audioFileURL absoluteString],
    @"audioFileSize": @(audioFileSize)
  }];
    
  // resume any other audio services that might be waiting for priority
  NSError *error;
  [[AVAudioSession sharedInstance] setActive:NO
                                   withOptions:AVAudioSessionSetActiveOptionNotifyOthersOnDeactivation
                                   error:&error];
  
  if (error) {
    NSLog(@"error: %@", [error localizedDescription]);
  }
}

- (void)audioRecorderEncodeErrorDidOccur:(AVAudioRecorder *)recorder error:(NSError *)error {
  if (error) {
    // TODO: dispatch error over the bridge
    NSLog(@"error: %@", [error localizedDescription]);
  }
}

- (void)audioSessionInterruptionNotification:(NSNotification*)notification {
  if(notification.userInfo[AVAudioSessionInterruptionTypeKey] == AVAudioSessionInterruptionTypeBegan){
    [self sendEventWithName:@"recordingInterruptionBegan" body:@{}]
    if(shouldResume){
      [self pauseRecording]
    }else{
      [self stopRecording]
    }
  }else{
    [self sendEventWithName:@"recordingInterruptionEnded" body:@{}]
    if(shouldResume){
      [self resumeRecording]
    }
  }
}

RCT_EXPORT_METHOD(prepareRecordingAtPath:(NSString *)path 
                  sampleRate:(float)sampleRate 
                  channels:(nonnull NSNumber *)channels 
                  quality:(NSNumber *)quality 
                  encoding:(NSNumber *)encoding 
                  meteringEnabled:(BOOL)meteringEnabled 
                  shouldResume:(BOOL)shouldResume)
{
  // create parent dirs if necessary
  NSString *filePathAndDirectory = [path stringByDeletingLastPathComponent];
  NSError *error=nil;

  if (![[NSFileManager defaultManager] 
    createDirectoryAtPath:filePathAndDirectory
                          withIntermediateDirectories:YES
                          attributes:nil
                          error:&error])
  {
    NSLog(@"Create directory error: %@", error);
  }  

  audioFileURL = [NSURL fileURLWithPath:path];
  resumeOnInterrupt = shouldResume;
  
  recordSession = [AVAudioSession sharedInstance];
  [recordSession setCategory:AVAudioSessionCategoryPlayAndRecord error:nil];

  audioRecorder = [[AVAudioRecorder alloc]
                    initWithURL:audioFileURL
                    settings:@{
                      AVEncoderAudioQualityKey: quality ?: @(AVAudioQualityHigh),
                      AVFormatIDKey: encoding ?: @(kAudioFormatMPEG4AAC),
                      AVNumberOfChannelsKey: channels ?: @2,
                      AVSampleRateKey: sampleRate ?: @(48000.0F)
                    }
                    error:&error];

  audioRecorder.meteringEnabled = meteringEnabled;
  audioRecorder.delegate = self;

  if (error) {
    // TODO: dispatch error over the bridge
    NSLog(@"error: %@", [error localizedDescription]);
  } else {
    [audioRecorder prepareToRecord];
  }
}

- (void)startProgressTimer {
  progressTimer = [NSTimer scheduledTimerWithTimeInterval:0.25F 
                           target:self 
                           selector:@selector(progressTick) 
                           userInfo:nil 
                           repeats:YES];
}

- (void)stopProgressTimer {
  [progressTimer invalidate]
}

RCT_EXPORT_METHOD(startRecording)
{
  [self startProgressTimer]
  [recordSession setActive:YES error:nil];
  [audioRecorder record];
}

RCT_EXPORT_METHOD(stopRecording)
{
  [audioRecorder stop];
  [recordSession setCategory:AVAudioSessionCategoryPlayback error:nil];
  [self stopProgressTimer]
}

RCT_EXPORT_METHOD(pauseRecording)
{
  if (audioRecorder.isRecording) {
    [audioRecorder pause];
  }
  [self stopProgressTimer]
}

RCT_EXPORT_METHOD(resumeRecording)
{
  if (!_audioRecorder.isRecording) {
    [_audioRecorder record];
  }
  [self startProgressTimer]
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

- (NSString *) applicationDocumentsDirectory
{
  NSArray *paths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES);
  NSString *basePath = ([paths count] > 0) ? [paths objectAtIndex:0] : nil;
  return basePath;
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
    @"NSLibraryDirectoryPath": [self getPathForDirectory:NSLibraryDirectory],
    @"iOSAudioQuality": @{
      @"Low": AVAudioQualityLow,
      @"Medium": AVAudioQualityMedium,
      @"High": AVAudioQualityHigh
    },
    @"iOSAudioEncoding": @{
      @"lpcm": kAudioFormatLinearPCM,
      @"ima4": kAudioFormatAppleIMA4,
      @"aac": kAudioFormatMPEG4AAC,
      @"MAC3": kAudioFormatMACE3,
      @"MAC6": kAudioFormatMACE6,
      @"ulaw": kAudioFormatULaw,
      @"alaw": kAudioFormatALaw,
      @"mp1": kAudioFormatMPEGLayer1,
      @"mp2": kAudioFormatMPEGLayer2,
      @"alac": kAudioFormatAppleLossless,
      @"amr": kAudioFormatAMR,
      @"flac": kAudioFormatFLAC,
      @"opus": kAudioFormatOpus
    }
  };
}

@end
