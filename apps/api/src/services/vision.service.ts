import { ExtractedService, ExtractionResult } from '@codename/api';
// import { v4 as uuidv4 } from 'uuid';

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export class VisionService {
  async processImage(imageUrl: string): Promise<ExtractionResult> {
    // MOCK: Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // MOCK: Return dummy data
    const services: ExtractedService[] = [
      {
        id: uuidv4(),
        name: 'Goddess Braids',
        price: 15000, // 150.00
        duration: 240,
        category: 'Braids',
        confidence: 98,
        description: 'Waist length, pre-stretched hair included.',
      },
      {
        id: uuidv4(),
        name: 'Silk Press',
        price: 8500, // 85.00
        duration: 90,
        category: 'Natural Hair',
        confidence: 95,
        description: 'Includes wash, deep condition, and trim.',
      },
    ];

    return {
      id: uuidv4(),
      services,
      categories: ['Braids', 'Natural Hair'],
      overallConfidence: 96,
      sourceImageUrl: imageUrl,
      processingTimeMs: 3000,
      warnings: [],
    };
  }
}
