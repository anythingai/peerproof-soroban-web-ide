import { useState, useEffect } from 'react';
import { Play, History, Copy } from 'lucide-react';
import { api, InvokeResponse } from '../services/api';

interface Deployment {
  contractId: string;
  transactionHash: string;
  timestamp: string;
  accountPublicKey: string;
}

export function RunPanel() {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [selectedDeployment, setSelectedDeployment] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [functionName, setFunctionName] = useState('');
  const [functionArgs, setFunctionArgs] = useState('');
  const [isInvoking, setIsInvoking] = useState(false);
  const [invokeResult, setInvokeResult] = useState<InvokeResponse | null>(null);
  const [error, setError] = useState('');

  const accounts = JSON.parse(localStorage.getItem('soroban-ide-accounts') || '[]');

  useEffect(() => {
    // Load deployments from localStorage
    const savedDeployments = JSON.parse(localStorage.getItem('soroban-ide-deployments') || '[]');
    setDeployments(savedDeployments);
  }, []);

  const handleInvoke = async () => {
    if (!selectedDeployment || !selectedAccount || !functionName) {
      setError('Please fill all required fields');
      return;
    }

    const account = accounts.find((acc: any) => acc.publicKey === selectedAccount);
    if (!account) {
      setError('Selected account not found');
      return;
    }

    setIsInvoking(true);
    setError('');
    setInvokeResult(null);

    try {
      let args = [];
      if (functionArgs.trim()) {
        try {
          args = JSON.parse(`[${functionArgs}]`);
        } catch {
          args = functionArgs.split(',').map(arg => arg.trim());
        }
      }

      const result = await api.invoke({
        contract_id: selectedDeployment,
        function_name: functionName,
        args: args,
        secret_key: account.secretKey,
        network: 'futurenet'
      });
      
      setInvokeResult(result);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Function invocation failed');
    } finally {
      setIsInvoking(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const commonFunctions = [
    { name: 'hello', args: '"world"', description: 'Basic hello function' },
    { name: 'increment', args: '42', description: 'Increment a number' },
  ];

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-sm font-medium text-gray-300">Run Contract Functions</h3>

      {/* Contract Selection */}
      <div className="space-y-2">
        <label htmlFor="deployment-select" className="text-xs text-gray-400">Select Deployed Contract:</label>
        <select
          id="deployment-select"
          aria-label="Select Deployed Contract"
          value={selectedDeployment}
          onChange={(e) => setSelectedDeployment(e.target.value)}
          className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-sm text-white"
        >
          <option value="">Select contract...</option>
          {deployments.map((deployment) => (
            <option key={deployment.contractId} value={deployment.contractId}>
              {deployment.contractId.substring(0, 12)}... 
              ({new Date(deployment.timestamp).toLocaleDateString()})
            </option>
          ))}
        </select>
      </div>

      {/* Account Selection */}
      <div className="space-y-2">
        <label htmlFor="invoke-account-select" className="text-xs text-gray-400">Invoke from Account:</label>
        <select
          id="invoke-account-select"
          aria-label="Invoke from Account"
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

      {/* Function Name */}
      <div className="space-y-2">
        <label className="text-xs text-gray-400">Function Name:</label>
        <input
          type="text"
          value={functionName}
          onChange={(e) => setFunctionName(e.target.value)}
          placeholder="e.g., hello, increment"
          className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-sm text-white placeholder-gray-500"
        />
      </div>

      {/* Function Arguments */}
      <div className="space-y-2">
        <label className="text-xs text-gray-400">Arguments (comma-separated):</label>
        <input
          type="text"
          value={functionArgs}
          onChange={(e) => setFunctionArgs(e.target.value)}
          placeholder='e.g., "world", 42, true'
          className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-sm text-white placeholder-gray-500"
        />
        <div className="text-xs text-gray-500">
          Use JSON format for complex types. Strings need quotes.
        </div>
      </div>

      {/* Common Functions Quick Access */}
      <div className="space-y-2">
        <label className="text-xs text-gray-400">Quick Functions:</label>
        <div className="space-y-1">
          {commonFunctions.map((func) => (
            <button
              key={func.name}
              onClick={() => {
                setFunctionName(func.name);
                setFunctionArgs(func.args);
              }}
              className="w-full text-left px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded text-xs"
            >
              <div className="text-blue-400">{func.name}({func.args})</div>
              <div className="text-gray-500">{func.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Invoke Button */}
      <button
        onClick={handleInvoke}
        disabled={isInvoking || !selectedDeployment || !selectedAccount || !functionName}
        className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-sm rounded"
      >
        <Play className="w-4 h-4" />
        <span>{isInvoking ? 'Invoking...' : 'Invoke Function'}</span>
      </button>

      {/* Result Display */}
      {invokeResult && (
        <div className="bg-gray-800 rounded p-3 space-y-2">
          <div className="text-green-400 text-xs font-medium">✓ Function executed successfully</div>
          
          <div className="space-y-2">
            <div>
              <div className="text-xs text-gray-400 mb-1">Result:</div>
              <div className="bg-gray-900 p-2 rounded">
                <pre className="text-xs text-white overflow-x-auto">
                  {JSON.stringify(invokeResult.result, null, 2)}
                </pre>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-400">Transaction Hash:</div>
              <button
                onClick={() => copyToClipboard(invokeResult.transactionHash || '')}
                className="p-1 hover:bg-gray-700 rounded"
                title="Copy transaction hash"
              >
                <Copy className="w-3 h-3 text-gray-400" />
              </button>
            </div>
            <div className="font-mono text-xs text-blue-400 bg-gray-900 p-1 rounded break-all">
              {invokeResult.transactionHash}
            </div>
            
            {invokeResult.cost && (
              <div className="text-xs text-gray-400">
                Cost: {invokeResult.cost}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-900 border border-red-700 rounded p-2 text-red-200 text-xs">
          {error}
        </div>
      )}

      {/* Recent Deployments Info */}
      {deployments.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No deployed contracts</p>
          <p className="text-xs mt-1">Deploy a contract first to run functions</p>
        </div>
      )}
    </div>
  );
}
