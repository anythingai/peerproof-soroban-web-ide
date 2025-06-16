import Editor from '@monaco-editor/react';

interface MonacoEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
}

export function MonacoEditor({ value, onChange, language }: MonacoEditorProps) {
  const handleEditorChange = (value: string | undefined) => {
    onChange(value || '');
  };

  return (
    <Editor
      height="100%"
      language={language}
      value={value}
      onChange={handleEditorChange}
      theme="vs-dark"
      options={{
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        fontSize: 14,
        lineNumbers: 'on',
        roundedSelection: false,
        scrollbar: {
          vertical: 'visible',
          horizontal: 'visible'
        },
        automaticLayout: true,
        tabSize: 2,
        insertSpaces: true,
        wordWrap: 'on',
        formatOnType: true,
        formatOnPaste: true,
        renderWhitespace: 'selection',
        renderControlCharacters: true,
        folding: true,
        foldingHighlight: true,
        showFoldingControls: 'always',
        matchBrackets: 'always',
        autoIndent: 'advanced',
        colorDecorators: true,
        codeLens: true,
        contextmenu: true,
        copyWithSyntaxHighlighting: true,
        suggest: {
          showKeywords: true,
          showSnippets: true,
          showClasses: true,
          showFunctions: true,
          showVariables: true,
        }
      }}
    />
  );
}
