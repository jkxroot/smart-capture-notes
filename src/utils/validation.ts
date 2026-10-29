import { Category, CATEGORIES } from '../types/record';
import { APP_CONFIG } from './constants';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export const validateEmail = (email: string): ValidationResult => {
  const trimmed = email.trim();
  if (!trimmed) {
    return { isValid: false, error: 'Email address is required.' };
  }
  // Standard RFC 5322 regex approximation for practical email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { isValid: false, error: 'Please enter a valid email address.' };
  }
  return { isValid: true };
};

export const validatePassword = (password: string): ValidationResult => {
  if (!password) {
    return { isValid: false, error: 'Password is required.' };
  }
  if (password.length < 6) {
    return { isValid: false, error: 'Password must be at least 6 characters.' };
  }
  return { isValid: true };
};

export const validateRecordTitle = (title: string): ValidationResult => {
  const trimmed = title.trim();
  if (!trimmed) {
    return { isValid: false, error: 'Title is required.' };
  }
  if (trimmed.length > APP_CONFIG.MAX_TITLE_LENGTH) {
    return {
      isValid: false,
      error: `Title cannot exceed ${APP_CONFIG.MAX_TITLE_LENGTH} characters.`,
    };
  }
  return { isValid: true };
};

export const validateRecordNotes = (notes?: string | null): ValidationResult => {
  if (!notes) {
    return { isValid: true };
  }
  if (notes.length > APP_CONFIG.MAX_NOTES_LENGTH) {
    return {
      isValid: false,
      error: `Notes cannot exceed ${APP_CONFIG.MAX_NOTES_LENGTH} characters.`,
    };
  }
  return { isValid: true };
};

export const validateRecordCategory = (category: string): ValidationResult => {
  if (!category) {
    return { isValid: false, error: 'Category is required.' };
  }
  if (!CATEGORIES.includes(category as Category)) {
    return { isValid: false, error: 'Invalid category selected.' };
  }
  return { isValid: true };
};
