/**
 * Znapsite.com - Tool-First Onboarding Homepage
 *
 * Value-first UX: Users build and preview their site BEFORE creating an account.
 * Account creation occurs at Step 6, AFTER preview.
 *
 * Course Correction (2026-01-08): Restructured from SaaS landing page to tool-first onboarding.
 */

import { PixelLightning } from './components/backgrounds/PixelLightning';
import { useState, useEffect } from 'react';
import {
  OnboardingProgress,
  WireframeSelector,
  ComponentPicker,
  CustomerInfoForm,
} from './components/onboarding';
import { ComparisonPage } from './pages/ComparisonPage';

// Pricing type matching CustomerInfoForm
interface CalculatedPricing {
  planType: 'free' | 'standard' | 'ai_powered';
  totalPrice: number;
  basePlanPrice: number;
  addonPrices: number;
  breakdown: string[];
}

// Types for onboarding data
interface ExtractedMetadata {
  businessName?: string;
  description?: string;
  industry?: string;
  address?: string;
  website?: string;
  logo?: string;
  // Instagram OAuth fields
  oauthAvailable?: boolean;
  instagramConnected?: boolean;
  instagramProfile?: {
    username?: string;
    biography?: string;
    profile_pic_url?: string;
    website?: string;
    followers_count?: number;
  };
}

interface InstagramOAuthState {
  showAuth: boolean;
  authUrl: string;
}

interface BusinessDetails {
  name: string;
  industry: string;
  location: string;
  phone: string;
}

interface UploadedData {
  type: 'file' | 'text';
  content: string | File;
  extractedMetadata?: ExtractedMetadata;
}

// API: Fetch metadata from URL
async function fetchUrlMetadata(url: string): Promise<ExtractedMetadata> {
  try {
    const response = await fetch('/api/metadata/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      console.warn('Metadata extraction failed:', response.status);
      return {};
    }

    const data = await response.json();
    return {
      businessName: data.businessName || undefined,
      description: data.description || undefined,
      industry: data.industry || undefined,
      address: data.address || undefined,
      website: data.website || undefined,
      logo: data.logo || undefined,
      oauthAvailable: data.rawMetadata?.oauthAvailable || false,
    };
  } catch (error) {
    console.warn('Metadata extraction error:', error);
    return {};
  }
}

// API: Fetch Instagram OAuth URL
async function fetchInstagramAuthUrl(): Promise<string | null> {
  try {
    const response = await fetch('/auth/instagram/url');
    if (!response.ok) return null;
    const data = await response.json();
    return data.authUrl || null;
  } catch (error) {
    console.warn('Failed to fetch Instagram auth URL:', error);
    return null;
  }
}

