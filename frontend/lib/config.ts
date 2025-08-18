// Configuration for the Neural Playground frontend
export const config = {
  // Backend API base URL
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
  
  // API endpoints
  api: {
    guests: {
      session: '/api/guests/session',
      sessionById: (sessionId: string) => `/api/guests/session/${sessionId}`,
    },
  },
} as const;

export default config;
