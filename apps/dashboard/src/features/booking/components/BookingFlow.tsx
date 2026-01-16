import React, { useState } from 'react';
import { useBooking } from '../hooks/useBooking';
import { useTenant } from '@/contexts/TenantContext';
import { ServiceList } from './ServiceList';
import { SlotPicker } from './SlotPicker';
import { CheckoutForm } from './CheckoutForm';
import { Button } from '@/components/ui/button';
import { ChevronLeft, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SiteFooter } from '@/components/SiteFooter';

interface BookingFlowProps {
  tenantId?: string; // Optional prop for testing, defaults to context
  simulateDelay?: number;
}

export const BookingFlow: React.FC<BookingFlowProps> = ({ tenantId: propTenantId, simulateDelay }) => {
  // Use tenant from context, fall back to prop for testing
  const { tenantId: contextTenantId } = useTenant();
  const tenantId = propTenantId ?? contextTenantId;

  if (!tenantId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-red-500">Tenant information not available</p>
      </div>
    );
  }
  const { state, setService, setDate, setSlot, goBack } = useBooking();
  const [bookingId, setBookingId] = useState<string | null>(null);

  if (bookingId) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-6 p-6 text-center bg-gradient-to-br from-pink-500/10 to-purple-500/10 min-h-screen">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center space-y-4"
        >
           <div className="p-4 rounded-full bg-pink-100 text-pink-600">
             <CheckCircle2 size={64} />
           </div>
           <h1 className="text-3xl font-bold tracking-tight text-pink-900">See you soon!</h1>
           <p className="text-zinc-600 max-w-xs">
             Your appointment is confirmed. We've sent the details to your email.
           </p>
           <div className="bg-white/40 backdrop-blur-md px-4 py-2 rounded-lg font-mono text-xs border border-pink-500/20">
             REF: {bookingId.split('-')[0].toUpperCase()}
           </div>
        </motion.div>
        <Button variant="outline" onClick={() => window.location.reload()}>Back to Home</Button>
        <SiteFooter isFreeTier={true} tenantId={tenantId} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-pink-500/10 relative overflow-hidden">
      {/* Header with glassmorphism */}
      <header className="p-4 border-b border-pink-500/20 flex items-center bg-white/40 backdrop-blur-md z-10">
        {state.step !== 'service' && (
          <Button variant="ghost" size="icon" onClick={goBack} className="mr-2">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}
        <div className="flex-1 text-center font-bold tracking-tight text-pink-900">
          {state.step === 'service' && 'BOOK AN APPOINTMENT'}
          {state.step === 'date' && 'SELECT DATE'}
          {state.step === 'slot' && 'SELECT TIME'}
          {state.step === 'checkout' && 'CONFIRM BOOKING'}
        </div>
        {state.step !== 'service' && <div className="w-10" /> /* Spacer */}
      </header>

      {/* Progress Bar with glassmorphism */}
      <div className="h-1 bg-pink-500/20 w-full">
        <motion.div
          className="h-full bg-gradient-to-r from-pink-500 to-pink-600 shadow-lg shadow-pink-500/50"
          initial={{ width: '25%' }}
          animate={{
            width:
              state.step === 'service' ? '25%' :
              state.step === 'date' ? '50%' :
              state.step === 'slot' ? '75%' : '100%'
          }}
        />
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        <AnimatePresence mode="wait">
          {state.step === 'service' && (
            <motion.div
              key="service-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full"
            >
              <ServiceList onSelect={setService} />
            </motion.div>
          )}

          {state.step === 'date' && state.service && (
            <motion.div
              key="date-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full"
            >
              <SlotPicker
                serviceId={state.service.id}
                onSelect={setSlot}
              />
            </motion.div>
          )}

          {state.step === 'checkout' && state.service && state.slot && (
            <motion.div
              key="checkout-step"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="h-full"
            >
              <CheckoutForm
                service={{
                  id: state.service.id,
                  name: state.service.name,
                  price: state.service.price
                }}
                slot={state.slot}
                onSuccess={setBookingId}
                simulateDelay={simulateDelay}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <SiteFooter isFreeTier={true} tenantId={tenantId} />
    </div>
  );
};