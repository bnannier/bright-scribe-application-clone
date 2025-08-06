import React from 'react';
import SunEditor from 'suneditor-react';
import 'suneditor/dist/css/suneditor.min.css';
import { useTheme } from 'next-themes';
import { Badge } from '@/components/ui/badge';
import { Cloud, CloudOff, CloudUpload } from 'lucide-react';

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
  const { theme } = useTheme();
  const sanitizeContent = (text: string): string => {
    // Remove potentially harmful scripts and HTML
    return text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
               .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
               .replace(/javascript:/gi, '')
               .replace(/on\w+\s*=/gi, '');
  };

  return (
    <div className={`w-full h-full flex flex-col ${theme === 'dark' ? 'dark-editor' : 'light-editor'}`}>
      <div className="flex-1 min-h-0">
        <SunEditor
          setContents={content}
          onChange={(content) => {
            if (content.length <= maxLength) {
              const sanitizedValue = sanitizeContent(content);
              onChange?.(sanitizedValue);
            }
          }}
          placeholder={placeholder}
          disable={!editable}
          height="calc(100vh - 140px)"
          setOptions={{
            buttonList: [
              ['undo', 'redo'],
              ['font', 'fontSize', 'formatBlock'],
              ['bold', 'underline', 'italic', 'strike', 'subscript', 'superscript'],
              ['fontColor', 'hiliteColor'],
              ['removeFormat'],
              ['outdent', 'indent'],
              ['align', 'horizontalRule', 'list', 'lineHeight'],
              ['table', 'link', 'image'],
              ['fullScreen', 'showBlocks', 'codeView'],
            ],
            formats: ['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
            font: ['Arial', 'Comic Sans MS', 'Courier New', 'Impact', 'Georgia', 'Tahoma', 'Trebuchet MS', 'Verdana'],
            fontSize: [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72],
          }}
        />
      </div>
      
      {content.length > maxLength * 0.9 && (
        <div className="text-sm text-muted-foreground mt-1 px-4">
          {content.length}/{maxLength} characters
        </div>
      )}
    </div>
  );
};