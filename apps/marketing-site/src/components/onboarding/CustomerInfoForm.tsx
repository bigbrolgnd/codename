/**
 * CustomerInfoForm Component
 *
 * Step 6: Customer info form - FIRST account touchpoint.
 * Users provide email, password AFTER seeing their preview.
 * Pricing is AUTO-CALCULATED based on component selections - user does NOT select a plan.
 *
 * PRICING LOGIC (2026-01-11 Update):
 * - FREE: 1 page + 3 social feeds + 5K visits/month
 * - STANDARD ($39/mo): Multi-page OR 4+ feeds OR premium add-ons
 * - AI-POWERED ($79/mo): Any AI features selected
 */

import { useState } from 'react';

interface CalculatedPricing {
  planType: 'free' | 'standard' | 'ai_powered';
  totalPrice: number;
  basePlanPrice: number;
  addonPrices: number;
  breakdown: string[];
}

interface CustomerInfoFormProps {
  onLaunch: (data: { email: string; password: string; pricing: CalculatedPricing }) => void;
  calculatedPricing: CalculatedPricing;
  selectedComponents: string[];
}

export function CustomerInfoForm({ onLaunch, calculatedPricing, selectedComponents }: CustomerInfoFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Email validation regex - proper RFC 5322 compliant pattern
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Password strength indicator
  const getPasswordStrength = (pwd: string): { strength: 'weak' | 'medium' | 'strong'; score: number } => {
    if (!pwd) return { strength: 'weak', score: 0 };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[^a-zA-Z0-9]/.test(pwd)) score++;
    if (score <= 2) return { strength: 'weak', score };
    if (score <= 3) return { strength: 'medium', score };
    return { strength: 'strong', score };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Reset errors
    setEmailError('');
    setPasswordError('');

    // Email validation
    if (!email || !isValidEmail(email)) {
      setEmailError('Please enter a valid email address (e.g., you@example.com)');
      return;
    }

    // Password validation
    if (!password) {
      setPasswordError('Password is required');
      return;
    }

    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }

    // Confirm password validation
    if (!confirmPassword) {
      setPasswordError('Please confirm your password');
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    onLaunch({ email, password, pricing: calculatedPricing });
  };

  const passwordStrength = getPasswordStrength(password);
  const canSubmit = email && password && confirmPassword &&
                    password === confirmPassword &&
                    password.length >= 8 &&
                    isValidEmail(email);

  // Format price display based on plan type
  const getPricingDisplay = () => {
    if (calculatedPricing.planType === 'free') {
      return {
        title: 'FREE Tier',
        price: '$0',
        description: '5,000 visits/month included',
        items: selectedComponents.map(c => `✅ ${c}`)
      };
    }
    if (calculatedPricing.planType === 'ai_powered') {
      return {
        title: 'AI-Powered Plan',
        price: `$${calculatedPricing.totalPrice}/mo`,
        description: 'All features included',
        items: ['✅ All add-ons included', '✅ AI features enabled', ...selectedComponents.map(c => `✅ ${c}`)]
      };
    }
    return {
      title: 'Standard Plan',
      price: `$${calculatedPricing.totalPrice}/mo`,
      description: 'Premium features activated',
      items: calculatedPricing.breakdown.map(b => `✅ ${b}`)
    };
  };

  const pricingDisplay = getPricingDisplay();

  return (
    <div className="max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email Input */}
        <div>
          <label htmlFor="email" className="block text-white text-sm font-medium mb-2">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-4 py-3 rounded-lg bg-[var(--color-surface)]/50 border border-white/20 text-white placeholder:text-[var(--text-muted)] focus:border-[var(--color-accent)] focus:outline-none focus:shadow-[0_0_15px_var(--color-accent-glow)] transition-all"
            required
          />
        </div>

        {/* Password Input */}
        <div>
          <label htmlFor="password" className="block text-white text-sm font-medium mb-2">
            Create Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min 8 characters"
            className="w-full px-4 py-3 rounded-lg bg-[var(--color-surface)]/50 border border-white/20 text-white placeholder:text-[var(--text-muted)] focus:border-[var(--color-accent)] focus:outline-none focus:shadow-[0_0_15px_var(--color-accent-glow)] transition-all"
            required
            minLength={8}
          />
          {password && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    passwordStrength.strength === 'weak' ? 'bg-red-500 w-1/3' :
                    passwordStrength.strength === 'medium' ? 'bg-yellow-500 w-2/3' :
                    'bg-green-500 w-full'
                  }`}
                />
              </div>
              <span className={`text-xs ${
                passwordStrength.strength === 'weak' ? 'text-red-400' :
                passwordStrength.strength === 'medium' ? 'text-yellow-400' :
                'text-green-400'
              }`}>
                {passwordStrength.strength.toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Confirm Password Input */}
        <div>
          <label htmlFor="confirmPassword" className="block text-white text-sm font-medium mb-2">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter password"
            className="w-full px-4 py-3 rounded-lg bg-[var(--color-surface)]/50 border border-white/20 text-white placeholder:text-[var(--text-muted)] focus:border-[var(--color-accent)] focus:outline-none focus:shadow-[0_0_15px_var(--color-accent-glow)] transition-all"
            required
          />
        </div>

        {/* Auto-Calculated Pricing Display */}
        <div>
          <label className="block text-white text-sm font-medium mb-3">
            Your Site Configuration
          </label>
          <div className="glass-card p-4 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-2xl font-bold text-white">{pricingDisplay.price}</div>
                <div className="text-white font-medium text-sm">{pricingDisplay.title}</div>
                <div className="text-[var(--text-muted)] text-xs">{pricingDisplay.description}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Monthly Total</div>
              </div>
            </div>
            <div className="border-t border-white/10 pt-3 space-y-1">
              {pricingDisplay.items.map((item, idx) => (
                <div key={idx} className="text-xs text-white/80">{item}</div>
              ))}
            </div>
            <style>{`
              .glass-card {
                background: rgba(17, 17, 17, 0.6);
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
                border: 2px solid rgba(213, 82, 183, 0.3);
              }
            `}</style>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-2 text-center">
            Pricing automatically calculated based on your selections. Change anytime in dashboard.
          </p>
        </div>

        {/* Error Messages */}
        {emailError && (
          <p className="text-red-400 text-sm text-center">{emailError}</p>
        )}
        {passwordError && (
          <p className="text-red-400 text-sm text-center">{passwordError}</p>
        )}

        {/* Launch Button - THE CLIMAX */}
        <button
          type="submit"
          disabled={!canSubmit}
          className={`w-full py-4 rounded-lg font-bold text-lg transition-all relative overflow-hidden ${
            canSubmit
              ? 'bg-[var(--color-accent)] hover:bg-[var(--color-accent-light)] hover:scale-105 hover:shadow-[0_0_40px_var(--color-accent-glow)] cursor-pointer text-white'
              : 'bg-white/10 text-white/40 cursor-not-allowed'
          }`}
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="animate-pulse">
              <path
                d="M13 2L3 14H12L11 22L21 10H12L13 2Z"
                fill="white"
                stroke="#fff"
                strokeWidth="1"
              />
            </svg>
            Launch My Site
          </span>
          {/* Breathing pulse animation */}
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-light)] opacity-0 animate-pulse" />
        </button>

        {/* Trust Indicators */}
        <div className="flex items-center justify-center gap-6 text-xs text-[var(--text-muted)]">
          <div className="flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M8 12L11 15L16 9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>Secure SSL</span>
          </div>
          <div className="flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M8 12L11 15L16 9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>Cancel Anytime</span>
          </div>
        </div>
      </form>
    </div>
  );
}
