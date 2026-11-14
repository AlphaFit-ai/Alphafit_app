import apiClient from './apiClient';
import { logError } from './apiError';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ChatResponse {
  message: string;
  role: string;
  timestamp: number;
  success: boolean;
}

class ChatbotService {
  /**
   * Send a message to the chatbot. Failures are rethrown as they came (see `normalizeApiError`), so
   * the screen can say "offline" or "too slow" in the user's language.
   */
  async sendMessage(
    message: string,
    conversationHistory: ChatMessage[],
    saveHistory: boolean = true
  ): Promise<ChatResponse> {
    try {
      // Format conversation history for API
      const formattedHistory = conversationHistory.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await apiClient.post<ChatResponse>(
        '/chatbot/chat',
        {
          message: message.trim(),
          conversationHistory: formattedHistory,
          saveHistory,
        },
        {
          timeout: 120000, // 2 minutes timeout for AI generation
        }
      );

      return response.data;
    } catch (error: unknown) {
      logError('chatbot.send', error);
      throw error;
    }
  }

  /**
   * Check if chatbot service is available
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await apiClient.get('/chatbot/health');
      // Unavailable (the model is down): still HTTP 200, with `success` and `data` false.
      return response.data.success === true && response.data.data !== false;
    } catch (error) {
      logError('chatbot.health', error);
      return false;
    }
  }

  /**
   * Get conversation history. A failed request is rethrown (it used to come back as an empty list, so
   * the screen could not tell "no history" from "could not load it").
   */
  async getConversationHistory(): Promise<ChatMessage[]> {
    try {
      const response = await apiClient.get('/chatbot/history');
      return response.data.data || [];
    } catch (error) {
      logError('chatbot.history', error);
      throw error;
    }
  }

  /**
   * Clear conversation history
   */
  async clearConversationHistory(): Promise<void> {
    try {
      await apiClient.delete('/chatbot/history');
    } catch (error) {
      logError('chatbot.clearHistory', error);
      throw error;
    }
  }
}

export const chatbotService = new ChatbotService();
