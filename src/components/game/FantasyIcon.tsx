import React from 'react';
import { StatName } from '../../types';
import { RPGIcon } from './RPGIcon';

export function FantasyIcon({ stat, size = 32 }: { stat: StatName; size?: number }) {
  return <RPGIcon name={stat} size={size} />;
}
