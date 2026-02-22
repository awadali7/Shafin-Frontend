import { notificationsApi } from "../api/notifications";
import { getStoredUser } from "../api/client";

// Service Worker event types
interface ExtendableEvent extends Event {
    waitUntil(promise: Promise<any>): void;
}

interface PushEvent extends ExtendableEvent {
    data?: PushMessageData;
}

interface NotificationEvent extends ExtendableEvent {
    notification: Notification;
}

interface PushMessageData {
    json(): any;
    text(): string;
    arrayBuffer(): ArrayBuffer;
    blob(): Blob;
}

/**
 * Push Notification Service
 * Handles browser push notifications using Web Push API
 */
class PushNotificationService {
    private registration: ServiceWorkerRegistration | null = null;
    private subscription: PushSubscription | null = null;
    private vapidPublicKey: string | null = null;

    /**
     * Initialize push notification service
     */
    async initialize(): Promise<boolean> {
        if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
            console.warn(
                "Push notifications are not supported in this browser"
            );
            return false;
        }

        try {
            // Register service worker
            this.registration = await navigator.serviceWorker.register(
                "/sw.js",
                { scope: "/" }
            );

            // Get VAPID public key from backend
            try {
                const apiUrl =
                    process.env.NEXT_PUBLIC_API_URL ||
                    "http://localhost:5001/api";
                const response = await fetch(
                    `${apiUrl}/notifications/vapid-key`
                );
                if (response.ok) {
                    const data = await response.json();
                    this.vapidPublicKey = data.data?.publicKey || "";
                } else {
                    // Fallback to environment variable
                    this.vapidPublicKey =
                        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
                }
            } catch (error) {
                // Fallback to environment variable
                this.vapidPublicKey =
                    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
            }

            if (!this.vapidPublicKey) {
                console.warn("VAPID public key not configured");
                return false;
            }

            // Check if user has granted permission
            const permission = await Notification.requestPermission();
            if (permission !== "granted") {
                console.warn("Notification permission not granted");
                return false;
            }

            // Get or create subscription
            this.subscription =
                await this.registration.pushManager.getSubscription();

            if (!this.subscription) {
                this.subscription =
                    await this.registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: this.urlBase64ToUint8Array(
                            this.vapidPublicKey
                        ),
                    });
            }

            // Register subscription with backend
            await this.registerSubscription();

            // Listen for push events
            this.setupPushListener();

            return true;
        } catch (error) {
            console.error("Error initializing push notifications:", error);
            return false;
        }
    }

    /**
     * Register push subscription with backend
     */
    private async registerSubscription(): Promise<void> {
        if (!this.subscription) return;

        const user = getStoredUser();
        if (!user) return;

        try {
            const subscriptionData = {
                endpoint: this.subscription.endpoint,
                keys: {
                    p256dh: this.arrayBufferToBase64(
                        this.subscription.getKey("p256dh")!
                    ),
                    auth: this.arrayBufferToBase64(
                        this.subscription.getKey("auth")!
                    ),
                },
                userAgent: navigator.userAgent,
                deviceInfo: {
                    deviceType: this.getDeviceType(),
                    browser: this.getBrowser(),
                    os: this.getOS(),
                },
            };

            await notificationsApi.registerPushSubscription(subscriptionData);
        } catch (error) {
            console.error("Error registering push subscription:", error);
        }
    }

    /**
     * Unregister push subscription
     */
    async unregister(): Promise<void> {
        if (!this.subscription) return;

        try {
            await notificationsApi.unregisterPushSubscription(
                this.subscription.endpoint
            );
            await this.subscription.unsubscribe();
            this.subscription = null;
        } catch (error) {
            console.error("Error unregistering push subscription:", error);
        }
    }

    /**
     * Setup push event listener
     */
    private setupPushListener(): void {
        if (!this.registration) return;

        this.registration.addEventListener("push", (event: Event) => {
            const pushEvent = event as PushEvent;
            if (!pushEvent.data) return;

            const data = pushEvent.data.json();
            const title = data.title || "New Notification";
            const options: NotificationOptions = {
                body: data.body || data.message || "",
                icon: "/icon-192x192.png",
                badge: "/icon-96x96.png",
                tag: data.tag || "notification",
                data: data.data || {},
                requireInteraction: false,
            };

            pushEvent.waitUntil(
                this.registration!.showNotification(title, options)
            );
        });

        // Handle notification clicks
        this.registration.addEventListener(
            "notificationclick",
            (event: Event) => {
                const notificationEvent = event as NotificationEvent;
                notificationEvent.notification.close();

                const data = notificationEvent.notification.data;
                const url = data?.url || "/dashboard";

                // clients is available in service worker context
                notificationEvent.waitUntil(
                    (globalThis as any).clients.openWindow(url)
                );
            }
        );
    }

    /**
     * Convert VAPID key from base64 URL to Uint8Array
     */
    private urlBase64ToUint8Array(base64String: string): BufferSource {
        const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, "+")
            .replace(/_/g, "/");

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    /**
     * Convert ArrayBuffer to base64
     */
    private arrayBufferToBase64(buffer: ArrayBuffer): string {
        const bytes = new Uint8Array(buffer);
        let binary = "";
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    }

    /**
     * Get device type
     */
    private getDeviceType(): string {
        const ua = navigator.userAgent;
        if (/tablet|ipad/i.test(ua)) return "tablet";
        if (/mobile|android|iphone|ipod/i.test(ua)) return "mobile";
        return "desktop";
    }

    /**
     * Get browser name
     */
    private getBrowser(): string {
        const ua = navigator.userAgent;
        if (/edg/i.test(ua)) return "Edge";
        if (/chrome/i.test(ua) && !/opr|edge/i.test(ua)) return "Chrome";
        if (/firefox/i.test(ua)) return "Firefox";
        if (/safari/i.test(ua) && !/chrome/i.test(ua)) return "Safari";
        if (/opr/i.test(ua)) return "Opera";
        return "Unknown";
    }

    /**
     * Get OS name
     */
    private getOS(): string {
        const ua = navigator.userAgent;
        if (/windows/i.test(ua)) return "Windows";
        if (/macintosh|mac os x/i.test(ua)) return "macOS";
        if (/android/i.test(ua)) return "Android";
        if (/iphone|ipad|ipod/i.test(ua)) return "iOS";
        if (/linux/i.test(ua)) return "Linux";
        return "Unknown";
    }
}

export const pushNotificationService = new PushNotificationService();
