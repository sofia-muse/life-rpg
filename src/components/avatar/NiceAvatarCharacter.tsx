import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { CharacterAppearance, ClassTier, StatName } from '../../types';
import { FairytalePortrait } from './FairytalePortrait';
import { CharacterEvent } from './anime/useExpressionState';
import { colors } from '../../config/theme';
import { getPaintedPortrait } from '../../config/paintedPortraits';

interface Props {
  appearance: CharacterAppearance;
  dominantStat: StatName;
  classTier: ClassTier;
  size?: number;
  event?: CharacterEvent;
}

export function NiceAvatarCharacter({
  appearance,
  dominantStat,
  classTier,
  size = 80,
  event = 'idle',
}: Props) {
  return (
    <View
      style={[
        styles.frame,
        {
          width: size + 20,
          height: size + 20,
          borderColor: event === 'idle' ? colors.borderStrong : colors.goldBright,
        },
      ]}
    >
      {appearance.portraitStyle !== 'illustrated' ? (
        <Image
          source={getPaintedPortrait(appearance).source}
          accessibilityLabel={`${getPaintedPortrait(appearance).name}, painted fantasy portrait`}
          resizeMode="cover"
          style={{ width: size, height: size, borderRadius: 16 }}
        />
      ) : (
        <FairytalePortrait
          size={size}
          appearance={appearance}
          dominantStat={dominantStat}
          classTier={classTier}
        />
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  frame: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    borderWidth: 1,
    backgroundColor: colors.bgCanvas,
    overflow: 'hidden',
  },
});
