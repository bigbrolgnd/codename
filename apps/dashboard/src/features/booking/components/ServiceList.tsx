import React from 'react';
import { trpc } from '@/lib/trpc';
import { useTenant } from '@/contexts/TenantContext';
import { ExtractedService } from '@codename/api';
import { Loader2, ChevronRight, Sparkles, Award } from 'lucide-react';
import { motion } from 'framer-motion';

interface ServiceListProps {
  tenantId?: string; // Optional prop for testing, defaults to context
  onSelect: (service: ExtractedService) => void;
}

// Tier 3 frosted glass card styles
// Mobile: 8px blur for performance, Desktop: 12px blur for full effect
const glassCardStyle = "bg-white/40 backdrop-blur-sm md:backdrop-blur-md border border-pink-500/20 rounded-2xl shadow-lg shadow-pink-500/10";

export const ServiceList: React.FC<ServiceListProps> = ({ tenantId: propTenantId, onSelect }) => {
  const { tenantId: contextTenantId } = useTenant();
  const tenantId = propTenantId ?? contextTenantId;

  const servicesQuery = trpc.booking.listServices.useQuery(
    { tenantId },
    { enabled: !!tenantId } // Only query when tenantId is available
  );
  const [selectedService, setSelectedService] = React.useState<string | null>(null);

  if (servicesQuery.isLoading) {
    return (
      <div className="flex justify-center py-12 min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
      </div>
    );
  }

  if (servicesQuery.error) {
    return (
      <div className="text-center py-12 text-red-400">
        Failed to load services. Please try again later.
      </div>
    );
  }

  const services = servicesQuery.data || [];

  const handleSelect = (service: ExtractedService) => {
    setSelectedService(service.id);
    onSelect(service);
  };

  return (
    <div className="grid gap-4 w-full max-w-2xl mx-auto p-4">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-pink-500 tracking-tight">Select a Service</h2>
        <p className="text-zinc-400">Choose what you'd like to book today.</p>
      </div>

      {services.length === 0 ? (
        <div className="text-center py-12 text-zinc-500 border-2 border-dashed border-pink-500/20 rounded-2xl">
          No services available.
        </div>
      ) : (
        <div className="space-y-4">
          {services.map((service, index) => {
            // Mark first service as "Most Popular" (or customize logic as needed)
            const isMostPopular = index === 0;

            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelect(service as ExtractedService)}
                className={`
                  ${glassCardStyle}
                  cursor-pointer transition-all duration-300
                  hover:shadow-pink-500/30 hover:bg-white/50
                  ${selectedService === service.id ? 'ring-2 ring-pink-500 shadow-pink-500/40' : ''}
                  ${isMostPopular ? 'ring-1 ring-amber-400/50' : ''}
                `}
              >
                <div className="p-6">
                  {/* Most Popular Badge */}
                  {isMostPopular && (
                    <div className="flex items-center justify-end mb-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-500/30">
                        <Award className="h-3 w-3 mr-1" />
                        MOST POPULAR
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-zinc-900">{service.name}</h3>
                      {service.description && (
                        <p className="text-zinc-600 mt-1 text-sm">{service.description}</p>
                      )}
                    </div>
                    <div className="ml-4 text-right">
                      <div className="text-2xl font-bold text-pink-600 font-mono">
                        ${(service.price / 100).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-pink-500/20">
                    <div className="flex items-center text-zinc-600 text-sm">
                      <Sparkles className="h-4 w-4 mr-2 text-pink-500" />
                      {service.duration} minutes
                    </div>
                    <ChevronRight className="h-5 w-5 text-pink-500" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
