#!/usr/bin/env node

import { program } from "commander";
import inquirer from "inquirer";
import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import ora from "ora";

const packageJson = require("../package.json");

// When running from packages/cli/dist/index.js, repo root is ../../..
const getRepoRoot = (): string =>
  path.resolve(__dirname, "..", "..", "..");

const isMonorepo = (): boolean => {
  const root = getRepoRoot();
  return (
    fs.existsSync(path.join(root, "packages", "backends", "express", "package.json")) &&
    fs.existsSync(path.join(root, "packages", "admin", "package.json"))
  );
};

const copyFilter = (src: string): boolean => {
  const normalized = src.replace(/\\/g, "/");
  return (
    !/node_modules|\.next\/|\/dist\/|\.turbo\//.test(normalized) &&
    !/\.(tsbuildinfo|log)$/.test(normalized)
  );
};

/** Exclude template's admin folder and unused dirs when copying (admin from @enterprise/admin; .tmp/.enterprise unused). */
function defaultTemplateCopyFilter(templateDir: string) {
  return (src: string): boolean => {
    const rel = path.relative(templateDir, src);
    const sep = path.sep;
    if (rel.startsWith("admin" + sep) || rel === "admin") return false;
    if (rel.startsWith(".tmp" + sep) || rel === ".tmp") return false;
    if (rel.startsWith(".enterprise" + sep) || rel === ".enterprise") return false;
    return copyFilter(src);
  };
}

const ENTERPRISE_VERSION = packageJson.version || "1.0.0";

/** DB connection params collected from CLI prompts (for postgres/mysql/mongodb) */
interface DbParams {
  host?: string;
  port?: string;
  database?: string;
  user?: string;
  password?: string;
  filename?: string;
}

/** Ensure .env exists (copy from .env.example) and write DB_* from dbclient + dbParams */
async function ensureEnvAndWriteDb(
  targetPath: string,
  dbclient: string,
  dbParams: DbParams,
  envDir?: string,
): Promise<void> {
  const dir = envDir ? path.join(targetPath, envDir) : targetPath;
  await fs.ensureDir(dir);
  const envExample = path.join(dir, ".env.example");
  const envPath = path.join(dir, ".env");
  let content: string;
  if (await fs.pathExists(envExample)) {
    content = await fs.readFile(envExample, "utf8");
  } else {
    content = (await fs.pathExists(envPath)) ? await fs.readFile(envPath, "utf8") : "";
  }
  const set = (key: string, value: string) => {
    const line = `${key}=${value}`;
    const re = new RegExp(`^${key}=.*$`, "m");
    if (re.test(content)) content = content.replace(re, line);
    else content += (content && !content.endsWith("\n") ? "\n" : "") + line + "\n";
  };
  set("DB_CLIENT", dbclient);
  if (dbclient === "sqlite") {
    set("DB_FILENAME", dbParams.filename || "./.tmp/data.db");
  } else {
    if (dbParams.host != null) set("DB_HOST", dbParams.host);
    if (dbParams.port != null) set("DB_PORT", dbParams.port);
    if (dbParams.database != null) set("DB_NAME", dbParams.database);
    if (dbParams.user != null) set("DB_USER", dbParams.user);
    if (dbParams.password != null) set("DB_PASSWORD", dbParams.password);
  }
  await fs.writeFile(envPath, content);
}

/** Strapi-style: merge scope deps into project package.json (admin, design-system, etc. from core). */
async function createPackageJSON(
  targetPath: string,
  projectName: string,
  _config: { dbclient?: string }
): Promise<void> {
  const pkgPath = path.join(targetPath, "package.json");
  const existing = await fs.readJson(pkgPath).catch(() => ({}));
  const pkg = {
    ...existing,
    name: projectName.replace(/\s+/g, "-").toLowerCase(),
    private: true,
    version: existing.version || "1.0.0",
    dependencies: {
      "@enterprise/backend-express": `^${ENTERPRISE_VERSION}`,
      "@enterprise/admin": `^${ENTERPRISE_VERSION}`,
      "@enterprise/design-system": `^${ENTERPRISE_VERSION}`,
      "@enterprise/hooks": `^${ENTERPRISE_VERSION}`,
      "@enterprise/utils": `^${ENTERPRISE_VERSION}`,
      "@enterprise/types": `^${ENTERPRISE_VERSION}`,
      dotenv: "^16.4.7",
      ...existing.dependencies,
    },
    devDependencies: {
      typescript: "^5.7.3",
      "ts-node-dev": "^2.0.0",
      concurrently: "^9.1.0",
      ...existing.devDependencies,
    },
    engines: existing.engines || { node: ">=18.0.0" },
  };
  await fs.writeJson(pkgPath, pkg, { spaces: 2 });
}

