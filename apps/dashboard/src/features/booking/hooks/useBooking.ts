import { useState, useCallback } from 'react';
import { BookingState, BookingStep } from '../types/booking.types';
import { ExtractedService } from '@codename/api';

export function useBooking() {
  const [state, setState] = useState<BookingState>({
    step: 'service',
    service: null,
    date: null,
    slot: null,
  });

  const setService = useCallback((service: ExtractedService) => {
    setState(prev => ({ ...prev, service, step: 'date' }));
  }, []);

  const setDate = useCallback((date: string) => {
    setState(prev => ({ ...prev, date, step: 'slot' }));
  }, []);

  const setSlot = useCallback((slot: string) => {
    setState(prev => ({ ...prev, slot, step: 'checkout' }));
  }, []);

  const goBack = useCallback(() => {
    setState(prev => {
      if (prev.step === 'date') return { ...prev, step: 'service', service: null };
      if (prev.step === 'slot') return { ...prev, step: 'date', date: null };
      if (prev.step === 'checkout') return { ...prev, step: 'slot', slot: null };
      return prev;
    });
  }, []);

  return {
    state,
    setService,
    setDate,
    setSlot,
    goBack,
  };
}
