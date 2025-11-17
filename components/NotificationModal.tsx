import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Fonts, Spacing } from '../constants';
import { useTheme } from '../context/ThemeContext';

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'workout' | 'diet' | 'achievement' | 'general';
}

interface NotificationModalProps {
  visible: boolean;
  onClose: () => void;
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'New Workout Available',
    message: 'Your personalized chest workout is ready!',
    time: '2 hours ago',
    read: false,
    type: 'workout',
  },
  {
    id: '2',
    title: 'Diet Plan Updated',
    message: 'Your meal plan has been optimized based on your progress.',
    time: '5 hours ago',
    read: false,
    type: 'diet',
  },
  {
    id: '3',
    title: 'Achievement Unlocked',
    message: 'Congratulations! You completed 7 days in a row.',
    time: '1 day ago',
    read: true,
    type: 'achievement',
  },
  {
    id: '4',
    title: 'Weekly Progress Report',
    message: 'Your weekly summary is now available.',
    time: '2 days ago',
    read: true,
    type: 'general',
  },
];

export default function NotificationModal({ visible, onClose }: NotificationModalProps) {
  const { t } = useTranslation();
  const { colors, isDarkMode } = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);

  const getIconName = (type: Notification['type']) => {
    switch (type) {
      case 'workout':
        return 'barbell';
      case 'diet':
        return 'restaurant';
      case 'achievement':
        return 'trophy';
      default:
        return 'notifications';
    }
  };

  const getIconColor = (type: Notification['type']) => {
    switch (type) {
      case 'workout':
        return Colors.primary;
      case 'diet':
        return '#4CAF50';
      case 'achievement':
        return Colors.gold;
      default:
        return colors.text;
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif => (notif.id === id ? { ...notif, read: true } : notif))
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View>
              <Text style={[styles.title, { color: colors.text }]}>
                {t('notifications.title')}
              </Text>
              {unreadCount > 0 && (
                <Text style={[styles.unreadCount, { color: colors.textSecondary }]}>
                  {unreadCount} {t('notifications.unread')}
                </Text>
              )}
            </View>
            <View style={styles.headerActions}>
              {unreadCount > 0 && (
                <TouchableOpacity onPress={markAllAsRead} style={styles.markAllButton}>
                  <Text style={[styles.markAllText, { color: Colors.primary }]}>
                    {t('notifications.markAllRead')}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Notifications List */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {notifications.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="notifications-off-outline" size={64} color={colors.textSecondary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  {t('notifications.empty')}
                </Text>
              </View>
            ) : (
              notifications.map((notification) => (
                <TouchableOpacity
                  key={notification.id}
                  style={[
                    styles.notificationItem,
                    {
                      backgroundColor: notification.read
                        ? colors.background
                        : isDarkMode
                        ? Colors.gray[800]
                        : Colors.gray[50],
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => markAsRead(notification.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.iconContainer, { backgroundColor: `${getIconColor(notification.type)}20` }]}>
                    <Ionicons
                      name={getIconName(notification.type)}
                      size={24}
                      color={getIconColor(notification.type)}
                    />
                  </View>

                  <View style={styles.notificationContent}>
                    <View style={styles.notificationHeader}>
                      <Text style={[styles.notificationTitle, { color: colors.text }]}>
                        {notification.title}
                      </Text>
                      {!notification.read && <View style={styles.unreadDot} />}
                    </View>
                    <Text
                      style={[styles.notificationMessage, { color: colors.textSecondary }]}
                      numberOfLines={2}
                    >
                      {notification.message}
                    </Text>
                    <Text style={[styles.notificationTime, { color: colors.textSecondary }]}>
                      {notification.time}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    height: '85%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenPaddingHorizontal,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 28,
    fontFamily: Fonts.bold,
    marginBottom: 4,
  },
  unreadCount: {
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  markAllButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  markAllText: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.screenPaddingHorizontal,
    paddingVertical: 16,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    marginTop: 16,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  notificationMessage: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    marginBottom: 8,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: 12,
    fontFamily: Fonts.regular,
  },
});
