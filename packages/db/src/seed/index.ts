import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { stdin as input, stdout as output } from "node:process";
import * as readline from "node:readline/promises";

import dotenv from "dotenv";

import type { SeedSuperadminOptions, SeedSuperadminResult } from "./admin";

// Ensure apps/api/.env is loaded if not already in process.env
const envPaths = [
  resolve(process.cwd(), "apps/api/.env"),
  resolve(process.cwd(), "../../apps/api/.env"),
  resolve(process.cwd(), ".env"),
];
for (const p of envPaths) {
  if (existsSync(p)) {
    dotenv.config({ path: p });
    break;
  }
}

export type { SeedSuperadminOptions, SeedSuperadminResult } from "./admin";

export async function seedSuperadmin(
  options: SeedSuperadminOptions,
): Promise<SeedSuperadminResult> {
  const { seedSuperadmin: runSeed } = await import("./admin");
  return runSeed(options);
}

async function runInteractiveSeed() {
  console.log("┌────────────────────────────────────────────────────────┐");
  console.log("│ 👑 Hono Commerce Database Seeder: Superadmin Provision  │");
  console.log("└────────────────────────────────────────────────────────┘\n");

  const rl = readline.createInterface({ input, output });

  try {
    // 1. Check CLI arguments or prompt
    const cliEmail = process.argv[2]?.trim();
    const cliName = process.argv[3]?.trim();

    let email = cliEmail;
    if (!email) {
      email = await rl.question("✉️  Enter Superadmin Email: ");
      email = email.trim();
    }

    if (!email || !email.includes("@")) {
      console.error("\n❌ Invalid email address provided. Seeding aborted.\n");
      process.exit(1);
    }

    let name = cliName;
    if (!name) {
      const nameInput = await rl.question(
        "👤 Enter Superadmin Name [Platform Admin]: ",
      );
      name = nameInput.trim() || "Platform Admin";
    }

    console.log(`\n⏳ Provisioning superadmin for ${email}...`);

    const result = await seedSuperadmin({ email, name });

    if (result.isNew) {
      console.log(`\n✨ Success: Created new Superadmin account!`);
    } else if (result.elevated) {
      console.log(`\n✨ Success: Elevated existing account to Superadmin!`);
    } else {
      console.log(`\nℹ️  Notice: Account is already an active Superadmin.`);
    }

    console.log("──────────────────────────────────────────────────────────");
    console.log(`  User ID:    ${result.user.id}`);
    console.log(`  Name:       ${result.user.name}`);
    console.log(`  Email:      ${result.user.email}`);
    console.log(`  Role:       ${result.user.role}`);
    console.log(`  Status:     ${result.user.status}`);
    console.log("──────────────────────────────────────────────────────────\n");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Seeding failed with error:", error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Execute if run directly from CLI
if (import.meta.main || process.argv[1]?.endsWith("seed/index.ts")) {
  runInteractiveSeed();
}
