import { StyleProp, ViewStyle } from 'react-native';

export interface AppLottieHandle {
  play: () => void;
  reset: () => void;
}

export interface AppLottieProps {
  source: unknown;
  autoPlay?: boolean;
  loop?: boolean;
  speed?: number;
  style?: StyleProp<ViewStyle>;
}
