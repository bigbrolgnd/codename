import { ExtractedService } from '@codename/api';

export type BookingStep = 'service' | 'date' | 'slot' | 'checkout';

export interface BookingState {
  step: BookingStep;
  service: ExtractedService | null;
  date: string | null;
  slot: string | null;
}
