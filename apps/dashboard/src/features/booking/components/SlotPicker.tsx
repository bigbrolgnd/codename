import React, { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Loader2, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SlotPickerProps {
  tenantId: string;
  serviceId: string;
  onSelect: (slot: string) => void;
}

export const SlotPicker: React.FC<SlotPickerProps> = ({ tenantId, serviceId, onSelect }) => {
  const [selectedDate, setSelectedId] = useState<string>(new Date().toISOString().split('T')[0]);

  const slotsQuery = trpc.booking.getAvailableSlots.useQuery({
    tenantId,
    serviceId,
    date: selectedDate,
  });

  // Generate next 7 days for the date picker
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  return (
    <div className="w-full max-w-2xl mx-auto p-4 flex flex-col h-full">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold">Pick a Time</h2>
        <p className="text-muted-foreground">Select your preferred date and time.</p>
      </div>

      {/* Simple Horizontal Date Picker */}
      <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
        {dates.map((date) => {
          const d = new Date(date);
          const isSelected = selectedDate === date;
          return (
            <Button
              key={date}
              variant={isSelected ? 'default' : 'outline'}
              className={`flex-shrink-0 flex flex-col h-16 w-16 p-0 rounded-xl transition-all ${
                isSelected ? 'bg-emerald-600 hover:bg-emerald-500' : 'hover:border-emerald-500/50'
              }`}
              onClick={() => setSelectedId(date)}
            >
              <span className="text-[10px] uppercase opacity-70">
                {d.toLocaleDateString('en-US', { weekday: 'short' })}
              </span>
              <span className="text-lg font-bold">
                {d.getUTCDate()}
              </span>
            </Button>
          );
        })}
      </div>

      <div className="flex-1 mt-4">
        {slotsQuery.isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            <p className="text-sm text-muted-foreground font-mono">Scanning availability...</p>
          </div>
        ) : slotsQuery.error ? (
          <div className="text-center py-12 text-red-500">
            Failed to load time slots.
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div 
              key={selectedDate}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-3 sm:grid-cols-4 gap-3"
            >
              {slotsQuery.data?.length === 0 ? (
                <div className="col-span-full text-center py-12 space-y-4">
                  <div className="p-4 rounded-full bg-muted w-fit mx-auto">
                    <Clock className="h-8 w-8 opacity-20" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium">No slots available</p>
                    <p className="text-sm text-muted-foreground max-w-[200px] mx-auto">
                      Try selecting a different date from the calendar above.
                    </p>
                  </div>
                </div>
              ) : (
                slotsQuery.data?.map((slot) => {
                  const time = new Date(slot).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  });
                  return (
                    <Button
                      key={slot}
                      variant="outline"
                      className="h-12 text-sm font-medium hover:border-emerald-500 hover:bg-emerald-500/5 active:scale-95 transition-all"
                      onClick={() => onSelect(slot)}
                    >
                      {time}
                    </Button>
                  );
                })
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};
