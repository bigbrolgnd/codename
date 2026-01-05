import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExtractionConfidenceBanner } from './ExtractionConfidenceBanner';
import { ExtractionResult } from '@codename/api';
import { vi, describe, it, expect } from 'vitest';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  AlertCircle: () => <span data-testid="icon-alert" />,
  CheckCircle: () => <span data-testid="icon-check" />,
  Info: () => <span data-testid="icon-info" />,
  Sparkles: () => <span data-testid="icon-sparkles" />,
}));

const mockResult: ExtractionResult = {
  id: '123',
  services: Array(12).fill({}), // 12 items
  categories: ['Hair', 'Nails'],
  overallConfidence: 95,
  sourceImageUrl: 'http://example.com/img.jpg',
  processingTimeMs: 1000,
  warnings: []
};

describe('ExtractionConfidenceBanner', () => {
  it('renders high confidence state correctly', () => {
    render(<ExtractionConfidenceBanner extractionResult={mockResult} />);
    
    expect(screen.getByText('High Confidence Extraction')).toBeInTheDocument();
    expect(screen.getByText('95% Score')).toBeInTheDocument();
    expect(screen.getByText(/I found 12 services across 2 categories/)).toBeInTheDocument();
    expect(screen.getByTestId('icon-check')).toBeInTheDocument();
  });

  it('renders medium confidence state (Review Suggested) when confidence < 90', () => {
    const mediumResult = { ...mockResult, overallConfidence: 85 };
    render(<ExtractionConfidenceBanner extractionResult={mediumResult} />);
    
    expect(screen.getByText('Review Suggested')).toBeInTheDocument();
    expect(screen.getByText('85% Score')).toBeInTheDocument();
    expect(screen.getByTestId('icon-info')).toBeInTheDocument();
  });

  it('renders low confidence state when confidence < 70', () => {
    const lowResult = { ...mockResult, overallConfidence: 65 };
    render(<ExtractionConfidenceBanner extractionResult={lowResult} />);
    
    expect(screen.getByText('Low Confidence Extraction')).toBeInTheDocument();
    expect(screen.getByText('65% Score')).toBeInTheDocument();
    expect(screen.getByTestId('icon-alert')).toBeInTheDocument();
  });

  it('shows review button when lowConfidenceCount > 0', () => {
    const onReview = vi.fn();
    render(
      <ExtractionConfidenceBanner 
        extractionResult={mockResult} 
        lowConfidenceCount={3} 
        onReviewLowConfidence={onReview} 
      />
    );
    
    // Even with high overall confidence, low items trigger review suggested style usually, 
    // or at least the button should be there.
    // The component logic says: else if (overallConfidence < 90 || lowConfidenceCount > 0) -> Review Suggested.
    // So status should be Review Suggested.
    expect(screen.getByText('Review Suggested')).toBeInTheDocument();
    
    const btn = screen.getByText('Review 3 Items');
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(onReview).toHaveBeenCalled();
  });

  it('does not show review button when lowConfidenceCount is 0', () => {
    render(
      <ExtractionConfidenceBanner 
        extractionResult={mockResult} 
        lowConfidenceCount={0} 
      />
    );
    expect(screen.queryByText(/Review \d+ Items/)).not.toBeInTheDocument();
  });
});
