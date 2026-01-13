/**
 * Text Generate Effect Component
 * Based on: Aceternity Text Generate Effect
 * Wrapped to consume design system tokens
 */

import { useEffect, useRef, useState } from 'react';
import { cn } from '../../lib/utils';

export interface TextGenerateEffectProps {
  words: string[];
  className?: string;
  duration?: number;
  as?: React.ElementType;
}

export function TextGenerateEffect({
  words,
  className,
  duration = 2000,
  as: Tag = 'h1',
}: TextGenerateEffectProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const startAnimation = () => {
      intervalRef.current = setInterval(() => {
        setCurrentWordIndex((prevIndex) => {
          const word = words[prevIndex];
          const nextIndex = (prevIndex + 1) % words.length;

          if (isDeleting) {
            setCurrentText((text) => word.slice(0, text.length - 1));
            if (currentText.length === 1) {
              setIsDeleting(false);
              return nextIndex;
            }
          } else {
            setCurrentText((text) => {
              const newText = word.slice(0, text.length + 1);
              if (newText.length === word.length) {
                setIsDeleting(true);
                setTimeout(() => {
                  setCurrentWordIndex((prev) => (prev + 1) % words.length);
                  setIsDeleting(false);
                }, 1500);
              }
              return newText;
            });
          }
          return prevIndex;
        });
      }, 50);
    };

    startAnimation();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [words, isDeleting, currentText.length]);

  return (
    <Tag
      className={cn(
        'text-[var(--text-h1)] font-bold text-[var(--text-all)]',
        className
      )}
    >
      {currentText}
      <span className="animate-pulse">|</span>
    </Tag>
  );
}
