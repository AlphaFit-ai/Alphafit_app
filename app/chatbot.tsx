import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, StyleSheet, TextInput, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { Fonts } from '../constants';
import { useTheme } from '../context/ThemeContext';
import { useProfilePicture } from '../hooks/queries';
import { chatbotService, ChatMessage } from '../services';
import { logError, normalizeApiError } from '../services/apiError';
import { parseApiDate } from '../services/apiTime';
import {
  AppImage,
  Button,
  haptic,
  PressableScale,
  Screen,
  Skeleton,
  SkeletonGroup,
  Text,
} from '../src/ui';

/** A message as the screen keeps it: the api shape plus a local id and a delivery state. */
interface Item extends ChatMessage {
  id: string;
  /** `failed` messages keep their text and offer a retry. */
  status?: 'failed';
  failure?: string;
}

const isSystemPrompt = (content: string) => {
  const text = content.toLowerCase();
  return (
    text.includes('as a nutrition expert') ||
    text.includes('generate a short, inspiring quote') ||
    text.includes('analyze this meal') ||
    text.includes('generate a response')
  );
};

/** The history comes whole from the api, so the screen shows it a page at a time, newest first. */
export const CHAT_PAGE = 30;
/** How many of the latest messages go to the coach as context with a new message. */
export const CHAT_CONTEXT_MESSAGES = 20;

let counter = 0;
const nextId = () => `m${(counter += 1)}`;

const Bubble = React.memo(function Bubble({
  item,
  avatar,
  onRetry,
}: {
  item: Item;
  avatar: string | null;
  onRetry: (item: Item) => void;
}) {
  const { t } = useTranslation();
  const { tokens } = useTheme();
  const c = tokens.color;
  const isUser = item.role === 'user';
  const time = parseApiDate(item.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowCoach]}>
      {!isUser && <Ionicons name="sparkles" size={20} color={c.accentText} style={styles.icon} />}
      <View style={styles.column}>
        <View
          style={[
            styles.bubble,
            isUser
              ? { backgroundColor: c.accent }
              : { backgroundColor: c.surfaceMuted, borderColor: c.border, borderWidth: 1 },
          ]}
        >
          <Text style={{ color: isUser ? c.onAccent : c.text }}>{item.content}</Text>
          <Text
            variant="caption"
            style={[styles.time, { color: isUser ? c.onAccent : c.textSubtle }]}
          >
            {time}
          </Text>
        </View>
        {item.status === 'failed' ? (
          <PressableScale
            onPress={() => onRetry(item)}
            minTarget
            accessibilityRole="button"
            accessibilityLabel={`${t('chat.notSent')} ${t('common.retry')}`}
            style={styles.failed}
          >
            <Ionicons name="alert-circle" size={16} color={c.dangerText} />
            <Text variant="caption" tone="danger" style={styles.failedText}>
              {item.failure ?? t('chat.notSent')} {t('common.retry')}
            </Text>
          </PressableScale>
        ) : null}
      </View>
      {isUser &&
        (avatar ? (
          <AppImage source={{ uri: avatar }} accessible={false} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: c.surfaceMuted }]}>
            <Ionicons name="person" size={18} color={c.textMuted} />
          </View>
        ))}
    </View>
  );
});

/**
 * The coach chat. Newest message at the bottom (an inverted list keeps it there while the keyboard
 * moves), a message that could not be sent stays on screen with its text and a retry, and a coach
 * that is down (HTTP 503) shows a plain explanation instead of a broken composer.
 */
