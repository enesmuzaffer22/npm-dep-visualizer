#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const analyzer_1 = require("./analyzer");
const generator_1 = require("./generator");
const program = new commander_1.Command();
program
    .name('depviz')
    .description('Analyze and visualize JavaScript/TypeScript project dependencies as an interactive HTML report.')
    .version('1.0.0')
    .option('-d, --dir <path>', 'Root directory of the project to analyze', '.')
    .option('-o, --output <path>', 'Output HTML file path', './dependency-report.html')
    .option('-e, --exclude <patterns...>', 'Glob patterns to exclude (space-separated)')
    .action((options) => {
    const dir = path.resolve(options.dir);
    const output = path.resolve(options.output);
    // Validate directory exists
    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
        console.error(`\n  ❌ Error: Directory not found: ${dir}\n`);
        process.exit(1);
    }
    console.log('');
    console.log('  🔍 Dep Visualizer');
    console.log('  ─────────────────────────────────');
    console.log(`  📂 Directory: ${dir}`);
    console.log(`  📄 Output:    ${output}`);
    console.log('');
    // Analyze
    console.log('  ⏳ Analyzing project dependencies...');
    const startTime = Date.now();
    const result = (0, analyzer_1.analyze)({
        dir,
        exclude: options.exclude,
    });
    const analysisTime = Date.now() - startTime;
    console.log(`  ✅ Analysis complete in ${analysisTime}ms`);
    console.log('');
    console.log(`  📊 Stats:`);
    console.log(`     • ${result.stats.totalFiles} source files`);
    console.log(`     • ${result.stats.totalImports} total imports`);
    console.log(`     • ${result.stats.totalLocalImports} local imports`);
    console.log(`     • ${result.stats.totalExternalPackages} external packages`);
    if (result.stats.circularDependencies.length > 0) {
        console.log(`     ⚠️  ${result.stats.circularDependencies.length} circular dependencies found`);
    }
    console.log('');
    // Generate HTML
    console.log('  ⏳ Generating HTML report...');
    const html = (0, generator_1.generateHTML)(result);
    // Ensure output directory exists
    const outputDir = path.dirname(output);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    fs.writeFileSync(output, html, 'utf-8');
    const fileSize = (fs.statSync(output).size / 1024).toFixed(1);
    console.log(`  ✅ Report saved: ${output} (${fileSize} KB)`);
    console.log('');
    console.log('  🌐 Open it in your browser to explore your dependencies!');
    console.log('');
});
program.parse();
//# sourceMappingURL=cli.js.map