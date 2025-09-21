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
    .default({})
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
    const { error, value } = schema.validate(req.body, { 
      abortEarly: false,
      stripUnknown: true 
    });
    
    if (error) {
      const errorMessages = error.details.map(detail => detail.message);
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
