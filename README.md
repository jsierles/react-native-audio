
Record audio in iOS or Android React Native apps.

## MAINTENANCE STATUS

This project is no longer actively maintained by me, the original author. I will not be answering issues or merging any more PRs. If someone is interested in taking over the library permanently, let me know!

## BREAKING CHANGES

For React Native >= 0.47.2, use v3.4.0 and up.
For React Native >= 0.40, use v3.1.0 up til 3.2.2.
For React Native <= 0.39, use v3.0.0 or lower.

v4.0 introduced a breaking change to the API to introduce distinct pause and resume methods.

v3.x removed playback support in favor of using more mature libraries like [react-native-sound](https://github.com/zmxv/react-native-sound). If you need to play
from the network, please submit a PR to that project or try `react-native-video`.

### Installation

Install the npm package and link it to your project:

```
npm install react-native-audio --save
react-native link react-native-audio
```

On *iOS* you need to add a usage description to `Info.plist`:

```
<key>NSMicrophoneUsageDescription</key>
<string>This sample uses the microphone to record your speech and convert it to text.</string>
```

On *Android* you need to add a permission to `AndroidManifest.xml`:

```
<uses-permission android:name="android.permission.RECORD_AUDIO" />
```

### Manual Installation

This is not necessary if you have used `react-native link`

#### Android

Edit `android/settings.gradle` to declare the project directory:
```
include ':react-native-audio'
project(':react-native-audio').projectDir = new File(rootProject.projectDir, '../node_modules/react-native-audio/android')
```

Edit `android/app/build.gradle` to declare the project dependency:
```
dependencies {
  ...
  compile project(':react-native-audio')
}
```

Edit `android/app/src/main/java/.../MainApplication.java` to register the native module:

```java
...
import com.rnim.rn.audio.ReactNativeAudioPackage; // <-- New
...

public class MainApplication extends Application implements ReactApplication {
  ...
  @Override
  protected List<ReactPackage> getPackages() {
    return Arrays.<ReactPackage>asList(
        new MainReactPackage(),
        new ReactNativeAudioPackage() // <-- New
    );
  }
```

#### iOS

Drag `node_modules/react-native-audio/ios/RNAudio.xcoderproj` into your project's Libraries on Xcode.

Add `libRNAudio.a` into Link Binary With Libraries from Xcode - Build Phases.


### Running the Sample App

In the `AudioExample` directory:

```
npm install
react-native run-ios
react-native run-android
```

### Usage

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

`AudioQuality` is supported on iOS. `Low`, `Medium`, and `High` will translate to `AVAudioQualityLow`, `AVAudioQualityMedium`, and `AVAudioQualityHigh` respectively.

#### Cross-platform options

```
SampleRate: int
Channels: int
AudioQuality: string
AudioEncoding: string
IncludeBase64: boolean
```

Encodings supported on iOS: `lpcm, ima4, aac, MAC3, MAC6, ulaw, alaw, mp1, mp2, alac, amr`
Encodings supported on Android: `aac, aac_eld, amr_nb, amr_wb, he_aac, vorbis`

Use the `IncludeBase64` boolean to include the `base64` encoded recording on the `AudioRecorder.onFinished` event object. Please use it with care: passing large amounts of data over the bridge, from native to Javascript, can use lots of memory and cause slow performance.

If you want to upload the audio, it might be best to do it on the native thread with a package like [React Native Fetch Blob](https://github.com/joltup/react-native-fetch-blob).

#### iOS-only fields

Use `MeteringEnabled` boolean to enable audio metering. The following values are available on the recording progress object. 

| Name | Related AVAudioRecorder parameter | Description |
|------|-----------------------------------|-------------|
|currentMetering| averagePowerForChannel | The current average power, in decibels, for the sound being recorded. A return value of 0 dB indicates full scale, or maximum power; a return value of -160 dB indicates minimum power (that is, near silence). If the signal provided to the audio recorder exceeds ±full scale, then the return value may exceed 0 (that is, it may enter the positive range).|
|currentPeakMetering | peakPowerForChannel | The current peak power, in decibels, for the sound being recorded. A return value of 0 dB indicates full scale, or maximum power; a return value of -160 dB indicates minimum power (that is, near silence). If the signal provided to the audio recorder exceeds ±full scale, then the return value may exceed 0 (that is, it may enter the positive range).|

For example: 

```js
AudioRecorder.onProgress = (data) => {
    console.log(data.currentMetering, data.currentPeakMetering)
};
```

#### Android-only fields

AudioEncodingBitRate: int

OutputFormat: string, `mpeg_4, aac_adts, amr_nb, amr_wb, three_gpp, webm`

AudioSource: int (constants) (Possible values: AudioSource.DEFAULT, AudioSource.MIC, AudioSource.VOICE_UPLINK, AudioSource.VOICE_DOWNLINK, AudioSource.VOICE_CALL, AudioSource.CAMCORDER, AudioSource.VOICE_RECOGNITION, AudioSource.VOICE_COMMUNICATION, AudioSource.REMOTE_SUBMIX, AudioSource.UNPROCESSED)

See [the example](https://github.com/jsierles/react-native-audio/blob/master/AudioExample/index.ios.js) for more details. For playing audio check out [React Native Sound](https://github.com/zmxv/react-native-sound)

MP3 recording is *not supported* since the underlying platforms do not support it.

Thanks to Brent Vatne, Johannes Lumpe, Kureev Alexey, Matthew Hartman and Rakan Nimer for their assistance.

Progress tracking code borrowed from https://github.com/brentvatne/react-native-video.
