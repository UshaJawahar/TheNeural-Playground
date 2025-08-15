const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface Project {
  id: string
  name: string
  type: 'text' | 'image' | 'sound' | 'numbers'
  description?: string
  language: string
  storage: 'browser' | 'cloud'
  created_at?: string
  updated_at?: string
}

export interface TrainingData {
  label: string
  examples: string[]
}

export interface TrainingJob {
  id: string
  project_id: string
  status: 'pending' | 'training' | 'completed' | 'failed'
  created_at: string
  completed_at?: string
}

export interface Prediction {
  label: string
  confidence: number
}

// API client class
class APIClient {
  private baseURL: string

  constructor() {
    this.baseURL = API_BASE_URL
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  // Project endpoints
  async getProjects(): Promise<Project[]> {
    return this.request<Project[]>('/api/projects')
  }

  async getProject(id: string): Promise<Project> {
    return this.request<Project>(`/api/projects/${id}`)
  }

  async createProject(project: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<Project> {
    return this.request<Project>('/api/projects', {
      method: 'POST',
      body: JSON.stringify(project),
    })
  }

  async deleteProject(id: string): Promise<void> {
    return this.request<void>(`/api/projects/${id}`, {
      method: 'DELETE',
    })
  }

  // Training data endpoints
  async getTrainingData(projectId: string): Promise<TrainingData[]> {
    return this.request<TrainingData[]>(`/api/projects/${projectId}/training-data`)
  }

  async addTrainingExample(
    projectId: string,
    label: string,
    example: string
  ): Promise<void> {
    return this.request<void>(`/api/projects/${projectId}/training-data`, {
      method: 'POST',
      body: JSON.stringify({ label, example }),
    })
  }

  async removeTrainingExample(
    projectId: string,
    label: string,
    example: string
  ): Promise<void> {
    return this.request<void>(`/api/projects/${projectId}/training-data`, {
      method: 'DELETE',
      body: JSON.stringify({ label, example }),
    })
  }

  // Training endpoints
  async startTraining(projectId: string): Promise<TrainingJob> {
    return this.request<TrainingJob>(`/api/projects/${projectId}/train`, {
      method: 'POST',
    })
  }

  async getTrainingStatus(projectId: string, jobId: string): Promise<TrainingJob> {
    return this.request<TrainingJob>(`/api/projects/${projectId}/training-jobs/${jobId}`)
  }

  // Prediction endpoints
  async predict(projectId: string, text: string): Promise<Prediction[]> {
    return this.request<Prediction[]>(`/api/projects/${projectId}/predict`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    })
  }

  // Demo projects (for try-it-now mode)
  async getDemoProjects(): Promise<Project[]> {
    return this.request<Project[]>('/api/demo-projects')
  }

  async createDemoProject(type: string): Promise<Project> {
    return this.request<Project>('/api/demo-projects', {
      method: 'POST',
      body: JSON.stringify({ type }),
    })
  }
}

// Export singleton instance
export const api = new APIClient()

// Helper functions for local storage (browser storage mode)
export const localStorage = {
  saveProject(project: Project): void {
    const projects = this.getProjects()
    const index = projects.findIndex(p => p.id === project.id)
    if (index >= 0) {
      projects[index] = project
    } else {
      projects.push(project)
    }
    window.localStorage.setItem('ml4kids_projects', JSON.stringify(projects))
  },

  getProjects(): Project[] {
    const data = window.localStorage.getItem('ml4kids_projects')
    return data ? JSON.parse(data) : []
  },

  getProject(id: string): Project | null {
    const projects = this.getProjects()
    return projects.find(p => p.id === id) || null
  },

  deleteProject(id: string): void {
    const projects = this.getProjects()
    const filtered = projects.filter(p => p.id !== id)
    window.localStorage.setItem('ml4kids_projects', JSON.stringify(filtered))
  },

  saveTrainingData(projectId: string, data: TrainingData[]): void {
    window.localStorage.setItem(`ml4kids_training_${projectId}`, JSON.stringify(data))
  },

  getTrainingData(projectId: string): TrainingData[] {
    const data = window.localStorage.getItem(`ml4kids_training_${projectId}`)
    return data ? JSON.parse(data) : []
  },
}
