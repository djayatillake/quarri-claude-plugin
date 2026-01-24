/**
 * CLI Authentication flow for Quarri
 * Handles both existing users (email + code) and new users (email + invite token)
 */

import * as readline from 'readline';
import { QuarriApiClient } from '../api/client.js';
import { saveCredentials, StoredCredentials } from './token-store.js';

/**
 * Create a readline interface for user input
 */
function createReadline(): readline.Interface {
  return readline.createInterface({
    input: process.stdin,
    output: process.stderr, // Use stderr so it doesn't interfere with MCP protocol
  });
}

/**
 * Prompt user for input
 */
async function prompt(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

/**
 * Run the interactive authentication flow
 */
export async function runAuthFlow(client: QuarriApiClient): Promise<StoredCredentials | null> {
  const rl = createReadline();

  try {
    console.error('\n=== Quarri CLI Authentication ===\n');

    // Ask if user has an account or invite
    const authType = await prompt(
      rl,
      'Do you have a Quarri account? (yes/no/invite): '
    );

    const email = await prompt(rl, 'Enter your email address: ');

    if (!email || !email.includes('@')) {
      console.error('Invalid email address');
      return null;
    }

    if (authType.toLowerCase() === 'invite' || authType.toLowerCase() === 'i') {
      // New user with invitation
      return await handleInviteAuth(rl, client, email);
    } else if (authType.toLowerCase() === 'yes' || authType.toLowerCase() === 'y') {
      // Existing user
      return await handleExistingUserAuth(rl, client, email);
    } else {
      console.error('\nYou need either an existing Quarri account or an invitation.');
      console.error('Contact your administrator for an invitation.');
      return null;
    }
  } finally {
    rl.close();
  }
}

/**
 * Handle authentication for existing users (email + verification code)
 */
async function handleExistingUserAuth(
  rl: readline.Interface,
  client: QuarriApiClient,
  email: string
): Promise<StoredCredentials | null> {
  console.error('\nRequesting verification code...');

  // Request verification code
  const requestResult = await client.requestVerificationCode(email);

  if (!requestResult.success) {
    console.error(`Failed to request code: ${requestResult.error}`);
    return null;
  }

  console.error('Verification code sent to your email.');
  const code = await prompt(rl, 'Enter the 6-digit verification code: ');

  if (!code || code.length !== 6) {
    console.error('Invalid verification code');
    return null;
  }

  // Verify code and get token
  console.error('Verifying code...');
  const verifyResult = await client.verifyCode(email, code);

  if (!verifyResult.success) {
    console.error(`Verification failed: ${verifyResult.error}`);
    return null;
  }

  // Save credentials
  const credentials: StoredCredentials = {
    token: verifyResult.token!,
    email: verifyResult.user!.email,
    role: verifyResult.user!.role,
    databases: verifyResult.databases!,
    expiresAt: verifyResult.expiresAt!,
  };

  saveCredentials(credentials);
  console.error(`\nAuthenticated successfully as ${email}!`);
  console.error(`Role: ${credentials.role}`);
  console.error(`Databases: ${credentials.databases.map((d) => d.database_name).join(', ')}`);

  return credentials;
}

/**
 * Handle authentication for new users with invitation token
 */
async function handleInviteAuth(
  rl: readline.Interface,
  client: QuarriApiClient,
  email: string
): Promise<StoredCredentials | null> {
  const inviteToken = await prompt(
    rl,
    'Enter your invitation token (from the invite email): '
  );

  if (!inviteToken) {
    console.error('Invitation token is required');
    return null;
  }

  console.error('\nVerifying invitation...');
  const verifyResult = await client.verifyInvite(email, inviteToken);

  if (!verifyResult.success) {
    console.error(`Invitation verification failed: ${verifyResult.error}`);
    return null;
  }

  // Save credentials
  const credentials: StoredCredentials = {
    token: verifyResult.token!,
    email: verifyResult.user!.email,
    role: verifyResult.user!.role,
    databases: verifyResult.databases!,
    expiresAt: verifyResult.expiresAt!,
  };

  saveCredentials(credentials);
  console.error(`\nAccount created and authenticated successfully!`);
  console.error(`Email: ${email}`);
  console.error(`Role: ${credentials.role}`);
  console.error(`Databases: ${credentials.databases.map((d) => d.database_name).join(', ')}`);

  return credentials;
}

/**
 * Validate an existing token
 */
export async function validateToken(
  client: QuarriApiClient,
  token: string
): Promise<boolean> {
  const result = await client.validateToken(token);
  return result.success;
}
