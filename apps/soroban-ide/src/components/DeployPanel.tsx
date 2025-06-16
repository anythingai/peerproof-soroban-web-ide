import { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { api, DeployResponse } from '../services/api';

interface FileNode {
  name: string;
  type: 'file' | 'directory';
  path: string;
  content?: string;
  children?: FileNode[];
}

interface DeployPanelProps {
  fileTree: FileNode[];
}

export function DeployPanel({ fileTree }: DeployPanelProps) {
  const [selectedAccount, setSelectedAccount] = useState('');
  const [isCompiling, setIsCompiling] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [compileResult, setCompileResult] = useState<any>(null);
  const [deployResult, setDeployResult] = useState<DeployResponse | null>(null);
  const [error, setError] = useState('');

  const accounts = JSON.parse(localStorage.getItem('soroban-ide-accounts') || '[]');

  const flattenFiles = (nodes: FileNode[], result: any = {}): any => {
    nodes.forEach(node => {
      if (node.type === 'file' && node.content) {
        result[node.path] = node.content;
      }
      if (node.children) {
        flattenFiles(node.children, result);
      }
    });
    return result;
  };

  const handleCompile = async () => {
    if (!fileTree.length) {
      setError('No files to compile');
      return;
    }

    setIsCompiling(true);
    setError('');
    setCompileResult(null);

    try {
      const files = flattenFiles(fileTree);
      const result = await api.compile(files);
      setCompileResult(result);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Compilation failed');
    } finally {
      setIsCompiling(false);
    }
  };

  const handleDeploy = async () => {
    if (!compileResult?.wasm_base64) {
      setError('No compiled WASM to deploy');
      return;
    }

    if (!selectedAccount) {
      setError('Please select an account');
      return;
    }

    const account = accounts.find((acc: any) => acc.publicKey === selectedAccount);
    if (!account) {
      setError('Selected account not found');
      return;
    }

    setIsDeploying(true);
    setError('');
    setDeployResult(null);

    try {
      const result: DeployResponse = await api.deploy({
        wasm_base64: compileResult.wasm_base64,
        secret_key: account.secretKey,
        network: 'futurenet'
      });
      setDeployResult(result);
      
      // Save deployment to localStorage for quick access
      const deployments = JSON.parse(localStorage.getItem('soroban-ide-deployments') || '[]');
      deployments.unshift({
        ...result,
        timestamp: new Date().toISOString(),
        accountPublicKey: account.publicKey
      });
      localStorage.setItem('soroban-ide-deployments', JSON.stringify(deployments.slice(0, 10)));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Deployment failed');
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-sm font-medium text-gray-300">Deploy Contract</h3>

      {/* Account Selection */}
      <div className="space-y-2">
        <label htmlFor="deploy-account-select" className="text-xs text-gray-400">Deploy from Account:</label>
        <select
          id="deploy-account-select"
          aria-label="Deploy from Account"
          value={selectedAccount}
          onChange={(e) => setSelectedAccount(e.target.value)}
          className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-sm text-white"
        >
          <option value="">Select account...</option>
          {accounts.map((account: any) => (
            <option key={account.publicKey} value={account.publicKey}>
              {account.name} ({account.publicKey.substring(0, 8)}...)
            </option>
          ))}
        </select>
      </div>

      {/* Compile Step */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">1. Compile Contract</span>
          {compileResult && (
            <CheckCircle className="w-4 h-4 text-green-400" />
          )}
        </div>
        <button
          onClick={handleCompile}
          disabled={isCompiling}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-sm rounded"
        >
          <FileText className="w-4 h-4" />
          <span>{isCompiling ? 'Compiling...' : 'Compile to WASM'}</span>
        </button>
        
        {compileResult && (
          <div className="bg-gray-800 rounded p-2 text-xs">
            <div className="text-green-400 mb-1">✓ Compilation successful</div>
            <div className="text-gray-400">
              WASM size: {compileResult.wasm_size} bytes
            </div>
            {compileResult.xdr_base64 && (
              <div className="text-gray-400">
                XDR generated successfully
              </div>
            )}
          </div>
        )}
      </div>

      {/* Deploy Step */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">2. Deploy to Futurenet</span>
          {deployResult && (
            <CheckCircle className="w-4 h-4 text-green-400" />
          )}
        </div>
        <button
          onClick={handleDeploy}
          disabled={isDeploying || !compileResult || !selectedAccount}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-sm rounded"
        >
          <Upload className="w-4 h-4" />
          <span>{isDeploying ? 'Deploying...' : 'Deploy Contract'}</span>
        </button>

        {deployResult && (
          <div className="bg-gray-800 rounded p-3 text-xs space-y-2">
            <div className="text-green-400 mb-2">✓ Deployment successful</div>
            
            <div className="space-y-1">
              <div className="text-gray-400">Contract ID:</div>
              <div className="font-mono text-white bg-gray-900 p-1 rounded break-all">
                {deployResult.contractId}
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="text-gray-400">Transaction Hash:</div>
              <div className="font-mono text-blue-400 bg-gray-900 p-1 rounded break-all">
                {deployResult.transactionHash}
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="text-gray-400">WASM Hash:</div>
              <div className="font-mono text-gray-300 bg-gray-900 p-1 rounded break-all">
                {deployResult.wasmHash}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900 border border-red-700 rounded p-3 flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
          <div className="text-red-200 text-xs">{error}</div>
        </div>
      )}

      {/* Network Info */}
      <div className="border-t border-gray-700 pt-3 mt-4">
        <div className="text-xs text-gray-400 space-y-1">
          <div>Network: Stellar Futurenet</div>
          <div>RPC: https://rpc-futurenet.stellar.org:443</div>
          <div>Passphrase: Test SDF Future Network ; October 2022</div>
        </div>
      </div>
    </div>
  );
}
