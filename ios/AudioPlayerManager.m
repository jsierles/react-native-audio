//
//  AudioPlayerManager.m
//  AudioPlayerManager
//
//  Created by Joshua Sierles on 15/04/15.
//  Copyright (c) 2015 Joshua Sierles. All rights reserved.
//

#import "AudioPlayerManager.h"
#import "RCTConvert.h"
#import "RCTBridge.h"
#import "RCTEventDispatcher.h"
#import <AVFoundation/AVFoundation.h>

NSString *const AudioPlayerEventProgress = @"playerProgress";
NSString *const AudioPlayerEventFinished = @"playerFinished";

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

- (NSString *) applicationDocumentsDirectory
{
  NSArray *paths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES);
  NSString *basePath = ([paths count] > 0) ? [paths objectAtIndex:0] : nil;
  return basePath;
}

RCT_EXPORT_METHOD(play:(NSString *)path)
{
  NSError *error;

  NSString *audioFilePath = [[self applicationDocumentsDirectory] stringByAppendingPathComponent:path];


  _audioFileURL = [NSURL fileURLWithPath:audioFilePath];

  _audioPlayer = [[AVAudioPlayer alloc]
    initWithContentsOfURL:_audioFileURL
    error:&error];
  _audioPlayer.delegate = self;

  if (error) {
    [self stopProgressTimer];
    NSLog(@"audio playback loading error: %@", [error localizedDescription]);
    // TODO: dispatch error over the bridge
  } else {
    [self startProgressTimer];
    [_audioPlayer play];
  }
}

RCT_EXPORT_METHOD(playWithUrl:(NSURL *) url)
{
  NSError *error;
  NSData* data = [NSData dataWithContentsOfURL: url];

  _audioPlayer = [[AVAudioPlayer alloc] initWithData:data  error:&error];
  _audioPlayer.delegate = self;
  if (error) {
    [self stopProgressTimer];
    NSLog(@"audio playback loading error: %@", [error localizedDescription]);
    // TODO: dispatch error over the bridge
  } else {
    [self startProgressTimer];
    [_audioPlayer play];
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

@end
