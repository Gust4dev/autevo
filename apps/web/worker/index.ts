// @ts-nocheck — compiled by @ducanh2912/next-pwa, not the main tsconfig

self.addEventListener("push", (event) => {
    if (!event.data) return;

    try {
        const data = event.data.json();

        const options = {
            body: data.body || "",
            icon: data.icon || "/branding/icon-192x192.png",
            badge: "/branding/icon-192x192.png",
            vibrate: [100, 50, 100],
            data: {
                url: data.url || "/dashboard",
                timestamp: Date.now(),
            },
            tag: data.tag || "autevo-notification",
            renotify: true,
            requireInteraction: false,
            silent: false,
        };

        event.waitUntil(
            self.registration.showNotification(data.title || "Autevo", options)
        );
    } catch {
        // malformed push payload
    }
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    const url = event.notification.data?.url || "/dashboard";

    event.waitUntil(
        self.clients
            .matchAll({ type: "window", includeUncontrolled: true })
            .then((clientList) => {
                for (const client of clientList) {
                    if (client.url.includes("/dashboard") && "focus" in client) {
                        client.navigate(url);
                        return client.focus();
                    }
                }
                return self.clients.openWindow(url);
            })
    );
});

self.addEventListener("notificationclose", () => { });


