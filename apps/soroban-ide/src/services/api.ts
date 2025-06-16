// Centralized API service for backend communication
const API_BASE_URL = '/api';

export interface CompileRequest {
  files: Record<string, string>;
}

export interface CompileResponse {
  wasm_base64?: string;
  wasm_size?: number;
  build_info?: {
    duration_ms: number;
    warnings: string[];
    errors: string[];
  };
  error?: string;
}

export interface DeployRequest {
  wasm_base64: string;
  secret_key: string;
  network: string;
}

export interface DeployResponse {
  contractId?: string;
  transactionHash?: string;
  wasmHash?: string;
  cost?: Record<string, any>;
  error?: string;
}

export interface InvokeRequest {
  contract_id: string;
  function_name: string;
  args: any[];
  secret_key: string;
  network: string;
}

export interface InvokeResponse {
  result?: any;
  transactionHash?: string;
  cost?: string;
  logs?: string[];
  error?: string;
}

export interface KeypairResponse {
  publicKey: string;
  secretKey: string;
}

export interface FileOperation {
  parentPath?: string;
  name?: string;
  type?: 'file' | 'folder';
  content?: string;
  path?: string;
  oldPath?: string;
  newName?: string;
}

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  async healthCheck(): Promise<{ status: string; services: Record<string, string> }> {
    return this.request('/health');
  }

  async compile(files: Record<string, string>): Promise<CompileResponse> {
    return this.request('/compile', {
      method: 'POST',
      body: JSON.stringify({ files }),
    });
  }

  async deploy(request: DeployRequest): Promise<DeployResponse> {
    return this.request('/deploy', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async invoke(request: InvokeRequest): Promise<InvokeResponse> {
    return this.request('/invoke', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async generateKeypair(): Promise<KeypairResponse> {
    return this.request('/generate-keypair', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async fundAccount(publicKey: string, network: string = 'futurenet'): Promise<{ success: boolean; error?: string }> {
    return this.request('/fund-account', {
      method: 'POST',
      body: JSON.stringify({ publicKey, network }),
    });
  }

  async createFile(operation: FileOperation): Promise<{ path: string; success: boolean }> {
    return this.request('/files/create', {
      method: 'POST',
      body: JSON.stringify(operation),
    });
  }

  async deleteFile(path: string): Promise<{ success: boolean }> {
    return this.request('/files/delete', {
      method: 'POST',
      body: JSON.stringify({ path }),
    });
  }

  async renameFile(oldPath: string, newName: string): Promise<{ path: string; success: boolean }> {
    return this.request('/files/rename', {
      method: 'POST',
      body: JSON.stringify({ oldPath, newName }),
    });
  }

  async getFileTree(): Promise<any> {
    return this.request('/files/get-tree');
  }
}

export const api = new ApiService();