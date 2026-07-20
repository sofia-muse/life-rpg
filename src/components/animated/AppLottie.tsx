// Platform-agnostic entry for TypeScript resolution.
// Metro still prefers AppLottie.native.tsx / AppLottie.web.tsx at runtime.
export { default } from './AppLottie.web';
export type { AppLottieHandle, AppLottieProps } from './AppLottie.types';
