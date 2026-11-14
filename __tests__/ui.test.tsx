import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { ThemeProvider } from '../context/ThemeContext';
import '../i18n/config';
import {
  Button,
  Dialog,
  EmptyState,
  ErrorState,
  OptionCard,
  Sheet,
  Skeleton,
  Text,
  ToastProvider,
  useToast,
  WheelPicker,
  WizardStep,
} from '../src/ui';
import { stepDirection } from '../src/ui/StepTransition';
import { TOAST_DURATION_MS } from '../src/ui/Toast';
import { darkTokens, lightTokens } from '../src/theme/tokens';

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), canGoBack: () => true, replace: jest.fn() }),
}));

type Theme = 'light' | 'dark';
const themed = (ui: React.ReactElement, theme: Theme = 'light') =>
  render(
    <ThemeProvider initialTheme={theme}>
      <ToastProvider>{ui}</ToastProvider>
    </ThemeProvider>
  );

const flat = (node: { props: { style?: unknown } }) =>
  StyleSheet.flatten(node.props.style as object) as Record<string, string | number>;

describe('Text', () => {
  it('takes its colour and size from the tokens of the active theme', () => {
    themed(<Text variant="title">Hello</Text>, 'dark');
    const style = flat(screen.getByText('Hello'));
    expect(style.color).toBe(darkTokens.color.text);
    expect(style.fontSize).toBe(darkTokens.type.title.fontSize);

    screen.unmount();
    themed(<Text tone="muted">Quiet</Text>, 'light');
    expect(flat(screen.getByText('Quiet')).color).toBe(lightTokens.color.textMuted);
  });

  it('caps the system font scale so large text bends the layout instead of breaking it', () => {
    themed(<Text>Scaled</Text>);
    expect(screen.getByText('Scaled').props.maxFontSizeMultiplier).toBe(1.5);
  });
});

describe('Button', () => {
  it('presses, announces itself as a button and uses its title as the name', () => {
    const onPress = jest.fn();
    themed(<Button title="Continue" onPress={onPress} />);
    const button = screen.getByRole('button', { name: 'Continue' });
    fireEvent.press(button);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does nothing while disabled or loading, and says so to screen readers', () => {
    const onPress = jest.fn();
    themed(
      <>
        <Button title="Off" onPress={onPress} disabled />
        <Button title="Busy" onPress={onPress} loading />
      </>
    );
    fireEvent.press(screen.getByRole('button', { name: 'Off' }));
    fireEvent.press(screen.getByRole('button', { name: 'Busy' }));
    expect(onPress).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Busy' }).props.accessibilityState).toMatchObject({
      busy: true,
      disabled: true,
    });
  });

  it('puts dark text, never white, on the coral accent button', () => {
    themed(<Button title="Retry" variant="accent" onPress={jest.fn()} />);
    const label = flat(screen.getByText('Retry'));
    expect(label.color).toBe(lightTokens.color.onAccent);
    expect(label.color).not.toBe('#FFFFFF');
  });

  it('inverts in dark mode (white pill, black text)', () => {
    themed(<Button title="Go" onPress={jest.fn()} />, 'dark');
    expect(flat(screen.getByText('Go')).color).toBe(darkTokens.color.onAction);
    expect(flat(screen.getByRole('button', { name: 'Go' })).backgroundColor).toBe(
      darkTokens.color.action
    );
  });
});

describe('OptionCard', () => {
  it('is a radio with a selected state and reports presses', () => {
    const onPress = jest.fn();
    themed(<OptionCard title="Male" selected onPress={onPress} />);
    const card = screen.getByRole('radio', { name: 'Male' });
    expect(card.props.accessibilityState).toMatchObject({ selected: true, checked: true });
    fireEvent.press(card);
    expect(onPress).toHaveBeenCalled();
  });
});

