Record and play back audio in your iOS or Android React Native apps.

### Installation

Install the npm package and link it to your project:

```
npm install react-native-audio
react-native link react-native-audio
```

On *Android* you need to add a permission to `AndroidManifest.xml`:

```
<uses-permission android:name="android.permission.RECORD_AUDIO" />
```

### Running the Sample App

In the `AudioExample` directory:

```
npm install
react-native run-ios
react-native run-android
```

### Usage

This library supports recording, basic playback and progress reporting.

NOTE: Progress reporting is *iOS only* for now.

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

#### Cross-platform options

```
SampleRate: int
Channels: int
AudioQuality: string
AudioEncoding: string
```

Encodings supported on iOS: `lpcm, ima4, aac, MAC3, MAC6, ulaw, alaw, mp1, mp2, alac, amr`
Encodings supported on Android: `aac, aac_eld, amr_nb, amr_wb, he_aac, vorbis`

#### iOS-only fields

The `MeteringEnabled` boolean to enable audio metering.

#### Android-only fields

AudioEncodingBitRate: int
OutputFormat: string, `mpeg_4, aac_adts, amr_nb, amr_wb, three_gpp, webm`

See [the example](https://github.com/jsierles/react-native-audio/blob/master/AudioExample/index.ios.js) for more options, including playback and callbacks. For more audio play features, check out [React Native Sound](https://github.com/zmxv/react-native-sound)

MP3 recording is *not supported* since the underlying platforms do not support it.

Thanks to Brent Vatne, Johannes Lumpe, Kureev Alexey, Matthew Hartman and Rakan Nimer for their assistance.

Progress tracking code borrowed from https://github.com/brentvatne/react-native-video.
