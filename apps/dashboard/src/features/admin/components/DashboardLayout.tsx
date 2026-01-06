import React from 'react';
import { Sidebar } from './Sidebar';
import { PulseHeader } from './PulseHeader';
import { OverviewPage } from '../pages/OverviewPage';
import { InsightsPage } from '../pages/InsightsPage';
import { MarketingPage } from '../pages/MarketingPage';
import { ComingSoon } from './ComingSoon';
import { StaffList } from './StaffList';
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

export const DashboardLayout: React.FC = () => {

  const { currentRoute, navigate } = useAdminRouter();

  const tenantId = 'tenant_default'; // TODO: Get from auth context

  const metrics = usePulseMetrics(tenantId); 



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

      case ADMIN_ROUTES.SETTINGS:

        return <ComingSoon feature="Settings" onBack={() => navigate(ADMIN_ROUTES.OVERVIEW)} />;

      default:

        return <OverviewPage />;

    }

  };



  return (

    <div className="flex h-screen bg-zinc-950 overflow-hidden text-zinc-50 selection:bg-emerald-500/30">

      {/* Desktop Sidebar */}

      <div className="hidden md:block">

        <Sidebar currentRoute={currentRoute} onNavigate={navigate} tenantId={tenantId} />

      </div>



      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">

        <PulseHeader metrics={metrics} />

        

        {/* Mobile Nav */}

        <div className="md:hidden p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950 sticky top-0 z-20">

           <Sheet>

             <SheetTrigger asChild>

               <Button variant="ghost" size="icon">

                 <Menu className="h-6 w-6" />

               </Button>

             </SheetTrigger>

             <SheetContent side="left" className="p-0 w-64 bg-zinc-950 border-r-zinc-800">

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

      </div>

    </div>

  );

};
