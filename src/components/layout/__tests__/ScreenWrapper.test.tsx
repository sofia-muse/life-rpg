import React from 'react';
import renderer from 'react-test-renderer';
import { colors } from '../../../config/theme';

type PlatformOs = 'ios' | 'web';

function loadScreenWrapperForPlatform(os: PlatformOs) {
  jest.resetModules();
  jest.doMock('react-native', () => {
    const actual = jest.requireActual('react-native');
    return {
      ...actual,
      Platform: {
        ...actual.Platform,
        OS: os,
        select: (values: Record<string, unknown>) => values[os] ?? values.default,
      },
    };
  });

  let ReactNative: typeof import('react-native');
  let ScreenWrapper: typeof import('../ScreenWrapper').ScreenWrapper;

  jest.isolateModules(() => {
    ReactNative = require('react-native');
    ScreenWrapper = require('../ScreenWrapper').ScreenWrapper;
  });

  return { ReactNative: ReactNative!, ScreenWrapper: ScreenWrapper! };
}

function findContainerStyle(tree: renderer.ReactTestRenderer, ReactNative: typeof import('react-native')) {
  const container = tree.root.findAllByType(ReactNative.View).find((node) => {
    const style = ReactNative.StyleSheet.flatten(node.props.style);
    return style?.paddingHorizontal === 16;
  });

  expect(container).toBeDefined();
  return ReactNative.StyleSheet.flatten(container!.props.style);
}

describe('ScreenWrapper', () => {
  afterEach(() => {
    jest.resetModules();
    jest.unmock('react-native');
  });

  it('keeps native screens full-width with mobile spacing', () => {
    const { ReactNative, ScreenWrapper } = loadScreenWrapperForPlatform('ios');

    const tree = renderer.create(
      <ScreenWrapper>
        <ReactNative.Text>Sanctuary</ReactNative.Text>
      </ScreenWrapper>
    );

    const scrollView = tree.root.findByType(ReactNative.ScrollView);
    const contentStyle = ReactNative.StyleSheet.flatten(scrollView.props.style);
    const containerStyle = findContainerStyle(tree, ReactNative);

    expect(contentStyle).toMatchObject({
      flex: 1,
      backgroundColor: colors.bgPrimary,
    });
    expect(containerStyle).toMatchObject({
      flex: 1,
      paddingHorizontal: 16,
      paddingTop: 48,
    });
    expect(containerStyle.maxWidth).toBeUndefined();
    expect(containerStyle.alignSelf).toBeUndefined();
  });

  it('constrains web screens to a centered phone-width column', () => {
    const { ReactNative, ScreenWrapper } = loadScreenWrapperForPlatform('web');

    const tree = renderer.create(
      <ScreenWrapper scroll={false}>
        <ReactNative.Text>Sanctuary</ReactNative.Text>
      </ScreenWrapper>
    );

    const rootView = tree.root.findByType(ReactNative.View);
    const rootStyle = ReactNative.StyleSheet.flatten(rootView.props.style);
    const containerStyle = findContainerStyle(tree, ReactNative);

    expect(rootStyle).toMatchObject({
      flex: 1,
      backgroundColor: colors.bgPrimary,
    });
    expect(containerStyle).toMatchObject({
      flex: 1,
      paddingHorizontal: 16,
      paddingTop: 16,
      width: '100%',
      maxWidth: 480,
      alignSelf: 'center',
    });
  });
});
