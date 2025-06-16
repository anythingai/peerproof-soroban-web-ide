import { useState } from 'react';
import * as StellarSdk from '@stellar/stellar-sdk';

// const FUTURENET_URL = 'https://rpc-futurenet.stellar.org:443'; (unused)
const FRIENDBOT_URL = 'https://friendbot-futurenet.stellar.org';

export function useStellar() {
  const [loading, _setLoading] = useState(false);

  const generateAccount = () => {
    return StellarSdk.Keypair.random();
  };

  const fundAccount = async (publicKey: string) => {
    try {
      const response = await fetch(`${FRIENDBOT_URL}?addr=${publicKey}`);
      if (!response.ok) {
        throw new Error(`Friendbot funding failed: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error funding account:', error);
      throw error;
    }
  };

  const getBalance = async (publicKey: string): Promise<string> => {
    try {
      // const server = new StellarSdk.SorobanRpc.Server(FUTURENET_URL); (unused)
      // For Soroban/Futurenet, we'll use the Horizon server to get XLM balance
      const horizonServer = new StellarSdk.Horizon.Server('https://horizon-futurenet.stellar.org');
      const account = await horizonServer.loadAccount(publicKey);
      
      const xlmBalance = account.balances.find(
        (balance: any) => balance.asset_type === 'native'
      );
      
      return xlmBalance ? parseFloat(xlmBalance.balance).toFixed(7) : '0';
    } catch (error) {
      console.error('Error getting balance:', error);
      return '0';
    }
  };

  const getAccountInfo = async (publicKey: string) => {
    try {
      const horizonServer = new StellarSdk.Horizon.Server('https://horizon-futurenet.stellar.org');
      return await horizonServer.loadAccount(publicKey);
    } catch (error) {
      console.error('Error getting account info:', error);
      throw error;
    }
  };

  return {
    generateAccount,
    fundAccount,
    getBalance,
    getAccountInfo,
    loading
  };
}
