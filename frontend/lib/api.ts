import { config } from './config';

const API_BASE_URL = config.api.baseUrl;

export interface ProjectCreateRequest {
  name: string;
  description: string;
  type: 'text-recognition';
  createdBy: string;
  tags: string[];
  notes: string;
  config: {
    epochs: number;
    batchSize: number;
    learningRate: number;
    validationSplit: number;
  };
}

export interface ProjectResponse {
  success: boolean;
  data: {
    id: string;
    name: string;
    description: string;
    type: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    tags: string[];
    notes: string;
    config: {
      epochs: number;
      batchSize: number;
      learningRate: number;
      validationSplit: number;
    };
    dataset: any;
    datasets: any[];
    model: any;
  };
}

export interface ApiError {
  detail: string;
}

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log('API request to:', url);
    console.log('API_BASE_URL:', API_BASE_URL);
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      console.log('Making fetch request with options:', defaultOptions);
      
      // Check if fetch is available
      if (typeof fetch === 'undefined') {
        throw new Error('Fetch API is not available in this environment');
      }
      
      const response = await fetch(url, defaultOptions);
      console.log('Response received:', response.status, response.statusText);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorData: ApiError = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();
      console.log('Response data:', responseData);
      return responseData;
    } catch (error) {
      console.error('API request error:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        url: url,
        options: defaultOptions
      });
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred');
    }
  }

  async createProject(projectData: ProjectCreateRequest): Promise<ProjectResponse> {
    return this.request<ProjectResponse>('/api/projects/', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  }

  async getProjects(): Promise<any> {
    return this.request('/api/projects/');
  }

  async getProject(projectId: string): Promise<any> {
    return this.request(`/api/projects/${projectId}`);
  }

  async addExamples(projectId: string, examples: any[]): Promise<any> {
    return this.request(`/api/projects/${projectId}/examples`, {
      method: 'POST',
      body: JSON.stringify({ examples }),
    });
  }

  async getExamples(projectId: string): Promise<any> {
    return this.request(`/api/projects/${projectId}/examples`);
  }

  async startTraining(projectId: string, config?: any): Promise<any> {
    const body = config ? JSON.stringify(config) : undefined;
    return this.request(`/api/projects/${projectId}/train`, {
      method: 'POST',
      body,
    });
  }

  async getTrainingStatus(projectId: string): Promise<any> {
    return this.request(`/api/projects/${projectId}/train`);
  }

  async predict(projectId: string, text: string): Promise<any> {
    return this.request(`/api/projects/${projectId}/predict`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  }

  async deleteProject(projectId: string | string[]): Promise<any> {
    if (Array.isArray(projectId)) {
      // Handle multiple project IDs - join with commas
      const ids = projectId.join(',');
      return this.request(`/api/projects/${ids}`, {
        method: 'DELETE',
      });
    } else {
      // Handle single project ID
      return this.request(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });
    }
  }
}

export const apiService = new ApiService();
export default apiService;
