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

async function signup(): Promise<void> {
  const rl = createReadline();

  try {
    console.log('\n🚀 Create a Quarri Organization\n');
    console.log('Start a 7-day free trial with up to 1GB of data.\n');

    const email = await prompt(rl, 'Email: ');
    if (!email || !email.includes('@')) {
      console.error('Invalid email address');
      rl.close();
      process.exit(1);
    }

    const orgName = await prompt(rl, 'Organization name: ');
    if (!orgName || orgName.length < 2) {
      console.error('Organization name must be at least 2 characters');
      rl.close();
      process.exit(1);
    }

    // Explain the two paths clearly
    console.log('\nChoose your setup:\n');
    console.log('  1. Superstore Demo (Recommended for trying Quarri)');
    console.log('     A ready-to-use retail analytics dataset with:');
    console.log('     - 51,000+ orders across global markets');
    console.log('     - Sales, profit, shipping, and customer data');
    console.log('     - Pre-configured for immediate querying');
    console.log('');
    console.log('  2. Custom Setup (For your own data)');
    console.log('     An empty database where you can:');
    console.log('     - Connect your own data sources');
    console.log('     - Upload CSVs');
    console.log('     - Build your data model from scratch');
    console.log('');

    const choice = await prompt(rl, 'Enter 1 or 2: ');
    const useSuperstore = choice === '1';

    console.log('\nRequesting verification code...');
    const initResult = await client.initiateSignup(email, orgName, useSuperstore);

    if (!initResult.success) {
      console.error(`Failed to initiate signup: ${initResult.error}`);
      rl.close();
      process.exit(1);
    }

    console.log('\n✓ Verification code sent to your email.\n');
    const code = await prompt(rl, 'Enter 6-digit code: ');

    if (!code || code.length !== 6) {
      console.error('Invalid verification code');
      rl.close();
      process.exit(1);
    }

    console.log('Creating organization...');
    const result = await client.completeSignup(email, code);

    if (!result.success) {
      console.error(`Signup failed: ${result.error}`);
      rl.close();
      process.exit(1);
    }

    // Save credentials
    const credentials: StoredCredentials = {
      token: result.token!,
      email: result.user!.email,
      role: result.user!.role,
      databases: result.databases!,
      expiresAt: result.expiresAt!,
    };

    saveCredentials(credentials);

    // Display success message
    console.log('\n✓ Organization created!\n');
    console.log(`  Database: ${result.databases![0]?.display_name || result.databases![0]?.database_name}`);

    if (result.trial_info) {
      // Parse and format the expiration date
      const expiresDate = new Date(result.trial_info.expires_at);
      const formattedDate = expiresDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      console.log(`  Trial expires: ${formattedDate}`);
      console.log(`  Data limit: ${result.trial_info.max_data_gb}GB`);
    }

    if (useSuperstore) {
      console.log('\n  Your database is ready! Try asking questions like:');
      console.log('  "Show me total sales by category"');
      console.log('  "Which products have the highest profit margin?"');
      console.log('  "What are the sales trends by region?"');
    } else {
      console.log('\n  Your empty database is ready. Next steps:');
      console.log('  - Use /quarri-extract to connect data sources');
      console.log('  - Upload CSVs with quarri_upload_csv');
      console.log('  - Build your data model with /quarri-model');
    }

    console.log(`\n  To upgrade to a full account: contact ${result.trial_info?.upgrade_contact || 'theo@quarri.ai'}\n`);
    console.log('You can now use Quarri tools in Claude Code.');

  } finally {
    rl.close();
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0] || 'login';

  switch (command) {
    case 'auth':
    case 'login':
      await login();
      break;
    case 'signup':
    case 'create':
      await signup();
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
      console.log('  signup, create           Create a new organization (7-day trial)');
      console.log('  auth, login              Authenticate existing account');
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
