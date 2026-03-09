#!/usr/bin/env node

import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs';
import { analyze } from './analyzer';
import { generateHTML } from './generator';

const program = new Command();

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

    const result = analyze({
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
    const html = generateHTML(result);

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
