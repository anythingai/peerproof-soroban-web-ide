import { useState, useEffect } from 'react';
import { Copy, Plus, RefreshCw } from 'lucide-react';
import { useStellar } from '../hooks/useStellar';
import { api } from '../services/api';

interface Account {
  name: string;
  publicKey: string;
  secretKey: string;
  balance: string;
}

export function AccountPanel() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const { fundAccount, getBalance } = useStellar();

  useEffect(() => {
    // Load accounts from localStorage
    const savedAccounts = localStorage.getItem('soroban-ide-accounts');
    if (savedAccounts) {
      setAccounts(JSON.parse(savedAccounts));
    }
  }, []);

  const saveAccounts = (newAccounts: Account[]) => {
    setAccounts(newAccounts);
    localStorage.setItem('soroban-ide-accounts', JSON.stringify(newAccounts));
  };

  const handleCreateAccount = async () => {
    setLoading(true);
    try {
      const keypair = await api.generateKeypair();
      console.log('Received keypair:', keypair);
      
      if (keypair.publicKey && keypair.secretKey) {
        const newAccount: Account = {
          name: `Account ${accounts.length + 1}`,
          publicKey: keypair.publicKey,
          secretKey: keypair.secretKey,
          balance: '0'
        };
        
        saveAccounts([...accounts, newAccount]);
        console.log('Account created successfully:', newAccount.name);
      } else {
        console.error('Invalid keypair response:', keypair);
      }
    } catch (error) {
      console.error('Error creating account:', error);
    }
    setLoading(false);
  };

  const handleFundAccount = async (account: Account) => {
    setLoading(true);
    try {
      await fundAccount(account.publicKey);
      // Update balance after funding
      const balance = await getBalance(account.publicKey);
      const updatedAccounts = accounts.map(acc => 
        acc.publicKey === account.publicKey 
          ? { ...acc, balance: balance }
          : acc
      );
      saveAccounts(updatedAccounts);
    } catch (error) {
      console.error('Error funding account:', error);
    }
    setLoading(false);
  };

  const handleRefreshBalance = async (account: Account) => {
    try {
      const balance = await getBalance(account.publicKey);
      const updatedAccounts = accounts.map(acc => 
        acc.publicKey === account.publicKey 
          ? { ...acc, balance: balance }
          : acc
      );
      saveAccounts(updatedAccounts);
    } catch (error) {
      console.error('Error refreshing balance:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-300">Accounts</h3>
        <button
          onClick={handleCreateAccount}
          disabled={loading}
          className="flex items-center space-x-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-xs rounded"
        >
          <Plus className="w-3 h-3" />
          <span>New</span>
        </button>
      </div>

      <div className="space-y-3">
        {accounts.map((account) => (
          <div key={account.publicKey} className="bg-gray-800 rounded p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white">{account.name}</span>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => handleRefreshBalance(account)}
                  className="p-1 hover:bg-gray-700 rounded"
                  title="Refresh balance"
                >
                  <RefreshCw className="w-3 h-3 text-gray-400" />
                </button>
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Public Key:</span>
                <button
                  onClick={() => copyToClipboard(account.publicKey)}
                  className="p-1 hover:bg-gray-700 rounded"
                  title="Copy public key"
                >
                  <Copy className="w-3 h-3 text-gray-400" />
                </button>
              </div>
              <div className="text-xs text-gray-300 font-mono break-all bg-gray-900 p-2 rounded">
                {account.publicKey}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Secret Key:</span>
                <button
                  onClick={() => copyToClipboard(account.secretKey)}
                  className="p-1 hover:bg-gray-700 rounded"
                  title="Copy secret key"
                >
                  <Copy className="w-3 h-3 text-gray-400" />
                </button>
              </div>
              <div className="text-xs text-gray-300 font-mono break-all bg-gray-900 p-2 rounded">
                {account.secretKey ? `${account.secretKey.substring(0, 10)}...` : 'Not available'}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-xs">
                <span className="text-gray-400">Balance: </span>
                <span className="text-white font-mono">{account.balance} XLM</span>
              </div>
              <button
                onClick={() => handleFundAccount(account)}
                disabled={loading}
                className="px-2 py-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-xs rounded"
              >
                Fund via Friendbot
              </button>
            </div>
          </div>
        ))}
      </div>

      {accounts.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <p className="text-sm">No accounts created yet</p>
          <p className="text-xs mt-1">Click "New" to create your first account</p>
        </div>
      )}
    </div>
  );
}
