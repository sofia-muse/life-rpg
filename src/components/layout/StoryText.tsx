import React, { forwardRef } from 'react';
import {
  Text as NativeText,
  TextInput as NativeInput,
  StyleSheet,
  TextProps,
  TextInputProps,
} from 'react-native';
import { colors, fonts } from '../../config/theme';

/** Keep readable book typography consistent, including real weight files on native. */
export const Text = forwardRef<NativeText, TextProps>(function StoryText({ style, ...props }, ref) {
  const flat = StyleSheet.flatten(style);
  const family = flat?.fontFamily ?? fonts.body;
  const isBody = family === fonts.body;
  const weight = Number(flat?.fontWeight ?? 400);
  const resolved = isBody
    ? flat?.fontStyle === 'italic'
      ? fonts.journal
      : flat?.fontWeight === 'bold' || weight >= 700
        ? fonts.bodyBold
        : weight >= 500
          ? fonts.bodyMedium
          : fonts.body
    : family;
  const custom = Object.values(fonts).includes(resolved);
  return (
    <NativeText
      ref={ref}
      {...props}
      style={[
        { fontFamily: fonts.body },
        style,
        custom && { fontFamily: resolved, fontWeight: 'normal', fontStyle: 'normal' },
      ]}
    />
  );
});

export const TextInput = forwardRef<NativeInput, TextInputProps>(function StoryInput(props, ref) {
  return (
    <NativeInput
      ref={ref}
      placeholderTextColor={colors.textMuted}
      selectionColor={colors.gold}
      {...props}
      style={[
        { fontFamily: fonts.body, borderColor: colors.borderStrong, borderRadius: 8 },
        props.style,
      ]}
    />
  );
});
