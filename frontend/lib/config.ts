// Configuration for the application
export const config = {
  // API Configuration
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
    timeout: 30000, // 30 seconds
  },
  
  // Project Configuration
  project: {
    maxNameLength: 100,
    maxDescriptionLength: 500,
    supportedTypes: ['text-recognition'] as const,
  },
  
  // UI Configuration
  ui: {
    maxExamplesPerBatch: 50,
    maxFileSize: 100 * 1024 * 1024, // 100MB
  }
};

// Debug logging
console.log('Frontend config loaded:', {
  apiBaseUrl: config.api.baseUrl,
  nodeEnv: process.env.NODE_ENV,
  publicApiUrl: process.env.NEXT_PUBLIC_API_URL
});

export default config;
