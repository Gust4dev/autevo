'use client';

import { useState, useEffect, useCallback } from 'react';

type PermissionState = 'prompt' | 'granted' | 'denied' | 'unsupported';

interface UsePushNotificationsReturn {
    permission: PermissionState;
    isSubscribed: boolean;
    isLoading: boolean;
    subscribe: () => Promise<boolean>;
    unsubscribe: () => Promise<boolean>;
    isSupported: boolean;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export function usePushNotifications(): UsePushNotificationsReturn {
    const [permission, setPermission] = useState<PermissionState>('prompt');
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSupported, setIsSupported] = useState(false);

    useEffect(() => {
        const checkSupport = async () => {
            if (typeof window === 'undefined') return;

            const supported = 'Notification' in window &&
                'serviceWorker' in navigator &&
                'PushManager' in window;

            setIsSupported(supported);

            if (!supported) {
                setPermission('unsupported');
                return;
            }

            setPermission(Notification.permission as PermissionState);

            try {
                const registration = await navigator.serviceWorker.ready;
                const subscription = await registration.pushManager.getSubscription();
                setIsSubscribed(!!subscription);
            } catch (error) {
                console.error('Error checking subscription:', error);
            }
        };

        checkSupport();
    }, []);

    const subscribe = useCallback(async (): Promise<boolean> => {
        if (!isSupported || permission === 'denied') {
            return false;
        }

        setIsLoading(true);

        try {
            const perm = await Notification.requestPermission();
            setPermission(perm as PermissionState);

            if (perm !== 'granted') {
                setIsLoading(false);
                return false;
            }

            const registration = await navigator.serviceWorker.ready;

            const vapidPublicKey = process.env.NEXT_PUBLIC_PWA_PUBLIC_KEY;

            if (!vapidPublicKey) {
                console.error('VAPID public key not configured');
                setIsLoading(false);
                return false;
            }

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
            });

            const response = await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(subscription.toJSON()),
            });

            if (!response.ok) {
                throw new Error('Failed to save subscription to server');
            }

            setIsSubscribed(true);
            setIsLoading(false);
            return true;
        } catch (error) {
            console.error('Push subscription failed:', error);
            setIsLoading(false);
            return false;
        }
    }, [isSupported, permission]);

    const unsubscribe = useCallback(async (): Promise<boolean> => {
        setIsLoading(true);

        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                await fetch('/api/push/subscribe', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ endpoint: subscription.endpoint }),
                });

                await subscription.unsubscribe();
            }

            setIsSubscribed(false);
            setIsLoading(false);
            return true;
        } catch (error) {
            console.error('Unsubscribe failed:', error);
            setIsLoading(false);
            return false;
        }
    }, []);

    return {
        permission,
        isSubscribed,
        isLoading,
        subscribe,
        unsubscribe,
        isSupported,
    };
}
