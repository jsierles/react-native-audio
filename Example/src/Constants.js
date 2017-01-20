import { Platform } from 'react-native'
import { AudioUtils } from 'react-native-audio-player-recorder'

const Constants = {
  MAX_AUDIO_LENGTH: 60,
  AUDIO_PATH: AudioUtils.DocumentDirectoryPath + '/example.aac',
  CUSTOM_RED: '#f22335',
  PLATFORM_MARGIN_TOP: Platform.OS === 'ios' ? 64 : 54,
  ICON_GREY_COLOR: '#6b6b6b',
}

export default Constants
