/**
 * Theme Preview Component
 * Displays a live preview of the user's site with the current theme applied.
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { RefreshCw, ExternalLink, Smartphone, Monitor, Tablet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useThemeEditor } from '../hooks/useThemeEditor';
import { generateStyleObject } from '../utils/css-generator';

type Viewport = 'desktop' | 'tablet' | 'mobile';

const VIEWPORT_SIZES: Record<Viewport, { width: string; icon: typeof Monitor }> = {
  desktop: { width: '100%', icon: Monitor },
  tablet: { width: '768px', icon: Tablet },
  mobile: { width: '375px', icon: Smartphone },
};

export function ThemePreview() {
  const { themeState } = useThemeEditor();
  const [viewport, setViewport] = useState<Viewport>('desktop');
  const [isLoading, setIsLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Generate CSS custom properties for injection
  const styleVars = useMemo(() => {
    const styles = themeState.styles[themeState.currentMode];
    return generateStyleObject(styles, { adjustments: themeState.hslAdjustments });
  }, [themeState.styles, themeState.currentMode, themeState.hslAdjustments]);

  // Sync theme with iframe via postMessage
  useEffect(() => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: 'THEME_UPDATE', styles: styleVars, mode: themeState.currentMode },
        '*'
      );
    }
  }, [styleVars, themeState.currentMode]);

  // In production, this would fetch the actual preview URL from the tenant config
  useEffect(() => {
    // Simulate loading the preview URL
    const timer = setTimeout(() => {
      // This would be replaced with actual tenant site URL
      setPreviewUrl(null); // Will show placeholder
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 500);
  };

  const handleOpenExternal = () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank');
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-background">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Preview</span>
          <span className="text-xs text-muted-foreground capitalize">
            ({themeState.currentMode} mode)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Viewport Toggle */}
          <ToggleGroup
            type="single"
            value={viewport}
            onValueChange={(v) => v && setViewport(v as Viewport)}
            className="border rounded-md"
          >
            {Object.entries(VIEWPORT_SIZES).map(([key, { icon: Icon }]) => (
              <ToggleGroupItem key={key} value={key} size="sm" className="px-2">
                <Icon className="h-4 w-4" />
              </ToggleGroupItem>
            ))}
          </ToggleGroup>

          {/* Actions */}
          <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleOpenExternal}
            disabled={!previewUrl}
            title="Open in new tab"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 p-4 overflow-auto bg-muted/50 flex items-center justify-center">
        <div
          className="bg-background border rounded-lg shadow-lg overflow-hidden transition-all duration-300"
          style={{
            width: VIEWPORT_SIZES[viewport].width,
            maxWidth: '100%',
            height: '100%',
            aspectRatio: viewport === 'mobile' ? '9/16' : viewport === 'tablet' ? '3/4' : 'auto',
          }}
        >
          {previewUrl ? (
            <iframe
              ref={iframeRef}
              src={`${previewUrl}?preview=true&mode=${themeState.currentMode}`}
              className="w-full h-full border-0"
              title="Site Preview"
            />
          ) : (
            /* Placeholder Preview */
            <div
              className="w-full h-full p-6 overflow-auto"
              style={styleVars as React.CSSProperties}
            >
              {/* Mock Site Header */}
              <header className="flex items-center justify-between mb-8">
                <div
                  className="text-xl font-bold"
                  style={{ color: 'var(--foreground)' }}
                >
                  Your Business
                </div>
                <nav className="flex gap-4">
                  <span
                    className="text-sm"
                    style={{ color: 'var(--muted-foreground)' }}
                  >
                    Services
                  </span>
                  <span
                    className="text-sm"
                    style={{ color: 'var(--muted-foreground)' }}
                  >
                    About
                  </span>
                  <span
                    className="text-sm"
                    style={{ color: 'var(--muted-foreground)' }}
                  >
                    Contact
                  </span>
                </nav>
              </header>

              {/* Mock Hero */}
              <section
                className="rounded-lg p-8 mb-6"
                style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
              >
                <h1 className="text-2xl font-bold mb-2">Welcome to Our Services</h1>
                <p className="opacity-90 mb-4">Professional service for your needs</p>
                <button
                  className="px-4 py-2 rounded-md font-medium"
                  style={{
                    backgroundColor: 'var(--background)',
                    color: 'var(--foreground)',
                    borderRadius: 'var(--radius)',
                  }}
                >
                  Book Now
                </button>
              </section>

              {/* Mock Cards */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {['Service A', 'Service B'].map((service) => (
                  <div
                    key={service}
                    className="p-4 rounded-lg border"
                    style={{
                      backgroundColor: 'var(--card)',
                      color: 'var(--card-foreground)',
                      borderColor: 'var(--border)',
                      borderRadius: 'var(--radius)',
                    }}
                  >
                    <h3 className="font-semibold mb-1">{service}</h3>
                    <p
                      className="text-sm mb-3"
                      style={{ color: 'var(--muted-foreground)' }}
                    >
                      Description of the service goes here.
                    </p>
                    <span
                      className="text-sm font-medium"
                      style={{ color: 'var(--primary)' }}
                    >
                      $50.00
                    </span>
                  </div>
                ))}
              </div>

              {/* Mock Secondary Section */}
              <section
                className="p-6 rounded-lg"
                style={{
                  backgroundColor: 'var(--secondary)',
                  color: 'var(--secondary-foreground)',
                  borderRadius: 'var(--radius)',
                }}
              >
                <h2 className="font-semibold mb-2">Why Choose Us?</h2>
                <p className="text-sm opacity-80">
                  We provide quality service with attention to detail.
                </p>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
