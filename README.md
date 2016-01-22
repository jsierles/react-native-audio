## react-native-audio

An audio recording and playback library for react-native.

This release recording and playback of the recording only. PRs are welcome for configuring the audio settings.

NOTE: The target filename must have an extension of '.m4a' to record properly.

NOTE: All files are saved to the app's 'Documents' directory.  When passing a path to the ```playWithPath()``` method, it assumes the file is already in the app's 'Documents' directory.

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

* Documentation
* Allow setting audio properties
* Convert JS api to a react component
* Store audio to media library
* Error handling over the js bridge
* Recommend react-native-video (media) for playback

Thanks to Brent Vatne, Johannes Lumpe, Kureev Alexey and the React Native community for assistance.

Progress tracking code borrowed from https://github.com/brentvatne/react-native-video.
