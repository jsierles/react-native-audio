//
//  AudioRecorderManager.h
//  AudioRecorderManager
//
//  Created by Joshua Sierles on 15/04/15.
//  Copyright (c) 2015 Joshua Sierles. All rights reserved.
//

#import "RCTBridgeModule.h"
#import "RCTLog.h"
#import <AVFoundation/AVFoundation.h>

@interface AudioRecorderManager : NSObject <RCTBridgeModule, AVAudioRecorderDelegate>

@end