import { useState, useEffect } from 'react';
import { FileTree } from './components/FileTree';
import { MonacoEditor } from './components/MonacoEditor';
import { AccountPanel } from './components/AccountPanel';
import { BuildOutput } from './components/BuildOutput';
import { useWebSocket } from './hooks/useWebSocket';
import { api } from './services/api';
import { FileText, Play, Upload } from 'lucide-react';

interface FileNode {
  name: string;
  type: 'file' | 'directory';
  path: string;
  content?: string;
  children?: FileNode[];
}

function App() {
  const [activeFile, setActiveFile] = useState<string>('');
  const [fileContent, setFileContent] = useState<string>('');
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  
  const { messages } = useWebSocket(`ws://${window.location.hostname}:8000/ws`);

  // Initialize with sample project
  useEffect(() => {
    // Clear any existing localStorage cache for file content
    localStorage.removeItem('soroban-ide-files');
    
    const sampleTree: FileNode[] = [
      {
        name: 'hello_world',
        type: 'directory',
        path: 'hello_world',
        children: [
          {
            name: 'Cargo.toml',
            type: 'file',
            path: 'hello_world/Cargo.toml',
            content: `[package]
name = "hello_world"
version = "0.1.0"
edition = "2021"
authors = ["Soroban IDE"]
description = "A sample Hello World smart contract for Soroban"
license = "MIT OR Apache-2.0"
repository = "https://github.com/your-org/soroban-ide"

[lib]
crate-type = ["cdylib"]

[features]
testutils = ["soroban-sdk/testutils"]

[dependencies]
soroban-sdk = "22.0.8"

[dev-dependencies]
soroban-sdk = { version = "22.0.8", features = ["testutils"] }

[profile.release]
opt-level = "z"
overflow-checks = true
debug = 0
strip = "symbols"
debug-assertions = false
panic = "abort"
codegen-units = 1
lto = true

[profile.release-with-logs]
inherits = "release"
debug-assertions = true`
          },
          {
            name: 'src',
            type: 'directory',
            path: 'hello_world/src',
            children: [
              {
                name: 'lib.rs',
                type: 'file',
                path: 'hello_world/src/lib.rs',
                content: `#![no_std]
use soroban_sdk::{contract, contractimpl, symbol_short, Env, Symbol, Vec};

/// A simple "Hello World" Soroban smart contract demonstrating basic functionality.
/// This contract includes common patterns like storage, events, and different data types.
#[contract]
pub struct HelloContract;

#[contractimpl]
impl HelloContract {
    /// Returns a greeting message combined with the provided name.
    ///
    /// # Arguments
    /// * \`to\` - The name to greet (as a Symbol)
    ///
    /// # Returns
    /// A Symbol containing "Hello" + the provided name
    pub fn hello(env: Env, to: Symbol) -> Symbol {
        // Log the greeting for debugging
        env.events().publish(
            (symbol_short!("hello"),),
            (symbol_short!("called"), to.clone())
        );

        // Return a simple greeting
        symbol_short!("Hello")
    }

    /// Increments a given number by 1.
    /// Demonstrates basic arithmetic operations.
    ///
    /// # Arguments
    /// * \`value\` - The number to increment
    ///
    /// # Returns
    /// The incremented value
    pub fn increment(env: Env, value: u32) -> u32 {
        let result = value.saturating_add(1);

        // Emit an event for the increment operation
        env.events().publish(
            (symbol_short!("inc"),),
            (value, result)
        );

        result
    }

    /// Stores a value in the contract's persistent storage.
    /// Demonstrates how to use Soroban's storage system.
    ///
    /// # Arguments
    /// * \`key\` - The storage key
    /// * \`value\` - The value to store
    pub fn store_value(env: Env, key: Symbol, value: u32) {
        env.storage().persistent().set(&key, &value);

        env.events().publish(
            (symbol_short!("store"),),
            (key, value)
        );
    }

    /// Retrieves a value from the contract's persistent storage.
    ///
    /// # Arguments
    /// * \`key\` - The storage key to lookup
    ///
    /// # Returns
    /// The stored value, or 0 if key doesn't exist
    pub fn get_value(env: Env, key: Symbol) -> u32 {
        env.storage().persistent().get(&key).unwrap_or(0)
    }

    /// Adds two numbers together.
    /// Simple demonstration of function with multiple parameters.
    ///
    /// # Arguments
    /// * \`a\` - First number
    /// * \`b\` - Second number
    ///
    /// # Returns
    /// Sum of a and b
    pub fn add(env: Env, a: u32, b: u32) -> u32 {
        let result = a.saturating_add(b);

        env.events().publish(
            (symbol_short!("add"),),
            (a, b, result)
        );

        result
    }

    /// Returns a vector of numbers from 1 to n.
    /// Demonstrates working with vectors in Soroban.
    ///
    /// # Arguments
    /// * \`n\` - The upper limit (must be <= 10 for efficiency)
    ///
    /// # Returns
    /// A vector containing numbers from 1 to n
    pub fn get_numbers(env: Env, n: u32) -> Vec<u32> {
        if n > 10 {
            panic!("Number too large, maximum is 10");
        }

        let mut vec = Vec::new(&env);
        for i in 1..=n {
            vec.push_back(i);
        }

        env.events().publish(
            (symbol_short!("numbers"),),
            (n, vec.len())
        );

        vec
    }

    /// Returns the current contract version.
    /// Useful for contract upgrades and version tracking.
    pub fn version() -> Symbol {
        symbol_short!("v1.0.0")
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::{Events, Ledger};
    use soroban_sdk::{symbol_short, vec, Env};

    #[test]
    fn test_hello() {
        let env = Env::default();
        let contract_id = env.register_contract(None, HelloContract);
        let client = HelloContractClient::new(&env, &contract_id);

        let result = client.hello(&symbol_short!("World"));
        assert_eq!(result, symbol_short!("Hello"));

        // Check that event was emitted
        let events = env.events().all();
        assert_eq!(events.len(), 1);
    }

    #[test]
    fn test_increment() {
        let env = Env::default();
        let contract_id = env.register_contract(None, HelloContract);
        let client = HelloContractClient::new(&env, &contract_id);

        assert_eq!(client.increment(&5), 6);
        assert_eq!(client.increment(&u32::MAX), u32::MAX); // Test overflow protection
    }

    #[test]
    fn test_storage() {
        let env = Env::default();
        let contract_id = env.register_contract(None, HelloContract);
        let client = HelloContractClient::new(&env, &contract_id);

        let key = symbol_short!("test_key");
        let value = 42u32;

        // Store value
        client.store_value(&key, &value);

        // Retrieve value
        let retrieved = client.get_value(&key);
        assert_eq!(retrieved, value);

        // Test non-existent key
        let missing = client.get_value(&symbol_short!("missing"));
        assert_eq!(missing, 0);
    }

    #[test]
    fn test_add() {
        let env = Env::default();
        let contract_id = env.register_contract(None, HelloContract);
        let client = HelloContractClient::new(&env, &contract_id);

        assert_eq!(client.add(&10, &20), 30);
        assert_eq!(client.add(&u32::MAX, &1), u32::MAX); // Test overflow protection
    }

    #[test]
    fn test_get_numbers() {
        let env = Env::default();
        let contract_id = env.register_contract(None, HelloContract);
        let client = HelloContractClient::new(&env, &contract_id);

        let result = client.get_numbers(&5);
        let expected = vec![&env, 1, 2, 3, 4, 5];
        assert_eq!(result, expected);
    }

    #[test]
    #[should_panic(expected = "Number too large")]
    fn test_get_numbers_too_large() {
        let env = Env::default();
        let contract_id = env.register_contract(None, HelloContract);
        let client = HelloContractClient::new(&env, &contract_id);

        client.get_numbers(&15); // Should panic
    }

    #[test]
    fn test_version() {
        assert_eq!(HelloContract::version(), symbol_short!("v1.0.0"));
    }
}`
              }
            ]
          }
        ]
      }
    ];
    
    setFileTree(sampleTree);
    
    // Safely access nested properties and set up the Cargo.toml as the active file
    const helloWorldDir = sampleTree[0];
    if (helloWorldDir && helloWorldDir.children) {
      const cargoFile = helloWorldDir.children.find(child => child.name === 'Cargo.toml');
      if (cargoFile && cargoFile.content) {
        setActiveFile(cargoFile.path);
        setFileContent(cargoFile.content);
      } else {
        // Fallback to lib.rs if Cargo.toml not found
        const srcDir = helloWorldDir.children.find(child => child.name === 'src');
        if (srcDir && srcDir.children) {
          const libFile = srcDir.children.find(child => child.name === 'lib.rs');
          if (libFile && libFile.content) {
            setActiveFile(libFile.path);
            setFileContent(libFile.content);
          }
        }
      }
    }
  }, []);

  const handleFileSelect = (file: FileNode) => {
    if (file.type === 'file' && file.content !== undefined) {
      setActiveFile(file.path);
      setFileContent(file.content);
    }
  };

  const handleCodeChange = (value: string) => {
    setFileContent(value);
    // Update file tree with new content
    const updateFileContent = (nodes: FileNode[]): FileNode[] => {
      return nodes.map(node => {
        if (node.path === activeFile) {
          return { ...node, content: value };
        }
        if (node.children) {
          return { ...node, children: updateFileContent(node.children) };
        }
        return node;
      });
    };
    setFileTree(updateFileContent(fileTree));
  };

  const handleCreateFile = async (parentPath: string, fileName: string) => {
    try {
      const result = await api.createFile({
        parentPath,
        name: fileName,
        type: 'file',
        content: ''
      });
      
      if (result.success) {
        // Add new file to tree
        const addFileToTree = (nodes: FileNode[]): FileNode[] => {
          return nodes.map(node => {
            if (node.path === parentPath && node.type === 'directory') {
              const newFile: FileNode = {
                name: fileName,
                type: 'file',
                path: result.path,
                content: ''
              };
              return {
                ...node,
                children: [...(node.children || []), newFile]
              };
            }
            if (node.children) {
              return { ...node, children: addFileToTree(node.children) };
            }
            return node;
          });
        };
        setFileTree(addFileToTree(fileTree));
      }
    } catch (error) {
      console.error('Failed to create file:', error);
    }
  };

  const handleCreateFolder = async (parentPath: string, folderName: string) => {
    try {
      const result = await api.createFile({
        parentPath,
        name: folderName,
        type: 'folder'
      });
      
      if (result.success) {
        // Add new folder to tree
        const addFolderToTree = (nodes: FileNode[]): FileNode[] => {
          return nodes.map(node => {
            if (node.path === parentPath && node.type === 'directory') {
              const newFolder: FileNode = {
                name: folderName,
                type: 'directory',
                path: result.path,
                children: []
              };
              return {
                ...node,
                children: [...(node.children || []), newFolder]
              };
            }
            if (node.children) {
              return { ...node, children: addFolderToTree(node.children) };
            }
            return node;
          });
        };
        setFileTree(addFolderToTree(fileTree));
      }
    } catch (error) {
      console.error('Failed to create folder:', error);
    }
  };

  const handleDeleteFile = async (filePath: string) => {
    try {
      const result = await api.deleteFile(filePath);
      
      if (result.success) {
        // Remove file from tree
        const removeFromTree = (nodes: FileNode[]): FileNode[] => {
          return nodes.filter(node => node.path !== filePath).map(node => {
            if (node.children) {
              return { ...node, children: removeFromTree(node.children) };
            }
            return node;
          });
        };
        setFileTree(removeFromTree(fileTree));
        
        // Clear editor if deleted file was active
        if (activeFile === filePath) {
          setActiveFile('');
          setFileContent('');
        }
      }
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
  };

  const handleRenameFile = async (oldPath: string, newName: string) => {
    try {
      const result = await api.renameFile(oldPath, newName);
      
      if (result.success) {
        // Update file tree with new name/path
        const updateTree = (nodes: FileNode[]): FileNode[] => {
          return nodes.map(node => {
            if (node.path === oldPath) {
              return { ...node, name: newName, path: result.path };
            }
            if (node.children) {
              return { ...node, children: updateTree(node.children) };
            }
            return node;
          });
        };
        setFileTree(updateTree(fileTree));
        
        // Update active file if it was renamed
        if (activeFile === oldPath) {
          setActiveFile(result.path);
        }
      }
    } catch (error) {
      console.error('Failed to rename file:', error);
    }
  };

  const handleCompile = async () => {
    try {
      // Collect all files for compilation
      const projectFiles: { [key: string]: string } = {};
      
      const collectFiles = (nodes: FileNode[]) => {
        nodes.forEach(node => {
          if (node.type === 'file' && node.content !== undefined) {
            projectFiles[node.path] = node.content;
          }
          if (node.children) {
            collectFiles(node.children);
          }
        });
      };
      
      collectFiles(fileTree);
      
      const result = await api.compile(projectFiles);
      
      if (result.error) {
        console.error('Compilation failed:', result.error);
      } else {
        console.log('Compilation successful:', result);
      }
    } catch (error) {
      console.error('Failed to compile:', error);
    }
  };

  const handleDeploy = async () => {
    try {
      // First compile to get WASM
      const projectFiles: { [key: string]: string } = {};
      
      const collectFiles = (nodes: FileNode[]) => {
        nodes.forEach(node => {
          if (node.type === 'file' && node.content !== undefined) {
            projectFiles[node.path] = node.content;
          }
          if (node.children) {
            collectFiles(node.children);
          }
        });
      };
      
      collectFiles(fileTree);
      
      const compileResult = await api.compile(projectFiles);
      
      if (compileResult.error) {
        console.error('Compilation failed:', compileResult.error);
        return;
      }
      
      if (!compileResult.wasm_base64) {
        console.error('No WASM output from compilation');
        return;
      }
      
      // Get account from localStorage
      const accounts = JSON.parse(localStorage.getItem('soroban-ide-accounts') || '[]');
      if (accounts.length === 0) {
        alert('Please create an account first');
        return;
      }
      
      const account = accounts[0]; // Use first account
      
      const deployResult = await api.deploy({
        wasm_base64: compileResult.wasm_base64,
        secret_key: account.secretKey,
        network: 'futurenet'
      });
      
      if (deployResult.error) {
        console.error('Deployment failed:', deployResult.error);
      } else {
        console.log('Deployment successful:', deployResult);
        
        // Save deployment to localStorage
        const deployments = JSON.parse(localStorage.getItem('soroban-ide-deployments') || '[]');
        deployments.push({
          contractId: deployResult.contractId,
          transactionHash: deployResult.transactionHash,
          timestamp: new Date().toISOString(),
          accountPublicKey: account.publicKey
        });
        localStorage.setItem('soroban-ide-deployments', JSON.stringify(deployments));
      }
    } catch (error) {
      console.error('Failed to deploy:', error);
    }
  };

  return (
    <div className="h-screen bg-slate-900 text-white flex">
      {/* Left Sidebar - File Explorer */}
      <div className="w-80 bg-slate-800 border-r border-slate-700 flex flex-col">
        {/* Header with macOS style buttons */}
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="ml-2 text-sm font-medium text-slate-300">Soroban Remix IDE</span>
          </div>
        </div>

        {/* File Explorer */}
        <div className="flex-1">
          <div className="p-4 border-b border-slate-700">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">EXPLORER</h3>
            <FileTree 
              files={fileTree} 
              onFileSelect={handleFileSelect} 
              activeFile={activeFile}
              onCreateFile={handleCreateFile}
              onCreateFolder={handleCreateFolder}
              onDeleteFile={handleDeleteFile}
              onRenameFile={handleRenameFile}
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex">
        {/* Editor Area */}
        <div className="flex-1 flex flex-col">
          {/* Tab Bar */}
          <div className="bg-slate-800 border-b border-slate-700 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {activeFile ? (
                  <div className="flex items-center space-x-2 bg-slate-700 px-3 py-1 rounded">
                    <FileText className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-slate-200">{activeFile.split('/').pop()}</span>
                  </div>
                ) : (
                  <span className="text-sm text-slate-400">No file selected</span>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-sm rounded font-medium">
                Save
              </button>
              <button className="px-3 py-1 bg-slate-600 hover:bg-slate-700 text-sm rounded font-medium">
                Format
              </button>
            </div>
          </div>

          {/* Editor */}
          <div className="flex-1 bg-slate-900">
            {activeFile ? (
              <MonacoEditor
                value={fileContent}
                onChange={handleCodeChange}
                language="rust"
              />
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500">
                <div className="text-center">
                  <div className="text-slate-600 text-6xl mb-4 font-mono">// </div>
                  <p className="text-lg">Select a file to start editing...</p>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Terminal/Output */}
          <div className="h-48 bg-slate-800 border-t border-slate-700">
            <div className="flex border-b border-slate-700">
              <button className="px-4 py-2 text-xs font-medium text-slate-400 border-r border-slate-700 bg-slate-700">
                TERMINAL
              </button>
              <button className="px-4 py-2 text-xs font-medium text-slate-400 border-r border-slate-700">
                OUTPUT
              </button>
              <button className="px-4 py-2 text-xs font-medium text-slate-400">
                DEBUG CONSOLE
              </button>
              <div className="ml-auto px-4 py-2 flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-green-400 font-medium">Build Success</span>
              </div>
            </div>
            <div className="p-4 h-full overflow-y-auto">
              <BuildOutput messages={messages} />
            </div>
          </div>
        </div>

        {/* Right Sidebar - Deploy Panel */}
        <div className="w-80 bg-slate-800 border-l border-slate-700 flex flex-col">
          {/* Deploy Section */}
          <div className="border-b border-slate-700 p-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">DEPLOY</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-2 block">Network:</label>
                <div className="bg-slate-700 px-3 py-2 rounded text-sm">
                  <span className="text-blue-400 font-medium">Futurenet (Testnet)</span>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <button 
                  onClick={handleCompile}
                  className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-sm rounded font-medium"
                >
                  Compile Contract
                </button>
                <button 
                  onClick={handleDeploy}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-sm rounded font-medium flex items-center justify-center space-x-1"
                >
                  <Upload className="w-4 h-4" />
                  <span>Deploy Contract</span>
                </button>
              </div>
              <div className="text-xs text-slate-500 bg-slate-700 p-3 rounded">
                Ready to compile...
              </div>
            </div>
          </div>

          {/* Contract Interaction Section */}
          <div className="border-b border-slate-700 p-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">CONTRACT INTERACTION</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-2 block">Contract ID:</label>
                <div className="flex space-x-2">
                  <input 
                    type="text" 
                    placeholder="Enter contract ID"
                    className="flex-1 bg-slate-700 border border-slate-600 px-3 py-2 rounded text-sm text-white placeholder-slate-500"
                  />
                  <button className="px-3 py-2 bg-slate-600 hover:bg-slate-500 text-sm rounded font-medium whitespace-nowrap">
                    Load Info
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="function-select" className="text-xs text-slate-400 mb-2 block">Function:</label>
                <select id="function-select" aria-label="Function" className="w-full bg-slate-700 border border-slate-600 px-3 py-2 rounded text-sm text-white">
                  <option>hello</option>
                  <option>increment</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-2 block">Arguments (JSON):</label>
                <textarea 
                  placeholder='["world"]'
                  className="w-full bg-slate-700 border border-slate-600 px-3 py-2 rounded text-sm text-white placeholder-slate-500 h-16 resize-none font-mono"
                />
              </div>
              <button className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-sm rounded font-medium flex items-center justify-center space-x-2">
                <Play className="w-4 h-4" />
                <span>Invoke Function</span>
              </button>
              <div className="text-xs text-slate-500 bg-slate-700 p-3 rounded min-h-[60px]">
                Function results will appear here...
              </div>
            </div>
          </div>

          {/* Accounts Section */}
          <div className="border-b border-slate-700 p-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">ACCOUNTS</h3>
            <AccountPanel />
          </div>

          {/* Deployment History */}
          <div className="flex-1 p-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">DEPLOYMENT HISTORY</h3>
            <div className="text-xs text-slate-500 text-center py-8">
              No deployments yet...
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
