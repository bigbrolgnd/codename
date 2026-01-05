/**
 * The 4 phases of the reveal animation
 */
export type RevealPhase = 'architecture' | 'intelligence' | 'security' | 'launch';

/**
 * Provisioning status from backend (eventually via tRPC subscription)
 */
export interface ProvisioningStatus {
  phase: RevealPhase;
  progress: number;           // 0-100 within current phase
  overallProgress: number;    // 0-100 total
  currentStep: string;        // Human-readable status message
  logs: ProvisioningLog[];
  isComplete: boolean;
  siteUrl?: string;
  error?: ProvisioningError;
}

export interface ProvisioningLog {
  id: string;
  timestamp: Date;
  message: string;
  type: 'info' | 'success' | 'warning';
  phase: RevealPhase;
}

export interface ProvisioningError {
  code: string;
  message: string;
  phase: RevealPhase;
  canRetry: boolean;
}

/**
 * Metadata for UI display per phase
 */
export interface PhaseMetadata {
  label: string;
  icon: string;
  color: string;
  description: string;
}

export const PHASE_CONFIG: Record<RevealPhase, PhaseMetadata> = {
  architecture: {
    label: 'Architecture',
    icon: 'Grid3x3',
    color: 'zinc',
    description: 'Designing your site layout and grid system...',
  },
  intelligence: {
    label: 'Intelligence',
    icon: 'Brain',
    color: 'blue',
    description: 'Syncing extracted services and booking logic...',
  },
  security: {
    label: 'Security',
    icon: 'Shield',
    color: 'amber',
    description: 'Securing checkout and domain infrastructure...',
  },
  launch: {
    label: 'Launch',
    icon: 'Rocket',
    color: 'emerald',
    description: 'Final polish and deploying to the edge...',
  },
};

/**
 * State for the Reveal Animation orchestrator
 */
export interface RevealAnimationState {
  currentPhase: RevealPhase;
  overallProgress: number;
  logs: ProvisioningLog[];
  isComplete: boolean;
  error: ProvisioningError | null;
}
