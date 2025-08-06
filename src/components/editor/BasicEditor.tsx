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
            colorList: [
              '#ff0000', '#ff5e00', '#ffe400', '#abf200', '#00d8ff', '#0055ff', '#6600ff', '#ff00dd', '#000000',
              '#ffd8d8', '#fae0d4', '#faf4c0', '#e4f7ba', '#d4f4fa', '#d9e5ff', '#e8d9ff', '#ffd9fa', '#f1f1f1',
              '#ffa7a7', '#ffc19e', '#faed7d', '#cef279', '#b2ebf4', '#b2ccff', '#d1b2ff', '#ffb2f5', '#bdbdbd',
              '#ff7979', '#ffa07a', '#f9d71c', '#a9e34b', '#54c7ec', '#6bcf7f', '#a29bfe', '#fd79a8', '#636e72',
              '#e84393', '#fd63c3', '#6c5ce7', '#a29bfe', '#74b9ff', '#0984e3', '#00b894', '#00cec9', '#2d3436'
            ],
            callBackSave: (contents: string) => {
              // Add !important to all color swatch inline styles
              const parser = new DOMParser();
              const doc = parser.parseFromString(`<div>${contents}</div>`, 'text/html');
              const elementsWithStyle = doc.querySelectorAll('[style*="background-color"]');
              
              elementsWithStyle.forEach(el => {
                const currentStyle = el.getAttribute('style') || '';
                const updatedStyle = currentStyle.replace(
                  /background-color:\s*([^;]+)/g, 
                  'background-color: $1 !important'
                );
                el.setAttribute('style', updatedStyle);
              });
              
              return doc.body.innerHTML;
            }
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