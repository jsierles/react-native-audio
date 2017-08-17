import { Platform } from 'react-native';
import defaultRecordingOptions from './constants/defaultRecordingOptions';

// Hack to bridge over different APIs between Android and iOS
const getNativePrepareRecordingAtPathArguments = ({
  recordingPath,
  recordingOptions
}) => {
  const customRecordingOptions = {
    ...defaultRecordingOptions,
    ...recordingOptions
  };
  if (Platform.OS === 'ios') {
    const {
      SampleRate,
      Channels,
      AudioQuality,
      AudioEncoding,
      MeteringEnabled
    } = customRecordingOptions;
    return [
      recordingPath,
      SampleRate,
      Channels,
      AudioQuality,
      AudioEncoding,
      MeteringEnabled
    ];
  }
  return [recordingPath, recordingOptions];
};
export default getNativePrepareRecordingAtPathArguments;
