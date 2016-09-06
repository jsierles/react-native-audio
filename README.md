## react-native-audio for iOS and android

An audio recording and playback library for React Native iOS apps.

On iOS, it supports most iOS AVAudioRecorder class configuration options.

### Installation

Install the package via npm, and link the binary to your iOS and Android projects:

```
npm install react-native-audio
react-native link react-native-audio
```

#### Extra Android installation step

Update AndroidManifest.xml by adding the `RECORD_AUDIO` permission:
```
<uses-permission android:name="android.permission.RECORD_AUDIO" />
```

### Running the Sample App On iOS

Update AndroidManifest.xml by adding the `RECORD_AUDIO` permission :
```
<uses-permission android:name="android.permission.RECORD_AUDIO" />
```

### Running the Sample App On IOS

In the `AudioExample` directory:

```
npm install
react-native run-ios
```

### Running the Sample App On Android

In the `AudioExample` directory:

```
npm install
react-native run-android
```

### Running the Sample App On Android

In the `AudioExample` directory:

```
npm install
react-native run-android
```

### Usage

This library supports recording, basic playback and progress reporting. Progress reporting is iOS only for now.

To record in AAC format, at 22050 KHz in low quality mono with metering enabled:

```
import {AudioRecorder, AudioUtils} from 'react-native-audio';
let audioPath = AudioUtils.DocumentDirectoryPath + '/test.aac';

AudioRecorder.prepareRecordingAtPath(audioPath, {
  SampleRate: 22050,
  Channels: 1,
  AudioQuality: "Low",
  AudioEncoding: "aac",
  MeteringEnabled: true
});
```

See [the example](https://github.com/jsierles/react-native-audio/blob/master/AudioExample/index.ios.js) for more options, including playback and callbacks. For more audio play options, check out [React Native Sound](https://github.com/zmxv/react-native-sound)

### Supported audio formats

A subset of formats listed here are supported: https://developer.apple.com/reference/coreaudio/1572096-audio_data_format_identifiers

Currently supported format arguments: lpcm, ima4, aac, MAC3, MAC6, ulaw, alaw, mp1, mp2, alac.

MP3 recording is not supported on iOS.

Thanks to Brent Vatne, Johannes Lumpe, Kureev Alexey and Matthew Hartman for their assistance.

Progress tracking code borrowed from https://github.com/brentvatne/react-native-video.