/** If the app is inside the monorepo, patch @enterprise/* deps to file:... so npm install works */
function patchEnterpriseDepsInApp(targetPath: string, repoRoot: string): void {
  const targetAbs = path.resolve(targetPath);
  const repoAbs = path.resolve(repoRoot);
  if (!targetAbs.startsWith(repoAbs) || targetAbs === repoAbs) return;
  const packagesDir = path.join(repoRoot, "packages");
  const backendsExpressDir = path.join(repoRoot, "packages", "backends", "express");
  const adminPkgDir = path.join(repoRoot, "packages", "admin");
  if (!fs.existsSync(packagesDir)) return;

  const rootPkgPath = path.join(targetPath, "package.json");
  if (!fs.existsSync(rootPkgPath)) return;
  const rootPkg = fs.readJsonSync(rootPkgPath);
  if (!rootPkg.dependencies) return;

  const fromRoot = targetPath;
  const patch = (key: string, dir: string) => {
    if (rootPkg.dependencies[key] && fs.existsSync(dir)) {
      rootPkg.dependencies[key] = `file:${path.relative(fromRoot, dir).replace(/\\/g, "/")}`;
    }
  };
  patch("@enterprise/backend-express", backendsExpressDir);
  patch("@enterprise/admin", adminPkgDir);
  for (const name of ["core", "database", "types", "design-system", "hooks", "utils"]) {
    patch(`@enterprise/${name}`, path.join(packagesDir, name));
  }
  fs.writeJsonSync(rootPkgPath, rootPkg, { spaces: 2 });
}

program
  .version(packageJson.version)
  .name("create-enterprise-app")
  .description("Enterprise CMS CLI (create project, develop, start)");

program
  .command("develop")
  .description("Start Admin + API in development (run from project directory)")
  .action(() => {
    const { execSync } = require("child_process");
    const cwd = process.cwd();
    try {
      execSync("npm run develop", { cwd, stdio: "inherit" });
    } catch {
      console.error(chalk.red("Run this command from your Enterprise CMS project directory. Or run: npm run develop"));
      process.exit(1);
    }
  });

program
  .command("start")
  .description("Start production server (run from project directory)")
  .action(() => {
    const { execSync } = require("child_process");
    const cwd = process.cwd();
    try {
      execSync("npm run start", { cwd, stdio: "inherit" });
    } catch {
      console.error(chalk.red("Run this command from your Enterprise CMS project directory. Or run: npm run start"));
      process.exit(1);
    }
  });

