import { useState } from 'react'
import ServiceUpload from './features/onboarding/components/ServiceUpload'
import { SmartLedger } from './features/onboarding/components/SmartLedger'
import { TheatricalReveal } from './features/onboarding/components/TheatricalReveal'
import { ExtractionResult } from '@codename/api'
import { EditableService } from './features/onboarding/types/smartLedger.types'
import { Button } from './components/ui/button'

function App() {
  const [step, setStep] = useState<'welcome' | 'upload' | 'review' | 'reveal' | 'dashboard'>('welcome')
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null)
  const [confirmedServices, setConfirmedServices] = useState<EditableService[]>([])

  // Welcome Step
  if (step === 'welcome') {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center">
          <header className="mb-8 text-center">
            <h1 className="text-5xl font-bold tracking-tighter text-emerald-500 mb-2">codename</h1>
            <p className="text-zinc-400 text-lg italic">"Your Business, Automated."</p>
          </header>
          
          <main className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
            <div className="space-y-6">
              <div className="p-5 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
                <h2 className="text-xl font-semibold mb-3">Zero-Touch Setup</h2>
                <p className="text-zinc-400 leading-relaxed">
                  Transform your price list into a fully functional web app in minutes.
                </p>
              </div>
              <button 
                onClick={() => setStep('upload')}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-900/20 active:scale-95"
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
           <div className="text-center">
              <p className="mb-4">No extraction result found.</p>
              <button onClick={() => setStep('upload')} className="text-emerald-500 hover:underline">Go back</button>
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

  // Dashboard Step (Placeholder for Epic 3)
  if (step === 'dashboard') {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-emerald-500 mb-4">Command Center</h2>
          <p className="text-zinc-400 text-xl">Welcome to your business dashboard.</p>
          <Button variant="link" className="mt-8 text-zinc-500" onClick={() => setStep('welcome')}>Start Over (Dev Only)</Button>
        </div>
      </div>
    )
  }

  return null
}

export default App
