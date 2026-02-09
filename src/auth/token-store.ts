/**
 * Token storage for Quarri CLI credentials
 * Stores tokens in ~/.quarri/credentials with secure permissions
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface StoredCredentials {
  token: string;
  email: string;
  role: string;
  databases: Array<{
    database_name: string;
    display_name: string;
    access_level: string;
  }>;
  selectedDatabase?: string;
  expiresAt: string;
}

const QUARRI_DIR = path.join(os.homedir(), '.quarri');
const CREDENTIALS_FILE = path.join(QUARRI_DIR, 'credentials');

/**
 * Ensure the ~/.quarri directory exists with secure permissions
 */
function ensureQuarriDir(): void {
  if (!fs.existsSync(QUARRI_DIR)) {
    fs.mkdirSync(QUARRI_DIR, { mode: 0o700 });
  }
}

/**
 * Load stored credentials from disk
 */
export function loadCredentials(): StoredCredentials | null {
  try {
    if (!fs.existsSync(CREDENTIALS_FILE)) {
      return null;
    }

    const content = fs.readFileSync(CREDENTIALS_FILE, 'utf-8');
    const credentials = JSON.parse(content) as StoredCredentials;

    // Check if token is expired
    if (credentials.expiresAt) {
      const expiresAt = new Date(credentials.expiresAt);
      if (expiresAt < new Date()) {
        // Token expired — return null but keep credentials file
        // so loadExpiredEmail() can read the email for re-auth
        return null;
      }
    }

    return credentials;
  } catch (error) {
    console.error('Failed to load credentials:', error);
    return null;
  }
}

/**
 * Load email from expired credentials for re-authentication.
 * Returns the email if credentials exist but are expired, null otherwise.
 */
export function loadExpiredEmail(): string | null {
  try {
    if (!fs.existsSync(CREDENTIALS_FILE)) {
      return null;
    }

    const content = fs.readFileSync(CREDENTIALS_FILE, 'utf-8');
    const credentials = JSON.parse(content) as StoredCredentials;

    if (credentials.expiresAt) {
      const expiresAt = new Date(credentials.expiresAt);
      if (expiresAt < new Date()) {
        return credentials.email || null;
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Check how many minutes until token expires. Returns null if no credentials.
 */
export function getTokenExpiryMinutes(): number | null {
  try {
    if (!fs.existsSync(CREDENTIALS_FILE)) {
      return null;
    }

    const content = fs.readFileSync(CREDENTIALS_FILE, 'utf-8');
    const credentials = JSON.parse(content) as StoredCredentials;

    if (credentials.expiresAt) {
      const expiresAt = new Date(credentials.expiresAt);
      return Math.round((expiresAt.getTime() - Date.now()) / (1000 * 60));
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Save credentials to disk with secure permissions
 */
export function saveCredentials(credentials: StoredCredentials): void {
  ensureQuarriDir();

  const content = JSON.stringify(credentials, null, 2);
  fs.writeFileSync(CREDENTIALS_FILE, content, { mode: 0o600 });
}

/**
 * Clear stored credentials
 */
export function clearCredentials(): void {
  try {
    if (fs.existsSync(CREDENTIALS_FILE)) {
      fs.unlinkSync(CREDENTIALS_FILE);
    }
  } catch (error) {
    console.error('Failed to clear credentials:', error);
  }
}

/**
 * Get the currently selected database
 */
export function getSelectedDatabase(): string | null {
  const credentials = loadCredentials();
  if (!credentials) {
    return null;
  }

  // Return selected database or first available database
  if (credentials.selectedDatabase) {
    return credentials.selectedDatabase;
  }

  if (credentials.databases && credentials.databases.length > 0) {
    return credentials.databases[0].database_name;
  }

  return null;
}

/**
 * Set the selected database
 * Accepts either database_name or display_name, stores the actual database_name
 */
export function setSelectedDatabase(databaseName: string): boolean {
  const credentials = loadCredentials();
  if (!credentials) {
    return false;
  }

  // Find database by database_name or display_name
  const db = credentials.databases.find(
    (d) => d.database_name === databaseName || d.display_name === databaseName
  );

  if (!db && credentials.role !== 'super_admin') {
    return false;
  }

  // Store the actual database_name (not display_name)
  credentials.selectedDatabase = db ? db.database_name : databaseName;
  saveCredentials(credentials);
  return true;
}

/**
 * Get the stored API token
 */
export function getToken(): string | null {
  const credentials = loadCredentials();
  return credentials?.token ?? null;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return loadCredentials() !== null;
}
