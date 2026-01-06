import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { Loader2, ShieldCheck } from 'lucide-react';

interface InviteStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  onSuccess: () => void;
}

export const InviteStaffModal: React.FC<InviteStaffModalProps> = ({ 
  isOpen, 
  onClose, 
  tenantId,
  onSuccess 
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'manager' | 'staff'>('staff');

  const inviteMutation = trpc.admin.inviteStaff.useMutation({
    onSuccess: () => {
      toast.success(`${name} has been invited to your team.`);
      onSuccess();
      onClose();
      // Reset form
      setName('');
      setEmail('');
      setRole('staff');
    },
    onError: (err) => {
      toast.error(err.message);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    inviteMutation.mutate({
      tenantId,
      name,
      email,
      role,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold font-serif flex items-center gap-2">
            <ShieldCheck className="text-emerald-500" /> Invite Team Member
          </DialogTitle>
          <DialogDescription className="text-zinc-500">
            Send an invitation to join your business command center.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="staff-name" className="text-zinc-400 uppercase text-[10px] font-bold tracking-widest">Full Name</Label>
              <Input 
                id="staff-name" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Smith"
                className="bg-zinc-950 border-zinc-800 focus-visible:ring-emerald-500/50"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-email" className="text-zinc-400 uppercase text-[10px] font-bold tracking-widest">Email Address</Label>
              <Input 
                id="staff-email" 
                type="email"
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@example.com"
                className="bg-zinc-950 border-zinc-800 focus-visible:ring-emerald-500/50"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-400 uppercase text-[10px] font-bold tracking-widest">Select Role</Label>
              <div className="grid grid-cols-3 gap-2">
                {(['staff', 'manager', 'admin'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all ${
                      role === r 
                        ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-900/20' 
                        : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                    }`}
                  >
                    {r.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="submit" 
              className="w-full bg-emerald-600 hover:bg-emerald-500 font-bold"
              disabled={inviteMutation?.isLoading}
            >
              {inviteMutation?.isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending Invitation...
                </>
              ) : (
                'Send Invitation'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
