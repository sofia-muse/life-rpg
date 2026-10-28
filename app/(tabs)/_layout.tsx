import { FantasyIcon } from '../../src/components/game/FantasyIcon';
import { StatName } from '../../src/types';
import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography } from '../../src/config/theme';
import { getTabDockWidth, getViewportSize } from '../../src/config/responsive';

function TabIcon({
  label,
  icon,
  focused,
  wide,
}: {
  label: string;
  icon: string;
  focused: boolean;
  wide: boolean;
}) {
  return (
    <View style={[styles.tabItem, wide && styles.tabItemWide, focused && styles.tabItemActive]}>
      {focused && (
        <LinearGradient
          colors={['rgba(212, 184, 114, 0.28)', 'rgba(164, 137, 66, 0.14)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      )}
      <View
        pointerEvents="none"
        style={[styles.innerBorder, focused && styles.innerBorderActive]}
      />
      <FantasyIcon
        stat={
          (
            {
              '⌂': 'vitality',
              '⚔': 'strength',
              '⛨': 'willpower',
              '✦': 'intelligence',
              '✎': 'dexterity',
            } as Record<string, StatName>
          )[icon] ?? 'intelligence'
        }
        size={30}
      />
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
    </View>
  );
}

export default function TabLayout() {
  const { width } = useWindowDimensions();
  const viewport = getViewportSize(width);
  const floatingDock = Platform.OS === 'web' && viewport !== 'phone';
  const dockWidth = getTabDockWidth(width);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: [
          styles.tabBar,
          floatingDock && styles.tabBarFloating,
          floatingDock
            ? {
                width: dockWidth,
                left: Math.max((width - dockWidth) / 2, 24),
              }
            : null,
        ],
        tabBarItemStyle: floatingDock ? styles.tabBarItemWide : undefined,
        tabBarIconStyle: { width: '100%', height: 54 },
        tabBarShowLabel: false,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Sanctuary" icon="⌂" focused={focused} wide={floatingDock} />
          ),
        }}
      />
      <Tabs.Screen
        name="quests"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Adventures" icon="⚔" focused={focused} wide={floatingDock} />
          ),
        }}
      />
      <Tabs.Screen
        name="raids"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Raids" icon="⛨" focused={focused} wide={floatingDock} />
          ),
        }}
      />
      <Tabs.Screen
        name="skills"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Skills" icon="✦" focused={focused} wide={floatingDock} />
          ),
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Chronicle" icon="✎" focused={focused} wide={floatingDock} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.tabBg,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    height: 76,
    paddingTop: 10,
    paddingBottom: 10,
  },
  tabBarFloating: {
    position: 'absolute',
    bottom: 18,
    borderTopWidth: 1,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 26,
    height: 84,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(10,25,20,0.97)',
    shadowColor: colors.bgCanvas,
    shadowOpacity: 0.28,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 14 },
    elevation: 10,
  },
  tabBarItemWide: {
    paddingHorizontal: 6,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
    width: '100%',
    minHeight: 50,
    borderRadius: 18,
    overflow: 'hidden',
  },
  tabItemWide: {
    minWidth: 120,
    minHeight: 56,
  },
  tabItemActive: {
    borderWidth: 1,
    borderColor: colors.goldSoft,
  },
  innerBorder: {
    position: 'absolute',
    top: 4,
    right: 4,
    bottom: 4,
    left: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  innerBorderActive: {
    borderColor: 'rgba(255,255,255,0.14)',
  },
  tabIcon: {
    fontSize: 18,
    color: colors.tabInactive,
    opacity: 0.9,
  },
  tabIconActive: {
    color: colors.tabActive,
  },
  tabLabel: {
    fontSize: 11,
    color: colors.tabInactive,
    marginTop: 3,
    textTransform: 'none',
    ...typography.body,
  },
  tabLabelActive: {
    color: colors.tabActive,
    fontWeight: '600',
  },
});
