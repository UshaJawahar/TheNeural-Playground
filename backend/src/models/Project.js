const { v4: uuidv4 } = require('uuid');

class Project {
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this.name = data.name || '';
    this.description = data.description || '';
    this.type = data.type || 'text-recognition'; // text-recognition, classification, regression, custom
    this.status = data.status || 'draft'; // draft, training, trained, testing
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.createdBy = data.createdBy || '';
    
    // Dataset information (single dataset for backward compatibility)
    this.dataset = {
      filename: data.dataset?.filename || '',
      size: data.dataset?.size || 0,
      records: data.dataset?.records || 0,
      uploadedAt: data.dataset?.uploadedAt || null,
      gcsPath: data.dataset?.gcsPath || ''
    };
    
    // Datasets array for frontend compatibility
    this.datasets = data.datasets || [this.dataset];
    
    // Model information
    this.model = {
      filename: data.model?.filename || '',
      accuracy: data.model?.accuracy || null,
      loss: data.model?.loss || null,
      trainedAt: data.model?.trainedAt || null,
      gcsPath: data.model?.gcsPath || ''
    };
    
    // Training configuration
    this.config = {
      epochs: data.config?.epochs || 100,
      batchSize: data.config?.batchSize || 32,
      learningRate: data.config?.learningRate || 0.001,
      validationSplit: data.config?.validationSplit || 0.2,
      ...data.config
    };
    
    // Training history
    this.trainingHistory = data.trainingHistory || [];
    
    // Metadata
    this.tags = data.tags || [];
    this.notes = data.notes || '';
  }

  toFirestore() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      type: this.type,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      createdBy: this.createdBy,
      dataset: this.dataset,
      datasets: this.datasets,
      model: this.model,
      config: this.config,
      trainingHistory: this.trainingHistory,
      tags: this.tags,
      notes: this.notes
    };
  }

  static fromFirestore(doc) {
    if (!doc.exists) return null;
    const data = doc.data();
    return new Project({ id: doc.id, ...data });
  }

  update(data) {
    Object.assign(this, data);
    this.updatedAt = new Date();
    return this;
  }

  startTraining() {
    this.status = 'training';
    this.updatedAt = new Date();
    return this;
  }

  completeTraining(accuracy, loss) {
    this.status = 'trained';
    this.model.accuracy = accuracy;
    this.model.loss = loss;
    this.model.trainedAt = new Date();
    this.updatedAt = new Date();
    return this;
  }

  failTraining(error) {
    this.status = 'testing';
    this.notes = `Training failed: ${error}`;
    this.updatedAt = new Date();
    return this;
  }
}

module.exports = Project;