program
  .command("create", { isDefault: true })
  .description("Create a new Enterprise CMS project")
  .argument("[project-directory]", "Project name (new folder) or path (e.g. . or ./ to use current directory)")
  .option("--no-run", "Do not start the application after creation")
  .option("--use-npm", "Use npm as package manager")
  .option("--use-yarn", "Use yarn as package manager")
  .option("--use-pnpm", "Use pnpm as package manager")
  .option("--quickstart", "Quick start: SQLite, minimal prompts, no run after")
  .option("--dbclient <dbclient>", "Database: postgres, mysql, sqlite, mongodb")
  .option(
    "--backend <backend>",
    "Backend framework (express, nestjs, fastify, go)",
  )
  .option(
    "--layout <layout>",
    "Project layout: standard (full app) or API only",
  )
  .action(async (projectDirectory, options) => {
    const quickstart = options.quickstart === true;
    const rawArg = typeof projectDirectory === "string" ? projectDirectory.trim() : undefined;
    const isPathTarget =
      rawArg === "." ||
      rawArg === "./" ||
      (rawArg != null && (rawArg.startsWith("./") || path.isAbsolute(rawArg)));
    let targetPath: string;
    let projectName: string;
    let dirForCd: string;

    if (isPathTarget) {
      targetPath = path.resolve(process.cwd(), rawArg || ".");
      projectName = path.basename(targetPath);
      dirForCd = rawArg === "." || rawArg === "./" ? "." : rawArg!;
    } else {
      let dir: string;
      if (quickstart) {
        dir = rawArg || "my-enterprise-app";
      } else {
        const nameAnswer = await inquirer.prompt([
          {
            type: "input",
            name: "projectName",
            message: "What is your project name?",
            default: rawArg || "my-enterprise-app",
          },
        ]);
        dir = (nameAnswer.projectName as string).trim() || rawArg || "my-enterprise-app";
      }
      targetPath = path.resolve(process.cwd(), dir);
      projectName = dir;
      dirForCd = dir;
      if (fs.existsSync(targetPath)) {
        console.error(chalk.red(`\nError: Directory ${targetPath} already exists.\n`));
        process.exit(1);
      }
    }

    const packageManager = options.usePnpm ? "pnpm" : options.useYarn ? "yarn" : "npm";

    const answers = quickstart
      ? {}
      : await inquirer.prompt([
          {
            type: "list",
            name: "backend",
            message: "Choose your backend framework:",
            choices: ["express", "nestjs", "fastify", "go"],
            default: "express",
            when: !options.backend,
          },
          {
            type: "list",
            name: "dbclient",
            message: "Choose your database:",
            choices: ["sqlite", "postgres", "mysql", "mongodb"],
            default: "sqlite",
            when: !options.dbclient,
          },
          {
            type: "list",
            name: "layout",
            message: "Project layout:",
            choices: [
              { name: "Full app (config/, src/, database/ + Admin UI)", value: "standard" },
              { name: "API only (config/, src/, database/)", value: "api-only" },
            ],
            default: "standard",
          },
        ]);

    const config = {
      backend: options.backend || (quickstart ? "express" : (answers as any).backend),
      dbclient: options.dbclient || (quickstart ? "sqlite" : (answers as any).dbclient),
      language: "typescript",
      layout: options.layout || (quickstart ? "standard" : (answers as any).layout),
    } as {
      backend: string;
      dbclient: string;
      language: string;
      layout: string;
    };

    let dbParams: DbParams = {};
    const dbclient = config.dbclient || "sqlite";
    if (!quickstart && dbclient !== "sqlite") {
      const defaultPort =
        dbclient === "postgres" ? "5432" : dbclient === "mysql" ? "3306" : "27017";
      const dbAnswers = await inquirer.prompt([
        { type: "input", name: "host", message: "Database host:", default: "localhost" },
        { type: "input", name: "port", message: "Database port:", default: defaultPort },
        { type: "input", name: "database", message: "Database name:", default: "enterprise" },
        {
            type: "input",
            name: "user",
            message: "Database user:",
            default: dbclient === "postgres" ? "postgres" : dbclient === "mysql" ? "root" : "",
          },
        { type: "password", name: "password", message: "Database password:", mask: "*" },
      ]);
      dbParams = {
        host: (dbAnswers.host as string) || "localhost",
        port: (dbAnswers.port as string) || defaultPort,
        database: (dbAnswers.database as string) || "enterprise",
        user: (dbAnswers.user as string) || "",
        password: (dbAnswers.password as string) || "",
      };
    } else if (dbclient === "sqlite") {
      dbParams = { filename: "./.tmp/data.db" };
    }

    const spinner = ora("Creating Enterprise CMS project...").start();

    try {
      if (isPathTarget) await fs.ensureDir(targetPath);
      const backend = config.backend || "express";
      const layout = config.layout || "standard";
      const useFullMonorepo = false; // Single app only; no backend/ + admin/ workspaces
      const repoRoot = getRepoRoot();
      const defaultTemplateDir = path.join(__dirname, "..", "templates", "default");
      const hasDefaultTemplate = fs.existsSync(path.join(defaultTemplateDir, "package.json"));
      const apiOnlyTemplateDir = path.join(__dirname, "..", "templates", "api-only");

      if (layout === "api-only" && fs.existsSync(path.join(apiOnlyTemplateDir, "package.json"))) {
        spinner.text = "Creating API-only layout (config/, src/, database/, public/)...";
        await fs.copy(apiOnlyTemplateDir, targetPath);
        const rootPkg = await fs.readJson(path.join(targetPath, "package.json"));
        rootPkg.name = projectName;
        await fs.writeJson(path.join(targetPath, "package.json"), rootPkg, { spaces: 2 });
        await ensureEnvAndWriteDb(targetPath, dbclient, dbParams);
        spinner.succeed(chalk.green("API-only project created. .env created from .env.example. Run npm run dev."));
      } else if (useFullMonorepo) {
        // Local mode: copy real packages/backends/express and packages/admin, wire to workspace packages
        spinner.text = "Copying full backend and admin (with all modules)...";
        await fs.ensureDir(targetPath);

        const backendSrc = path.join(repoRoot, "packages", "backends", "express");
        const adminSrc = path.join(repoRoot, "packages", "admin");
        const backendDest = path.join(targetPath, "backend");
        const adminDest = path.join(targetPath, "admin");

        await fs.copy(backendSrc, backendDest, { filter: copyFilter });
        await fs.copy(adminSrc, adminDest, { filter: copyFilter });

        // Root package.json
        await fs.writeJson(
          path.join(targetPath, "package.json"),
          {
            name: projectName,
            version: "1.0.0",
            private: true,
            scripts: {
              dev: "npm run dev --workspaces --if-present",
              develop: "npm run dev --workspaces --if-present",
              build: "npm run build --workspaces --if-present",
              start: "npm run start --workspaces --if-present",
              "dev:admin": "npm run dev -w admin",
              "dev:backend": "npm run dev -w backend",
            },
            workspaces: ["admin", "backend"],
            engines: { node: ">=18.0.0" },
          },
          { spaces: 2 },
        );

        // Backend: point @enterprise/* to repo packages (target is e.g. repo/my-app/backend -> ../../packages)
        const backendPkgPath = path.join(backendDest, "package.json");
        const backendPkg = await fs.readJson(backendPkgPath);
        backendPkg.name = "backend";
        const pkgRef = (name: string) => `file:../../packages/${name}`;
        if (backendPkg.dependencies) {
          if (backendPkg.dependencies["@enterprise/core"]) backendPkg.dependencies["@enterprise/core"] = pkgRef("core");
          if (backendPkg.dependencies["@enterprise/database"]) backendPkg.dependencies["@enterprise/database"] = pkgRef("database");
          if (backendPkg.dependencies["@enterprise/types"]) backendPkg.dependencies["@enterprise/types"] = pkgRef("types");
        }
        await fs.writeJson(backendPkgPath, backendPkg, { spaces: 2 });

        // Admin: point @enterprise/* to repo packages
        const adminPkgPath = path.join(adminDest, "package.json");
        const adminPkg = await fs.readJson(adminPkgPath);
        adminPkg.name = "admin";
        if (adminPkg.dependencies) {
          if (adminPkg.dependencies["@enterprise/design-system"]) adminPkg.dependencies["@enterprise/design-system"] = pkgRef("design-system");
          if (adminPkg.dependencies["@enterprise/hooks"]) adminPkg.dependencies["@enterprise/hooks"] = pkgRef("hooks");
          if (adminPkg.dependencies["@enterprise/utils"]) adminPkg.dependencies["@enterprise/utils"] = pkgRef("utils");
          if (adminPkg.dependencies["@enterprise/types"]) adminPkg.dependencies["@enterprise/types"] = pkgRef("types");
        }
        await fs.writeJson(adminPkgPath, adminPkg, { spaces: 2 });

        await ensureEnvAndWriteDb(targetPath, dbclient, dbParams, "backend");

        await fs.writeFile(
          path.join(targetPath, "README.md"),
          `# ${projectName} – Enterprise CMS (full)

Generated with full backend + admin, linked to monorepo packages.

## Setup

1. Edit \`backend/.env\` (DB_*, ADMIN_JWT_SECRET, CORS_ORIGIN).
2. From this folder: \`npm install\`
3. \`npm run develop\` — One server: API http://localhost:9390/api, Admin http://localhost:9390/admin.

## Features

- **Backend**: REST + GraphQL, JWT, content types, hooks, plugins, MySQL/Postgres/Mongo.
- **Admin**: Dashboard, Content Type Builder, Content Manager, Plugins, Middlewares, Settings, onboarding, dark/light mode.
`,
          "utf8",
        );

        spinner.succeed(chalk.green("Full Enterprise CMS project created (backend + admin + all modules linked)!"));
      } else if (backend === "express" && hasDefaultTemplate && layout !== "api-only") {
        // Standard: minimal template; admin from @enterprise/admin package
        spinner.text = "Creating full app (config/, src/, database/ + Admin from package)...";
        await fs.copy(defaultTemplateDir, targetPath, {
          filter: defaultTemplateCopyFilter(defaultTemplateDir),
        });

        await createPackageJSON(targetPath, projectName, config);

        await ensureEnvAndWriteDb(targetPath, dbclient, dbParams);
        patchEnterpriseDepsInApp(targetPath, getRepoRoot());

        const readmeBody = `# ${projectName} – Enterprise CMS

Generated with \`npx create-enterprise-app\`. Structure: config/, src/, database/, public/. Admin UI from \`@enterprise/admin\`.

## Setup

1. Edit \`.env\` at project root (DB_*, CORS_ORIGIN, NEXT_PUBLIC_API_URL).
2. \`npm install\`
3. \`npm run develop\` — One server (Strapi-style): API at http://localhost:9390/api, Admin at http://localhost:9390/admin.

## Features

- Admin from package (\`@enterprise/admin\`). Customize via \`src/admin/\`.
- REST + GraphQL, JWT, Content Type Builder, Content Manager, Plugins, Settings.

## Troubleshooting

- **Port 9390 already in use (EADDRINUSE)** — Stop the previous \`npm run develop\` (Ctrl+C) or set \`PORT=9391\` in \`.env\`.
- **ERR_CONNECTION_REFUSED** — The server did not start (often because port was in use). Fix the port conflict and restart \`npm run develop\`.
`;
        await fs.writeFile(path.join(targetPath, "README.md"), readmeBody, "utf8");

        spinner.succeed(chalk.green("Project created! Run npm install then npm run develop."));
      } else {
        // Minimal template (no full template or backend !== express)
        const templateDir = path.join(__dirname, "..", "templates", backend);
        if (!fs.existsSync(templateDir)) {
          spinner.fail(chalk.red(`Template for backend "${backend}" is not available. Use --backend express.`));
          process.exit(1);
        }
        await fs.copy(templateDir, targetPath);

        const rootPkgPath = path.join(targetPath, "package.json");
        const rootPkg = await fs.readJson(rootPkgPath);
        rootPkg.name = projectName;
        await fs.writeJson(rootPkgPath, rootPkg, { spaces: 2 });

        if (backend === "express") {
          const backendDir = path.join(targetPath, "backend");
          const envExample = path.join(backendDir, ".env.example");
          if (fs.existsSync(envExample)) {
            await ensureEnvAndWriteDb(targetPath, dbclient, dbParams, "backend");
          }
        } else {
          await ensureEnvAndWriteDb(targetPath, dbclient, dbParams);
        }
        patchEnterpriseDepsInApp(targetPath, getRepoRoot());

        spinner.succeed(chalk.green("Enterprise CMS project created successfully!"));
      }

      const hasFullApp = layout !== "api-only" && backend === "express" && (useFullMonorepo || hasDefaultTemplate);
      const runAfterCreate = hasFullApp && !options.noRun;

      console.log(`\nNext steps:\n`);
      console.log(chalk.cyan(`  cd ${dirForCd}`));
      console.log(chalk.cyan(`  ${packageManager} install`));

      try {
        spinner.start("Installing dependencies...");
        const { execSync } = require("child_process");
        execSync(`${packageManager} install`, { cwd: targetPath, stdio: "pipe" });
        spinner.succeed("Dependencies installed.");
      } catch (e) {
        spinner.warn("Install failed. Run manually: " + packageManager + " install");
      }

      if (runAfterCreate) {
        console.log(chalk.cyan(`  ${packageManager} run develop`));
        console.log(chalk.gray("\n  Admin: http://localhost:9390/admin  |  API: http://localhost:9390/api"));
        console.log(chalk.gray("  Edit .env for database (DB_*, PORT).\n"));
        try {
          const { execSync } = require("child_process");
          execSync(`${packageManager} run develop`, { cwd: targetPath, stdio: "inherit" });
        } catch {
          console.log(chalk.gray("  Run manually: " + packageManager + " run develop\n"));
        }
      } else {
        if (hasFullApp) {
          console.log(chalk.cyan(`  ${packageManager} run develop`));
          console.log(chalk.gray("\n  Admin: http://localhost:9390/admin  |  API: http://localhost:9390/api\n"));
        } else {
          console.log(chalk.cyan(`  ${packageManager} run dev\n`));
        }
      }
      if (useFullMonorepo) {
        console.log(chalk.gray("  (Monorepo mode: @enterprise/* linked from repo packages.)\n"));
      }
    } catch (error) {
      spinner.fail(chalk.red("Failed to create project."));
      console.error(error);
      process.exit(1);
    }
  });

program.parse(process.argv);
