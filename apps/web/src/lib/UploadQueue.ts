/**
 * UploadQueue: An IndexedDB-backed queue for resilient photo uploads.
 * Ensures photos are not lost if the browser is closed or the network drops
 * during an inspection session. Uses IndexedDB to bypass the 5MB localStorage limit.
 */
import { get, set } from 'idb-keyval';

const QUEUE_KEY = 'inspection_upload_queue';

export interface QueuedUpload {
    id: string;
    itemId: string;
    orderId: string;
    base64: string;
    status: 'pending' | 'uploading' | 'failed';
    attempts: number;
    createdAt: number;
}

// Simple event target for React to listen to changes
export const queueEventEmitter = new EventTarget();

function emitChange() {
    queueEventEmitter.dispatchEvent(new Event('change'));
}

async function readQueue(): Promise<QueuedUpload[]> {
    try {
        const queue = await get<QueuedUpload[]>(QUEUE_KEY);
        return queue || [];
    } catch {
        return [];
    }
}

async function writeQueue(queue: QueuedUpload[]): Promise<void> {
    try {
        await set(QUEUE_KEY, queue);
        emitChange();
    } catch (err) {
        console.error('Failed to write to IndexedDB upload queue:', err);
    }
}

export const UploadQueue = {
    /**
     * Add a photo to the pending upload queue.
     */
    async enqueue(itemId: string, orderId: string, base64: string): Promise<string> {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const queue = await readQueue();
        queue.push({ id, itemId, orderId, base64, status: 'pending', attempts: 0, createdAt: Date.now() });
        await writeQueue(queue);
        return id;
    },

    /**
     * Get all pending items in the queue.
     */
    async getPending(): Promise<QueuedUpload[]> {
        const queue = await readQueue();
        return queue.filter(item => item.status === 'pending' || item.status === 'failed');
    },

    /**
     * Mark an item as uploading.
     */
    async markUploading(id: string): Promise<void> {
        const queue = await readQueue();
        const updated = queue.map(item =>
            item.id === id ? { ...item, status: 'uploading' as const, attempts: item.attempts + 1 } : item,
        );
        await writeQueue(updated);
    },

    /**
     * Remove a successfully uploaded item from the queue.
     */
    async remove(id: string): Promise<void> {
        const queue = await readQueue();
        await writeQueue(queue.filter(item => item.id !== id));
    },

    /**
     * Mark a failed upload so it can be retried.
     */
    async markFailed(id: string): Promise<void> {
        const queue = await readQueue();
        const updated = queue.map(item =>
            item.id === id ? { ...item, status: 'failed' as const } : item,
        );
        await writeQueue(updated);
    },

    /**
     * Clear all items older than 24 hours to prevent stale data buildup.
     */
    async cleanup(): Promise<void> {
        const cutoff = Date.now() - 86400000;
        const queue = await readQueue();
        await writeQueue(queue.filter(item => item.createdAt > cutoff));
    },

    /**
     * Count of pending/failed items.
     */
    async count(): Promise<number> {
        const pending = await this.getPending();
        return pending.length;
    },
};
