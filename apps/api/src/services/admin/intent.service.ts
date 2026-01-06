export class IntentService {
  /**
   * Simple rule-based intent recognition for demo purposes
   */
  async process(message: string): Promise<{ reply: string, intent?: string }> {
    const text = message.toLowerCase();

    if (text.includes('block') || text.includes('unavailable') || text.includes('off')) {
      return {
        reply: "Understood. I can help you block off time. Which day specifically are we talking about?",
        intent: 'block_time'
      };
    }

    if (text.includes('price') || text.includes('cost') || text.includes('charge')) {
      return {
        reply: "I see you're looking to adjust your pricing. I can update your services instantly. Which service should we change?",
        intent: 'update_price'
      };
    }

    if (text.includes('hi') || text.includes('hello') || text.includes('hey')) {
      return {
        reply: "Hello! I'm your Business Agent. How can I help you automate your operations today?",
        intent: 'greeting'
      };
    }

    return {
      reply: "I'm processing your request. I can help with scheduling, pricing updates, and site content. Could you be a bit more specific?",
      intent: 'general_inquiry'
    };
  }
}
