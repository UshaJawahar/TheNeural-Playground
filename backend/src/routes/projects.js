const express = require('express');
const multer = require('multer');
const ProjectService = require('../services/ProjectService');
const { validateProject, validateTrainingConfig } = require('../middleware/validation');

const router = express.Router();
const projectService = new ProjectService();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow CSV, JSON, and common data formats
    const allowedTypes = [
      'text/csv',
      'application/json',
      'text/plain',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV, JSON, and Excel files are allowed.'), false);
    }
  }
});

// GET /api/projects - Get all projects
router.get('/', async (req, res) => {
  try {
    const { limit = 50, offset = 0, status, type, createdBy, search } = req.query;
    const filters = { status, type, createdBy };
    
    let projects;
    if (search) {
      projects = await projectService.searchProjects(search, filters);
    } else {
      projects = await projectService.getAllProjects(parseInt(limit), parseInt(offset));
    }
    
    res.json({
      success: true,
      data: projects,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: projects.length
      }
    });
  } catch (error) {
    console.error('Error getting projects:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/projects/:id - Get project by ID
router.get('/:id', async (req, res) => {
  try {
    const project = await projectService.getProjectById(req.params.id);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }
    
    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Error getting project:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/projects - Create new project
router.post('/', validateProject, async (req, res) => {
  try {
    const project = await projectService.createProject(req.body);
    res.status(201).json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// PUT /api/projects/:id - Update project
router.put('/:id', validateProject, async (req, res) => {
  try {
    const project = await projectService.updateProject(req.params.id, req.body);
    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// DELETE /api/projects/:id - Delete project
router.delete('/:id', async (req, res) => {
  try {
    await projectService.deleteProject(req.params.id);
    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/projects/:id/dataset - Upload dataset
router.post('/:id/dataset', upload.single('dataset'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const metadata = {
      records: req.body.records ? parseInt(req.body.records) : 0,
      description: req.body.description || ''
    };

    const result = await projectService.uploadDataset(req.params.id, req.file, metadata);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error uploading dataset:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/projects/:id/train - Start training
router.post('/:id/train', validateTrainingConfig, async (req, res) => {
  try {
    const result = await projectService.startTraining(req.params.id, req.body);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error starting training:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/projects/:id/status - Get project status
router.get('/:id/status', async (req, res) => {
  try {
    const project = await projectService.getProjectById(req.params.id);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }
    
          res.json({
        success: true,
        data: {
          id: project.id,
          status: project.status,
          dataset: project.dataset,
          datasets: project.datasets,
          model: project.model,
          updatedAt: project.updatedAt
        }
      });
  } catch (error) {
    console.error('Error getting project status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
