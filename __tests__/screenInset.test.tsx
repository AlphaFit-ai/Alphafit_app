import { fireEvent, render, screen } from '@testing-library/react-native';
import { HeaderShownContext } from 'expo-router/react-navigation';
import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { ThemeProvider } from '../context/ThemeContext';
import { PageHeader, Screen } from '../src/ui';
import { TOP_GAP } from '../src/ui/Screen';

/**
 * The status-bar inset is added once, with one small gap (TOP_GAP, 4) and nothing stacked on it: the
 * owner saw a space between the status bar and the screen. A navigator header (none is shown now)
 * would already cover the status bar, so a screen under it would not add it a second time (the Diet
 * tab's questions once did, under the tab header).
 */
const STATUS_BAR = 40;
const insets = { top: STATUS_BAR, bottom: 20, left: 0, right: 0 };

function open(underHeader: boolean, props: Partial<React.ComponentProps<typeof Screen>> = {}) {
  render(
    <SafeAreaInsetsContext.Provider value={insets}>
      <HeaderShownContext.Provider value={underHeader}>
        <ThemeProvider initialTheme="light">
          <Screen header={<Text>Back and progress</Text>} {...props}>
            <Text>Body</Text>
          </Screen>
        </ThemeProvider>
      </HeaderShownContext.Provider>
    </SafeAreaInsetsContext.Provider>
  );
  // The view that holds the pinned header carries the top padding.
  const headerBox = screen.getByText('Back and progress').parent!.parent!;
  return StyleSheet.flatten(headerBox.props.style).paddingTop as number;
}

it('without a navigator header (every screen now): the first row sits 4 below the status bar', () => {
  expect(TOP_GAP).toBe(4);
  expect(open(false)).toBe(STATUS_BAR + TOP_GAP);
});

it('under a navigator header: no second status-bar gap', () => {
  expect(open(true)).toBe(TOP_GAP);
});

it('noTopInset still leaves the inset to the parent', () => {
  expect(open(false, { noTopInset: true })).toBe(TOP_GAP);
});

it('a screen without a pinned header: one spacer of the status bar plus the gap, nothing else', () => {
  render(
    <SafeAreaInsetsContext.Provider value={insets}>
      <HeaderShownContext.Provider value={false}>
        <ThemeProvider initialTheme="light">
          <Screen>
            <PageHeader title="Settings" back={false} />
          </Screen>
        </ThemeProvider>
      </HeaderShownContext.Provider>
    </SafeAreaInsetsContext.Provider>
  );
  const frame = screen.UNSAFE_root.findAll(
    (node) => typeof node.props.style === 'object' && node.props.style?.height !== undefined
  );
  expect(StyleSheet.flatten(frame[0].props.style).height).toBe(STATUS_BAR + TOP_GAP);
  // The page header adds no top padding of its own: no box between the spacer and the title has one.
  let box = screen.getByText('Settings').parent;
  while (box && box !== frame[0].parent) {
    expect(StyleSheet.flatten(box.props.style)?.paddingTop ?? 0).toBe(0);
    box = box.parent;
  }
});

describe('centred body (Login, Register)', () => {
  it('centres the body in the scroll frame, a size the keyboard does not change', () => {
    render(
      <SafeAreaInsetsContext.Provider value={insets}>
        <ThemeProvider initialTheme="light">
          <Screen scroll keyboard centered>
            <Text>Sign-in block</Text>
          </Screen>
        </ThemeProvider>
      </SafeAreaInsetsContext.Provider>
    );
    // The scroll view (the keyboard-aware one) reports its frame.
    const frame = screen.UNSAFE_root.findAll(
      (node) => typeof node.props.onLayout === 'function'
    )[0];
    fireEvent(frame, 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 390, height: 640 } },
    });
    // The view that holds the block: the nearest ancestor with a style.
    let holder = screen.getByText('Sign-in block').parent;
    while (holder && !StyleSheet.flatten(holder.props.style)?.justifyContent)
      holder = holder.parent;
    expect(StyleSheet.flatten(holder!.props.style)).toMatchObject({
      minHeight: 640,
      justifyContent: 'center',
    });
  });
});
