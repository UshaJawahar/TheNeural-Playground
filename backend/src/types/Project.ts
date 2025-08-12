// TypeScript interfaces for TheNeural Project types
// These match the frontend expectations

export interface Dataset {
  filename: string;
  size: number;
  records: number;
  uploadedAt: string | null;
  gcsPath: string;
}

export interface TrainedModel {
  filename: string;
  accuracy: number | null;
  loss: number | null;
  trainedAt: string | null;
  gcsPath: string;
}

export interface ProjectConfig {
  epochs: number;
  batchSize: number;
  learningRate: number;
  validationSplit: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  type: 'text-recognition' | 'classification' | 'regression' | 'custom';
  status: 'draft' | 'training' | 'trained' | 'testing';
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  
  // Dataset information (backward compatibility)
  dataset: Dataset;
  
  // Datasets array for frontend compatibility
  datasets: Dataset[];
  
  // Model information
  model: TrainedModel;
  
  // Training configuration
  config: ProjectConfig;
  
  // Training history
  trainingHistory: any[];
  
  // Metadata
  tags: string[];
  notes: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  details?: string[];
}

export interface ProjectListResponse {
  success: boolean;
  data: Project[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

export interface ProjectStatusResponse {
  success: boolean;
  data: {
    id: string;
    status: string;
    dataset: Dataset;
    datasets: Dataset[];
    model: TrainedModel;
    updatedAt: string;
  };
}

// Training job types
export interface TrainingJob {
  projectId: string;
  datasetPath: string;
  config: ProjectConfig;
  timestamp: string;
}

// File upload types
export interface FileUploadResponse {
  success: boolean;
  data: {
    success: boolean;
    gcsPath: string;
  };
}
