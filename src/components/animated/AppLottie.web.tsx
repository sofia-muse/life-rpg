import React from 'react';
import { View } from 'react-native';
import { AppLottieHandle, AppLottieProps } from './AppLottie.types';

const AppLottie = React.forwardRef<AppLottieHandle, AppLottieProps>(({ style }, _ref) => {
  return <View pointerEvents="none" style={style} />;
});

AppLottie.displayName = 'AppLottie';

export default AppLottie;
