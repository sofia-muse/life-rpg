import React from 'react';
import LottieView from 'lottie-react-native';
import { AppLottieHandle, AppLottieProps } from './AppLottie.types';

const AppLottie = React.forwardRef<AppLottieHandle, AppLottieProps>((props, ref) => (
  <LottieView ref={ref} {...props} />
));

AppLottie.displayName = 'AppLottie';

export default AppLottie;
