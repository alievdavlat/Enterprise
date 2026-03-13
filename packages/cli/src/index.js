#!/usr/bin/env node
import { program } from "commander";
import inquirer from "inquirer";
import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import ora from "ora";
const packageJson = require("../package.json");
program
    .version(packageJson.version)
    .description("Scaffold a new Enterprise CMS project")
    .argument("[project-directory]", "Directory to create the project in")
    .option("--dbclient <dbclient>", "Database client (postgres, mysql, mongodb)")
    .option("--backend <backend>", "Backend framework (express, nestjs, fastify, go)")
    .option("--language <language>", "Programming language (typescript, javascript)")
    .action(async (projectDirectory, options) => {
    let dir = projectDirectory;
    if (!dir) {
        const answers = await inquirer.prompt([
            {
                type: "input",
                name: "projectDirectory",
                message: "What is your project name?",
                default: "my-enterprise-app",
            },
        ]);
        dir = answers.projectDirectory;
    }
    const answers = await inquirer.prompt([
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
            message: "Choose your database client:",
            choices: ["postgres", "mysql", "mongodb"],
            default: "postgres",
            when: !options.dbclient,
        },
        {
            type: "list",
            name: "language",
            message: "Choose your language:",
            choices: ["typescript", "javascript"],
            default: "typescript",
            when: !options.language,
        },
    ]);
    const config = { ...options, ...answers };
    const targetPath = path.resolve(process.cwd(), dir);
    if (fs.existsSync(targetPath)) {
        console.error(chalk.red(`\nError: Directory ${targetPath} already exists.\n`));
        process.exit(1);
    }
    const spinner = ora("Creating Enterprise CMS project...").start();
    try {
        const backend = config.backend || "express";
        const templateDir = path.join(__dirname, "..", "templates", backend);
        if (!fs.existsSync(templateDir)) {
            spinner.fail(chalk.red(`Template for backend "${backend}" is not available. Use --backend express.`));
            process.exit(1);
        }
        await fs.copy(templateDir, targetPath);
        const rootPkgPath = path.join(targetPath, "package.json");
        const rootPkg = await fs.readJson(rootPkgPath);
        rootPkg.name = path.basename(dir);
        await fs.writeJson(rootPkgPath, rootPkg, { spaces: 2 });
        if (backend === "express") {
            const backendDir = path.join(targetPath, "backend");
            const envExample = path.join(backendDir, ".env.example");
            if (fs.existsSync(envExample)) {
                const envPath = path.join(backendDir, ".env");
                if (!fs.existsSync(envPath)) {
                    await fs.copy(envExample, envPath);
                }
            }
        }
        spinner.succeed(chalk.green("Enterprise CMS project created successfully!"));
        console.log(`\nNext steps:\n`);
        console.log(chalk.cyan(`  cd ${dir}`));
        console.log(chalk.cyan(`  npm install`));
        console.log(chalk.cyan(`  npm run dev\n`));
    }
    catch (error) {
        spinner.fail(chalk.red("Failed to create project."));
        console.error(error);
        process.exit(1);
    }
});
program.parse(process.argv);
//# sourceMappingURL=index.js.map