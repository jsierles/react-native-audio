#import "AudioRecorderManager.h"
#import "RCTConvert.h"
#import "RCTBridge.h"
#import "RCTEventDispatcher.h"
#import <AVFoundation/AVFoundation.h>

NSString *const AudioRecorderEventProgress = @"videoProgress";

@implementation AudioRecorderManager {
  
  AVAudioRecorder *_audioRecorder;
  AVAudioPlayer *_audioPlayer;

  id _progressUpdateTimer;
  int _progressUpdateInterval;
  NSDate *_prevProgressUpdateTime;
  NSURL *_audioFileURL;
  AVAudioSession *_recordSession;
}

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE();

- (void)sendProgressUpdate {
   if (_audioRecorder == nil || !_audioRecorder.recording) {
     return;
   }

  if (_prevProgressUpdateTime == nil ||
     (([_prevProgressUpdateTime timeIntervalSinceNow] * -1000.0) >= _progressUpdateInterval)) {
    [_bridge.eventDispatcher sendDeviceEventWithName:AudioRecorderEventProgress body:@{
      @"currentTime": [NSNumber numberWithFloat:_audioRecorder.currentTime]
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

RCT_EXPORT_METHOD(prepareRecordingAtPath:(NSString *)path)
{

  NSArray *dirPaths;
  NSString *docsDir;

  dirPaths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES);
  docsDir = dirPaths[0];

  NSString *audioFilePath = [docsDir stringByAppendingPathComponent:path];

  _audioFileURL = [NSURL fileURLWithPath:audioFilePath];

  NSDictionary *recordSettings = [NSDictionary
          dictionaryWithObjectsAndKeys: [NSNumber numberWithInt:AVAudioQualityHigh],
          AVEncoderAudioQualityKey, [NSNumber numberWithInt:16],
          AVEncoderBitRateKey, [NSNumber numberWithInt: 2],
          AVNumberOfChannelsKey,
          [NSNumber numberWithFloat:44100.0],
          AVSampleRateKey,
          nil];

  NSError *error = nil;

  _recordSession = [AVAudioSession sharedInstance];
  [_recordSession setCategory:AVAudioSessionCategoryPlayAndRecord error:nil];

  _audioRecorder = [[AVAudioRecorder alloc]
                initWithURL:_audioFileURL
                settings:recordSettings
                error:&error];
  
  _audioRecorder.delegate = self;

  if (error) {
      NSLog(@"error: %@", [error localizedDescription]);
      // TODO: dispatch error over the bridge
    } else {
      [_audioRecorder prepareToRecord];
  }
}

RCT_EXPORT_METHOD(record)
{
  if (!_audioRecorder.recording) {
    [self startProgressTimer];
    [_recordSession setActive:YES error:nil];
    [_audioRecorder record];

  }
}

RCT_EXPORT_METHOD(stop)
{
  if (_audioRecorder.recording) {
    [_audioRecorder stop];
    [_recordSession setActive:NO error:nil];
  }
}

RCT_EXPORT_METHOD(pause)
{
  if (_audioRecorder.recording) {
    [self stopProgressTimer];
    [_audioRecorder pause];
  }
}

RCT_EXPORT_METHOD(play)
{
  if (!_audioRecorder.recording) {
    NSError *error;

    _audioPlayer = [[AVAudioPlayer alloc]
      initWithContentsOfURL:_audioRecorder.url
      error:&error];

    if (error) {
      NSLog(@"audio playback loading error: %@", [error localizedDescription]);
      // TODO: dispatch error over the bridge
    } else {
      [_audioPlayer play];
    }
  }
}

@end