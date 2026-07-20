import React, { useImperativeHandle, useRef } from 'react';
import LottieView, { AnimationObject } from 'lottie-react-native';
import { AppLottieHandle, AppLottieProps } from './AppLottie.types';

const AppLottie = React.forwardRef<AppLottieHandle, AppLottieProps>((props, ref) => {
  const lottieRef = useRef<LottieView>(null);

  useImperativeHandle(
    ref,
    () => ({
      play: () => {
        lottieRef.current?.play();
      },
      reset: () => {
        lottieRef.current?.reset();
      },
    }),
    [],
  );

  const { source, ...rest } = props;
  return (
    <LottieView
      ref={lottieRef}
      source={source as string | AnimationObject | { uri: string }}
      {...rest}
    />
  );
});

AppLottie.displayName = 'AppLottie';

export default AppLottie;
