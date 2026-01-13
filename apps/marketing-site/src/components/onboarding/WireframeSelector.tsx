/**
 * WireframeSelector Component
 *
 * Step 3: User selects from 6 wireframe layout templates.
 * Each card shows a preview of the layout style.
 */

import { useState } from 'react';

interface WireframeTemplate {
  id: string;
  name: string;
  description: string;
  preview: React.ReactNode;
}

interface WireframeSelectorProps {
  onSelect: (templateId: string) => void;
  selectedTemplate?: string;
}

const templates: WireframeTemplate[] = [
  {
    id: 'hero-center',
    name: 'Hero Center',
    description: 'Centered hero with large headline and CTA',
    preview: (
      <div className="w-full h-full bg-white/10 rounded-t-lg flex items-center justify-center">
        <div className="w-1/2 h-2 bg-white/30 rounded" />
      </div>
    ),
  },
  {
    id: 'hero-split',
    name: 'Hero Split',
    description: 'Split layout with image on left, text on right',
    preview: (
      <div className="w-full h-full bg-white/10 rounded-t-lg flex p-2 gap-2">
        <div className="w-1/2 bg-white/20 rounded" />
        <div className="w-1/2 flex flex-col gap-1">
          <div className="w-3/4 h-2 bg-white/30 rounded" />
          <div className="w-1/2 h-2 bg-white/20 rounded" />
        </div>
      </div>
    ),
  },
  {
    id: 'grid-3col',
    name: 'Grid Gallery',
    description: 'Three-column grid for portfolio or services',
    preview: (
      <div className="w-full h-full bg-white/10 rounded-t-lg flex p-2 gap-1">
        <div className="flex-1 bg-white/20 rounded" />
        <div className="flex-1 bg-white/20 rounded" />
        <div className="flex-1 bg-white/20 rounded" />
      </div>
    ),
  },
  {
    id: 'masonry',
    name: 'Masonry',
    description: 'Masonry grid for visual content',
    preview: (
      <div className="w-full h-full bg-white/10 rounded-t-lg flex p-2 gap-1">
        <div className="flex flex-col gap-1 w-1/2">
          <div className="flex-1 bg-white/20 rounded" />
          <div className="flex-1 bg-white/30 rounded" />
        </div>
        <div className="flex flex-col gap-1 w-1/2">
          <div className="flex-1 bg-white/30 rounded" />
          <div className="flex-1 bg-white/20 rounded" />
        </div>
      </div>
    ),
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean, minimal design with lots of whitespace',
    preview: (
      <div className="w-full h-full bg-white/10 rounded-t-lg flex items-center justify-center">
        <div className="w-1/3 h-2 bg-white/20 rounded" />
      </div>
    ),
  },
  {
    id: 'bold',
    name: 'Bold',
    description: 'Large typography, high contrast design',
    preview: (
      <div className="w-full h-full bg-white/10 rounded-t-lg flex items-center justify-center">
        <div className="w-2/3 h-4 bg-white/40 rounded" />
      </div>
    ),
  },
];

export function WireframeSelector({ onSelect, selectedTemplate }: WireframeSelectorProps) {
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {templates.map((template) => {
        const isSelected = selectedTemplate === template.id;
        const isHovered = hoveredTemplate === template.id;

        return (
          <button
            key={template.id}
            onClick={() => onSelect(template.id)}
            onMouseEnter={() => setHoveredTemplate(template.id)}
            onMouseLeave={() => setHoveredTemplate(null)}
            className={`
              glass-card p-4 rounded-xl transition-all duration-300 cursor-pointer
              ${isSelected ? 'border-[var(--color-accent)] shadow-[0_0_30px_var(--color-accent-glow)]' : ''}
              ${isHovered && !isSelected ? 'scale-105 shadow-[0_0_20px_var(--color-accent-glow)]' : ''}
            `}
          >
            {/* Preview Area */}
            <div className="aspect-video bg-black/30 rounded-lg mb-3 overflow-hidden">
              {template.preview}
            </div>

            {/* Template Info */}
            <h3 className="text-white font-semibold text-sm mb-1">{template.name}</h3>
            <p className="text-[var(--text-muted)] text-xs">{template.description}</p>

            {/* Selection Indicator */}
            {isSelected && (
              <div className="absolute top-3 right-3 w-6 h-6 bg-[var(--color-accent)] rounded-full flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M20 6L9 17L4 12"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            )}

            {/* Inline styles */}
            <style>{`
              .glass-card {
                background: rgba(17, 17, 17, 0.6);
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
                border: 1px solid rgba(213, 82, 183, 0.3);
                position: relative;
              }
            `}</style>
          </button>
        );
      })}
    </div>
  );
}
