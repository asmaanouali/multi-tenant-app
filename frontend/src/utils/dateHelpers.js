import { format, parseISO, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';

// Format date to display string
export const formatDate = (date, formatStr = 'MMM dd, yyyy') => {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr);
};

// Get start of month
export const getMonthStart = (date = new Date()) => {
  return startOfMonth(date);
};

// Get end of month
export const getMonthEnd = (date = new Date()) => {
  return endOfMonth(date);
};

// Get next month
export const getNextMonth = (date = new Date()) => {
  return addMonths(date, 1);
};

// Get previous month
export const getPreviousMonth = (date = new Date()) => {
  return subMonths(date, 1);
};

// Convert date to ISO string for API
export const toISOString = (date) => {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return dateObj.toISOString();
};

// Check if date is in range
export const isDateInRange = (date, startDate, endDate) => {
  const checkDate = typeof date === 'string' ? parseISO(date) : date;
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
  
  return checkDate >= start && checkDate <= end;
};

// Get month name
export const getMonthName = (date = new Date()) => {
  return format(date, 'MMMM yyyy');
};