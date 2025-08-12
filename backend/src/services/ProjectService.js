const { firestore, bucket, topic } = require('../config/gcp');
const Project = require('../models/Project');
const { v4: uuidv4 } = require('uuid');

class ProjectService {
  constructor() {
    this.collection = firestore.collection('projects');
  }

  // Create a new project
  async createProject(projectData) {
    try {
      const project = new Project(projectData);
      const docRef = await this.collection.doc(project.id).set(project.toFirestore());
      return project;
    } catch (error) {
      console.error('Error creating project:', error);
      throw new Error('Failed to create project');
    }
  }

  // Get project by ID
  async getProjectById(projectId) {
    try {
      const doc = await this.collection.doc(projectId).get();
      return Project.fromFirestore(doc);
    } catch (error) {
      console.error('Error getting project:', error);
      throw new Error('Failed to get project');
    }
  }

  // Get all projects
  async getAllProjects(limit = 50, offset = 0) {
    try {
      const snapshot = await this.collection
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .offset(offset)
        .get();
      
      return snapshot.docs.map(doc => Project.fromFirestore(doc));
    } catch (error) {
      console.error('Error getting projects:', error);
      throw new Error('Failed to get projects');
    }
  }

  // Update project
  async updateProject(projectId, updateData) {
    try {
      const project = await this.getProjectById(projectId);
      if (!project) {
        throw new Error('Project not found');
      }
      
      project.update(updateData);
      await this.collection.doc(projectId).update(project.toFirestore());
      return project;
    } catch (error) {
      console.error('Error updating project:', error);
      throw new Error('Failed to update project');
    }
  }

  // Delete project
  async deleteProject(projectId) {
    try {
      const project = await this.getProjectById(projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      // Delete associated files from GCS
      if (project.dataset.gcsPath) {
        await this.deleteFile(project.dataset.gcsPath);
      }
      if (project.model.gcsPath) {
        await this.deleteFile(project.model.gcsPath);
      }

      // Delete from Firestore
      await this.collection.doc(projectId).delete();
      return true;
    } catch (error) {
      console.error('Error deleting project:', error);
      throw new Error('Failed to delete project');
    }
  }

  // Upload dataset file
  async uploadDataset(projectId, file, metadata = {}) {
    try {
      const project = await this.getProjectById(projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      const filename = `datasets/${projectId}/${file.originalname}`;
      const fileBuffer = file.buffer;
      
      // Upload to GCS
      const gcsFile = bucket.file(filename);
      await gcsFile.save(fileBuffer, {
        metadata: {
          contentType: file.mimetype,
          metadata: {
            projectId,
            uploadedAt: new Date().toISOString(),
            ...metadata
          }
        }
      });

      // Update project with dataset info
      const newDataset = {
        filename: file.originalname,
        size: file.size,
        records: metadata.records || 0,
        uploadedAt: new Date(),
        gcsPath: filename
      };
      
      const updateData = {
        dataset: newDataset,
        datasets: [newDataset] // Update datasets array for frontend compatibility
      };

      await this.updateProject(projectId, updateData);
      return { success: true, gcsPath: filename };
    } catch (error) {
      console.error('Error uploading dataset:', error);
      throw new Error('Failed to upload dataset');
    }
  }

  // Start training job
  async startTraining(projectId, config = {}) {
    try {
      const project = await this.getProjectById(projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      if (!project.dataset.gcsPath) {
        throw new Error('No dataset uploaded for this project');
      }

      // Update project status
      project.startTraining();
      if (config) {
        project.update({ config: { ...project.config, ...config } });
      }
      
      await this.collection.doc(projectId).update(project.toFirestore());

      // Publish training job to Pub/Sub
      const message = {
        projectId,
        datasetPath: project.dataset.gcsPath,
        config: project.config,
        timestamp: new Date().toISOString()
      };

      await topic.publish(Buffer.from(JSON.stringify(message)));
      
      return { success: true, message: 'Training job started' };
    } catch (error) {
      console.error('Error starting training:', error);
      throw new Error('Failed to start training');
    }
  }

  // Delete file from GCS
  async deleteFile(gcsPath) {
    try {
      const file = bucket.file(gcsPath);
      await file.delete();
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  // Search projects
  async searchProjects(query, filters = {}) {
    try {
      let ref = this.collection;
      
      // Apply filters
      if (filters.status) {
        ref = ref.where('status', '==', filters.status);
      }
      if (filters.type) {
        ref = ref.where('type', '==', filters.type);
      }
      if (filters.createdBy) {
        ref = ref.where('createdBy', '==', filters.createdBy);
      }

      const snapshot = await ref.get();
      let projects = snapshot.docs.map(doc => Project.fromFirestore(doc));

      // Apply text search if query provided
      if (query) {
        const searchTerm = query.toLowerCase();
        projects = projects.filter(project => 
          project.name.toLowerCase().includes(searchTerm) ||
          project.description.toLowerCase().includes(searchTerm) ||
          project.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
      }

      return projects;
    } catch (error) {
      console.error('Error searching projects:', error);
      throw new Error('Failed to search projects');
    }
  }
}

module.exports = ProjectService;
