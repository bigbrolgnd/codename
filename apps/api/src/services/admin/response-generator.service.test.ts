import { describe, it, expect } from 'vitest';
import { ResponseGeneratorService } from './response-generator.service';

describe('ResponseGeneratorService', () => {
  const service = new ResponseGeneratorService();

  it('generates a enthusiastic reply for a 5-star review', async () => {
    const review = { authorName: 'Elena', rating: 5, content: 'Amazing service!' };
    const reply = await service.generateReply(review);
    
    expect(reply).toContain('Elena');
    expect(reply.toLowerCase()).toContain('thank you');
  });

  it('generates a professional apology for a low-rating review', async () => {
    const review = { authorName: 'Marcus', rating: 2, content: 'Wait was too long.' };
    const reply = await service.generateReply(review);
    
    expect(reply).toContain('Marcus');
    expect(reply.toLowerCase()).toContain('sorry');
    expect(reply.toLowerCase()).toContain('better');
  });

  it('generates a standard polite reply for a 4-star review', async () => {
    const review = { authorName: 'Leo', rating: 4, content: 'Good overall.' };
    const reply = await service.generateReply(review);
    
    expect(reply).toContain('Leo');
    expect(reply.toLowerCase()).toContain('feedback');
  });
});
