'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { UploadQueue, queueEventEmitter } from '@/lib/UploadQueue';
import { toast } from 'sonner';

export interface OfflineQueueState {
    isOnline: boolean;
    pendingCount: number;
    isSyncing: boolean;
}

type UploadFn = (itemId: string, base64: string) => Promise<void>;

/**
 * useOfflineQueue
 *
 * Manages offline photo uploads for the inspection page.
 * - When offline: enqueues the upload in localStorage and shows a toast
 * - When back online: automatically retries all pending uploads
 * - Exposes state for a persistent banner UI
 */
export function useOfflineQueue(uploadFn: UploadFn): {
    state: OfflineQueueState;
    handleUpload: (itemId: string, orderId: string, base64: string) => Promise<boolean>;
} {
    const [isOnline, setIsOnline] = useState(
        typeof navigator !== 'undefined' ? navigator.onLine : true
    );
    const [pendingCount, setPendingCount] = useState(0);
    const [isSyncing, setIsSyncing] = useState(false);
    const uploadFnRef = useRef(uploadFn);
    uploadFnRef.current = uploadFn;

    const refreshCount = useCallback(async () => {
        setPendingCount(await UploadQueue.count());
    }, []);

    // Process all pending items in the queue
    const processQueue = useCallback(async () => {
        const pending = await UploadQueue.getPending();
        if (pending.length === 0) return;

        setIsSyncing(true);
        const toastId = toast.loading(`Enviando ${pending.length} foto(s) pendente(s)...`, {
            duration: Infinity,
        });

        let successCount = 0;
        let failCount = 0;

        for (const item of pending) {
            await UploadQueue.markUploading(item.id);
            try {
                await uploadFnRef.current(item.itemId, item.base64);
                await UploadQueue.remove(item.id);
                successCount++;
            } catch {
                await UploadQueue.markFailed(item.id);
                failCount++;
            }
        }

        toast.dismiss(toastId);

        if (successCount > 0 && failCount === 0) {
            toast.success(`${successCount} foto(s) enviada(s) com sucesso!`);
        } else if (successCount > 0 && failCount > 0) {
            toast.warning(`${successCount} foto(s) enviada(s), ${failCount} falhou(aram). Tente novamente.`);
        } else if (failCount > 0) {
            toast.error(`Falha ao enviar ${failCount} foto(s). Verifique a conexão.`);
        }

        setIsSyncing(false);
        refreshCount();
    }, [refreshCount]);

    // Listen to online/offline events
    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            toast.success('Conexão restaurada! Enviando fotos pendentes...', { duration: 3000 });
            processQueue();
        };

        const handleOffline = () => {
            setIsOnline(false);
            toast.warning('Sem conexão. As fotos serão salvas e enviadas quando a rede voltar.', {
                duration: 5000,
                id: 'offline-warning',
            });
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Check for pending items on mount
        refreshCount();

        // Listen to IndexedDB queue changes
        const handleQueueChange = () => refreshCount();
        queueEventEmitter.addEventListener('change', handleQueueChange);

        UploadQueue.count().then((count) => {
            if (navigator.onLine && count > 0) {
                processQueue();
            }
        });

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            queueEventEmitter.removeEventListener('change', handleQueueChange);
        };
    }, [processQueue, refreshCount]);

    /**
     * handleUpload — call this instead of directly calling the upload mutation.
     * Returns true if uploaded immediately, false if queued for later.
     */
    const handleUpload = useCallback(
        async (itemId: string, orderId: string, base64: string): Promise<boolean> => {
            if (!navigator.onLine) {
                await UploadQueue.enqueue(itemId, orderId, base64);
                refreshCount();
                toast.warning('Foto salva localmente. Será enviada quando a rede voltar.', {
                    duration: 4000,
                    icon: '📷',
                });
                return false;
            }

            // Online — upload directly
            try {
                await uploadFnRef.current(itemId, base64);
                return true;
            } catch (error) {
                // Network error during upload — enqueue for retry
                await UploadQueue.enqueue(itemId, orderId, base64);
                refreshCount();
                toast.warning('Falha no envio. Foto salva para reenvio automático.', {
                    duration: 4000,
                    icon: '📷',
                });
                return false;
            }
        },
        [refreshCount]
    );

    return {
        state: { isOnline, pendingCount, isSyncing },
        handleUpload,
    };
}
