export class ResponseGeneratorService {
  /**
   * Generates a suggested reply based on review rating and content.
   * In production, this would use a LLM (e.g. GPT-4) for nuanced responses.
   */
  async generateReply(
    review: { authorName: string; rating: number; content: string },
    businessProfile: { name: string; tone: 'professional' | 'casual' } = { name: 'The Business', tone: 'professional' }
  ): Promise<string> {
    const { authorName, rating } = review;
    const { name, tone } = businessProfile;

    const prefix = tone === 'professional' ? 'Hi' : 'Hey';
    const signature = `\n\nBest, \n${name}`;

    if (rating >= 5) {
      return `${prefix} ${authorName}, thank you so much for the 5-star review! We're thrilled you enjoyed your experience. See you again soon!${signature}`;
    }

    if (rating >= 4) {
      return `${prefix} ${authorName}, thank you for your feedback! We're glad you had a good experience and we appreciate you taking the time to share your thoughts.${signature}`;
    }

    return `${prefix} ${authorName}, I'm so sorry to hear about your experience. We strive for excellence at ${name} and clearly missed the mark this time. Please contact us directly so we can make it better.${signature}`;
  }
}
