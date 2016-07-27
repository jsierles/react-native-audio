## react-native-audio for iOS

An audio recording and playback library for React Native iOS apps. It supports most configuration options available to the iOS AVAudioRecorder class.

## Breaking changes in 1.0.0

The path provided to `AudioRecorder.prepareRecordingAtPath` now requires an absolute path. See the `AudioUtils` helper methods and the example project to see how to use them.

### Installation

Install the package via npm and link using rnpm. Rnpm is bundled in React Native 0.27, so it should be used in favor of manual linking.

```
npm install -g rnpm
npm install react-native-audio
rnpm link react-native-audio
```

### Running the Sample App

In the `AudioExample` directory:

```
npm install
react-native run-ios
```

### Usage

This library supports recording, basic playback and offers progress callbacks for both.

To record in AAC format, at 22050 KHz in low quality mono:

```
import {AudioRecorder, AudioUtils} from 'react-native-audio';
let audioPath = AudioUtils.DocumentDirectoryPath + '/test.aac';

AudioRecorder.prepareRecordingAtPath(audioPath, {
  SampleRate: 22050,
  Channels: 1,
  AudioQuality: "Low",
  AudioEncoding: "aac"
});
```

See [the example](https://github.com/jsierles/react-native-audio/blob/master/AudioExample/index.ios.js) for more options, including playback and callbacks. For more audio play options, check out [React Native Sound](https://github.com/zmxv/react-native-sound)

### Supported audio formats

A subset of formats listed here are supported: https://developer.apple.com/reference/coreaudio/1572096-audio_data_format_identifiers

Currently supported format arguments: lpcm, ima4, aac, MAC3, MAC6, ulaw, alaw, mp1, mp2, alac.

MP3 recording is not supported on iOS.

Thanks to Brent Vatne, Johannes Lumpe, Kureev Alexey and Matthew Hartman for their assistance.

Progress tracking code borrowed from https://github.com/brentvatne/react-native-video.
