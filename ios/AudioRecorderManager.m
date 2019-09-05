//
//  AudioRecorderManager.m
//  AudioRecorderManager
//
//  Derived from Joshua Sierles on 15/04/15.
//  Refactored/Restructured by Matt Way (for Notiv) on 5/9/19.
//

#import "AudioRecorderManager.h"
#import <React/RCTConvert.h>
#import <React/RCTBridge.h>
#import <React/RCTUtils.h>
#import <React/RCTEventDispatcher.h>
#import <AVFoundation/AVFoundation.h>

NSString *const EVENT_RECORDING_PROGRESS = @"recordingProgress";
NSString *const EVENT_RECORDING_FINISHED = @"recordingFinished";
NSString *const EVENT_INTERRUPTION_BEGAN = @"recordingInterruptionBegan";
NSString *const EVENT_INTERRUPTION_ENDED = @"recordingInterruptionEnded";

@implementation AudioRecorderManager {

  AVAudioSession *recordSession;
  AVAudioRecorder *audioRecorder;

  BOOL hasListeners;
  BOOL meteringEnabled;
  BOOL resumeOnInterrupt;

  NSURL *audioFileURL;
  NSTimer *progressTimer;
}

RCT_EXPORT_MODULE();

+ (BOOL)requiresMainQueueSetup {
  return YES;
}

-(void)startObserving {
  hasListeners = YES;
}

-(void)stopObserving {
  hasListeners = NO;
}

- (NSArray<NSString *> *)supportedEvents {
  return @[
    EVENT_RECORDING_PROGRESS,
    EVENT_RECORDING_FINISHED,
    EVENT_INTERRUPTION_BEGAN,
    EVENT_INTERRUPTION_ENDED
  ];
}

- (void)progressTick:(NSTimer *)timer {
  if (!hasListeners) {
    return;
  }

  NSMutableDictionary *body = [[NSMutableDictionary alloc] init];
  [body setValue:[NSNumber numberWithDouble:audioRecorder.currentTime] forKey:@"currentTime"];

  if(audioRecorder.meteringEnabled){
    [audioRecorder updateMeters];
    float currentMetering = [audioRecorder averagePowerForChannel: 0];
    [body setValue:[NSNumber numberWithFloat:currentMetering] forKey:@"currentMetering"];
    float currentPeakMetering = [audioRecorder peakPowerForChannel: 0];
    [body setValue:[NSNumber numberWithFloat:currentPeakMetering] forKey:@"currentPeakMetering"];
  }

  [self sendEventWithName:EVENT_RECORDING_PROGRESS body:body];
}

- (void)triggerFinishEvent:(BOOL)status {
  uint64_t audioFileSize = [[[NSFileManager defaultManager] attributesOfItemAtPath:[audioFileURL path] error:nil] fileSize];
  
  [self sendEventWithName:EVENT_RECORDING_FINISHED body:@{
    @"duration":@(audioRecorder.currentTime),
    @"status": status ? @"OK" : @"ERROR",
    @"audioFileURL": [audioFileURL absoluteString],
    @"audioFileSize": @(audioFileSize)
  }];
}

- (void)audioRecorderDidFinishRecording:(AVAudioRecorder *)recorder successfully:(BOOL)flag {
  [self triggerFinishEvent:flag];
    
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
  if(!hasListeners){
    return;
  }

  if ([[notification.userInfo valueForKey:AVAudioSessionInterruptionTypeKey] isEqualToNumber:[NSNumber numberWithInt:AVAudioSessionInterruptionTypeBegan]]) {
    [self sendEventWithName:EVENT_INTERRUPTION_BEGAN body:@{}];
    if(resumeOnInterrupt){
      [self pauseRecording];
    }else{
      [self stopRecording];
    }
  }else{
    [self sendEventWithName:EVENT_INTERRUPTION_ENDED body:@{}];
    if(resumeOnInterrupt){
      [self resumeRecording];
    }
  }
}

