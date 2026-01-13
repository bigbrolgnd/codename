/**
 * OnboardingProgress Component
 *
 * Progress indicator showing the user's position in the 7-step onboarding flow.
 * Displays a progress bar with lightning icon at the leading edge.
 */

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps?: number;
}

const stepLabels = [
  'Start Here',
  'Business Details',
  'Design & Content',
  'Components',
  'Preview',
  'Customer Info',
  'Launch',
];

export function OnboardingProgress({ currentStep, totalSteps = 7 }: OnboardingProgressProps) {
  const progressPercent = ((currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 px-4 pt-4 bg-gradient-to-b from-black/80 to-transparent">
      <div className="max-w-3xl mx-auto">
        {/* Progress Bar Container */}
        <div className="glass-card px-4 py-3">
          <div className="flex items-center gap-4">
            {/* Step Indicator */}
            <div className="flex items-center gap-2 text-sm font-medium text-white min-w-fit">
              <span className="text-[var(--color-accent)]">Step</span>
              <span>{currentStep}</span>
              <span className="text-[var(--text-muted)]">of {totalSteps}</span>
            </div>

            {/* Progress Bar */}
            <div className="flex-1 h-2 bg-black/30 rounded-full overflow-hidden relative">
              {/* Background track */}
              <div className="absolute inset-0 rounded-full" />

              {/* Progress fill with lightning edge */}
              <div
                className="h-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-light)] rounded-full transition-all duration-500 ease-out relative"
                style={{ width: `${progressPercent}%` }}
              >
                {/* Lightning bolt at leading edge */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="drop-shadow-[0_0_8px_var(--color-accent-glow)]"
                  >
                    <path
                      d="M13 2L3 14H12L11 22L21 10H12L13 2Z"
                      fill="var(--color-accent-light)"
                      stroke="#fff"
                      strokeWidth="1"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Current Step Label */}
            <div className="hidden sm:block text-sm text-white font-medium min-w-[120px] text-right">
              {stepLabels[currentStep - 1] || ''}
            </div>
          </div>
        </div>

        {/* Inline styles for glass-card */}
        <style>{`
          .glass-card {
            background: rgba(17, 17, 17, 0.6);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(213, 82, 183, 0.3);
            border-radius: 12px;
            box-shadow: 0 0 20px rgba(213, 82, 183, 0.2);
          }
        `}</style>
      </div>
    </div>
  );
}
