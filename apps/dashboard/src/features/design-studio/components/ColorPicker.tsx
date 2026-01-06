/**
 * Color Picker Component
 * Individual color input with visual swatch and popover picker.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { convertToHex, isValidColor } from '../utils/color-converter';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  className?: string;
}

const DEBOUNCE_MS = 150;

export function ColorPicker({ label, value, onChange, className }: ColorPickerProps) {
  const [inputValue, setInputValue] = useState(value);
  const [isValid, setIsValid] = useState(true);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Sync external value changes
  useEffect(() => {
    setInputValue(value);
    setIsValid(isValidColor(value));
  }, [value]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Debounced change handler for text input
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInputValue(newValue);

      // Clear pending debounce
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      // Validate and update
      const valid = isValidColor(newValue);
      setIsValid(valid);

      if (valid) {
        debounceRef.current = setTimeout(() => {
          onChange(newValue);
        }, DEBOUNCE_MS);
      }
    },
    [onChange]
  );

  // Direct change from color picker (no debounce needed)
  const handleColorPickerChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInputValue(newValue);
      setIsValid(true);
      onChange(newValue);
    },
    [onChange]
  );

  // Convert value to hex for the native color picker
  const hexValue = convertToHex(value);

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <Label className="w-28 text-sm text-muted-foreground truncate" title={label}>
        {label}
      </Label>

      <Popover>
        <PopoverTrigger asChild>
          <button
            className={cn(
              'h-8 w-8 rounded-md border shadow-sm cursor-pointer transition-all',
              'hover:ring-2 hover:ring-ring hover:ring-offset-2',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
            )}
            style={{ backgroundColor: isValid ? value : '#ff0000' }}
            aria-label={`Pick color for ${label}`}
          />
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3" align="start" sideOffset={8}>
          <input
            type="color"
            value={hexValue.startsWith('#') ? hexValue : '#000000'}
            onChange={handleColorPickerChange}
            className="w-32 h-32 cursor-pointer border-0 p-0"
          />
        </PopoverContent>
      </Popover>

      <Input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        placeholder="oklch(...) or #hex"
        className={cn(
          'flex-1 font-mono text-sm',
          !isValid && 'border-destructive focus-visible:ring-destructive'
        )}
      />
    </div>
  );
}
