import React from 'react';
import { Textarea } from '@/components/ui/textarea';

interface BasicEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  className?: string;
  editable?: boolean;
  maxLength?: number;
}

export const BasicEditor: React.FC<BasicEditorProps> = ({
  content = '',
  onChange,
  placeholder = "Start writing...",
  className = "",
  editable = true,
  maxLength = 100000, // 100KB character limit
}) => {
  const sanitizeContent = (text: string): string => {
    // Remove potentially harmful scripts and HTML
    return text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
               .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
               .replace(/javascript:/gi, '')
               .replace(/on\w+\s*=/gi, '');
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    
    // Apply length limit
    if (newValue.length <= maxLength) {
      const sanitizedValue = sanitizeContent(newValue);
      onChange?.(sanitizedValue);
    }
  };

  return (
    <div className="w-full">
      <Textarea
        value={content}
        onChange={handleChange}
        placeholder={placeholder}
        className={`min-h-[400px] resize-none ${className}`}
        disabled={!editable}
        maxLength={maxLength}
      />
      {content.length > maxLength * 0.9 && (
        <div className="text-sm text-muted-foreground mt-1">
          {content.length}/{maxLength} characters
        </div>
      )}
    </div>
  );
};