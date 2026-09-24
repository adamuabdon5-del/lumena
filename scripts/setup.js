import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const envFile = path.join(rootDir, ".env");
const envExampleFile = path.join(rootDir, ".env.example");

console.log("=========================================");
console.log("   Lumen Development Environment Setup   ");
console.log("=========================================\n");

// 1. Copy .env.example to .env if it does not already exist
if (!fs.existsSync(envFile)) {
  if (fs.existsSync(envExampleFile)) {
    fs.copyFileSync(envExampleFile, envFile);
    console.log("✓ Created .env from .env.example");
  } else {
    console.warn("⚠ Warning: .env.example was not found at repository root.");
  }
} else {
  console.log("✓ .env already exists. Skipping copy.");
}

// 2. Print instructions for editing the configuration file
console.log("\n-----------------------------------------");
console.log("Configuration Instructions:");
console.log("-----------------------------------------");
console.log("Please review and configure '.env' with your local environment settings:");
console.log("  - STELLAR_NETWORK   : 'testnet' or 'local' (defaults to 'testnet')");
console.log("  - HORIZON_URL       : Horizon REST API endpoint (e.g. http://localhost:8000 for local)");
console.log("  - SOROBAN_RPC_URL   : Soroban RPC endpoint (e.g. http://localhost:8000/rpc for local)");
console.log("  - SIGNER_PROVIDER   : 'env' (default for dev/testnet) or 'awskms' (for production)");
console.log("  - FEE_PAYER_SECRET  : Secret key of the Stellar account that pays fees & reserves");
console.log("  - COSIGNER_SECRET   : Secret key of the server co-signer for 2-of-2 multisig");
console.log("  - PORT              : Server port (defaults to 3000)");
console.log("  - LUMEN_LOG_LEVEL   : Log level (trace, debug, info, warn, error)");
console.log("-----------------------------------------\n");

// 3. Run pnpm install
console.log("Running 'pnpm install' to install dependencies across the monorepo...\n");
try {
  execSync("pnpm install", { stdio: "inherit", cwd: rootDir });
  console.log("\n✓ Setup completed successfully!");
} catch (err) {
  console.error("\n❌ Error running 'pnpm install':", err.message);
  process.exit(1);
}
