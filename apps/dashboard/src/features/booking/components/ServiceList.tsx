import React from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExtractedService } from '@codename/api';
import { Loader2, ChevronRight } from 'lucide-react';

interface ServiceListProps {
  tenantId: string;
  onSelect: (service: ExtractedService) => void;
}

export const ServiceList: React.FC<ServiceListProps> = ({ tenantId, onSelect }) => {
  const servicesQuery = trpc.booking.listServices.useQuery({ tenantId });

  if (servicesQuery.isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (servicesQuery.error) {
    return (
      <div className="text-center py-12 text-red-500">
        Failed to load services. Please try again later.
      </div>
    );
  }

  const services = servicesQuery.data || [];

  return (
    <div className="grid gap-4 w-full max-w-2xl mx-auto p-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold">Select a Service</h2>
        <p className="text-muted-foreground">Choose what you'd like to book today.</p>
      </div>
      
      {services.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
          No services available.
        </div>
      ) : (
        services.map((service) => (
          <Card 
            key={service.id} 
            className="cursor-pointer hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all group"
            onClick={() => onSelect(service as ExtractedService)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-bold">{service.name}</CardTitle>
              <div className="font-mono text-emerald-600 font-bold">
                ${(service.price / 100).toFixed(2)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-end">
                <CardDescription className="flex-1">
                  {service.description || `Duration: ${service.duration} mins`}
                </CardDescription>
                <Button variant="ghost" size="sm" className="group-hover:translate-x-1 transition-transform">
                  Select <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};
