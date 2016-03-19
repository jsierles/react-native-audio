## react-native-audio (iOS only)

An audio recording and playback library for react-native. It supports most configuration options available to the iOS AVAudioRecorder class.

## Breaking changes in 1.0.0

The path provided to `AudioRecorder.prepareRecordingAtPath` now requires an absolute path. See the `AudioUtils` helper methods and the example project to see how to use them.

### Installation

1. `npm install react-native-audio`
2. In the XCode's "Project navigator", right click on project's name ➜ `Add Files to <...>`
3. Go to `node_modules` ➜ `react-native-audio`
4. Select the `ios/Audio*Manager.*` files

### Sample App

In the AudioExample directory:

1. `npm install`
2. open AudioExample.xcodeproj
3. Run

### TODO

* Update project to be linkable using rnpm
* Documentation
* Convert JS api to a react component
* Store audio to media library
* Error handling over the js bridge
* Android support

Thanks to Brent Vatne, Johannes Lumpe, Kureev Alexey and Matthew Hartman for assistance.

Progress tracking code borrowed from https://github.com/brentvatne/react-native-video.
