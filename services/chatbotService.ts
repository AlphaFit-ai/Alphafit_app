import apiClient from './apiClient';

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
   * Send a message to the chatbot
   */
  async sendMessage(message: string, conversationHistory: ChatMessage[]): Promise<ChatResponse> {
    try {
      // Format conversation history for API
      const formattedHistory = conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await apiClient.post<ChatResponse>('/chatbot/chat', {
        message: message.trim(),
        conversationHistory: formattedHistory,
      });

      return response.data;
    } catch (error: any) {
      console.error('Error sending message to chatbot:', error);
      throw new Error(error.response?.data?.message || 'Failed to send message');
    }
  }

  /**
   * Check if chatbot service is available
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await apiClient.get('/chatbot/health');
      return response.data.success === true;
    } catch (error) {
      console.error('Error checking chatbot health:', error);
      return false;
    }
  }

  /**
   * Get conversation history
   */
  async getConversationHistory(): Promise<ChatMessage[]> {
    try {
      const response = await apiClient.get('/chatbot/history');
      return response.data.data || [];
    } catch (error) {
      console.error('Error getting conversation history:', error);
      return [];
    }
  }

  /**
   * Clear conversation history
   */
  async clearConversationHistory(): Promise<void> {
    try {
      await apiClient.delete('/chatbot/history');
    } catch (error) {
      console.error('Error clearing conversation history:', error);
      throw error;
    }
  }
}

export const chatbotService = new ChatbotService();
