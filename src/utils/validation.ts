// Shared form validation utilities
export const validators = {
  // Email format
  email: (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
  
  // URL format (http/https or relative /path)
  url: (v: string) => !v || v.startsWith('/') || /^https?:\/\/[^\s]+$/.test(v.trim()),
  
  // Numeric (integer or decimal)
  numeric: (v: string) => /^\d*\.?\d+$/.test(v.trim()),
  
  // No script injection (basic XSS prevention)
  safe: (v: string) => !/<script|javascript:|on\w+\s*=|data:/i.test(v),
  
  // Required field
  required: (v: string) => v.trim().length > 0,
};

// Sanitize text input - strip dangerous HTML/script patterns
export function sanitize(input: string, maxLength = 1000): string {
  return input
    .slice(0, maxLength)
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/data:text\/html/gi, '')
    .trim();
}

// Validate and return error message or null
export function validateField(
  value: string,
  rules: { required?: boolean; maxLength?: number; email?: boolean; url?: boolean; numeric?: boolean; label?: string }
): string | null {
  const label = rules.label || 'Field';
  
  if (rules.required && !value.trim()) return `${label} is required`;
  if (value && rules.maxLength && value.length > rules.maxLength) return `${label} must be under ${rules.maxLength} characters`;
  if (value && rules.email && !validators.email(value)) return 'Please enter a valid email address';
  if (value && rules.url && !validators.url(value)) return 'Please enter a valid URL (must start with https:// or /)';
  if (value && rules.numeric && !validators.numeric(value)) return `${label} must be a number`;
  if (value && !validators.safe(value)) return `${label} contains invalid characters`;
  
  return null;
}

// Validate entire form - returns first error or null
export function validateForm(fields: Array<{ value: string; rules: Parameters<typeof validateField>[1] }>): string | null {
  for (const { value, rules } of fields) {
    const err = validateField(value, rules);
    if (err) return err;
  }
  return null;
}
