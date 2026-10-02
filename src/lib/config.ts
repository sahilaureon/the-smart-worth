/**
 * Application Configuration
 * This file contains hardcoded API keys and configuration values as requested by the user.
 */

export const CONFIG = {
  ADMIN_EMAIL: import.meta.env.VITE_ADMIN_EMAIL || 'helplinesmartworth@gmail.com',
  BACKEND_URL: '/api'
};

// Configuration is now focused on backend connectivity
export const isConfigured = true;