RCT_EXPORT_METHOD(prepareRecordingAtPath:(NSString *)path 
                  sampleRate:(nonnull NSNumber *)sampleRate 
                  channels:(nonnull NSNumber *)channels 
                  quality:(nonnull NSNumber *)quality 
                  encoding:(nonnull NSNumber *)encoding 
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
  [[NSNotificationCenter defaultCenter] addObserver:self
                                        selector:@selector(audioSessionInterruptionNotification:)
                                        name:AVAudioSessionInterruptionNotification
                                        object:recordSession];
  [recordSession setCategory:AVAudioSessionCategoryPlayAndRecord withOptions:AVAudioSessionCategoryOptionAllowBluetooth error:nil];

  // TODO: Expose a more sophisticated interface to js for providing device preference
  // Right now this takes a preference order
  NSDictionary *audioTypes = @{ 
    AVAudioSessionPortBluetoothHFP: @6,     
    AVAudioSessionPortCarAudio: @5,
    AVAudioSessionPortHeadsetMic: @4,
    AVAudioSessionPortUSBAudio: @3,
    AVAudioSessionPortLineIn: @2,
    AVAudioSessionPortBuiltInMic : @1
  };
  AVAudioSessionPortDescription *preferredPort = Nil;
  for (AVAudioSessionPortDescription *desc in recordSession.availableInputs) {
    if(preferredPort == Nil || [audioTypes[desc.portType] intValue] > [audioTypes[preferredPort.portType] intValue]){
      preferredPort = desc;
    }
  }
  if(preferredPort != Nil){
    [recordSession setPreferredInput:preferredPort error:nil];
  }else{
    NSLog(@"No input port is available");
  }

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
  progressTimer = [NSTimer timerWithTimeInterval:0.5F 
                           target:self 
                           selector:@selector(progressTick:) 
                           userInfo:nil 
                           repeats:YES];
  // react-native timers need to be added specifically to main thread
  [[NSRunLoop mainRunLoop] addTimer:progressTimer forMode:NSRunLoopCommonModes];
}

- (void)stopProgressTimer {
  [progressTimer invalidate];
}

RCT_EXPORT_METHOD(startRecording)
{
  [self startProgressTimer];
  [recordSession setActive:YES error:nil];
  [audioRecorder record];
}

RCT_EXPORT_METHOD(stopRecording)
{
  // this checks for failure cases in which the audio was
  // stopped for some reason, but js expects a finished event to trigger
  if(audioRecorder.isRecording){
    [audioRecorder stop];
  }else{
    [self triggerFinishEvent:NO];
  }  
  [recordSession setCategory:AVAudioSessionCategoryPlayback error:nil];
  [self stopProgressTimer];
}

RCT_EXPORT_METHOD(pauseRecording)
{
  if (audioRecorder.isRecording) {
    [audioRecorder pause];
  }
  [self stopProgressTimer];
}

RCT_EXPORT_METHOD(resumeRecording)
{
  if (!audioRecorder.isRecording) {
    [audioRecorder record];
  }
  [self startProgressTimer];
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
      @"Low": @(AVAudioQualityLow),
      @"Medium": @(AVAudioQualityMedium),
      @"High": @(AVAudioQualityHigh)
    },
    @"iOSAudioEncoding": @{
      @"lpcm": @(kAudioFormatLinearPCM),
      @"ima4": @(kAudioFormatAppleIMA4),
      @"aac": @(kAudioFormatMPEG4AAC),
      @"MAC3": @(kAudioFormatMACE3),
      @"MAC6": @(kAudioFormatMACE6),
      @"ulaw": @(kAudioFormatULaw),
      @"alaw": @(kAudioFormatALaw),
      @"mp1": @(kAudioFormatMPEGLayer1),
      @"mp2": @(kAudioFormatMPEGLayer2),
      @"alac": @(kAudioFormatAppleLossless),
      @"amr": @(kAudioFormatAMR),
      @"flac": @(kAudioFormatFLAC),
      @"opus": @(kAudioFormatOpus)
    }
  };
}

@end