export default function ChatbotScreen() {
  const { t } = useTranslation();
  const { tokens } = useTheme();
  const c = tokens.color;
  const router = useRouter();
  const listRef = useRef<FlatList<Item>>(null);

  const [items, setItems] = useState<Item[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyFailed, setHistoryFailed] = useState(false);
  const [visibleCount, setVisibleCount] = useState(CHAT_PAGE);
  const [available, setAvailable] = useState(true);
  const [checking, setChecking] = useState(false);
  const { uri: avatar } = useProfilePicture();

  // The latest welcome builder, for callbacks that must not change when the language does.
  const welcomeRef = useRef<() => Item>(() => ({
    id: '',
    role: 'assistant',
    content: '',
    timestamp: 0,
  }));
  const welcome = useCallback(
    (): Item => ({
      id: nextId(),
      role: 'assistant',
      content: t('chat.welcome'),
      timestamp: Date.now(),
    }),
    [t]
  );

  useEffect(() => {
    welcomeRef.current = welcome;
  }, [welcome]);

  const checkHealth = useCallback(async () => {
    setChecking(true);
    try {
      setAvailable(await chatbotService.checkHealth());
    } catch {
      setAvailable(false);
    } finally {
      setChecking(false);
    }
  }, []);

  /** Loads the saved conversation. A failure keeps the welcome message and offers to try again. */
  const loadHistory = useCallback(async (isActive: () => boolean = () => true) => {
    setLoadingHistory(true);
    setHistoryFailed(false);
    try {
      const history = await chatbotService.getConversationHistory();
      const kept = history.filter((m) => !isSystemPrompt(m.content));
      if (isActive()) {
        setItems(
          kept.length > 0 ? kept.map((m) => ({ ...m, id: nextId() })) : [welcomeRef.current()]
        );
        setVisibleCount(CHAT_PAGE);
      }
    } catch (error) {
      logError('chat.history', error);
      if (isActive()) {
        setHistoryFailed(true);
        setItems((prev) => (prev.length > 0 ? prev : [welcomeRef.current()]));
      }
    } finally {
      if (isActive()) setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void checkHealth();
    void loadHistory(() => active);
    return () => {
      active = false;
    };
  }, [checkHealth, loadHistory]);

  /** Sends `item` (already in the list). On failure it stays there, marked, with its text. */
  const deliver = useCallback(
    async (item: Item, history: ChatMessage[]) => {
      setSending(true);
      setItems((prev) => prev.map((m) => (m.id === item.id ? { ...m, status: undefined } : m)));
      try {
        const response = await chatbotService.sendMessage(item.content, history);
        setItems((prev) => [
          ...prev,
          {
            id: nextId(),
            role: 'assistant',
            content: response.message,
            timestamp: response.timestamp,
          },
        ]);
        haptic.select();
      } catch (error: unknown) {
        logError('chat.send', error);
        const { kind, status } = normalizeApiError(error);
        if (status === 503) setAvailable(false);
        const failure =
          status === 503
            ? t('chat.unavailableTitle')
            : kind === 'timeout'
              ? t('chat.timeout')
              : kind === 'offline'
                ? t('errors.offline')
                : t('chat.sendFailed');
        setItems((prev) =>
          prev.map((m) => (m.id === item.id ? { ...m, status: 'failed', failure } : m))
        );
        haptic.error();
      } finally {
        setSending(false);
      }
    },
    [t]
  );

  const send = () => {
    const text = draft.trim();
    if (!text || sending || !available) return;
    const item: Item = { id: nextId(), role: 'user', content: text, timestamp: Date.now() };
    const history = items.filter((m) => m.status !== 'failed').slice(-CHAT_CONTEXT_MESSAGES);
    setItems((prev) => [...prev, item]);
    setDraft('');
    void deliver(item, history);
  };

  const retry = useCallback(
    (item: Item) => {
      if (sending) return;
      const history = items
        .filter((m) => m.id !== item.id && m.status !== 'failed')
        .slice(-CHAT_CONTEXT_MESSAGES);
      void deliver(item, history);
    },
    [deliver, items, sending]
  );

  // The inverted list wants the newest first.
  const data = useMemo(() => [...items].reverse().slice(0, visibleCount), [items, visibleCount]);
  const hasOlder = items.length > visibleCount;
  const showOlder = useCallback(() => setVisibleCount((n) => n + CHAT_PAGE), []);
  const renderItem = useCallback(
    ({ item }: { item: Item }) => <Bubble item={item} avatar={avatar} onRetry={retry} />,
    [avatar, retry]
  );

  const header = (
    <View style={styles.header}>
      <PressableScale
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel={t('common.back')}
        style={styles.back}
      >
        <Ionicons name="arrow-back" size={24} color={c.text} />
      </PressableScale>
      <Text variant="subheading" accessibilityRole="header" style={styles.title}>
        {t('chat.title')}
      </Text>
      <View style={styles.back} />
    </View>
  );

  return (
    <Screen header={header} padded={false}>
      <KeyboardAvoidingView behavior="padding" style={styles.fill}>
        {!available && !loadingHistory ? (
          <View
            style={[styles.notice, { backgroundColor: c.warningSoft }]}
            accessibilityRole="alert"
          >
            <Ionicons name="cloud-offline-outline" size={22} color={c.warningText} />
            <View style={styles.fill}>
              <Text variant="bodyStrong">{t('chat.unavailableTitle')}</Text>
              <Text variant="caption" tone="muted">
                {t('chat.unavailableMessage')}
              </Text>
            </View>
            <Button
              title={t('common.retry')}
              size="small"
              variant="secondary"
              fullWidth={false}
              loading={checking}
              onPress={() => void checkHealth()}
            />
          </View>
        ) : null}

        {historyFailed && !loadingHistory ? (
          <View
            style={[styles.notice, { backgroundColor: c.warningSoft }]}
            accessibilityRole="alert"
          >
            <Ionicons name="time-outline" size={22} color={c.warningText} />
            <Text variant="label" style={styles.fill}>
              {t('chat.historyFailed')}
            </Text>
            <Button
              title={t('common.retry')}
              size="small"
              variant="secondary"
              fullWidth={false}
              onPress={() => void loadHistory()}
            />
          </View>
        ) : null}

        {loadingHistory ? (
          <SkeletonGroup label={t('common.loading')} style={styles.skeleton}>
            <Skeleton width="70%" height={64} radius={16} />
            <Skeleton width="55%" height={44} radius={16} style={styles.right} />
            <Skeleton width="75%" height={80} radius={16} />
          </SkeletonGroup>
        ) : (
          <FlatList
            ref={listRef}
            data={data}
            inverted
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            initialNumToRender={12}
            windowSize={9}
            onEndReached={() => {
              if (hasOlder) showOlder();
            }}
            onEndReachedThreshold={0.4}
            // In an inverted list the footer is the top: older messages are loaded from there.
            ListFooterComponent={
              hasOlder ? (
                <Button
                  variant="ghost"
                  size="small"
                  title={t('chat.earlier')}
                  onPress={showOlder}
                />
              ) : null
            }
            ListHeaderComponent={
              sending ? (
                <View style={styles.typing} accessibilityLabel={t('common.loading')}>
                  <ActivityIndicator size="small" color={c.accent} />
                </View>
              ) : null
            }
          />
        )}

        <View style={[styles.composer, { backgroundColor: c.bg, borderTopColor: c.border }]}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder={t('chat.placeholder')}
            placeholderTextColor={c.textSubtle}
            accessibilityLabel={t('chat.placeholder')}
            editable={available}
            multiline
            maxLength={2000}
            maxFontSizeMultiplier={1.5}
            style={[styles.input, { backgroundColor: c.surfaceMuted, color: c.text }]}
          />
          <PressableScale
            onPress={send}
            disabled={!draft.trim() || sending || !available}
            feedback
            accessibilityRole="button"
            accessibilityLabel={t('chat.send')}
            accessibilityState={{ disabled: !draft.trim() || sending || !available }}
            style={[
              styles.send,
              {
                backgroundColor: draft.trim() && !sending && available ? c.accent : c.disabled,
              },
            ]}
          >
            <Ionicons
              name="send"
              size={20}
              color={draft.trim() && !sending && available ? c.onAccent : c.onDisabled}
            />
          </PressableScale>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center' },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, textAlign: 'center' },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 16,
  },
  skeleton: { padding: 16, gap: 12 },
  right: { alignSelf: 'flex-end' },
  list: { paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  rowUser: { justifyContent: 'flex-end' },
  rowCoach: { justifyContent: 'flex-start' },
  icon: { marginBottom: 8 },
  column: { maxWidth: '78%', gap: 4 },
  bubble: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  time: { alignSelf: 'flex-end', marginTop: 4, fontSize: 11, lineHeight: 14 },
  failed: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44 },
  failedText: { flexShrink: 1, fontFamily: Fonts.semiBold },
  avatar: { width: 32, height: 32, borderRadius: 16 },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  typing: { alignSelf: 'flex-start', padding: 12 },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    fontFamily: Fonts.regular,
  },
  send: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
