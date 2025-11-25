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

  useEffect(() => {
    checkChatbotHealth();
    loadUserProfilePicture();
    loadConversationHistory();
  }, []);

  const loadConversationHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const history = await chatbotService.getConversationHistory();
      
      if (history && history.length > 0) {
        setMessages(history);
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
    paddingHorizontal: Spacing.screenPaddingHorizontal,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: Fonts.sizes.lg,
    fontFamily: Fonts.bold,
    marginBottom: 2,
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
