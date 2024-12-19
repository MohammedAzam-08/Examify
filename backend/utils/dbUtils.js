import mongoose from 'mongoose';

export const validateObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

export const handleDuplicateKeyError = (error) => {
  const field = Object.keys(error.keyValue)[0];
  return `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
};

export const handleValidationError = (error) => {
  const errors = Object.values(error.errors).map(err => err.message);
  return errors.join(', ');
};