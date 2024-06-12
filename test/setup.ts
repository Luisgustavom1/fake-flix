import * as dotenv from 'dotenv';
import * as fs from 'node:fs';

const testEnvFile = '.env.test';
const envFile = '.env';

if (!fs.existsSync(envFile)) {
  throw new Error('.env file found');
}

if (!fs.existsSync(testEnvFile)) {
  throw new Error('.env.test file found');
}

dotenv.config({ path: envFile });
dotenv.config({ path: testEnvFile, override: true });
