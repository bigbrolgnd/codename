/**
 * Contrast Checker Component
 * Validates theme color pairs against WCAG 2.1 accessibility standards.
 */

import { useMemo } from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { checkAllContrasts, WCAG_AA_THRESHOLD } from '../utils/contrast-checker';
import type { ThemeStyleProps, HSLAdjustments } from '../types/theme';

interface ContrastCheckerProps {
  styles: ThemeStyleProps;
  adjustments?: HSLAdjustments;
}

export function ContrastChecker({ styles, adjustments }: ContrastCheckerProps) {
  const results = useMemo(() => checkAllContrasts(styles, adjustments), [styles, adjustments]);

  const failingCount = results.filter((r) => !r.passesAA).length;
  const criticalFailingCount = results.filter((r) => r.critical && !r.passesAA).length;
  const allPass = failingCount === 0;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant={allPass ? 'outline' : criticalFailingCount > 0 ? 'destructive' : 'secondary'}
          size="sm"
        >
          {allPass ? (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Contrast OK
            </>
          ) : (
            <>
              <AlertTriangle className="h-4 w-4 mr-2" />
              {failingCount} Issue{failingCount > 1 ? 's' : ''}
            </>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Accessibility Contrast Check</DialogTitle>
          <DialogDescription>
            WCAG 2.1 AA requires a contrast ratio of at least {WCAG_AA_THRESHOLD}:1 for normal
            text. Critical pairs (marked with *) will block publishing if they fail.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          {results.map((result) => (
            <div
              key={result.label}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                !result.passesAA
                  ? result.critical
                    ? 'border-destructive bg-destructive/5'
                    : 'border-yellow-500/50 bg-yellow-500/5'
                  : 'border-border'
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Preview swatch */}
                <div
                  className="w-16 h-10 rounded flex items-center justify-center text-xs font-medium border"
                  style={{
                    backgroundColor: result.bgColor,
                    color: result.fgColor,
                  }}
                >
                  Aa
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {result.label}
                    {result.critical && <span className="text-destructive ml-1">*</span>}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {result.bg} / {result.fg}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    result.passesAA ? (result.passesAAA ? 'default' : 'secondary') : 'destructive'
                  }
                >
                  {result.ratio}:1
                </Badge>
                {result.passesAAA && (
                  <Badge variant="outline" className="text-xs">
                    AAA
                  </Badge>
                )}
                {result.passesAA ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertTriangle
                    className={`h-5 w-5 ${
                      result.critical ? 'text-destructive' : 'text-yellow-500'
                    }`}
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        {criticalFailingCount > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive font-medium">
              {criticalFailingCount} critical contrast issue{criticalFailingCount > 1 ? 's' : ''}{' '}
              must be fixed before publishing.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
