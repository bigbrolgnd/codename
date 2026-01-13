import React from 'react';
import { Sidebar } from './Sidebar';
import { PulseHeader } from './PulseHeader';
import { OverviewPage } from '../pages/OverviewPage';
import { InsightsPage } from '../pages/InsightsPage';
import { MarketingPage } from '../pages/MarketingPage';
import { AddonsPage } from '../pages/AddonsPage';
import { ComingSoon } from './ComingSoon';
import { StaffList } from './StaffList';
import { LightningBackground } from './LightningBackground';
import { useAdminRouter } from '../hooks/useAdminRouter';
import { usePulseMetrics } from '../hooks/usePulseMetrics';
import { ADMIN_ROUTES } from '../constants/routes';
import {
  Sheet,
  SheetContent,
  SheetTrigger
} from "@/components/ui/sheet";
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { AgentChat } from './AgentChat';
import { SocialSharingWizard } from './SocialSharingWizard';
import { useTenant } from '@/contexts/TenantContext';

export const DashboardLayout: React.FC = () => {

  const { currentRoute, navigate } = useAdminRouter();
  const { tenantId } = useTenant();

  const metrics = usePulseMetrics(tenantId ?? '');
  const [showWizard, setShowWizard] = React.useState(false);

  // Show error if tenant not available
  if (!tenantId) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-zinc-400">Tenant information not available. Please log in.</p>
      </div>
    );
  }

  React.useEffect(() => {
    const hasSeen = localStorage.getItem('hasSeenSocialWizard_' + tenantId);
    if (!hasSeen) {
       // Delay slightly for effect
       const timer = setTimeout(() => {
         setShowWizard(true);
       }, 1500);
       return () => clearTimeout(timer);
    }

    // 7 Days Trigger
    const installDate = localStorage.getItem('installDate_' + tenantId);
    if (!installDate) {
        localStorage.setItem('installDate_' + tenantId, new Date().toISOString());
    } else {
        const days = (new Date().getTime() - new Date(installDate).getTime()) / (1000 * 3600 * 24);
        if (days > 7 && !localStorage.getItem('hasSeenSocialWizard_7days_' + tenantId)) {
             setShowWizard(true);
             localStorage.setItem('hasSeenSocialWizard_7days_' + tenantId, 'true');
        }
    }
  }, [tenantId]);

  const handleCloseWizard = () => {
    setShowWizard(false);
    localStorage.setItem('hasSeenSocialWizard_' + tenantId, 'true');
  };

  const renderContent = () => {

    switch (currentRoute) {

      case ADMIN_ROUTES.OVERVIEW:

        return <OverviewPage />;

      case ADMIN_ROUTES.INSIGHTS:

        return <InsightsPage />;

      case ADMIN_ROUTES.CALENDAR:

        return <ComingSoon feature="Calendar" onBack={() => navigate(ADMIN_ROUTES.OVERVIEW)} />;

      case ADMIN_ROUTES.STAFF:

        return <StaffList tenantId={tenantId} />;

      case ADMIN_ROUTES.MARKETING:

        return <MarketingPage tenantId={tenantId} />;

      case ADMIN_ROUTES.ADDONS:

        return <AddonsPage />;

      case ADMIN_ROUTES.SETTINGS:

        return <ComingSoon feature="Settings" onBack={() => navigate(ADMIN_ROUTES.OVERVIEW)} />;

      default:

        return <OverviewPage />;

    }

  };



  return (
    <>
      <LightningBackground />
      <div className="flex h-screen bg-transparent overflow-hidden text-zinc-50 selection:bg-violet-500/30">

      {/* Desktop Sidebar */}

      <div className="hidden md:block">

        <Sidebar currentRoute={currentRoute} onNavigate={navigate} tenantId={tenantId} />

      </div>



      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">

        <PulseHeader metrics={metrics} />

        

        {/* Mobile Nav */}

        <div className="md:hidden p-4 border-b border-white/5 flex items-center justify-between glass-frosted sticky top-0 z-20">

           <Sheet>

             <SheetTrigger asChild>

               <Button variant="ghost" size="icon">

                 <Menu className="h-6 w-6" />

               </Button>

             </SheetTrigger>

             <SheetContent side="left" className="p-0 w-64 glass-surface border-r-white/5">

               <Sidebar 

                 currentRoute={currentRoute} 

                 onNavigate={navigate} 

                 isMobile 

                 tenantId={tenantId}

               />

             </SheetContent>

           </Sheet>

           <span className="font-bold tracking-tighter">COMMAND</span>

           <div className="w-10" />

        </div>



        <main className="flex-1 overflow-y-auto bg-zinc-950">

          <div className="max-w-7xl mx-auto">

            {renderContent()}

          </div>

        </main>



        <AgentChat tenantId={tenantId} />
        <SocialSharingWizard tenantId={tenantId} isOpen={showWizard} onClose={handleCloseWizard} />

      </div>

    </div>
    </>

  );

};
