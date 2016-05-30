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

Thanks to Brent Vatne, Johannes Lumpe, Kureev Alexey and Matthew Hartman for their assistance.

Progress tracking code borrowed from https://github.com/brentvatne/react-native-video.
