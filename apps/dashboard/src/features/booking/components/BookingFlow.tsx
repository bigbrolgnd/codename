import React, { useState } from 'react';
import { useBooking } from '../hooks/useBooking';
import { ServiceList } from './ServiceList';
import { SlotPicker } from './SlotPicker';
import { CheckoutForm } from './CheckoutForm';
import { Button } from '@/components/ui/button';
import { ChevronLeft, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SiteFooter } from '@/components/SiteFooter';

interface BookingFlowProps {
  tenantId: string;
  simulateDelay?: number;
}

export const BookingFlow: React.FC<BookingFlowProps> = ({ tenantId, simulateDelay }) => {
  const { state, setService, setDate, setSlot, goBack } = useBooking();
  const [bookingId, setBookingId] = useState<string | null>(null);

  if (bookingId) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-6 p-6 text-center bg-background">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center space-y-4"
        >
           <div className="p-4 rounded-full bg-emerald-100 text-emerald-600">
             <CheckCircle2 size={64} />
           </div>
           <h1 className="text-3xl font-bold tracking-tight text-emerald-900">See you soon!</h1>
           <p className="text-muted-foreground max-w-xs">
             Your appointment is confirmed. We've sent the details to your email.
           </p>
           <div className="bg-muted px-4 py-2 rounded-lg font-mono text-xs border">
             REF: {bookingId.split('-')[0].toUpperCase()}
           </div>
        </motion.div>
        <Button variant="outline" onClick={() => window.location.reload()}>Back to Home</Button>
        <SiteFooter isFreeTier={true} tenantId={tenantId} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background relative overflow-hidden">
      {/* Header */}
      <header className="p-4 border-b flex items-center bg-background/95 backdrop-blur z-10">
        {state.step !== 'service' && (
          <Button variant="ghost" size="icon" onClick={goBack} className="mr-2">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}
        <div className="flex-1 text-center font-bold tracking-tight">
          {state.step === 'service' && 'BOOK AN APPOINTMENT'}
          {state.step === 'date' && 'SELECT DATE'}
          {state.step === 'slot' && 'SELECT TIME'}
          {state.step === 'checkout' && 'CONFIRM BOOKING'}
        </div>
        {state.step !== 'service' && <div className="w-10" /> /* Spacer */}
      </header>

      {/* Progress Bar */}
      <div className="h-1 bg-muted w-full">
        <motion.div 
          className="h-full bg-emerald-500"
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
              <ServiceList tenantId={tenantId} onSelect={setService} />
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
                tenantId={tenantId} 
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
                tenantId={tenantId}
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