const Joi = require('joi');

// Validation schema for project creation/update
const projectSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  description: Joi.string().max(500).optional(),
  type: Joi.string().valid('text-recognition', 'classification', 'regression', 'custom').optional(),
  status: Joi.string().valid('draft', 'training', 'trained', 'testing').optional(),
  createdBy: Joi.string().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  notes: Joi.string().max(1000).optional(),
  config: Joi.object({
    epochs: Joi.number().integer().min(1).max(10000).optional(),
    batchSize: Joi.number().integer().min(1).max(10000).optional(),
    learningRate: Joi.number().positive().max(1).optional(),
    validationSplit: Joi.number().positive().max(1).optional()
  }).optional()
});

// Validation schema for training configuration
const trainingConfigSchema = Joi.object({
  epochs: Joi.number().integer().min(1).max(10000).optional(),
  batchSize: Joi.number().integer().min(1).max(10000).optional(),
  learningRate: Joi.number().positive().max(1).optional(),
  validationSplit: Joi.number().positive().max(1).optional()
});

// Middleware to validate project data
const validateProject = (req, res, next) => {
  const { error, value } = projectSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.details.map(detail => detail.message)
    });
  }
  
  req.body = value;
  next();
};

// Middleware to validate training configuration
const validateTrainingConfig = (req, res, next) => {
  const { error, value } = trainingConfigSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Training configuration validation failed',
      details: error.details.map(detail => detail.message)
    });
  }
  
  req.body = value;
  next();
};

module.exports = {
  validateProject,
  validateTrainingConfig
};
