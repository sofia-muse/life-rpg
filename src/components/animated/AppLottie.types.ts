import { StyleProp, ViewStyle } from 'react-native';

export interface AppLottieHandle {
  play: () => void;
  reset: () => void;
}

export type AppLottieVariant = 'aura' | 'sparkle' | 'levelup';

export interface AppLottieProps {
  source: unknown;
  autoPlay?: boolean;
  loop?: boolean;
  speed?: number;
  style?: StyleProp<ViewStyle>;
  /** Web has no lottie-react-native player, so each preset draws its own motion. */
  variant?: AppLottieVariant;
}
