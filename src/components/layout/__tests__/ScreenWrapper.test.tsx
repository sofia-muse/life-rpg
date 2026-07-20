import React from 'react';
import renderer from 'react-test-renderer';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../../config/theme';
import { ScreenWrapper } from '../ScreenWrapper';

function setPlatformOs(os: typeof Platform.OS) {
  Object.defineProperty(Platform, 'OS', {
    configurable: true,
    get: () => os,
  });
}

function findContainerStyle(tree: renderer.ReactTestRenderer) {
  const container = tree.root.findAllByType(View).find((node) => {
    const style = StyleSheet.flatten(node.props.style) as
      | { paddingHorizontal?: number }
      | undefined;
    return style?.paddingHorizontal === 16;
  });

  expect(container).toBeDefined();
  return StyleSheet.flatten(container!.props.style);
}

describe('ScreenWrapper', () => {
  const originalOs = Platform.OS;

  afterEach(() => {
    setPlatformOs(originalOs);
  });

  it('keeps native screens full-width with mobile spacing', () => {
    setPlatformOs('ios');

    const tree = renderer.create(
      <ScreenWrapper>
        <Text>Sanctuary</Text>
      </ScreenWrapper>
    );

    const scrollView = tree.root.findByType(ScrollView);
    const contentStyle = StyleSheet.flatten(scrollView.props.style);
    const containerStyle = findContainerStyle(tree);

    expect(contentStyle).toMatchObject({
      flex: 1,
      backgroundColor: colors.bgPrimary,
    });
    expect(containerStyle).toMatchObject({
      flex: 1,
      width: '100%',
      alignSelf: 'center',
      paddingHorizontal: 16,
      paddingTop: 48,
    });
    expect(containerStyle.maxWidth).toBeUndefined();
  });

  it('uses web top padding and centers phone-width content', () => {
    setPlatformOs('web');

    const tree = renderer.create(
      <ScreenWrapper scroll={false}>
        <Text>Sanctuary</Text>
      </ScreenWrapper>
    );

    const rootView = tree.root.findByType(View);
    const rootStyle = StyleSheet.flatten(rootView.props.style);
    const containerStyle = findContainerStyle(tree);

    expect(rootStyle).toMatchObject({
      flex: 1,
      backgroundColor: colors.bgPrimary,
    });
    expect(containerStyle).toMatchObject({
      flex: 1,
      paddingHorizontal: 16,
      paddingTop: 16,
      width: '100%',
      alignSelf: 'center',
    });
  });
});