// Step 2: Business Details Form
function BusinessDetailsForm({
  onNext,
  onBack,
  initialData,
}: {
  onNext: (data: BusinessDetails) => void;
  onBack: () => void;
  initialData?: ExtractedMetadata;
}) {
  // Instagram OAuth state
  const [instagramOAuth, setInstagramOAuth] = useState<InstagramOAuthState | null>(null);
  const [instagramConnecting, setInstagramConnecting] = useState(false);
  // Map extracted metadata to form defaults
  const getInitialIndustry = (industry?: string): string => {
    if (!industry) return '';
    const normalized = industry.toLowerCase();
    if (normalized.includes('salon') || normalized.includes('barber') || normalized.includes('beauty') || normalized.includes('hair') || normalized.includes('nail')) return 'salon';
    if (normalized.includes('clean')) return 'cleaning';
    if (normalized.includes('restaurant') || normalized.includes('food') || normalized.includes('cafe')) return 'restaurant';
    if (normalized.includes('fitness') || normalized.includes('gym') || normalized.includes('training')) return 'fitness';
    if (normalized.includes('creative') || normalized.includes('portfolio') || normalized.includes('design') || normalized.includes('art')) return 'creative';
    return '';
  };

  const [formData, setFormData] = useState({
    name: initialData?.businessName || '',
    industry: getInitialIndustry(initialData?.industry),
    location: initialData?.address || '',
    phone: '',
  });

  // Sync form when initialData is populated (e.g., after URL metadata extraction)
  useEffect(() => {
    if (initialData?.businessName || initialData?.address || initialData?.industry) {
      setFormData({
        name: initialData.businessName || '',
        industry: getInitialIndustry(initialData.industry),
        location: initialData.address || '',
        phone: '',
      });
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext(formData);
  };

  // Handle "Connect Instagram" button click
  const handleConnectInstagram = async () => {
    setInstagramConnecting(true);
    const authUrl = await fetchInstagramAuthUrl();
    if (authUrl) {
      setInstagramOAuth({ showAuth: true, authUrl });
    } else {
      alert('Unable to connect Instagram. Please try again later.');
    }
    setInstagramConnecting(false);
  };

  return (
    <div className="max-w-lg mx-auto">
      {/* Instagram OAuth Modal */}
      {instagramOAuth?.showAuth && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="glass-card p-8 rounded-2xl max-w-md text-center">
            <div className="text-5xl mb-4">📸</div>
            <h2 className="text-2xl font-bold text-white mb-4">
              Connect Your Instagram
            </h2>
            <p className="text-[var(--text-muted)] mb-6">
              Connect your Instagram business account to automatically import your profile info, bio, and images for AI-powered content generation.
            </p>
            <a
              href={instagramOAuth.authUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-[var(--color-accent)] hover:bg-[var(--color-accent-light)]
                     text-white px-8 py-4 rounded-xl font-bold text-lg transition-all"
            >
              Connect Instagram →
            </a>
            <button
              type="button"
              onClick={() => setInstagramOAuth(null)}
              className="mt-4 text-[var(--text-muted)] hover:text-white"
            >
              I'll do this later
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="businessName" className="block text-white text-sm font-medium mb-2">
            Business Name
          </label>
          <input
            id="businessName"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Elena's Braids"
            className="w-full px-4 py-3 rounded-lg bg-[var(--color-surface)]/50 border border-white/20 text-white placeholder:text-[var(--text-muted)] focus:border-[var(--color-accent)] focus:outline-none focus:shadow-[0_0_15px_var(--color-accent-glow)] transition-all"
            required
          />
        </div>

        <div>
          <label htmlFor="industry" className="block text-white text-sm font-medium mb-2">
            Industry
          </label>
          <select
            id="industry"
            value={formData.industry}
            onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
            className="w-full px-4 py-3 rounded-lg bg-[var(--color-surface)]/50 border border-white/20 text-white focus:border-[var(--color-accent)] focus:outline-none transition-all"
            required
          >
            <option value="">Select your industry</option>
            <option value="salon">Salon / Barber</option>
            <option value="cleaning">Cleaning Services</option>
            <option value="restaurant">Restaurant / Food</option>
            <option value="fitness">Fitness / Training</option>
            <option value="creative">Creative / Portfolio</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label htmlFor="location" className="block text-white text-sm font-medium mb-2">
            Location
          </label>
          <input
            id="location"
            type="text"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="City, State"
            className="w-full px-4 py-3 rounded-lg bg-[var(--color-surface)]/50 border border-white/20 text-white placeholder:text-[var(--text-muted)] focus:border-[var(--color-accent)] focus:outline-none focus:shadow-[0_0_15px_var(--color-accent-glow)] transition-all"
            required
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-white text-sm font-medium mb-2">
            Phone (Optional)
          </label>
          <input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="(555) 123-4567"
            className="w-full px-4 py-3 rounded-lg bg-[var(--color-surface)]/50 border border-white/20 text-white placeholder:text-[var(--text-muted)] focus:border-[var(--color-accent)] focus:outline-none focus:shadow-[0_0_15px_var(--color-accent-glow)] transition-all"
          />
        </div>

        {/* Instagram Connect Button - always shown */}
        <div className="bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-orange-500/20 border border-purple-400/30 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">📸</span>
            <div>
              <p className="text-white font-medium">Connect Your Instagram</p>
              <p className="text-[var(--text-muted)] text-sm">
                Import your bio, images, and insights for AI-powered content
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleConnectInstagram}
            disabled={instagramConnecting}
            className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600
                   text-white px-4 py-2 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {instagramConnecting ? 'Connecting...' : 'Connect Instagram'}
          </button>
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 border border-white/30 text-white px-6 py-3 rounded-lg font-semibold transition-all hover:bg-white/10 cursor-pointer"
          >
            Back
          </button>
          <button
            type="submit"
            className="flex-1 bg-[var(--color-accent)] hover:bg-[var(--color-accent-light)] text-white px-6 py-3 rounded-lg font-semibold transition-all hover:shadow-[0_0_20px_var(--color-accent-glow)] cursor-pointer"
          >
            Next
          </button>
        </div>
      </form>
    </div>
  );
}

// Step 5: Preview Site (Theatrical Reveal)
function PreviewSite({ onLaunch, onEdit }: { onLaunch: () => void; onEdit: () => void }) {
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    // Animation completes after 2 seconds
    const timer = setTimeout(() => setIsAnimating(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Isometric Preview Container */}
      <div className="relative">
        <div className={`
          aspect-video bg-black/40 rounded-2xl border-2 border-[var(--color-accent)]/50
          flex items-center justify-center overflow-hidden relative
          ${isAnimating ? 'animate-pulse' : ''}
        `}>
          {/* Blueprint Grid Effect */}
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: `
              linear-gradient(var(--color-accent)/30 1px, transparent 1px),
              linear-gradient(90deg, var(--color-accent)/30 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px',
          }} />

          {/* Preview Content */}
          <div className={`text-center z-10 transition-all duration-1000 ${isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
            <div className="text-6xl mb-4">🏠</div>
            <h2 className="text-3xl font-bold text-white mb-2">Your Website</h2>
            <p className="text-[var(--text-muted)] mb-6">Powered by Znapsite</p>
            <div className="flex gap-4 justify-center text-sm text-[var(--text-muted)]">
              <span className="px-3 py-1 bg-white/10 rounded-full">Smart Calendar</span>
              <span className="px-3 py-1 bg-white/10 rounded-full">Reviews</span>
              <span className="px-3 py-1 bg-white/10 rounded-full">Contact</span>
            </div>
          </div>

          {/* Building Animation Overlay */}
          {isAnimating && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="text-center">
                <div className="text-4xl mb-4 animate-bounce">⚡</div>
                <p className="text-white font-medium">Building your site...</p>
                <div className="mt-4 flex justify-center gap-2">
                  <div className="w-2 h-2 bg-[var(--color-accent)] rounded-full animate-ping" />
                  <div className="w-2 h-2 bg-[var(--color-accent)] rounded-full animate-ping" style={{ animationDelay: '0.2s' }} />
                  <div className="w-2 h-2 bg-[var(--color-accent)] rounded-full animate-ping" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Glow Effect */}
        <div className="absolute -inset-4 bg-[var(--color-accent)]/20 blur-3xl -z-10 rounded-3xl" />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
        <button
          onClick={onEdit}
          className="border border-white/30 text-white px-8 py-3 rounded-lg font-semibold transition-all hover:bg-white/10 cursor-pointer"
        >
          ← Back to Edit
        </button>
        <button
          onClick={onLaunch}
          className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-light)] text-white px-8 py-3 rounded-lg font-semibold transition-all hover:scale-105 hover:shadow-[0_0_30px_var(--color-accent-glow)] cursor-pointer"
        >
          Launch My Site →
        </button>
      </div>
    </div>
  );
}

// Step 7: Deployment / Success
function DeploymentView({ email }: { email: string }) {
  const [status, setStatus] = useState<'deploying' | 'success' | 'error'>('deploying');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const steps = [
      { msg: 'Creating your account...', progress: 25 },
      { msg: 'Provisioning your container...', progress: 50 },
      { msg: 'Configuring your domain...', progress: 75 },
      { msg: 'Deploying your site...', progress: 90 },
      { msg: 'Almost there...', progress: 95 },
    ];

    let stepIndex = 0;
    const interval = setInterval(() => {
      if (stepIndex < steps.length) {
        setProgress(steps[stepIndex].progress);
        stepIndex++;
      } else {
        clearInterval(interval);
        setTimeout(() => setStatus('success'), 500);
      }
    }, 800);

    return () => clearInterval(interval);
  }, []);

  if (status === 'deploying') {
    return (
      <div className="max-w-lg mx-auto text-center">
        <div className="text-6xl mb-6 animate-pulse">⚡</div>
        <h2 className="text-3xl font-bold text-white mb-4">Deploying Your Site</h2>
        <div className="w-full bg-white/10 rounded-full h-2 mb-4 overflow-hidden">
          <div
            className="h-full bg-[var(--color-accent)] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-[var(--text-muted)]" id="deployment-status">
          {progress < 25 ? 'Creating your account...' :
           progress < 50 ? 'Provisioning your container...' :
           progress < 75 ? 'Configuring your domain...' :
           progress < 95 ? 'Deploying your site...' :
           'Almost there...'}
        </p>
      </div>
    );
  }

  // Success / Fade to white transition
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
      <div className={`transition-all duration-1500 ${status === 'success' ? 'opacity-0 translate-y-[-20px]' : 'opacity-100'}`}>
        <div className="text-6xl mb-6">🎉</div>
        <h2 className="text-4xl font-bold text-white mb-4">Your Site is Live!</h2>
        <p className="text-xl text-[var(--text-muted)] mb-8">
          Welcome to Znapsite, {email}!
        </p>
        <p className="text-[var(--text-muted)] mb-8">
          A welcome email has been sent to your inbox.
        </p>
        <div className="bg-[var(--color-accent)]/20 border border-[var(--color-accent)] rounded-lg p-6 max-w-sm mx-auto">
          <p className="text-white text-sm mb-2">Your dashboard</p>
          <p className="text-xs text-[var(--text-muted)]">Manage your site, bookings, and automation</p>
        </div>
      </div>

      {/* Fade to white overlay */}
      {status === 'success' && (
        <div
          className={`
            fixed inset-0 bg-white transition-all duration-[1500ms] ease-in
            ${status === 'success' ? 'opacity-100' : 'opacity-0'}
          `}
          style={{ animation: 'fadeIn 1.5s forwards' }}
        />
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// Main App
function App() {
  const [currentStep, setCurrentStep] = useState(1);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [onboardingData, setOnboardingData] = useState<{
    uploadedData?: UploadedData;
    businessDetails?: BusinessDetails;
    selectedTemplate?: string;
    selectedComponents?: string[];
    email?: string;
    pricing?: CalculatedPricing;
    planType?: 'free' | 'standard' | 'ai_powered';
    billingInterval?: 'monthly' | 'quarterly' | 'annual';
    totalPrice?: number;
  }>({});

  // Listen for popstate (back/forward button)
  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Simple routing for comparison page
  if (currentPath === '/comparison') {
    return (
      <div className="min-h-screen relative">
        <style>{`
          :root {
            --color-accent: #d552b7;
            --color-accent-light: #e91e8c;
            --color-accent-glow: rgba(213, 82, 183, 0.5);
          }
        `}</style>
        <PixelLightning />
        <ComparisonPage />
        <footer className="py-6 px-4 border-t border-white/10 relative z-10 bg-black">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-[var(--text-muted)]">
            <p>© 2025 Znapsite. All rights reserved.</p>
            <div className="flex gap-6">
              <button onClick={() => {
                window.history.pushState({}, '', '/');
                setCurrentPath('/');
              }} className="text-[var(--color-accent)] font-bold hover:text-[var(--color-accent-light)] transition-all cursor-pointer">
                ← Back to Home
              </button>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // Auto-save to localStorage
  useEffect(() => {
    if (currentStep > 1) {
      localStorage.setItem('znapsite_onboarding_step', String(currentStep));
      localStorage.setItem('znapsite_onboarding_data', JSON.stringify(onboardingData));
    }
  }, [currentStep, onboardingData]);

  // Step Handlers
  const handleStep1Complete = (data: UploadedData) => {
    setOnboardingData({ ...onboardingData, uploadedData: data });
    setCurrentStep(2);
  };

  const handleStep2Complete = (data: BusinessDetails) => {
    setOnboardingData({ ...onboardingData, businessDetails: data });
    setCurrentStep(3);
  };

  const handleStep3Complete = (templateId: string) => {
    setOnboardingData({ ...onboardingData, selectedTemplate: templateId });
    setCurrentStep(4);
  };

  const handleStep4Complete = (
    components: string[],
    planType: 'free' | 'standard' | 'ai_powered',
    billingInterval: 'monthly' | 'quarterly' | 'annual',
    totalPrice: number
  ) => {
    setOnboardingData({
      ...onboardingData,
      selectedComponents: components,
      planType,
      billingInterval,
      totalPrice,
    });
    setCurrentStep(5);
  };

  const handleLaunch = () => {
    setCurrentStep(6);
  };

  // Calculate pricing based on selected components
  const calculatePricing = (): CalculatedPricing => {
    const components = onboardingData.selectedComponents || [];

    // Pricing logic (simplified - should match backend)
    const hasAIFeatures = components.some(c => c.includes('ai') || c.includes('vision') || c.includes('smart'));
    const hasMultiPage = components.includes('multi_page');
    const hasPremiumFeeds = (components.filter(c => c.includes('feed') || c.includes('social')).length) > 3;

    let planType: 'free' | 'standard' | 'ai_powered' = 'free';
    let basePlanPrice = 0;
    let addonPrices = 0;
    const breakdown: string[] = [];

    if (hasAIFeatures) {
      planType = 'ai_powered';
      basePlanPrice = 7900; // $79.00
      breakdown.push('AI-Powered Plan ($79/mo)');
      breakdown.push('All add-ons included');
      // Add selected components to breakdown
      components.forEach(c => {
        const name = c.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        breakdown.push(`${name} included`);
      });
    } else if (hasMultiPage || hasPremiumFeeds) {
      planType = 'standard';
      basePlanPrice = 3900; // $39.00
      breakdown.push('Standard Plan ($39/mo)');
      if (hasMultiPage) breakdown.push('Multi-page support');
      if (hasPremiumFeeds) breakdown.push('Premium social feeds');
      // Add selected components to breakdown
      components.forEach(c => {
        const name = c.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        breakdown.push(`${name} included`);
      });
    } else {
      breakdown.push('Free Tier (1 page + 3 feeds)');
      // Add selected components to breakdown
      components.slice(0, 4).forEach(c => {
        const name = c.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        breakdown.push(`${name} included`);
      });
    }

    if (planType !== 'free') {
      breakdown.push('5,000 visits/month included');
    }

    return {
      planType,
      totalPrice: basePlanPrice + addonPrices,
      basePlanPrice,
      addonPrices,
      breakdown,
    };
  };

  const handleStep6Complete = (data: { email: string; password: string; pricing: CalculatedPricing }) => {
    setOnboardingData({ ...onboardingData, email: data.email, pricing: data.pricing });
    setCurrentStep(7);
  };

  return (
    <div className="min-h-screen relative">
      {/* Global Styles */}
      <style>{`
        html {
          scroll-behavior: smooth;
        }
        :root {
          --color-accent: #d552b7;
          --color-accent-light: #e91e8c;
          --color-accent-glow: rgba(213, 82, 183, 0.5);
          --color-surface: #111111;
          --text-muted: rgba(255, 255, 255, 0.6);
          --text-accent: #f0abfc;
        }
      `}</style>

      {/* Pixel Lightning Background */}
      <PixelLightning />

      {/* Progress Indicator - shown on steps 2-6 */}
      {currentStep >= 2 && currentStep <= 6 && <OnboardingProgress currentStep={currentStep} />}

      {/* Main Content */}
      <main className={currentStep <= 6 ? `min-h-screen flex items-center justify-center px-4 relative z-10 ${currentStep >= 2 ? 'pt-36' : 'pt-24'} pb-12` : 'min-h-screen relative z-10'}>
        <div className="w-full max-w-6xl mx-auto">
          {currentStep === 1 && (
            <Step1 onStart={handleStep1Complete} />
          )}

          {currentStep === 2 && (
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Describe your business. AI will build it.</h2>
              <p className="text-[var(--text-muted)]">We'll set up the basics for you.</p>
              {onboardingData.uploadedData?.extractedMetadata && (
                <p className="text-sm text-[var(--color-accent)] mb-4">
                  ✓ We found some info from your link!
                </p>
              )}
              <BusinessDetailsForm
                onNext={handleStep2Complete}
                onBack={() => setCurrentStep(1)}
                initialData={onboardingData.uploadedData?.extractedMetadata}
              />
            </div>
          )}

          {currentStep === 3 && (
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Pick a layout. Or let AI choose.</h2>
              <p className="text-[var(--text-muted)] mb-6">Our AI selects high-conversion elements for your industry.</p>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-white mb-4">Select Template</h3>
                  <WireframeSelector
                    onSelect={handleStep3Complete}
                    selectedTemplate={onboardingData.selectedTemplate}
                  />
                </div>
                <div className="glass-card p-6 rounded-xl">
                  <h3 className="text-lg font-semibold text-white mb-4">Extracted Services</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between text-white p-2 bg-white/10 rounded">
                      <span>Basic Haircut</span>
                      <span className="text-[var(--color-accent)]">$45</span>
                    </div>
                    <div className="flex justify-between text-white p-2 bg-white/10 rounded">
                      <span>Braids (Medium)</span>
                      <span className="text-[var(--color-accent)]">$120</span>
                    </div>
                    <div className="flex justify-between text-white p-2 bg-white/10 rounded">
                      <span>Extensions</span>
                      <span className="text-[var(--color-accent)]">$180</span>
                    </div>
                  </div>
                  <p className="text-[var(--text-muted)] text-xs mt-4">AI extracted from your upload</p>
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="text-[var(--text-muted)] text-sm hover:text-white mt-4 cursor-pointer"
                  >
                    ← Upload different file
                  </button>
                  <style>{`
                    .glass-card {
                      background: rgba(17, 17, 17, 0.6);
                      backdrop-filter: blur(12px);
                      -webkit-backdrop-filter: blur(12px);
                      border: 1px solid rgba(213, 82, 183, 0.3);
                    }
                  `}</style>
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Add features. AI will maintain them.</h2>
              <p className="text-[var(--text-muted)] mb-6">From bookings to reviews, we handle the automation.</p>
              <ComponentPicker
                onContinue={handleStep4Complete}
                onSkip={() => setCurrentStep(5)}
              />
            </div>
          )}

          {currentStep === 5 && (
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white mb-2">See your site live in seconds.</h2>
              <p className="text-[var(--text-muted)] mb-8">
                Your website is built. No account needed to see the magic.
              </p>
              <PreviewSite
                onLaunch={handleLaunch}
                onEdit={() => setCurrentStep(4)}
              />
            </div>
          )}

          {currentStep === 6 && (
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white mb-2">Get your free site: business.znapsite.com</h2>
              <p className="text-[var(--text-muted)] mb-8">
                Your website is on autopilot. Just create an account to claim it.
              </p>
              <CustomerInfoForm
                onLaunch={handleStep6Complete}
                calculatedPricing={calculatePricing()}
                selectedComponents={onboardingData.selectedComponents || []}
              />
            </div>
          )}

          {currentStep === 7 && onboardingData.email && (
            <DeploymentView email={onboardingData.email} />
          )}
        </div>
      </main>

      {/* Footer - minimal */}
      <footer className="py-6 px-4 border-t border-white/10 relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-[var(--text-muted)]">
          <p>© 2025 Znapsite. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-all">Terms</a>
            <a href="#" className="hover:text-white transition-all">Privacy</a>
            <button onClick={() => {
              window.history.pushState({}, '', '/comparison');
              setCurrentPath('/comparison');
            }} className="text-[var(--color-accent)] font-bold hover:text-[var(--color-accent-light)] transition-all cursor-pointer">
              Znapsite vs. Wix
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}


// Step 1: Start Here Component - with tabs (Describe, Link, Upload)
type InputTab = 'describe' | 'link' | 'upload';

function Step1({ onStart }: { onStart: (data: UploadedData) => void }) {
  const [activeTab, setActiveTab] = useState<InputTab>('link');
  const [urlInput, setUrlInput] = useState('');
  const [descriptionInput, setDescriptionInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'link' && urlInput.trim()) {
        const metadata = await fetchUrlMetadata(urlInput);
        onStart({ type: 'text', content: urlInput, extractedMetadata: metadata });
      } else if (activeTab === 'describe' && descriptionInput.trim()) {
        onStart({ type: 'text', content: descriptionInput });
      } else if (activeTab === 'upload' && file) {
        onStart({ type: 'file', content: file });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getIcon = () => {
    const url = urlInput.toLowerCase();
    if (url.includes('instagram')) return '📸';
    if (url.includes('tiktok')) return '🎵';
    if (url.includes('facebook')) return '👥';
    if (url.includes('http')) return '🌐';
    return '🔗';
  };

  const tabs: { key: InputTab; label: string; icon: string }[] = [
    { key: 'describe', label: 'Describe', icon: '✍️' },
    { key: 'link', label: 'Link', icon: '🔗' },
    { key: 'upload', label: 'Upload', icon: '📎' },
  ];

  return (
    <div className="w-full">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tighter">
          Your Website. <span className="text-[var(--color-accent)]">On Autopilot.</span>
        </h1>
        <p className="text-xl md:text-2xl text-[var(--text-muted)] max-w-3xl mx-auto leading-relaxed">
          AI builds it in 2 minutes. Automatically updates with your social posts.
          Handles bookings. Gets you found on Google.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-12 items-center">
        {/* Left Side: Before (The Old Way) */}
        <div className="hidden lg:block space-y-6">
          <div className="glass-card p-8 rounded-3xl border-red-500/20 bg-red-500/5 opacity-60 grayscale hover:grayscale-0 transition-all">
            <h3 className="text-xl font-bold text-red-400 mb-4 flex items-center gap-2">
              <span className="text-2xl">😫</span> The DIY Way
            </h3>
            <ul className="space-y-4 text-[var(--text-muted)]">
              <li className="flex items-start gap-3">
                <span className="text-red-500 font-bold mt-1">✕</span>
                <span>4+ hours of drag-and-drop frustration</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-500 font-bold mt-1">✕</span>
                <span>Manual updates every time you post</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-500 font-bold mt-1">✕</span>
                <span>Confusing SEO settings and hosting</span>
              </li>
            </ul>
          </div>
          
          <div className="text-center">
            <div className="inline-block px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/40 text-sm font-bold uppercase tracking-widest">
              VS
            </div>
          </div>

          <div className="p-8 rounded-3xl border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/5">
            <h3 className="text-xl font-bold text-[var(--color-accent)] mb-4 flex items-center gap-2">
              <span className="text-2xl">⚡</span> The Autopilot Way
            </h3>
            <ul className="space-y-4 text-white">
              <li className="flex items-start gap-3">
                <span className="text-green-500 font-bold mt-1">✓</span>
                <span>2-minute AI-powered creation</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-500 font-bold mt-1">✓</span>
                <span>Zero maintenance. Updates itself.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-500 font-bold mt-1">✓</span>
                <span>Found on Google. Automatically.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Side: After (The Tool) */}
        <div className="max-w-xl mx-auto lg:mx-0">
          <div className="mb-6">
            <style>{`
              .glass-card {
                background: rgba(17, 17, 17, 0.6);
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
                border: 2px solid rgba(213, 82, 183, 0.4);
              }
              .tab-active {
                background: linear-gradient(135deg, var(--color-accent) 0%, #a855f7 100%);
                border-color: transparent;
              }
            `}</style>
            
            <div className="text-center lg:text-left mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Get started in seconds</h2>
              <p className="text-[var(--text-muted)]">Choose how you want AI to learn about you</p>
            </div>

            <div className="inline-flex gap-2 p-1 rounded-xl bg-white/5 border border-white/10 w-full lg:w-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`
                    flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all
                    ${activeTab === tab.key
                      ? 'tab-active text-white'
                      : 'text-[var(--text-muted)] hover:text-white hover:bg-white/10'}
                  `}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <div className="glass-card p-2 rounded-2xl">
              {/* Describe Tab - Textarea */}
              {activeTab === 'describe' && (
                <div className="flex flex-col gap-3">
                  <textarea
                    value={descriptionInput}
                    onChange={(e) => setDescriptionInput(e.target.value)}
                    placeholder="E.g., I run a hair braiding salon in Atlanta called Elena's Braids. We specialize in box braids, cornrows, and twist styles. Our prices range from $45 for basic braids to $180 for full extensions..."
                    rows={5}
                    className="w-full px-4 py-3 bg-white/5 rounded-xl border border-white/10 text-white placeholder:text-[var(--text-muted)] focus:border-[var(--color-accent)] focus:outline-none resize-none"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handleSubmit}
                      disabled={!descriptionInput.trim() || isLoading}
                      className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-light)] disabled:bg-white/20 disabled:cursor-not-allowed text-white px-8 py-4 rounded-xl font-bold text-lg transition-all cursor-pointer"
                    >
                      {isLoading ? 'Processing...' : 'Continue ⚡'}
                    </button>
                  </div>
                </div>
              )}

              {/* Link Tab - URL Input */}
              {activeTab === 'link' && (
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-white/5 rounded-xl border border-white/10">
                    <span className="text-xl">{getIcon()}</span>
                    <input
                      type="text"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://yourbusinesswebsite.com"
                      className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-[var(--text-muted)]"
                      onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    />
                  </div>
                  <button
                    onClick={handleSubmit}
                    disabled={!urlInput.trim() || isLoading}
                    className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-light)] disabled:bg-white/20 disabled:cursor-not-allowed text-white px-8 py-4 rounded-xl font-bold text-lg transition-all cursor-pointer whitespace-nowrap"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Scanning...
                      </span>
                    ) : (
                      'Continue ⚡'
                    )}
                  </button>
                </div>
              )}

              {/* Upload Tab - File Upload */}
              {activeTab === 'upload' && (
                <div className="flex flex-col gap-3">
                  <label
                    className={`
                      flex flex-col items-center justify-center px-8 py-8 rounded-xl border-2 border-dashed
                      ${file ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10' : 'border-white/20 bg-white/5 hover:border-white/40'}
                      cursor-pointer transition-all
                    `}
                  >
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    {file ? (
                      <div className="text-center">
                        <div className="text-4xl mb-2">📄</div>
                        <p className="text-white font-medium">{file.name}</p>
                        <p className="text-sm text-[var(--text-muted)]">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setFile(null);
                          }}
                          className="mt-2 text-sm text-[var(--color-accent)] hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="text-4xl mb-2">📎</div>
                        <p className="text-white font-medium">Click to upload or drag and drop</p>
                        <p className="text-sm text-[var(--text-muted)]">
                          PDF, DOC, TXT, or images
                        </p>
                      </div>
                    )}
                  </label>
                  <div className="flex justify-end">
                    <button
                      onClick={handleSubmit}
                      disabled={!file || isLoading}
                      className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-light)] disabled:bg-white/20 disabled:cursor-not-allowed text-white px-8 py-4 rounded-xl font-bold text-lg transition-all cursor-pointer"
                    >
                      {isLoading ? 'Processing...' : 'Continue ⚡'}
                    </button>
                  </div>
                </div>
              )}

              {/* Helper text */}
              <p className="text-xs text-[var(--text-muted)] mt-3 text-center">
                {activeTab === 'describe' && 'AI will use your description to personalize your website'}
                {activeTab === 'link' && 'AI will scan your website to understand your brand and style'}
                {activeTab === 'upload' && 'AI will extract your services and pricing from the document'}
              </p>
            </div>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center lg:justify-start gap-6 text-sm text-[var(--text-muted)]">
            <div className="flex items-center gap-1">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-[var(--color-accent)]">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" />
                <path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>No credit card</span>
            </div>
            <div className="flex items-center gap-1">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-[var(--color-accent)]">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" />
                <path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>2-minute setup</span>
            </div>
            <div className="flex items-center gap-1">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-[var(--color-accent)]">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" />
                <path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Free to try</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
