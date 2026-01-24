#!/usr/bin/env node
/**
 * Quarri CLI Authentication Tool
 * Run with: npx @quarri/claude-data-tools auth
 */

import { QuarriApiClient } from './api/client.js';
import { saveCredentials, loadCredentials, clearCredentials, StoredCredentials } from './auth/token-store.js';
import * as readline from 'readline';

const client = new QuarriApiClient();

function createReadline(): readline.Interface {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

async function prompt(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function login(): Promise<void> {
  const rl = createReadline();

  try {
    console.log('\n🔐 Quarri CLI Authentication\n');

    // Check for existing credentials
    const existing = loadCredentials();
    if (existing) {
      console.log(`Currently authenticated as: ${existing.email}`);
      const answer = await prompt(rl, 'Re-authenticate? (y/n): ');
      if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
        console.log('Keeping existing credentials.');
        rl.close();
        return;
      }
    }

    const email = await prompt(rl, 'Enter your email: ');
    if (!email || !email.includes('@')) {
      console.error('Invalid email address');
      rl.close();
      process.exit(1);
    }

    console.log('\nRequesting verification code...');
    const requestResult = await client.requestVerificationCode(email);

    if (!requestResult.success) {
      console.error(`Failed to request code: ${requestResult.error}`);
      rl.close();
      process.exit(1);
    }

    console.log('✓ Verification code sent to your email.\n');
    const code = await prompt(rl, 'Enter the 6-digit code: ');

    if (!code || code.length !== 6) {
      console.error('Invalid verification code');
      rl.close();
      process.exit(1);
    }

    console.log('Verifying...');
    const verifyResult = await client.verifyCode(email, code);

    if (!verifyResult.success) {
      console.error(`Verification failed: ${verifyResult.error}`);
      rl.close();
      process.exit(1);
    }

    const credentials: StoredCredentials = {
      token: verifyResult.token!,
      email: verifyResult.user!.email,
      role: verifyResult.user!.role,
      databases: verifyResult.databases!,
      expiresAt: verifyResult.expiresAt!,
    };

    saveCredentials(credentials);

    console.log('\n✓ Authenticated successfully!\n');
    console.log(`  Email: ${credentials.email}`);
    console.log(`  Role: ${credentials.role}`);
    console.log(`  Databases: ${credentials.databases.map(d => d.display_name || d.database_name).join(', ')}`);
    console.log('\nYou can now use Quarri tools in Claude Code.');
  } finally {
    rl.close();
  }
}

async function logout(): Promise<void> {
  clearCredentials();
  console.log('✓ Logged out. Credentials cleared.');
}

async function status(): Promise<void> {
  const credentials = loadCredentials();
  if (!credentials) {
    console.log('Not authenticated.');
    console.log('Run: npx @quarri/claude-data-tools auth');
    return;
  }

  console.log('\n🔐 Quarri Authentication Status\n');
  console.log(`  Email: ${credentials.email}`);
  console.log(`  Role: ${credentials.role}`);
  console.log(`  Expires: ${credentials.expiresAt}`);
  console.log(`  Databases:`);
  for (const db of credentials.databases) {
    console.log(`    - ${db.display_name || db.database_name} (${db.access_level})`);
  }
  if (credentials.selectedDatabase) {
    console.log(`  Selected: ${credentials.selectedDatabase}`);
  }
}

async function verify(email: string, code: string): Promise<void> {
  if (!email || !code) {
    console.error('Usage: quarri-auth verify <email> <code>');
    process.exit(1);
  }

  console.log('Verifying...');
  const verifyResult = await client.verifyCode(email, code);

  if (!verifyResult.success) {
    console.error(`Verification failed: ${verifyResult.error}`);
    process.exit(1);
  }

  const credentials: StoredCredentials = {
    token: verifyResult.token!,
    email: verifyResult.user!.email,
    role: verifyResult.user!.role,
    databases: verifyResult.databases!,
    expiresAt: verifyResult.expiresAt!,
  };

  saveCredentials(credentials);

  console.log('\n✓ Authenticated successfully!\n');
  console.log(`  Email: ${credentials.email}`);
  console.log(`  Role: ${credentials.role}`);
  console.log(`  Databases: ${credentials.databases.map(d => d.display_name || d.database_name).join(', ')}`);
}

async function requestCode(email: string): Promise<void> {
  if (!email) {
    console.error('Usage: quarri-auth request <email>');
    process.exit(1);
  }

  console.log(`Requesting verification code for ${email}...`);
  const result = await client.requestVerificationCode(email);

  if (!result.success) {
    console.error(`Failed to request code: ${result.error}`);
    process.exit(1);
  }

  console.log('✓ Verification code sent. Check your email.');
  console.log(`\nThen run: quarri-auth verify ${email} <code>`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0] || 'login';

  switch (command) {
    case 'auth':
    case 'login':
      await login();
      break;
    case 'logout':
      await logout();
      break;
    case 'status':
    case 'whoami':
      await status();
      break;
    case 'request':
      await requestCode(args[1]);
      break;
    case 'verify':
      await verify(args[1], args[2]);
      break;
    default:
      console.log('Usage: npx @quarri/claude-data-tools <command>');
      console.log('');
      console.log('Commands:');
      console.log('  auth, login              Interactive authentication');
      console.log('  request <email>          Request verification code');
      console.log('  verify <email> <code>    Complete verification');
      console.log('  logout                   Clear stored credentials');
      console.log('  status                   Show authentication status');
      break;
  }
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
