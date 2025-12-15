'use client';

import { useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc/provider';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';

export function DevTools() {
    // Only show in development
    if (process.env.NODE_ENV !== 'development') return null;

    const { user, isLoaded } = useUser();
    const [isOpen, setIsOpen] = useState(false);

    const switchRoleMutation = trpc.user.switchRole.useMutation({
        onSuccess: async (data) => {
            toast.success(`Role alterada para ${data.newRole}`);
            // Reload to apply new role guards
            window.location.reload(); 
        },
        onError: (err) => toast.error(err.message)
    });

    if (!isLoaded || !user) return null;

    const currentRole = user.publicMetadata.role as string;

    return (
        <div className="fixed bottom-4 right-4 z-[9999]">
            {!isOpen ? (
                <Button 
                    variant="destructive" 
                    size="icon" 
                    className="rounded-full shadow-2xl border-2 border-white overflow-hidden"
                    onClick={() => setIsOpen(true)}
                    title="DevTools"
                >
                    <ShieldAlert className="h-6 w-6" />
                </Button>
            ) : (
                <div className="bg-black/95 text-white p-4 rounded-xl shadow-2xl border border-red-500/50 w-64 space-y-4 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex justify-between items-center border-b border-white/10 pb-2">
                        <span className="font-bold text-red-400 flex items-center gap-2">
                            <ShieldAlert className="h-4 w-4" />
                            DEV TOOLS
                        </span>
                        <button 
                            onClick={() => setIsOpen(false)} 
                            className="text-white/50 hover:text-white transition-colors"
                        >
                            ✕
                        </button>
                    </div>
                    
                    <div className="text-xs bg-white/5 p-2 rounded border border-white/10">
                        <span className="opacity-50">Role Atual:</span>{' '}
                        <span className="font-mono text-yellow-400 font-bold ml-1">{currentRole || 'N/A'}</span>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                        {['OWNER', 'MANAGER', 'MEMBER'].map((role) => (
                            <Button
                                key={role}
                                variant={currentRole === role ? "default" : "secondary"}
                                size="sm"
                                className={`w-full justify-start text-xs h-9 ${
                                    currentRole === role 
                                        ? 'bg-red-600 hover:bg-red-700 text-white border-transparent' 
                                        : 'bg-white/10 hover:bg-white/20 text-white border-transparent'
                                }`}
                                disabled={switchRoleMutation.isPending}
                                onClick={() => switchRoleMutation.mutate({ targetRole: role as any })}
                            >
                                {role === currentRole && <div className="w-2 h-2 bg-white rounded-full mr-2 shadow-[0_0_8px_rgba(255,255,255,0.8)]" />}
                                Mudar para {role}
                            </Button>
                        ))}
                    </div>

                     <div className="text-[10px] text-center text-white/30 pt-2 border-t border-white/5">
                        Apenas visível em NODE_ENV=development
                    </div>
                </div>
            )}
        </div>
    );
}
