import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { AxiosError, AxiosHeaders, InternalAxiosRequestConfig } from 'axios';
import React from 'react';
import ChatbotScreen from '../app/chatbot';
import { AppProviders } from '../context/AppProviders';
import '../i18n/config';
import { chatbotService } from '../services';

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), replace: jest.fn(), push: jest.fn() }),
  useFocusEffect: jest.fn(),
}));
jest.mock('../services/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig;
const httpError = (status: number) =>
  new AxiosError(
    'fail',
    'ERR_BAD_RESPONSE',
    config,
    {},
    {
      status,
      statusText: '',
      headers: {},
      config,
      data: { success: false, message: 'down' },
    }
  );
const networkError = () => new AxiosError('Network Error', 'ERR_NETWORK', config, {});

let health: jest.SpyInstance;
let history: jest.SpyInstance;
let send: jest.SpyInstance;

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
  health = jest.spyOn(chatbotService, 'checkHealth').mockResolvedValue(true);
  history = jest.spyOn(chatbotService, 'getConversationHistory').mockResolvedValue([]);
  send = jest.spyOn(chatbotService, 'sendMessage');
});

const open = async () => {
  render(
    <AppProviders>
      <ChatbotScreen />
    </AppProviders>
  );
  await screen.findByText(/your AlphaFit AI coach/);
};

const type = (text: string) =>
  fireEvent.changeText(screen.getByLabelText('Ask me about fitness, nutrition...'), text);

describe('Chatbot', () => {
  it('sends a message and shows the answer', async () => {
    send.mockResolvedValue({
      message: 'Eat more protein.',
      role: 'assistant',
      timestamp: 1,
      success: true,
    });
    await open();
    type('How do I gain muscle?');
    fireEvent.press(screen.getByRole('button', { name: 'Send' }));

    expect(await screen.findByText('Eat more protein.')).toBeTruthy();
    expect(screen.getByText('How do I gain muscle?')).toBeTruthy();
    expect(send).toHaveBeenCalledWith('How do I gain muscle?', expect.any(Array));
  });

  it('keeps a message that could not be sent, with its text, and sends the same text again on retry', async () => {
    send.mockRejectedValueOnce(networkError());
    await open();
    type('Plan my week');
    fireEvent.press(screen.getByRole('button', { name: 'Send' }));

    expect(await screen.findByText(/You seem to be offline/)).toBeTruthy();
    expect(screen.getByText('Plan my week')).toBeTruthy(); // not lost

    send.mockResolvedValueOnce({
      message: 'Here is a plan.',
      role: 'assistant',
      timestamp: 2,
      success: true,
    });
    fireEvent.press(screen.getByRole('button', { name: /Not sent\..*Try again/ }));

    expect(await screen.findByText('Here is a plan.')).toBeTruthy();
    expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.calls[1][0]).toBe('Plan my week');
    expect(screen.queryByText(/You seem to be offline/)).toBeNull();
  });

  it('says the coach is unavailable on a 503, and stops accepting messages until it is back', async () => {
    send.mockRejectedValueOnce(httpError(503));
    await open();
    type('Hello coach');
    fireEvent.press(screen.getByRole('button', { name: 'Send' }));

    expect(await screen.findAllByText('Service Unavailable')).not.toHaveLength(0);
    expect(
      screen.getByText('The AI chatbot service is currently unavailable. Please try again later.')
    ).toBeTruthy();
    expect(screen.getByLabelText('Ask me about fitness, nutrition...').props.editable).toBe(false);

    // The coach comes back: the retry on the notice checks again and re-enables the composer.
    health.mockResolvedValue(true);
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    });
    await waitFor(() =>
      expect(screen.getByLabelText('Ask me about fitness, nutrition...').props.editable).toBe(true)
    );
  });

  it('shows the unavailable notice at once when the health check says the coach is down', async () => {
    health.mockResolvedValue(false);
    await open();
    expect(await screen.findByText('Service Unavailable')).toBeTruthy();
    expect(history).toHaveBeenCalled();
  });

  it('does not send an empty message', async () => {
    await open();
    fireEvent.press(screen.getByRole('button', { name: 'Send' }));
    expect(send).not.toHaveBeenCalled();
  });

  describe('history', () => {
    const saved = (n: number) =>
      Array.from({ length: n }, (_, i) => ({
        role: i % 2 === 0 ? ('user' as const) : ('assistant' as const),
        content: `message number ${i + 1}`,
        timestamp: 1000 + i,
      }));

    it('shows the newest messages first and loads older ones a page at a time', async () => {
      history.mockResolvedValue(saved(70));
      render(
        <AppProviders>
          <ChatbotScreen />
        </AppProviders>
      );
      expect(await screen.findByText('message number 70')).toBeTruthy();
      expect(screen.queryByText('message number 1')).toBeNull(); // the oldest are not drawn yet

      fireEvent.press(screen.getByRole('button', { name: 'Earlier messages' }));
      fireEvent.press(screen.getByRole('button', { name: 'Earlier messages' }));
      // 30 + 30 + 30 covers all 70: nothing left to load
      await waitFor(() =>
        expect(screen.queryByRole('button', { name: 'Earlier messages' })).toBeNull()
      );
    });

    it('sends only the latest messages as context, not the whole history', async () => {
      history.mockResolvedValue(saved(60));
      send.mockResolvedValue({ message: 'ok', role: 'assistant', timestamp: 9, success: true });
      render(
        <AppProviders>
          <ChatbotScreen />
        </AppProviders>
      );
      await screen.findByText('message number 60');
      type('And today?');
      fireEvent.press(screen.getByRole('button', { name: 'Send' }));
      await waitFor(() => expect(send).toHaveBeenCalled());
      expect(send.mock.calls[0][1]).toHaveLength(20);
      expect(send.mock.calls[0][1][19].content).toBe('message number 60');
    });

    it('says when the earlier messages could not be loaded, keeps the welcome, and can try again', async () => {
      history.mockRejectedValueOnce(networkError());
      render(
        <AppProviders>
          <ChatbotScreen />
        </AppProviders>
      );
      expect(await screen.findByText('Could not load your earlier messages.')).toBeTruthy();
      expect(screen.getByText(/your AlphaFit AI coach/)).toBeTruthy();

      history.mockResolvedValueOnce(saved(2));
      fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
      expect(await screen.findByText('message number 2')).toBeTruthy();
      expect(screen.queryByText('Could not load your earlier messages.')).toBeNull();
    });
  });
});
