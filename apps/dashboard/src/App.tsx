import { useState, useEffect } from 'react'
import ServiceUpload from './features/onboarding/components/ServiceUpload'
import { SmartLedger } from './features/onboarding/components/SmartLedger'
import { TheatricalReveal } from './features/onboarding/components/TheatricalReveal'
import { ExtractionResult } from '@codename/api'
import { EditableService } from './features/onboarding/types/smartLedger.types'
import { DashboardLayout } from './features/admin/components/DashboardLayout'
import { BookingFlow } from './features/booking/components/BookingFlow'

// Valid tenant ID pattern: tenant_ followed by alphanumeric characters
const TENANT_ID_PATTERN = /^tenant_[a-zA-Z0-9_]+$/;

function App() {
  const [step, setStep] = useState<'welcome' | 'upload' | 'review' | 'reveal' | 'dashboard' | 'booking'>('welcome')
  const [bookingTenantId, setBookingTenantId] = useState<string | null>(null)
  const [bookingError, setBookingError] = useState<string | null>(null)
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null)
  const [confirmedServices, setConfirmedServices] = useState<EditableService[]>([])

  useEffect(() => {
    // Dev mode bypass to jump straight to the dashboard for testing
    const params = new URLSearchParams(window.location.search);
    if (params.get('dev') === 'true') {
      setStep('dashboard');
    }

    // Booking route: ?booking=true&tenant=tenant_xxx
    if (params.get('booking') === 'true') {
      const tenant = params.get('tenant');
      if (tenant) {
        // Validate tenant ID format to prevent injection attacks
        if (!TENANT_ID_PATTERN.test(tenant)) {
          setBookingError('Invalid tenant ID format');
          return;
        }
        setBookingTenantId(tenant);
        setStep('booking');
      } else {
        setBookingError('Tenant ID is required for booking');
      }
    }
  }, []);

  // Welcome Step
  if (step === 'welcome') {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center">
          <header className="mb-8 text-center">
            <h1 className="text-5xl font-bold tracking-tighter text-pink-500 mb-2">codename</h1>
            <p className="text-zinc-400 text-lg italic">"Your Business, Automated."</p>
          </header>

          <main className="w-full max-w-md glass-card p-8 shadow-2xl">
            <div className="space-y-6">
              <div className="p-5 glass-dark rounded-xl border border-pink-500/20">
                <h2 className="text-xl font-semibold mb-3">Zero-Touch Setup</h2>
                <p className="text-zinc-400 leading-relaxed">
                  Transform your price list into a fully functional web app in minutes.
                </p>
              </div>
              <button
                onClick={() => setStep('upload')}
                className="w-full py-4 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-pink-900/20 active:scale-95 glow-soft"
              >
                Start Onboarding
              </button>
            </div>
          </main>
        </div>
      </div>
    )
  }

  // Upload Step
  if (step === 'upload') {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col items-center justify-center p-4">
        <ServiceUpload
          onUploadComplete={(result) => {
            setExtractionResult(result);
            setStep('review');
          }}
          onManualEntry={() => setStep('review')}
        />
      </div>
    )
  }

  // Review Step (Smart Ledger)
  if (step === 'review' && extractionResult) {
    return (
      <SmartLedger
        extractionResult={extractionResult}
        onBuild={(services) => {
          setConfirmedServices(services);
          setStep('reveal');
        }}
        onBack={() => setStep('upload')}
      />
    )
  }

  // Fallback if no result
  if (step === 'review' && !extractionResult) {
     return (
        <div className="min-h-screen bg-zinc-950 text-zinc-50 flex items-center justify-center">
           <div className="text-center glass-card p-8">
              <p className="mb-4 text-zinc-300">No extraction result found.</p>
              <button onClick={() => setStep('upload')} className="text-pink-500 hover:underline">Go back</button>
           </div>
        </div>
     )
  }

  // Reveal Step
  if (step === 'reveal') {
    return (
      <TheatricalReveal
        services={confirmedServices}
        onComplete={(url) => {
          window.open(url, '_blank');
        }}
        onGoToDashboard={() => setStep('dashboard')}
      />
    )
  }

  // Dashboard Step
  if (step === 'dashboard') {
    return <DashboardLayout />
  }

  // Booking Error Step
  if (step === 'booking' && bookingError) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-50 flex items-center justify-center p-4">
        <div className="text-center glass-card p-8 max-w-md">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Booking Error</h2>
          <p className="text-zinc-300 mb-6">{bookingError}</p>
          <button onClick={() => window.location.href = '/'} className="text-pink-500 hover:underline">
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  // Booking Step
  if (step === 'booking' && bookingTenantId) {
    return <BookingFlow tenantId={bookingTenantId} />;
  }

  return null
}

export default App