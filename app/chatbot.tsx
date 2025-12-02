import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Fonts, Spacing } from '../constants';
import { useTheme } from '../context/ThemeContext';
import { chatbotService, ChatMessage, imageService } from '../services';

export default function ChatbotScreen() {
  const { colors, isDarkMode } = useTheme();
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isChatbotAvailable, setIsChatbotAvailable] = useState(true);
  const [userProfilePicture, setUserProfilePicture] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  const [showScrollBottom, setShowScrollBottom] = useState(false);

  useEffect(() => {
    checkChatbotHealth();
    loadUserProfilePicture();
    loadConversationHistory();
  }, []);

  // Auto-scroll to bottom when history is loaded
  useEffect(() => {
    if (!isLoadingHistory) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: false });
      }, 100);
    }
  }, [isLoadingHistory]);

  const loadConversationHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const history = await chatbotService.getConversationHistory();

      if (history && history.length > 0) {
        // Filter out system prompts that might have been saved in history
        const filteredHistory = history.filter(msg => {
          const content = msg.content.toLowerCase();
          // Filter out messages that look like system prompts
          const isSystemPrompt =
            content.includes('as a nutrition expert') ||
            content.includes('generate a short, inspiring quote') ||
            content.includes('analyze this meal') ||
            content.includes('generate a response');

          return !isSystemPrompt;
        });

        setMessages(filteredHistory);
      } else {
        // Show welcome message if no history
        setMessages([{
          role: 'assistant',
          content: 'Hello! I\'m your AlphaFit AI coach. I\'m here to help you with fitness, nutrition, and wellness questions. How can I assist you today?',
          timestamp: Date.now(),
        }]);
      }
    } catch (error) {
      console.error('Error loading conversation history:', error);
      // Show welcome message on error
      setMessages([{
        role: 'assistant',
        content: 'Hello! I\'m your AlphaFit AI coach. I\'m here to help you with fitness, nutrition, and wellness questions. How can I assist you today?',
        timestamp: Date.now(),
      }]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const loadUserProfilePicture = async () => {
    try {
      const profilePicUrl = await imageService.getProfilePicture();
      setUserProfilePicture(profilePicUrl);
    } catch (error) {
      console.log('No profile picture found');
    }
  };

  const checkChatbotHealth = async () => {
    try {
      const isAvailable = await chatbotService.checkHealth();
      setIsChatbotAvailable(isAvailable);
      if (!isAvailable) {
        Alert.alert(
          'Service Unavailable',
          'The AI chatbot service is currently unavailable. Please try again later.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      setIsChatbotAvailable(false);
    }
  };

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 50;
    setShowScrollBottom(!isCloseToBottom);
  };

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    if (!isChatbotAvailable) {
      Alert.alert(
        'Service Unavailable',
        'The AI chatbot service is currently unavailable. Please try again later.'
      );
      return;
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputMessage.trim(),
      timestamp: Date.now(),
    };

    // Add user message to chat
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Send message to backend
      const response = await chatbotService.sendMessage(
        userMessage.content,
        messages
      );

      // Add assistant response to chat
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.message,
        timestamp: response.timestamp,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error: any) {
      console.error('Error sending message:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to send message. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = (message: ChatMessage, index: number) => {
    const isUser = message.role === 'user';

    return (
      <View
        key={index}
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.assistantMessageContainer,
        ]}
      >
        {!isUser && (
          <Ionicons name="sparkles" size={20} color={Colors.primary} style={styles.messageIcon} />
        )}
        <View
          style={[
            styles.messageBubble,
            isUser
              ? { backgroundColor: Colors.primary }
              : {
                backgroundColor: isDarkMode ? Colors.gray[800] : Colors.gray[100],
                borderColor: isDarkMode ? Colors.gray[700] : Colors.gray[200],
                borderWidth: 1,
              },
          ]}
        >
          <Text
            style={[
              styles.messageText,
              { color: isUser ? Colors.white : colors.text },
            ]}
          >
            {message.content}
          </Text>
        </View>
        {isUser && (
          userProfilePicture ? (
            <Image source={{ uri: userProfilePicture }} style={styles.userAvatar} />
          ) : (
            <Ionicons name="person" size={24} color={Colors.gray[500]} style={styles.messageIcon} />
          )
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: isDarkMode ? Colors.gray[900] : Colors.white,
            borderBottomColor: isDarkMode ? Colors.gray[800] : Colors.gray[200],
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            AI Coach
          </Text>
        </View>
        <View style={styles.headerRightPlaceholder} />
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {isLoadingHistory ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : (
            messages.map((message, index) => renderMessage(message, index))
          )}
          {isLoading && !isLoadingHistory && (
            <View style={styles.loadingContainer}>
              <View
                style={[
                  styles.messageBubble,
                  {
                    backgroundColor: isDarkMode ? Colors.gray[800] : Colors.gray[100],
                    borderColor: isDarkMode ? Colors.gray[700] : Colors.gray[200],
                    borderWidth: 1,
                  },
                ]}
              >
                <ActivityIndicator size="small" color={Colors.primary} />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Scroll to Bottom Button */}
        {showScrollBottom && (
          <TouchableOpacity
            style={[styles.scrollToBottomButton, { backgroundColor: isDarkMode ? Colors.gray[800] : Colors.white }]}
            onPress={scrollToBottom}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-down" size={20} color={Colors.primary} />
          </TouchableOpacity>
        )}

        {/* Input Area */}
        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: isDarkMode ? Colors.gray[900] : Colors.white,
              borderTopColor: isDarkMode ? Colors.gray[800] : Colors.gray[200],
            },
          ]}
        >
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: isDarkMode ? Colors.gray[800] : Colors.gray[100],
                color: colors.text,
              },
            ]}
            placeholder="Ask me about fitness, nutrition..."
            placeholderTextColor={colors.textSecondary}
            value={inputMessage}
            onChangeText={setInputMessage}
            multiline
            maxLength={500}
            editable={!isLoading && isChatbotAvailable}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              {
                backgroundColor:
                  inputMessage.trim() && !isLoading && isChatbotAvailable
                    ? Colors.primary
                    : Colors.gray[400],
              },
            ]}
            onPress={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading || !isChatbotAvailable}
          >
            <Ionicons
              name="send"
              size={20}
              color={Colors.white}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.screenPaddingHorizontal,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRightPlaceholder: {
    width: 40,
  },
  headerTitle: {
    fontSize: Fonts.sizes.lg,
    fontFamily: Fonts.bold,
  },
  headerSubtitle: {
    fontSize: Fonts.sizes.xs,
    fontFamily: Fonts.regular,
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: Spacing.screenPaddingHorizontal,
    paddingVertical: 16,
    paddingBottom: 20,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  assistantMessageContainer: {
    justifyContent: 'flex-start',
  },
  messageIcon: {
    marginHorizontal: 4,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginHorizontal: 4,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    marginHorizontal: 8,
  },
  messageText: {
    fontSize: Fonts.sizes.base,
    fontFamily: Fonts.regular,
    lineHeight: 24,
  },
  loadingContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  scrollToBottomButton: {
    position: 'absolute',
    right: 20,
    bottom: 90,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.screenPaddingHorizontal,
    paddingVertical: 20,
  },
  input: {
    flex: 1,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: Fonts.sizes.base,
    fontFamily: Fonts.regular,
    marginRight: 8,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
});
