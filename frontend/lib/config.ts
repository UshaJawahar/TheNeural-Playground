// Configuration for the Neural Playground frontend
export const config = {
  // Backend API base URL
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || 'https://theneural-backend-ed2fe2fxhq-uc.a.run.app',
  
  // API endpoints
  api: {
    guests: {
      session: '/api/guests/session',
      sessionById: (sessionId: string) => `/api/guests/session/${sessionId}`,
      deleteSession: (sessionId: string) => `/api/guests/session/${sessionId}`,
      projectById: (sessionId: string, projectId: string) => `/api/guests/session/${sessionId}/projects/${projectId}`,
      examples: (sessionId: string, projectId: string) => `/api/guests/session/${sessionId}/projects/${projectId}/examples`,
      trainModel: (sessionId: string, projectId: string) => `/api/guests/session/${sessionId}/projects/${projectId}/train`,
      trainingStatus: (sessionId: string, projectId: string) => `/api/guests/session/${sessionId}/projects/${projectId}/train`,
      predict: (sessionId: string, projectId: string) => `/api/guests/session/${sessionId}/projects/${projectId}/predict`,
      deleteModel: (sessionId: string, projectId: string) => `/api/guests/projects/${projectId}/model`,
      deleteExamplesByLabel: (sessionId: string, projectId: string, label: string) => `/api/guests/projects/${projectId}/examples/${label}`,
      deleteSpecificExample: (sessionId: string, projectId: string, label: string, exampleIndex: number) => `/api/guests/projects/${projectId}/examples/${label}/${exampleIndex}`,
    },
  },
} as const;

export default config;
