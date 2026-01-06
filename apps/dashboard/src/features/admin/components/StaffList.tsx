import React, { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  UserPlus, 
  MoreHorizontal, 
  Trash2, 
  Mail,
  Shield,
  Loader2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InviteStaffModal } from './InviteStaffModal';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface StaffListProps {
  tenantId: string;
}

const roleConfig = {
  admin: { label: 'Admin', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  manager: { label: 'Manager', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  staff: { label: 'Staff', color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' },
};

export const StaffList: React.FC<StaffListProps> = ({ tenantId }) => {
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  
  const staffQuery = trpc.admin.listStaff.useQuery({ tenantId });
  const deleteMutation = trpc.admin.deleteStaff.useMutation({
    onSuccess: () => {
      staffQuery.refetch();
      toast.success("Staff member removed");
    }
  });

  if (staffQuery.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        <p className="text-sm text-zinc-500 font-mono uppercase tracking-widest">Loading Team...</p>
      </div>
    );
  }

  const staff = staffQuery.data || [];

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-white font-serif">Staff Management</h1>
          <p className="text-zinc-500 text-sm">Manage roles and permissions for your team.</p>
        </div>
        <Button onClick={() => setIsInviteModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-500 gap-2">
          <UserPlus size={16} /> Invite Member
        </Button>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 overflow-hidden backdrop-blur-sm">
        <Table>
          <TableHeader className="bg-zinc-900/50">
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest">Name</TableHead>
              <TableHead className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest">Email</TableHead>
              <TableHead className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest">Role</TableHead>
              <TableHead className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest">Joined</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-zinc-500 italic">
                  No staff members invited yet.
                </TableCell>
              </TableRow>
            ) : (
              staff.map((member) => (
                <TableRow key={member.id} className="border-zinc-800 hover:bg-zinc-800/30 transition-colors group">
                  <TableCell className="font-medium text-white">{member.name}</TableCell>
                  <TableCell className="text-zinc-400">
                    <div className="flex items-center gap-2">
                      <Mail size={12} className="text-zinc-600" />
                      {member.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("capitalize font-mono text-[10px] px-2 py-0", roleConfig[member.role].color)}>
                      <Shield size={10} className="mr-1" />
                      {roleConfig[member.role].label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-zinc-500 text-xs">
                    {new Date(member.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-white">
                          <MoreHorizontal size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-zinc-300">
                        <DropdownMenuItem className="focus:bg-zinc-800 focus:text-white">Edit Permissions</DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-400 focus:bg-red-500/10 focus:text-red-400"
                          onClick={() => deleteMutation.mutate({ tenantId, staffId: member.id })}
                        >
                          <Trash2 size={14} className="mr-2" /> Remove Member
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <InviteStaffModal 
        isOpen={isInviteModalOpen} 
        onClose={() => setIsInviteModalOpen(false)} 
        tenantId={tenantId}
        onSuccess={() => staffQuery.refetch()}
      />
    </div>
  );
};
