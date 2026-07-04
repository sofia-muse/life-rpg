import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  Animated,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, spacing, fontSize, typography } from '../../config/theme';

interface Props {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  textStyle,
}: Props) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[
          styles.base,
          styles[`size_${size}`],
          styles[`frame_${variant}`],
          disabled && styles.disabled,
          style,
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ disabled: disabled || loading, busy: loading }}
      >
        {variant === 'primary' && (
          <LinearGradient
            colors={[colors.goldLight, colors.gold, colors.goldDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
        )}
        {variant !== 'primary' && <View pointerEvents="none" style={styles.secondaryGlow} />}
        <View pointerEvents="none" style={styles.innerBorder} />
        {loading ? (
          <ActivityIndicator color={variant === 'primary' ? colors.bgPrimary : colors.gold} />
        ) : (
          <Text style={[styles.text, styles[`text_${variant}`], styles[`text_${size}`], textStyle]}>
            {title}
          </Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  frame_primary: {
    borderWidth: 1,
    borderColor: colors.goldLight,
    shadowColor: colors.gold,
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  frame_secondary: {
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.goldSoft,
  },
  frame_ghost: {
    backgroundColor: 'transparent',
  },
  size_sm: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  size_md: {
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.lg,
  },
  size_lg: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: '700',
    textTransform: 'uppercase',
    ...typography.headingWide,
  },
  text_primary: {
    color: colors.bgPrimary,
  },
  text_secondary: {
    color: colors.gold,
  },
  text_ghost: {
    color: colors.gold,
  },
  text_sm: {
    fontSize: fontSize.sm,
  },
  text_md: {
    fontSize: fontSize.md,
  },
  text_lg: {
    fontSize: fontSize.lg,
  },
  innerBorder: {
    position: 'absolute',
    top: 3,
    right: 3,
    bottom: 3,
    left: 3,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  secondaryGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.goldSoft,
    opacity: 0.2,
  },
});
