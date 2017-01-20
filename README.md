# React Native Audio Player Recorder [![npm version](https://badge.fury.io/js/react-native-audio-player-recorder.svg)](http://badge.fury.io/js/react-native-audio-player-recorder)

[![NPM](https://nodei.co/npm/react-native-audio-player-recorder.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/react-native-audio-player-recorder/)

Record and play back audio through Loud Speaker, Receiver, Bluetooth and Headphones in your iOS or Android React Native apps.

## Features
`react-native-audio-player-recorder` is a package that allows you to:

- Record audio on both iOS and Android with `Progress reporting` and features such as: `recording`, `pause recording` and `stop recording`.
- Play audio on both iOS and Android with `progress reporting` and features such as: `playing`, `pause playing` and `stop playing`.

## Installation

### Install package

- Install with npm:

If you're using react-native version < `0.40.0`

Please run:

```bash
npm install react-native-audio-player-recorder@1.1.1 --save
```

If you're using react-native version >= `0.40.0`

Please run

```bash
npm install react-native-audio-player-recorder@2.0.0 --save
```

- Install with yarn:

If you're using react-native version < `0.40.0`

Please run:

```bash
yarn add react-native-audio-player-recorder@1.1.1
```

If you're using react-native version >= `0.40.0`

Please run

```bash
yarn add react-native-audio-player-recorder@2.0.0
```

### Link native libraries

```bash
react-native link react-native-audio-player-recorder
```

### Configration for iOS and Android

On *iOS* you need to add a usage description to `Info.plist`:

```
<key>NSMicrophoneUsageDescription</key>
<string>This sample uses the microphone to record your speech and convert it to text.</string>
```

On *Android* you need to add a permission to `AndroidManifest.xml`:

```
<uses-permission android:name="android.permission.RECORD_AUDIO" />
```

## Quick Getting Started

In the `AudioExample` directory:

```
npm install
react-native run-ios
```

### API Documentation

#### AudioRecorder
| Method                 | Method Description                                                                                                                        | Parameters    | Parameters Description                                                            |
|------------------------|-------------------------------------------------------------------------------------------------------------------------------------------|---------------|-----------------------------------------------------------------------------------|
| prepareRecordingAtPath | This method must be called before recording to set up the recording path and set the recording audio quality and output format and so on. | path, options | `path`: the local path to store the recording audio. `options`: the recording options |
| startRecording         | Start recording                                                                                                                           |               |                                                                                   |
| pauseRecording         | Pause recording                                                                                                                           |               |                                                                                   |
| stopRecording          | When this method is called, the recorded audio file will be saved to local automatically.                                                 |               |                                                                                   |
| playRecording          | Playing the recorded audio after recording finishes.                                                                                      |               |                                                                                   |
| stopPlaying            | Stop playing the recorded audio.                                                                                                          |               |                                                                                   |
| pausePlaying           | Pause playing the recorded audio.                                                                                                         |               |                                                                                   |
| onProgress             | Recording progress reporting callback function.                                                                                           |               |                                                                                   |
| onFinished             | Recording finishes callback function.                                                                                                     |               |                                                                                   |



#### AudioPlayer

| Method                  | Method Description                                                                                                   | Parameters    | Parameters Description                              |
|-------------------------|----------------------------------------------------------------------------------------------------------------------|---------------|-----------------------------------------------------|
| play                    | Play audio form path with options                                                                                    | path, options | `path`: local audio path `options`: the playing options |
| playWithUrl             |                                                                                                                      | url, options  | `url`: audio url `options`: the playing options         |
| pause                   | Pause playing                                                                                                        |               |                                                     |
| unpause                 | Unpause playing                                                                                                      |               |                                                     |
| stop                    | Stop playing audio                                                                                                   |               |                                                     |
| skipToSeconds           | Play audio from some position, the unit is second                                                                    | position      | `position`: use second as unit                        |
| onProgress              | Playing progress reporting callback, must call function setProgressSubscription to subscribe the onProgress callback | data          |                                                     |
| setProgressSubscription | onProgress callback subscriotion                                                                                     |               |                                                     |
| onFinished              | Playing finish callback, must call function setFinishedSubscription to subscribe the onFinished callback             |               |                                                     |
| setFinishedSubscription | onFinished callback subscription                                                                                     |               |                                                     |
| getOutputs              | Get current available outputs, will return an array of String, for example the outputs can be: `["Phone", "Phone Speaker", "Bluetooth"]`  |               |                                                     |


##### Available Playback Outputs

When playing audio, there are chances that the headphone is plugged, or the bluetooth headset is connected to your device.

`react-native-audio-player-recorder` supports to get current the available outputs.

```
_getAvailableOutputs() {
  AudioPlayer.getOutputs(outputs => {
    console.log('outputs========', outputs)
  })
}
```

##### Set Playback Outputs With Options

`react-native-audio-player-recorder` supports to play audio via appointed output.

Play Audio via outputs by passing `output` params:

- Receiver: `Phone`

- Loud Speaker: `Phone Speaker`

- Bluetooth: `Bluetooth`

- Headphones: `Headphones`


```
_playViaOutput(output) {
  let audioPath = AudioUtils.DocumentDirectoryPath + '/test.aac';      
  let options = {output: 'Phone'};
  AudioPlayer.play(audioPath, options)      
}
```


## Support

This package is forked from [https://github.com/jsierles/react-native-audio](https://github.com/jsierles/react-native-audio).

We borrow some features from it, learn a lot and add features such as: Playing via appointed outputs, get current available outputs, add audio progress reporting support for Andoid and so on.

If you like the component and want to support it, feel free to donate any amount or help with issues.
