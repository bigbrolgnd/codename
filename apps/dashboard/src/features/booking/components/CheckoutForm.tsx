import React, { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, CreditCard, Lock, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CheckoutFormProps {
  tenantId: string;
  service: { id: string; name: string; price: number };
  slot: string;
  onSuccess: (bookingId: string) => void;
  simulateDelay?: number;
}

export const CheckoutForm: React.FC<CheckoutFormProps> = ({ 
  tenantId, 
  service, 
  slot, 
  onSuccess,
  simulateDelay = 2000
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isPaying, setIsPaying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const createIntentMutation = trpc.booking.createPaymentIntent.useMutation();
  const confirmMutation = trpc.booking.confirmBooking.useMutation();

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPaying(true);

    try {
      // 1. Create Intent
      const intent = await createIntentMutation.mutateAsync({
        tenantId,
        serviceId: service.id,
      });

      // 2. Simulate Payment Delay
      if (simulateDelay > 0) {
        await new Promise(r => setTimeout(r, simulateDelay));
      }

      // 3. Confirm Booking
      const result = await confirmMutation.mutateAsync({
        tenantId,
        customerName: name,
        customerEmail: email,
        serviceId: service.id,
        startTime: slot,
        paymentIntentId: intent.id,
      });

      setIsSuccess(true);
      if (simulateDelay > 0) {
        setTimeout(() => onSuccess(result.bookingId), simulateDelay);
      } else {
        onSuccess(result.bookingId);
      }
    } catch (error) {
      console.error(error);
      setIsPaying(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="p-4 rounded-full bg-emerald-100 text-emerald-600"
        >
          <CheckCircle2 size={48} />
        </motion.div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Booking Confirmed!</h2>
          <p className="text-muted-foreground">Check your email for the confirmation details.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto p-4 space-y-6">
      <Card className="border-emerald-500/20 bg-emerald-500/5">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700">
              <CreditCard size={20} />
            </div>
            <div>
              <p className="text-xs uppercase font-bold text-emerald-800 tracking-wider">Secure Deposit</p>
              <p className="text-sm font-medium">{service.name}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-mono font-bold text-emerald-700">
              ${(service.price * 0.2 / 100).toFixed(2)}
            </p>
            <p className="text-[10px] text-muted-foreground">20% of total</p>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handlePayment} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input 
            id="name" 
            placeholder="Jane Doe" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            required 
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input 
            id="email" 
            type="email" 
            placeholder="jane@example.com" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
        </div>

        {/* Mock Credit Card Input */}
        <div className="space-y-2">
          <Label>Card Details</Label>
          <div className="h-12 rounded-lg border bg-zinc-50 px-3 flex items-center justify-between">
             <span className="text-sm text-zinc-400">•••• •••• •••• ••••</span>
             <span className="text-xs text-zinc-400">MM/YY CVC</span>
          </div>
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Lock size={10} /> Secure checkout powered by Stripe
          </p>
        </div>

        <Button 
          type="submit" 
          size="lg" 
          className="w-full bg-emerald-600 hover:bg-emerald-500"
          disabled={isPaying || !name || !email}
        >
          {isPaying ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing Payment...
            </>
          ) : (
            `Pay $${(service.price * 0.2 / 100).toFixed(2)} Deposit`
          )}
        </Button>
      </form>
    </div>
  );
};