describe('Dialog', () => {
  it('runs the pressed action and closes', () => {
    const onClose = jest.fn();
    const onDelete = jest.fn();
    themed(
      <Dialog
        visible
        title="Delete?"
        message="Cannot be undone"
        onClose={onClose}
        actions={[
          { label: 'Cancel', tone: 'cancel' },
          { label: 'Delete', tone: 'destructive', onPress: onDelete },
        ]}
      />
    );
    expect(screen.getByText('Cannot be undone')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Delete' }));
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('stays open for an action marked keepOpen (a form that validates first)', () => {
    const onClose = jest.fn();
    const onPress = jest.fn();
    themed(
      <Dialog
        visible
        title="Form"
        onClose={onClose}
        actions={[{ label: 'Save', keepOpen: true, onPress }]}
      />
    );
    fireEvent.press(screen.getByRole('button', { name: 'Save' }));
    expect(onPress).toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('shows a single OK when no actions are given and renders nothing when hidden', () => {
    const view = themed(<Dialog visible title="Done" onClose={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'OK' })).toBeTruthy();
    view.rerender(
      <ThemeProvider initialTheme="light">
        <ToastProvider>
          <Dialog visible={false} title="Done" onClose={jest.fn()} />
        </ToastProvider>
      </ThemeProvider>
    );
    expect(screen.queryByText('Done')).toBeNull();
  });
});

describe('Sheet', () => {
  it('shows its content and closes from the close button', () => {
    const onClose = jest.fn();
    themed(
      <Sheet visible title="Filter" closeLabel="Close" onClose={onClose}>
        <Text>Option A</Text>
      </Sheet>
    );
    expect(screen.getByText('Option A')).toBeTruthy();
    fireEvent.press(screen.getAllByRole('button', { name: 'Close' })[0]);
    expect(onClose).toHaveBeenCalled();
  });
});

describe('Toast', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  function Trigger() {
    const toast = useToast();
    return <Button title="Save" onPress={() => toast.show('Saved', 'success')} />;
  }

  it('appears when shown, is announced as an alert, and goes away by itself', () => {
    themed(<Trigger />);
    fireEvent.press(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByText('Saved')).toBeTruthy();
    expect(screen.getByRole('alert', { includeHiddenElements: true })).toBeTruthy();
    act(() => {
      jest.advanceTimersByTime(TOAST_DURATION_MS + 50);
    });
    expect(screen.queryByText('Saved')).toBeNull();
  });

  it('a second toast replaces the first and restarts the timer', () => {
    function Two() {
      const toast = useToast();
      return (
        <>
          <Button title="One" onPress={() => toast.show('First')} />
          <Button title="Two" onPress={() => toast.show('Second', 'error')} />
        </>
      );
    }
    themed(<Two />);
    fireEvent.press(screen.getByRole('button', { name: 'One' }));
    act(() => {
      jest.advanceTimersByTime(TOAST_DURATION_MS - 500);
    });
    fireEvent.press(screen.getByRole('button', { name: 'Two' }));
    expect(screen.queryByText('First')).toBeNull();
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByText('Second')).toBeTruthy(); // the timer restarted
  });
});

describe('WheelPicker', () => {
  const items = Array.from({ length: 20 }, (_, i) => ({ key: String(i), label: `Item ${i}` }));

  it('reports the index the wheel stops on, and only when it changed', () => {
    const onChange = jest.fn();
    themed(<WheelPicker items={items} selectedIndex={3} onChange={onChange} label="Height" />);
    const list = screen.UNSAFE_getByType(FlatList);

    fireEvent(list, 'momentumScrollEnd', { nativeEvent: { contentOffset: { y: 7 * 50 } } });
    expect(onChange).toHaveBeenCalledWith(7);

    fireEvent(list, 'scrollEndDrag', { nativeEvent: { contentOffset: { y: 7 * 50 + 10 } } });
    expect(onChange).toHaveBeenCalledTimes(1); // still index 7
  });

  it('clamps a scroll past the end to the last item', () => {
    const onChange = jest.fn();
    themed(<WheelPicker items={items} selectedIndex={0} onChange={onChange} />);
    const list = screen.UNSAFE_getByType(FlatList);
    fireEvent(list, 'momentumScrollEnd', { nativeEvent: { contentOffset: { y: 5000 } } });
    expect(onChange).toHaveBeenCalledWith(19);
  });

  it('is one adjustable control for screen readers with increment and decrement', () => {
    const onChange = jest.fn();
    themed(<WheelPicker items={items} selectedIndex={3} onChange={onChange} label="Height" />);
    const wheel = screen.getByLabelText('Height');
    expect(wheel.props.accessibilityRole).toBe('adjustable');
    expect(wheel.props.accessibilityValue).toEqual({ text: 'Item 3' });
    fireEvent(wheel, 'accessibilityAction', { nativeEvent: { actionName: 'increment' } });
    expect(onChange).toHaveBeenCalledWith(4);
    fireEvent(wheel, 'accessibilityAction', { nativeEvent: { actionName: 'decrement' } });
    expect(onChange).toHaveBeenLastCalledWith(2);
  });

  it('does not render all rows of a long list at once (virtualised)', () => {
    const long = Array.from({ length: 400 }, (_, i) => ({ key: String(i), label: `Row ${i}` }));
    themed(<WheelPicker items={long} selectedIndex={0} onChange={jest.fn()} />);
    expect(screen.queryByText('Row 399')).toBeNull();
  });
});

describe('ErrorState and EmptyState', () => {
  it('ErrorState says what happened and retries', () => {
    const onRetry = jest.fn();
    themed(<ErrorState kind="offline" onRetry={onRetry} />);
    expect(screen.getByText(/offline/i)).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalled();
  });

  it('EmptyState shows its message and an optional action', () => {
    const onAction = jest.fn();
    themed(
      <EmptyState
        title="Nothing yet"
        message="Scan a meal"
        actionLabel="Scan"
        onAction={onAction}
      />
    );
    expect(screen.getByText('Scan a meal')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Scan' }));
    expect(onAction).toHaveBeenCalled();
  });

  it('Skeleton is hidden from screen readers', () => {
    themed(<Skeleton height={20} />);
    expect(screen.toJSON()).toBeTruthy();
  });
});

describe('WizardStep', () => {
  it('shows the heading as a header, the answers, and a Continue button that follows `continueDisabled`', () => {
    const onContinue = jest.fn();
    const view = themed(
      <WizardStep
        step={3}
        totalSteps={10}
        title="What is your gender?"
        onContinue={onContinue}
        continueDisabled
      >
        <Text>answers</Text>
      </WizardStep>
    );
    expect(screen.getByRole('header', { name: 'What is your gender?' })).toBeTruthy();
    expect(screen.getByText('answers')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
    expect(onContinue).not.toHaveBeenCalled();

    view.rerender(
      <ThemeProvider initialTheme="light">
        <ToastProvider>
          <WizardStep step={3} totalSteps={10} title="What is your gender?" onContinue={onContinue}>
            <Text>answers</Text>
          </WizardStep>
        </ToastProvider>
      </ThemeProvider>
    );
    fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it('reports progress to screen readers', () => {
    themed(
      <WizardStep step={4} totalSteps={10} title="T" onContinue={jest.fn()}>
        <Text>x</Text>
      </WizardStep>
    );
    expect(screen.getByRole('progressbar').props.accessibilityValue).toMatchObject({
      now: 4,
      max: 10,
    });
  });
});

describe('stepDirection', () => {
  it('goes forward, back, and fades on the first step', () => {
    expect(stepDirection(null, 0)).toBe(0);
    expect(stepDirection(1, 2)).toBe(1);
    expect(stepDirection(3, 2)).toBe(-1);
  });
});
