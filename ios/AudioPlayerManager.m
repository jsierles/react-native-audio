//
//  AudioPlayerManager.m
//  AudioPlayerManager
//
//  Created by Joshua Sierles on 15/04/15.
//  Copyright (c) 2015 Joshua Sierles. All rights reserved.
//

#import "AudioPlayerManager.h"
#import "React/RCTConvert.h"
#import "React/RCTBridge.h"
#import "React/RCTEventDispatcher.h"
#import <AVFoundation/AVFoundation.h>

NSString *const AudioPlayerEventProgress = @"playerProgress";
NSString *const AudioPlayerEventFinished = @"playerFinished";

NSString *const OutputPhone = @"Phone";
NSString *const OutputPhoneSpeaker = @"Phone Speaker";
NSString *const OutputBluetooth = @"Bluetooth";
NSString *const OutputHeadphones = @"Headphones";

@implementation AudioPlayerManager {
  
  AVAudioPlayer *_audioPlayer;
  
  NSTimeInterval _currentTime;
  NSTimeInterval _currentDuration;
  id _progressUpdateTimer;
  int _progressUpdateInterval;
  NSDate *_prevProgressUpdateTime;
  NSURL *_audioFileURL;
}

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE();

- (void)sendProgressUpdate {
  if (_audioPlayer && _audioPlayer.playing) {
    _currentTime = _audioPlayer.currentTime;
    _currentDuration = _audioPlayer.duration;
  }
  
  // If audioplayer stopped, reset current time to 0
  if (_audioPlayer && !_audioPlayer.playing) {
    _currentTime = 0;
  }
  
  if (_prevProgressUpdateTime == nil ||
      (([_prevProgressUpdateTime timeIntervalSinceNow] * -1000.0) >= _progressUpdateInterval)) {
    [_bridge.eventDispatcher sendDeviceEventWithName:AudioPlayerEventProgress body:@{
                                                                                     @"currentTime": [NSNumber numberWithFloat:_currentTime],
                                                                                     @"currentDuration": [NSNumber numberWithFloat:_currentDuration]
                                                                                     }];
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

- (void)audioPlayerDidFinishPlaying:(AVAudioPlayer *)recorder successfully:(BOOL)flag {
  
  //Stop progress when finished...
  if (_audioPlayer.playing) {
    [_audioPlayer stop];
  }
  [self stopProgressTimer];
  [self sendProgressUpdate];
  
  [_bridge.eventDispatcher sendDeviceEventWithName:AudioPlayerEventFinished body:@{
                                                                                   @"finished": flag ? @"true" : @"false"
                                                                                   }];
}

RCT_EXPORT_METHOD(play:(NSString *)path options:(NSDictionary *)options)
{
  NSError *error;
  
  NSString *sessionCategory = [RCTConvert NSString:options[@"sessionCategory"]];
  [self setSessionCategory:sessionCategory];
  NSString *output = [RCTConvert NSString:options[@"output"]];
  [self setAudioOutput:output];
  NSNumber *numberOfLoops = [RCTConvert NSNumber:options[@"numberOfLoops"]];
  
  _audioFileURL = [NSURL fileURLWithPath:path];
  
  _audioPlayer = [[AVAudioPlayer alloc]
                  initWithContentsOfURL:_audioFileURL
                  error:&error];
  _audioPlayer.delegate = self;
  _audioPlayer.numberOfLoops = [numberOfLoops integerValue];
  
  if (error) {
    [self stopProgressTimer];
    NSLog(@"audio playback loading error: %@", [error localizedDescription]);
    // TODO: dispatch error over the bridge
  } else {
    [self startProgressTimer];
    [_audioPlayer play];
  }
}

RCT_EXPORT_METHOD(playWithUrl:(NSURL *) url options:(NSDictionary *)options)
{
  NSError *error;
  NSData* data = [NSData dataWithContentsOfURL: url];
  NSString *sessionCategory = [RCTConvert NSString:options[@"sessionCategory"]];
  [self setSessionCategory:sessionCategory];
  NSNumber *numberOfLoops = [RCTConvert NSNumber:options[@"numberOfLoops"]];
  
  _audioPlayer = [[AVAudioPlayer alloc] initWithData:data  error:&error];
  _audioPlayer.delegate = self;
  _audioPlayer.numberOfLoops = [numberOfLoops integerValue];
  
  if (error) {
    [self stopProgressTimer];
    NSLog(@"audio playback loading error: %@", [error localizedDescription]);
    // TODO: dispatch error over the bridge
  } else {
    [self startProgressTimer];
    [_audioPlayer play];
  }
}

- (void)setSessionCategory:(NSString *)sessionCategory {
  if ([sessionCategory isEqualToString:@"Ambient"]) {
    [[AVAudioSession sharedInstance] setCategory:AVAudioSessionCategoryAmbient error:nil];
  } else if ([sessionCategory isEqualToString:@"SoloAmbient"]) {
    [[AVAudioSession sharedInstance] setCategory:AVAudioSessionCategorySoloAmbient error:nil];
  } else if ([sessionCategory isEqualToString:@"Playback"]) {
    [[AVAudioSession sharedInstance] setCategory:AVAudioSessionCategoryPlayback error:nil];
  } else if ([sessionCategory isEqualToString:@"Record"]) {
    [[AVAudioSession sharedInstance] setCategory:AVAudioSessionCategoryRecord error:nil];
  } else if ([sessionCategory isEqualToString:@"PlayAndRecord"]) {
    [[AVAudioSession sharedInstance] setCategory:AVAudioSessionCategoryPlayAndRecord error:nil];
  } else if ([sessionCategory isEqualToString:@"AudioProcessing"]) {
    [[AVAudioSession sharedInstance] setCategory:AVAudioSessionCategoryAudioProcessing error:nil];
  } else if ([sessionCategory isEqualToString:@"MultiRoute"]) {
    [[AVAudioSession sharedInstance] setCategory:AVAudioSessionCategoryMultiRoute error:nil];
  }
}

- (void)setAudioOutput:(NSString *)output {
  if([output isEqualToString:OutputPhoneSpeaker]){
    AVAudioSession *audioSession = [AVAudioSession sharedInstance];
    [audioSession setCategory:AVAudioSessionCategoryPlayAndRecord error:nil];
    [audioSession setActive:YES error:nil];
    [audioSession overrideOutputAudioPort:AVAudioSessionPortOverrideSpeaker error:nil];
  } else if ([output isEqualToString:OutputPhone]){
    AVAudioSession *audioSession = [AVAudioSession sharedInstance];
    [audioSession setCategory:AVAudioSessionCategoryPlayAndRecord error:nil];
    [audioSession setActive:YES error:nil];
    [[AVAudioSession sharedInstance] overrideOutputAudioPort:AVAudioSessionPortOverrideNone error:nil];
  } else {
    [[AVAudioSession sharedInstance] overrideOutputAudioPort:AVAudioSessionPortOverrideNone error:nil];
  }
}

RCT_EXPORT_METHOD(pause)
{
  if (_audioPlayer.playing) {
    [_audioPlayer pause];
  }
}

RCT_EXPORT_METHOD(unpause)
{
  if (!_audioPlayer.playing) {
    [_audioPlayer play];
  }
}

RCT_EXPORT_METHOD(stop)
{
  if (_audioPlayer.playing) {
    [_audioPlayer stop];
    [self stopProgressTimer];
    [self sendProgressUpdate];
  }
}

RCT_EXPORT_METHOD(skipToSeconds:(float)position)
// Skips to an audio position (in seconds) of the current file on the [AVAudioPlayer* audioPlayer] class instance
// This works correctly for a playing and paused audioPlayer
//
{
  @synchronized(self)
  {
    // Negative values skip to start of file
    if ( position<0.0f )
      position = 0.0f;
    
    // Rounds down to remove sub-second precision
    position = (int)position;
    
    // Prevent skipping past end of file
    if ( position>=(int)_audioPlayer.duration )
    {
      NSLog( @"Audio: IGNORING skip to <%.02f> (past EOF) of <%.02f> seconds", position, _audioPlayer.duration );
      return;
    }
    
    // See if playback is active prior to skipping
    BOOL skipWhilePlaying = _audioPlayer.playing;
    
    // Perform skip
    NSLog( @"Audio: skip to <%.02f> of <%.02f> seconds", position, _audioPlayer.duration );
    
    // NOTE: This stop,set,prepare,(play) sequence produces reliable results on the simulator and device.
    [_audioPlayer stop];
    [_audioPlayer setCurrentTime:position];
    [_audioPlayer prepareToPlay];
    
    // Resume playback if it was active prior to skipping
    if ( skipWhilePlaying )
      [_audioPlayer play];
  }
}

RCT_EXPORT_METHOD(setCurrentTime:(NSTimeInterval) time)
{
  if (_audioPlayer.playing) {
    [_audioPlayer setCurrentTime: time];
  }
}

/*
 * Get the time where audio is playing right now
 */
RCT_EXPORT_METHOD(getCurrentTime:(RCTResponseSenderBlock)callback)
{
  NSTimeInterval currentTime = _audioPlayer.currentTime;
  callback(@[[NSNull null], [NSNumber numberWithDouble:currentTime]]);
}

RCT_EXPORT_METHOD(getDuration:(RCTResponseSenderBlock)callback)
{
  NSTimeInterval duration = _audioPlayer.duration;
  callback(@[[NSNull null], [NSNumber numberWithDouble:duration]]);
}

RCT_EXPORT_METHOD(getOutputs:(RCTResponseSenderBlock)callback)
{
  //Reset audio output route and session catetory when get the list
  AVAudioSession *audioSession = [AVAudioSession sharedInstance];
  [audioSession setCategory:AVAudioSessionCategoryPlayback error:nil];
  [audioSession overrideOutputAudioPort:AVAudioSessionPortOverrideNone error:nil];
  
  NSMutableArray *array;
  BOOL isHeadsetOn = false;
  BOOL isBluetoothConnected = false;
  
  AVAudioSessionRouteDescription* route = [[AVAudioSession sharedInstance] currentRoute];
  for (AVAudioSessionPortDescription* desc in [route outputs]) {
    if ([[desc portType] isEqualToString:AVAudioSessionPortHeadphones]) {
      isHeadsetOn = true;
      continue;
    }
    
    if ([[desc portType] isEqualToString:AVAudioSessionPortBluetoothA2DP] ||
        [[desc portType] isEqualToString:AVAudioSessionPortBluetoothLE] ||
        [[desc portType] isEqualToString:AVAudioSessionPortBluetoothHFP]) {
      isBluetoothConnected = true;
    }
  }
  if (isHeadsetOn) {
    array = [NSMutableArray arrayWithArray: @[OutputHeadphones]];
  } else if (isBluetoothConnected) {
    array = [NSMutableArray arrayWithArray: @[OutputPhone, OutputPhoneSpeaker, OutputBluetooth]];
  } else {
    array = [NSMutableArray arrayWithArray: @[OutputPhone, OutputPhoneSpeaker]];
  }
  
  callback(@[array]);
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
