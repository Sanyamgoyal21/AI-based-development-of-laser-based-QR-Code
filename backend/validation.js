const Joi = require('joi');

// User validation schemas
const userCreateSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .required()
    .messages({
      'string.alphanum': 'Username must contain only alphanumeric characters',
      'string.min': 'Username must be at least 3 characters long',
      'string.max': 'Username cannot exceed 30 characters',
      'any.required': 'Username is required'
    }),
  password: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.min': 'Password must be at least 6 characters long',
      'any.required': 'Password is required'
    }),
  fullName: Joi.string()
    .max(100)
    .optional()
    .allow(''),
  role: Joi.string()
    .valid('worker', 'admin')
    .default('worker')
});

const userLoginSchema = Joi.object({
  username: Joi.string()
    .required()
    .messages({
      'any.required': 'Username is required'
    }),
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required'
    })
});

// Item validation schemas
const itemCreateSchema = Joi.object({
  itemType: Joi.string()
    .trim()
    .required()
    .messages({
      'any.required': 'Item type is required'
    }),
  vendor: Joi.string()
    .trim()
    .optional()
    .allow(''),
  lotNumber: Joi.string()
    .trim()
    .optional()
    .allow(''),
  dateOfSupply: Joi.alternatives()
    .try(Joi.string().allow(''), Joi.date())
    .optional(),
  manufactureDate: Joi.alternatives()
    .try(Joi.string().allow(''), Joi.date())
    .optional(),
  warrantyStartDate: Joi.alternatives()
    .try(Joi.string().allow(''), Joi.date())
    .optional(),
  warrantyEndDate: Joi.alternatives()
    .try(Joi.string().allow(''), Joi.date())
    .optional(),
  warrantyMonths: Joi.alternatives()
    .try(Joi.number().integer().min(0), Joi.string().allow(''))
    .optional(),
  geoLat: Joi.alternatives()
    .try(Joi.number().min(-90).max(90), Joi.string().allow(''))
    .optional(),
  geoLng: Joi.alternatives()
    .try(Joi.number().min(-180).max(180), Joi.string().allow(''))
    .optional(),
  location: Joi.string()
    .trim()
    .optional()
    .allow(''),
  geotag: Joi.string()
    .trim()
    .optional()
    .allow(''),
  qrAccessPassword: Joi.string()
    .trim()
    .optional()
    .allow(''),
  dynamicData: Joi.alternatives()
    .try(Joi.object(), Joi.string().allow(''))
    .optional()
});

const itemUpdateSchema = Joi.object({
  itemType: Joi.string()
    .trim()
    .optional(),
  vendor: Joi.string()
    .trim()
    .optional()
    .allow(''),
  lotNumber: Joi.string()
    .trim()
    .optional()
    .allow(''),
  dateOfSupply: Joi.date()
    .optional(),
  warrantyMonths: Joi.number()
    .integer()
    .min(0)
    .optional(),
  geoLat: Joi.number()
    .min(-90)
    .max(90)
    .optional(),
  geoLng: Joi.number()
    .min(-180)
    .max(180)
    .optional(),
  dynamicData: Joi.object()
    .optional()
});

// QR Scan validation
const qrScanSchema = Joi.object({
  location: Joi.string()
    .trim()
    .optional()
    .allow('')
});

// Validation middleware
const validate = (schema) => {
  return (req, res, next) => {
    // Convert FormData values to appropriate types
    const processedBody = { ...req.body };
    
    // Convert string numbers to actual numbers
    if (processedBody.geoLat && !isNaN(processedBody.geoLat)) {
      processedBody.geoLat = parseFloat(processedBody.geoLat);
    }
    if (processedBody.geoLng && !isNaN(processedBody.geoLng)) {
      processedBody.geoLng = parseFloat(processedBody.geoLng);
    }
    if (processedBody.warrantyMonths && !isNaN(processedBody.warrantyMonths)) {
      processedBody.warrantyMonths = parseInt(processedBody.warrantyMonths);
    }
    
    // Parse dynamicData if it's a string
    if (processedBody.dynamicData && typeof processedBody.dynamicData === 'string') {
      try {
        processedBody.dynamicData = JSON.parse(processedBody.dynamicData);
      } catch (e) {
        processedBody.dynamicData = {};
      }
    }
    
    const { error, value } = schema.validate(processedBody, { 
      abortEarly: false,
      stripUnknown: true 
    });
    
    if (error) {
      const errorMessages = error.details.map(detail => detail.message);
      console.error('Validation Error:', errorMessages);
      console.error('Request Body:', processedBody);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errorMessages
      });
    }
    
    req.body = value;
    next();
  };
};

module.exports = {
  userCreateSchema,
  userLoginSchema,
  itemCreateSchema,
  itemUpdateSchema,
  qrScanSchema,
  validate
};
