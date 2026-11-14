import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { AppProviders } from '../context/AppProviders';
import { useDiet } from '../context/DietContext';
import { useProjection } from '../context/ProjectionContext';
import '../i18n/config';
import { queryClient } from '../services/queryClient';
import { queryKeys } from '../services/queryKeys';
import { renderStep, STEPS } from '../src/wizard';
import { Text } from 'react-native';

let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => {
  const router = { back: jest.fn(), replace: jest.fn(), push: jest.fn(), canGoBack: () => true };
  return {
    useRouter: () => router,
    router,
    useLocalSearchParams: () => mockParams,
    useFocusEffect: jest.fn(),
  };
});
const mockRouter = jest.requireMock('expo-router').router;
jest.mock('../services/apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve({ data: { data: null } })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));
const mockApi = jest.requireMock('../services/apiClient').default;

let diet!: ReturnType<typeof useDiet>;
let projection!: ReturnType<typeof useProjection>;
function Probe() {
  diet = useDiet();
  projection = useProjection();
  return (
    <Text testID="probe">{`diet:${diet.currentStep} projection:${projection.currentStep}`}</Text>
  );
}

const renderFlow = (id: string) =>
  render(
    <AppProviders>
      <Probe />
      {renderStep(id)}
    </AppProviders>
  );

beforeEach(() => {
  jest.clearAllMocks();
  mockParams = {};
  mockApi.get.mockImplementation(() => Promise.resolve({ data: { data: null } }));
});

describe('config-driven wizard steps', () => {
  it('every step in the config is a distinct question of its flow', () => {
    const seen = new Set<string>();
    for (const step of Object.values(STEPS)) {
      const key = `${step.flow}:${step.index}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
    expect(Object.keys(STEPS)).toHaveLength(7);
  });

  it('renders the question, keeps Continue off until an answer is picked, saves it and moves on', async () => {
    renderFlow('diet-meals');
    expect(await screen.findByText('How many meals do you usually eat per day?')).toBeTruthy();
    expect(screen.getByText('Step 3 of 4')).toBeTruthy();
    const cont = screen.getByRole('button', { name: 'Continue' });
    expect(cont.props.accessibilityState.disabled).toBe(true);

    fireEvent.press(screen.getByRole('radio', { name: '4 meals' }));
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
    });

    // The answer goes out in the shape the api already takes (a number), and the flow moves to step 3.
    await waitFor(() => expect(mockApi.post).toHaveBeenCalled());
    expect(JSON.stringify(mockApi.post.mock.calls)).toContain('"mealsPerDay":4');
    expect(screen.getByTestId('probe').props.children).toContain('diet:3');
  });

  it('back goes to the previous question of the flow, and the first question has no back button', async () => {
    const view = renderFlow('diet-allergies');
    await screen.findByText('Do you have any food allergies or dietary restrictions?');
    act(() => diet.setCurrentStep(1));
    fireEvent.press(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByTestId('probe').props.children).toContain('diet:0');
    view.unmount();

    renderFlow('diet-preference');
    await screen.findByText('Step 1 of 4');
    expect(screen.queryByRole('button', { name: 'Back' })).toBeNull();
  });

  it('shows the saved answer selected when the question is opened to edit it', async () => {
    mockParams = { returnTo: 'profile' };
    queryClient.setQueryData(queryKeys.projection, { sleepHours: '7-8' });
    renderFlow('projection-sleep');

    const saved = await screen.findByRole('radio', { name: '7-8 hours' });
    expect(saved.props.accessibilityState.selected).toBe(true);
    expect(screen.getByRole('radio', { name: '5-6 hours' }).props.accessibilityState.selected).toBe(
      false
    );

    // Editing saves and returns to the profile instead of moving to the next question.
    fireEvent.press(screen.getByRole('radio', { name: '9+ hours' }));
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
    });
    await waitFor(() => expect(mockRouter.back).toHaveBeenCalled());
    expect(screen.getByTestId('probe').props.children).toContain('projection:0');
  });

  it('yes needs some text, no clears it, and both are saved as the flag and the text', async () => {
    renderFlow('diet-allergies');
    await screen.findByText('Do you have any food allergies or dietary restrictions?');
    const cont = () => screen.getByRole('button', { name: 'Continue' });

    fireEvent.press(screen.getByRole('radio', { name: 'Yes' }));
    expect(cont().props.accessibilityState.disabled).toBe(true); // nothing typed yet
    fireEvent.changeText(screen.getByLabelText('Please specify ...'), '  peanuts ');
    expect(cont().props.accessibilityState.disabled).toBe(false);

    await act(async () => {
      fireEvent.press(cont());
    });
    await waitFor(() => expect(mockApi.post).toHaveBeenCalled());
    const sent = JSON.stringify(mockApi.post.mock.calls);
    expect(sent).toContain('"hasAllergies":true');
    expect(sent).toContain('"allergies":"peanuts"');
  });
});
