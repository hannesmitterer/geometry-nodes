/**
 * Notification Service for Resonance School
 * Handles countdown notifications and automatic triggers
 */

class NotificationService {
    constructor(logger) {
        this.logger = logger;
        this.notifications = [];
        this.triggers = new Map();
        this.soundEnabled = true;
        this.visualEnabled = true;
        this.permissionGranted = false;
        
        this.requestPermission();
    }

    /**
     * Request browser notification permission
     */
    async requestPermission() {
        if (!('Notification' in window)) {
            this.logger.warn('Browser does not support notifications');
            return false;
        }

        if (Notification.permission === 'granted') {
            this.permissionGranted = true;
            return true;
        }

        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            this.permissionGranted = permission === 'granted';
            return this.permissionGranted;
        }

        return false;
    }

    /**
     * Show notification
     */
    async notify(title, options = {}) {
        const notification = {
            id: 'notif_' + Date.now(),
            title,
            body: options.body || '',
            icon: options.icon || '/favicon.ico',
            timestamp: Date.now(),
            type: options.type || 'info',
            priority: options.priority || 'normal'
        };

        this.notifications.push(notification);
        this.logger.info('Notification created', { notification });

        // Visual notification
        if (this.visualEnabled) {
            this.showVisualNotification(notification);
        }

        // Browser notification
        if (this.permissionGranted && options.browser !== false) {
            this.showBrowserNotification(notification);
        }

        // Sound notification
        if (this.soundEnabled && options.sound) {
            this.playSound(options.sound);
        }

        return notification;
    }

    /**
     * Show visual notification in UI
     */
    showVisualNotification(notification) {
        const container = this.getNotificationContainer();
        const element = this.createNotificationElement(notification);
        
        container.appendChild(element);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            element.classList.add('fade-out');
            setTimeout(() => {
                container.removeChild(element);
            }, 300);
        }, 5000);
    }

    /**
     * Get or create notification container
     */
    getNotificationContainer() {
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                max-width: 400px;
            `;
            document.body.appendChild(container);
        }
        return container;
    }

    /**
     * Create notification element
     */
    createNotificationElement(notification) {
        const element = document.createElement('div');
        element.className = `notification notification-${notification.type}`;
        
        const colors = {
            info: '#00ffcc',
            success: '#00ff00',
            warning: '#ffa500',
            error: '#ff4444',
            critical: '#ff0000'
        };

        element.style.cssText = `
            background: rgba(0, 0, 0, 0.9);
            border-left: 4px solid ${colors[notification.type] || colors.info};
            border-radius: 4px;
            padding: 15px;
            margin-bottom: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
            color: #fff;
            font-family: 'Courier New', monospace;
            animation: slideIn 0.3s ease-out;
        `;

        element.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 5px; color: ${colors[notification.type] || colors.info}">
                ${notification.title}
            </div>
            ${notification.body ? `<div style="font-size: 0.9em; opacity: 0.9">${notification.body}</div>` : ''}
            <div style="font-size: 0.7em; opacity: 0.6; margin-top: 5px">
                ${new Date(notification.timestamp).toLocaleTimeString()}
            </div>
        `;

        return element;
    }

    /**
     * Show browser notification
     */
    showBrowserNotification(notification) {
        try {
            const browserNotif = new Notification(notification.title, {
                body: notification.body,
                icon: notification.icon,
                tag: notification.id,
                requireInteraction: notification.priority === 'high'
            });

            browserNotif.onclick = () => {
                window.focus();
                browserNotif.close();
            };
        } catch (error) {
            this.logger.error('Failed to show browser notification', { error });
        }
    }

    /**
     * Play sound
     */
    playSound(soundType = 'default') {
        try {
            const sounds = {
                default: 440,  // A4 note
                success: 523,  // C5 note
                warning: 392,  // G4 note
                error: 330     // E4 note
            };

            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = sounds[soundType] || sounds.default;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
            this.logger.error('Failed to play sound', { error });
        }
    }

    /**
     * Register countdown trigger
     */
    registerCountdownTrigger(name, targetTime, callback, options = {}) {
        const trigger = {
            name,
            targetTime: typeof targetTime === 'number' ? targetTime : new Date(targetTime).getTime(),
            callback,
            executed: false,
            notifications: options.notifications || []
        };

        this.triggers.set(name, trigger);
        this.logger.info('Countdown trigger registered', { trigger: name, targetTime });

        return trigger;
    }

    /**
     * Check and execute triggers
     */
    checkTriggers() {
        const now = Date.now();

        this.triggers.forEach((trigger, name) => {
            if (!trigger.executed && now >= trigger.targetTime) {
                this.logger.info('Executing trigger', { trigger: name });
                
                try {
                    // Execute callback
                    trigger.callback(trigger);
                    
                    // Send notifications
                    trigger.notifications.forEach(notif => {
                        this.notify(notif.title, notif.options);
                    });
                    
                    trigger.executed = true;
                } catch (error) {
                    this.logger.error('Error executing trigger', { trigger: name, error });
                }
            }
        });
    }

    /**
     * Start monitoring triggers
     */
    startMonitoring(interval = 1000) {
        if (this.monitoringInterval) {
            return;
        }

        this.monitoringInterval = setInterval(() => {
            this.checkTriggers();
        }, interval);

        this.logger.info('Trigger monitoring started');
    }

    /**
     * Stop monitoring triggers
     */
    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
            this.logger.info('Trigger monitoring stopped');
        }
    }

    /**
     * Get all notifications
     */
    getNotifications() {
        return [...this.notifications];
    }

    /**
     * Clear notifications
     */
    clearNotifications() {
        this.notifications = [];
    }

    /**
     * Enable/disable sound
     */
    toggleSound(enabled) {
        this.soundEnabled = enabled;
    }

    /**
     * Enable/disable visual notifications
     */
    toggleVisual(enabled) {
        this.visualEnabled = enabled;
    }

    /**
     * Cleanup
     */
    destroy() {
        this.stopMonitoring();
        this.notifications = [];
        this.triggers.clear();
    }
}

// Add CSS animation
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        .fade-out {
            animation: fadeOut 0.3s ease-out;
        }
        @keyframes fadeOut {
            from {
                opacity: 1;
            }
            to {
                opacity: 0;
                transform: translateX(400px);
            }
        }
    `;
    document.head.appendChild(style);
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotificationService;
}
