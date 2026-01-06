import React, { useState, useEffect } from 'react';
import { EditableService, DURATION_OPTIONS } from '../../types/smartLedger.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, X, Trash2, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { z } from 'zod';

interface ServiceCardExpandedProps {
  service: EditableService;
  onSave: (id: string, updates: Partial<EditableService>) => void;
  onCancel: () => void;
  onDelete: (id: string) => void;
  className?: string;
}

const EditSchema = z.object({
  name: z.string().min(1, "Name is required"),
  price: z.number().min(0, "Price must be positive"),
  duration: z.number().min(15, "Duration must be at least 15 min"),
  category: z.string().nullable(),
});

export const ServiceCardExpanded = ({
  service,
  onSave,
  onCancel,
  onDelete,
  className
}: ServiceCardExpandedProps) => {
  // State for form fields
  const [name, setName] = useState(service.name);
  const [priceDollars, setPriceDollars] = useState((service.price / 100).toFixed(2));
  const [duration, setDuration] = useState(service.duration);
  const [category, setCategory] = useState(service.category || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSave = () => {
    // Validate
    const priceCents = Math.round(parseFloat(priceDollars) * 100);
    const result = EditSchema.safeParse({
      name,
      price: priceCents,
      duration,
      category: category || null,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      // Handle Zod error structure (issues vs errors)
      const issues = result.error.issues || [];

      if (Array.isArray(issues)) {
        issues.forEach((err: any) => {
          if (err.path && err.path[0]) {
            fieldErrors[err.path[0].toString()] = err.message;
          }
        });
      }

      setErrors(fieldErrors);
      return;
    }

    onSave(service.id, {
      name,
      price: priceCents,
      duration,
      category: category || null,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <motion.div
      layoutId={`card-${service.id}`}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn("relative z-10 my-2", className)}
    >
      <Card className="border-primary/50 shadow-lg ring-1 ring-primary/20">
        <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Editing Service
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(service.id)}
            className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive p-0"
            title="Delete Service"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="p-4 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Service Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              className={cn(errors.name && "border-destructive")}
              placeholder="e.g. Goddess Braids"
              autoFocus
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Price ($)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={priceDollars}
                onChange={(e) => setPriceDollars(e.target.value)}
                onKeyDown={handleKeyDown}
                className={cn(errors.price && "border-destructive")}
              />
              {errors.price && <p className="text-xs text-destructive">{errors.price}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Duration</label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {DURATION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Category</label>
            <Input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. Braids, Color"
            />
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave}>
            <Check className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};
