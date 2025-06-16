/* eslint-disable react/jsx-no-inline-styles */
import React, { useState } from 'react';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen, Trash2, Edit3, FilePlus, FolderPlus } from 'lucide-react';

interface FileNode {
  name: string;
  type: 'file' | 'directory';
  path: string;
  content?: string;
  children?: FileNode[];
}

interface FileTreeProps {
  files: FileNode[];
  onFileSelect: (file: FileNode) => void;
  activeFile: string;
  level?: number;
  onCreateFile?: (parentPath: string, fileName: string) => void;
  onCreateFolder?: (parentPath: string, folderName: string) => void;
  onDeleteFile?: (filePath: string) => void;
  onRenameFile?: (oldPath: string, newName: string) => void;
}

export function FileTree({ 
  files, 
  onFileSelect, 
  activeFile, 
  level = 0, 
  onCreateFile, 
  onCreateFolder, 
  onDeleteFile, 
  onRenameFile 
}: FileTreeProps) {
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set(['hello_world', 'hello_world/src']));
  const [contextMenu, setContextMenu] = useState<{ show: boolean; x: number; y: number; file: FileNode | null }>({
    show: false,
    x: 0,
    y: 0,
    file: null
  });
  const [isRenaming, setIsRenaming] = useState<string | null>(null);
  const [newName, setNewName] = useState('');

  const toggleDirectory = (path: string) => {
    const newExpanded = new Set(expandedDirs);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedDirs(newExpanded);
  };

  const handleContextMenu = (e: React.MouseEvent, file: FileNode) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      file
    });
  };

  const handleCreateFile = (parentPath: string) => {
    const fileName = prompt('Enter file name:');
    if (fileName && onCreateFile) {
      onCreateFile(parentPath, fileName);
    }
    setContextMenu({ show: false, x: 0, y: 0, file: null });
  };

  const handleCreateFolder = (parentPath: string) => {
    const folderName = prompt('Enter folder name:');
    if (folderName && onCreateFolder) {
      onCreateFolder(parentPath, folderName);
    }
    setContextMenu({ show: false, x: 0, y: 0, file: null });
  };

  const handleDelete = (filePath: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      onDeleteFile?.(filePath);
    }
    setContextMenu({ show: false, x: 0, y: 0, file: null });
  };

  const handleRename = (oldPath: string, currentName: string) => {
    setIsRenaming(oldPath);
    setNewName(currentName);
    setContextMenu({ show: false, x: 0, y: 0, file: null });
  };

  const confirmRename = (oldPath: string) => {
    if (newName && newName !== contextMenu.file?.name && onRenameFile) {
      onRenameFile(oldPath, newName);
    }
    setIsRenaming(null);
    setNewName('');
  };

  const cancelRename = () => {
    setIsRenaming(null);
    setNewName('');
  };

  return (
    <>
      <div className="text-sm">
        {files.map((file) => (
          <div key={file.path}>
            <div
              className={`flex items-center px-2 py-1 hover:bg-slate-700 cursor-pointer group ${
                activeFile === file.path ? 'bg-blue-600/30 border-l-2 border-blue-400' : ''
              } pl-[${8 + level * 16}px]`}
              onClick={() => {
                if (file.type === 'directory') {
                  toggleDirectory(file.path);
                } else {
                  onFileSelect(file);
                }
              }}
              onContextMenu={(e) => handleContextMenu(e, file)}
            >
              {file.type === 'directory' && (
                <div className="w-4 h-4 mr-1 flex items-center justify-center">
                  {expandedDirs.has(file.path) ? (
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-3 h-3 text-slate-400" />
                  )}
                </div>
              )}
              <div className="w-4 h-4 mr-2 flex items-center justify-center">
                {file.type === 'directory' ? (
                  expandedDirs.has(file.path) ? (
                    <FolderOpen className="w-4 h-4 text-yellow-500" />
                  ) : (
                    <Folder className="w-4 h-4 text-yellow-500" />
                  )
                ) : (
                  <File className={`w-4 h-4 ${
                    file.name.endsWith('.rs') ? 'text-orange-400' : 
                    file.name.endsWith('.toml') ? 'text-blue-400' : 
                    'text-slate-400'
                  }`} />
                )}
              </div>
              {isRenaming === file.path ? (
                <input
                  type="text"
                  placeholder="Enter new file name"
                  aria-label="Rename file"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onBlur={() => confirmRename(file.path)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') confirmRename(file.path);
                    if (e.key === 'Escape') cancelRename();
                  }}
                  className="flex-1 bg-slate-600 text-white px-1 py-0 text-sm border border-blue-500 rounded"
                  autoFocus
                />
              ) : (
                <span className="text-slate-300 truncate flex-1">{file.name}</span>
              )}
              {file.type === 'directory' && (
                <div className="opacity-0 group-hover:opacity-100 flex items-center ml-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCreateFile(file.path);
                    }}
                    className="p-1 hover:bg-slate-600 rounded"
                    title="New File"
                  >
                    <FilePlus className="w-3 h-3 text-slate-400" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCreateFolder(file.path);
                    }}
                    className="p-1 hover:bg-slate-600 rounded"
                    title="New Folder"
                  >
                    <FolderPlus className="w-3 h-3 text-slate-400" />
                  </button>
                </div>
              )}
            </div>
            {file.type === 'directory' && 
             file.children && 
             expandedDirs.has(file.path) && (
              <FileTree
                files={file.children}
                onFileSelect={onFileSelect}
                activeFile={activeFile}
                level={level + 1}
                onCreateFile={onCreateFile}
                onCreateFolder={onCreateFolder}
                onDeleteFile={onDeleteFile}
                onRenameFile={onRenameFile}
              />
            )}
          </div>
        ))}
      </div>

      {/* Context Menu */}
      {contextMenu.show && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setContextMenu({ show: false, x: 0, y: 0, file: null })}
          />
          <div
            className={`fixed z-50 bg-slate-800 border border-slate-600 rounded-md shadow-lg py-1 min-w-[160px] top-[${contextMenu.y}px] left-[${contextMenu.x}px]`}
          >
            {contextMenu.file?.type === 'directory' && (
              <>
                <button
                  onClick={() => handleCreateFile(contextMenu.file!.path)}
                  className="flex items-center w-full px-3 py-2 text-sm text-slate-300 hover:bg-slate-700"
                >
                  <FilePlus className="w-4 h-4 mr-2" />
                  New File
                </button>
                <button
                  onClick={() => handleCreateFolder(contextMenu.file!.path)}
                  className="flex items-center w-full px-3 py-2 text-sm text-slate-300 hover:bg-slate-700"
                >
                  <FolderPlus className="w-4 h-4 mr-2" />
                  New Folder
                </button>
                <div className="border-t border-slate-600 my-1" />
              </>
            )}
            <button
              onClick={() => handleRename(contextMenu.file!.path, contextMenu.file!.name)}
              className="flex items-center w-full px-3 py-2 text-sm text-slate-300 hover:bg-slate-700"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Rename
            </button>
            <button
              onClick={() => handleDelete(contextMenu.file!.path)}
              className="flex items-center w-full px-3 py-2 text-sm text-red-400 hover:bg-slate-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </button>
          </div>
        </>
      )}
    </>
  );
}
