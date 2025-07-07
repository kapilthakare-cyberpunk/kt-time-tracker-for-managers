/**
 * Main Application Entry Point - Optimized Initialization
 * Coordinates all modules and handles application lifecycle
 */

import { initializeAuth, setupRecaptcha } from './auth.js';
import { initializeUI } from './ui.js';
import { EMAIL_TO_NAME_MAPPING } from './config.js';

/**
 * Application initialization with performance optimizations
 */
class TimeTrackerApp {
    constructor() {
        this.isInitialized = false;
        this.initPromise = null;
    }

    /**
     * Initialize the application
     */
    async initialize() {
        if (this.isInitialized) return;
        if (this.initPromise) return this.initPromise;

        this.initPromise = this.performInitialization();
        await this.initPromise;
    }

    /**
     * Perform the actual initialization
     */
    async performInitialization() {
        try {
            console.log('🚀 Initializing Time Tracker Application...');
            
            // Show loading state
            this.setGlobalLoadingState(true);
            
            // Initialize core modules in parallel for better performance
            await Promise.all([
                this.initializeAuth(),
                this.initializeUI(),
                this.setupGlobalErrorHandling()
            ]);
            
            // Setup reCAPTCHA after DOM is ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', setupRecaptcha);
            } else {
                setupRecaptcha();
            }
            
            this.isInitialized = true;
            console.log('✅ Time Tracker Application initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize application:', error);
            this.showInitializationError(error);
        } finally {
            this.setGlobalLoadingState(false);
        }
    }

    /**
     * Initialize authentication module
     */
    async initializeAuth() {
        initializeAuth();
        console.log('🔐 Authentication module initialized');
    }

    /**
     * Initialize UI module
     */
    async initializeUI() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializeUI);
        } else {
            initializeUI();
        }
        console.log('🎨 UI module initialized');
    }

    /**
     * Setup global error handling
     */
    async setupGlobalErrorHandling() {
        // Handle uncaught errors
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            this.handleGlobalError(event.error);
        });

        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.handleGlobalError(event.reason);
        });

        // Handle network errors
        window.addEventListener('offline', () => {
            this.showNetworkStatus(false);
        });

        window.addEventListener('online', () => {
            this.showNetworkStatus(true);
        });

        console.log('🛡️ Global error handling initialized');
    }

    /**
     * Handle global errors gracefully
     */
    handleGlobalError(error) {
        // Don't show alert for minor errors
        if (error && error.message) {
            if (error.message.includes('ResizeObserver') || 
                error.message.includes('Non-Error promise rejection')) {
                return; // Ignore common non-critical errors
            }
        }

        // Show user-friendly error message
        const errorMessage = this.getUserFriendlyErrorMessage(error);
        console.error('Application error:', errorMessage);
        
        // Optionally show notification instead of alert for better UX
        this.showNotification(errorMessage, 'error');
    }

    /**
     * Get user-friendly error message
     */
    getUserFriendlyErrorMessage(error) {
        if (!error) return 'An unknown error occurred.';
        
        if (typeof error === 'string') return error;
        
        if (error.code) {
            switch (error.code) {
                case 'auth/network-request-failed':
                    return 'Network error. Please check your internet connection.';
                case 'auth/too-many-requests':
                    return 'Too many attempts. Please try again later.';
                case 'permission-denied':
                    return 'Access denied. Please check your permissions.';
                default:
                    return error.message || 'An error occurred.';
            }
        }
        
        return error.message || 'An unexpected error occurred.';
    }

    /**
     * Show notification instead of alert for better UX
     */
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            max-width: 400px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" aria-label="Close"></button>
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
        
        // Add click to close
        notification.querySelector('.btn-close')?.addEventListener('click', () => {
            notification.remove();
        });
    }

    /**
     * Show network status
     */
    showNetworkStatus(isOnline) {
        const message = isOnline ? 
            'Connection restored. You are back online.' : 
            'You are currently offline. Some features may not work.';
        
        const type = isOnline ? 'success' : 'warning';
        this.showNotification(message, type);
    }

    /**
     * Set global loading state
     */
    setGlobalLoadingState(isLoading) {
        const body = document.body;
        if (isLoading) {
            body.classList.add('app-loading');
        } else {
            body.classList.remove('app-loading');
        }
    }

    /**
     * Show initialization error
     */
    showInitializationError(error) {
        const container = document.querySelector('.container') || document.body;
        container.innerHTML = `
            <div class="alert alert-danger text-center mt-5">
                <h4><i class="fas fa-exclamation-triangle"></i> Application Failed to Load</h4>
                <p>There was an error initializing the Time Tracker application.</p>
                <p><strong>Error:</strong> ${this.getUserFriendlyErrorMessage(error)}</p>
                <button class="btn btn-primary" onclick="location.reload()">
                    <i class="fas fa-redo"></i> Reload Application
                </button>
            </div>
        `;
    }

    /**
     * Get application version and info
     */
    getAppInfo() {
        return {
            name: 'Time Tracker',
            version: '2.0.0',
            build: 'optimized',
            features: [
                'Modular Architecture',
                'Performance Optimizations',
                'Efficient Caching',
                'Virtual DOM Updates',
                'Error Boundaries'
            ]
        };
    }
}

// Create application instance
const app = new TimeTrackerApp();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.initialize());
} else {
    app.initialize();
}

// Expose app for debugging in development
if (process?.env?.NODE_ENV === 'development' || window.location.hostname === 'localhost') {
    window.timeTrackerApp = app;
    console.log('🔧 App instance available as window.timeTrackerApp for debugging');
}

// Export for testing
export default app;