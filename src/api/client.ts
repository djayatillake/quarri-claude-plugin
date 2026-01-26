/**
 * Quarri API Client
 * HTTP client for communicating with the Quarri backend
 */

const DEFAULT_API_URL = 'https://app.quarri.ai';
const DEFAULT_TIMEOUT = 60000; // 60 seconds for most operations
const LONG_TIMEOUT = 180000; // 3 minutes for analysis pipelines

interface ApiResponse<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
}

interface AuthResponse {
  success: boolean;
  error?: string;
  token?: string;
  expiresAt?: string;
  user?: {
    email: string;
    role: string;
    user_id?: number;
  };
  databases?: Array<{
    database_name: string;
    display_name: string;
    access_level: string;
  }>;
  trial_info?: {
    is_trial: boolean;
    expires_at: string;
    days_remaining: number;
    max_data_gb: number;
    upgrade_contact: string;
  };
}

interface TrialStatusResponse {
  is_trial: boolean;
  database_name?: string;
  display_name?: string;
  days_remaining?: number;
  expires_at?: string;
  data_limit_bytes?: number;
  data_limit_gb?: number;
  signup_type?: string;
  upgrade_contact?: string;
  message?: string;
}

interface ToolResult {
  success: boolean;
  error?: string;
  [key: string]: unknown;
}

export class QuarriApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.QUARRI_API_URL || DEFAULT_API_URL;
  }

  /**
   * Set the authentication token
   */
  setToken(token: string): void {
    this.token = token;
  }

  /**
   * Make an HTTP request to the API with timeout support
   */
  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    useAuth = true,
    timeout = DEFAULT_TIMEOUT
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (useAuth && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json() as T & { error?: string };

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      return { success: true, data: data as T };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        return { success: false, error: `Request timeout after ${timeout / 1000}s` };
      }

      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: message };
    }
  }

  // ==================== Auth Methods ====================

  /**
   * Request a verification code for CLI authentication
   */
  async requestVerificationCode(email: string): Promise<AuthResponse> {
    const result = await this.request<AuthResponse>(
      'POST',
      '/api/auth/cli/request-code',
      { email },
      false
    );

    if (!result.success) {
      return { success: false, error: result.error };
    }

    return { success: true, ...result.data };
  }

  /**
   * Verify a code and get an API token
   */
  async verifyCode(email: string, code: string): Promise<AuthResponse> {
    const result = await this.request<AuthResponse>(
      'POST',
      '/api/auth/cli/verify-code',
      { email, code },
      false
    );

    if (!result.success) {
      return { success: false, error: result.error };
    }

    const data = result.data as AuthResponse;
    return {
      success: true,
      token: data.token,
      expiresAt: data.expiresAt,
      user: data.user,
      databases: data.databases,
    };
  }

  /**
   * Verify an invitation token for new users
   */
  async verifyInvite(email: string, inviteToken: string): Promise<AuthResponse> {
    const result = await this.request<AuthResponse>(
      'POST',
      '/api/auth/cli/verify-invite',
      { email, invite_token: inviteToken },
      false
    );

    if (!result.success) {
      return { success: false, error: result.error };
    }

    const data = result.data as AuthResponse;
    return {
      success: true,
      token: data.token,
      expiresAt: data.expiresAt,
      user: data.user,
      databases: data.databases,
    };
  }

  /**
   * Validate an existing token
   */
  async validateToken(token: string): Promise<AuthResponse> {
    const oldToken = this.token;
    this.token = token;

    const result = await this.request<AuthResponse>(
      'POST',
      '/api/auth/cli/validate-token',
      {},
      true
    );

    this.token = oldToken;

    if (!result.success) {
      return { success: false, error: result.error };
    }

    const data = result.data as AuthResponse;
    return {
      success: true,
      user: data.user,
      databases: data.databases,
    };
  }

  // ==================== Self-Service Signup Methods ====================

  /**
   * Initiate signup for a new organization
   */
  async initiateSignup(
    email: string,
    orgName: string,
    includeDemoData: boolean
  ): Promise<AuthResponse> {
    const result = await this.request<AuthResponse>(
      'POST',
      '/api/auth/cli/initiate-signup',
      { email, org_name: orgName, include_demo_data: includeDemoData },
      false
    );

    if (!result.success) {
      return { success: false, error: result.error };
    }

    return { success: true, ...result.data };
  }

  /**
   * Complete signup by verifying the code
   */
  async completeSignup(email: string, code: string): Promise<AuthResponse> {
    const result = await this.request<AuthResponse>(
      'POST',
      '/api/auth/cli/complete-signup',
      { email, code },
      false
    );

    if (!result.success) {
      return { success: false, error: result.error };
    }

    const data = result.data as AuthResponse;
    return {
      success: true,
      token: data.token,
      expiresAt: data.expiresAt,
      user: data.user,
      databases: data.databases,
      trial_info: data.trial_info,
    };
  }

  /**
   * Get trial status for the authenticated user
   */
  async getTrialStatus(): Promise<ApiResponse<TrialStatusResponse>> {
    return this.request<TrialStatusResponse>('GET', '/api/auth/cli/trial-status');
  }

  /**
   * Delete the authenticated user's trial account and organization
   */
  async deleteAccount(): Promise<AuthResponse> {
    const result = await this.request<AuthResponse>(
      'DELETE',
      '/api/auth/cli/delete-account',
      undefined,
      true
    );

    if (!result.success) {
      return { success: false, error: result.error };
    }

    return { success: true, ...result.data };
  }

  // ==================== Tool Methods ====================

  /**
   * List available tools
   */
  async listTools(): Promise<ApiResponse<{ tools: unknown[]; count: number }>> {
    return this.request('GET', '/api/cli/tools');
  }

  /**
   * Get tool schema
   */
  async getToolSchema(
    toolName: string
  ): Promise<ApiResponse<{ tool: unknown }>> {
    return this.request('GET', `/api/cli/tools/${toolName}`);
  }

  /**
   * Execute a tool
   */
  async executeTool(
    toolName: string,
    args: Record<string, unknown>,
    databaseName?: string
  ): Promise<ToolResult> {
    const body: Record<string, unknown> = { args };
    if (databaseName) {
      body.database_name = databaseName;
    }

    const result = await this.request<ToolResult>(
      'POST',
      `/api/cli/tool/${toolName}`,
      body
    );

    if (!result.success) {
      return { success: false, error: result.error };
    }

    return result.data as ToolResult;
  }

  /**
   * List user's databases
   */
  async listDatabases(): Promise<
    ApiResponse<{
      databases: Array<{
        database_name: string;
        display_name: string;
        access_level: string;
      }>;
    }>
  > {
    return this.request('GET', '/api/cli/databases');
  }

  /**
   * Execute multiple tools in batch
   */
  async executeBatch(
    tools: Array<{ name: string; args: Record<string, unknown> }>,
    databaseName?: string,
    stopOnError = false
  ): Promise<ApiResponse<{ results: ToolResult[] }>> {
    const body: Record<string, unknown> = { tools, stop_on_error: stopOnError };
    if (databaseName) {
      body.database_name = databaseName;
    }

    return this.request('POST', '/api/cli/batch', body);
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<ApiResponse<{ tool_count: number }>> {
    return this.request('GET', '/api/cli/health', undefined, false);
  }
}
