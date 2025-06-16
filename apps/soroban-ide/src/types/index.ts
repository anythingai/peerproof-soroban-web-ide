// Common types used across the application

export interface FileNode {
  name: string;
  type: 'file' | 'directory';
  path: string;
  content?: string;
  children?: FileNode[];
}

export interface Account {
  name: string;
  publicKey: string;
  secretKey: string;
  balance: string;
}

export interface CompileResult {
  wasm_base64: string;
  wasm_size: number;
  xdr_base64?: string;
  build_info: {
    duration_ms: number;
    warnings: string[];
    errors: string[];
  };
}

export interface DeployResult {
  contractId: string;
  transactionHash: string;
  wasmHash: string;
  cost: {
    cpuInsns: string;
    memBytes: string;
  };
}

export interface InvokeResult {
  result: any;
  transactionHash: string;
  cost: string;
  logs?: string[];
}

export interface Deployment {
  contractId: string;
  transactionHash: string;
  wasmHash: string;
  timestamp: string;
  accountPublicKey: string;
  network: string;
}

export interface BuildMessage {
  type: 'info' | 'error' | 'success' | 'warning';
  message: string;
  timestamp: string;
  source?: 'compiler' | 'deployer' | 'invoker';
}

export interface ContractFunction {
  name: string;
  inputs: ContractInput[];
  outputs: ContractOutput[];
  docs?: string;
}

export interface ContractInput {
  name: string;
  type: string;
  description?: string;
}

export interface ContractOutput {
  type: string;
  description?: string;
}

export interface NetworkConfig {
  name: string;
  rpcUrl: string;
  passphrase: string;
  friendbotUrl?: string;
}

export const NETWORKS: Record<string, NetworkConfig> = {
  futurenet: {
    name: 'Futurenet',
    rpcUrl: 'https://rpc-futurenet.stellar.org:443',
    passphrase: 'Test SDF Future Network ; October 2022',
    friendbotUrl: 'https://friendbot-futurenet.stellar.org'
  },
  testnet: {
    name: 'Testnet',
    rpcUrl: 'https://soroban-testnet.stellar.org:443',
    passphrase: 'Test SDF Network ; September 2015',
    friendbotUrl: 'https://friendbot.stellar.org'
  },
  mainnet: {
    name: 'Mainnet',
    rpcUrl: 'https://mainnet.stellar.org:443',
    passphrase: 'Public Global Stellar Network ; September 2015'
  }
};
