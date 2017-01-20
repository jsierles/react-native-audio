//
//  AudioPlayerManager.h
//  AudioPlayerManager
//
//  Created by Joshua Sierles on 23/04/15.
//  Copyright (c) 2015 Joshua Sierles. All rights reserved.
//

#import "React/RCTBridgeModule.h"
#import "React/RCTLog.h"
#import <AVFoundation/AVFoundation.h>

@interface AudioPlayerManager : NSObject <RCTBridgeModule, AVAudioPlayerDelegate>

@end
