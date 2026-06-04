import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../src/config/theme';

function TabIcon({ label, icon, focused }: { label: string; icon: string; focused: boolean }) {
  return (
    <View style={styles.tabItem}>
      <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>{icon}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="Home" icon="🏠" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="quests"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="Quests" icon="⚔️" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="skills"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="Skills" icon="🌟" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="Journal" icon="📜" focused={focused} />,
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
    height: 70,
    paddingTop: 8,
    paddingBottom: 8,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 22,
    opacity: 0.5,
  },
  tabIconActive: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 10,
    color: colors.tabInactive,
    marginTop: 2,
  },
  tabLabelActive: {
    color: colors.tabActive,
    fontWeight: '600',
  },
});
