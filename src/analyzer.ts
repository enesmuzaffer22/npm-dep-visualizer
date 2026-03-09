import * as path from 'path';
import * as fs from 'fs';
import { globSync } from 'glob';
import { parseImports } from './parser';
import { resolveImport, isExternalImport, readPathAliases, PathAliasConfig } from './resolver';

export interface FileNode {
  id: string;           // Absolute path
  relativePath: string; // Relative to project root
  imports: DependencyEdge[];
  importedBy: string[]; // Files that import this file
}

export interface DependencyEdge {
  source: string;       // Original import specifier
  resolved: string | null; // Resolved absolute path (null = external)
  isExternal: boolean;
  type: 'import' | 'require' | 'dynamic-import' | 're-export';
}

export interface ExternalPackage {
  name: string;
  importedBy: string[]; // Files that import this package
  importCount: number;
}

export interface AnalysisResult {
  projectRoot: string;
  files: Map<string, FileNode>;
  externalPackages: Map<string, ExternalPackage>;
  stats: {
    totalFiles: number;
    totalImports: number;
    totalExternalPackages: number;
    totalLocalImports: number;
    totalExternalImports: number;
    circularDependencies: string[][];
  };
}

export interface AnalyzerOptions {
  dir: string;
  exclude?: string[];
}

const DEFAULT_EXCLUDE = [
  '**/node_modules/**',
  '**/.git/**',
  '**/dist/**',
  '**/build/**',
  '**/.next/**',
  '**/.nuxt/**',
  '**/.output/**',
  '**/coverage/**',
  '**/*.config.*',
  '**/*.d.ts',
];

/**
 * Get the top-level package name from an import specifier.
 * e.g., 'next/link' → 'next', '@types/react' → '@types/react', 'lucide-react' → 'lucide-react'
 */
function getPackageName(source: string): string {
  if (source.startsWith('@')) {
    const parts = source.split('/');
    return parts.slice(0, 2).join('/');
  }
  return source.split('/')[0];
}

/**
 * Normalize a file path to use forward slashes for consistency.
 */
function normalizePath(p: string): string {
  return p.replace(/\\/g, '/');
}

/**
 * Analyze a project directory and build the full dependency graph.
 */
export function analyze(options: AnalyzerOptions): AnalysisResult {
  const projectRoot = path.resolve(options.dir);
  const excludePatterns = options.exclude || DEFAULT_EXCLUDE;

  // Read path aliases from tsconfig/jsconfig
  const aliases: PathAliasConfig = readPathAliases(projectRoot);

  // Find all source files
  const files = globSync('**/*.{ts,tsx,js,jsx,mjs,mts,vue,svelte}', {
    cwd: projectRoot,
    absolute: true,
    ignore: excludePatterns,
  });

  const fileNodes = new Map<string, FileNode>();
  const externalPackages = new Map<string, ExternalPackage>();

  let totalImports = 0;
  let totalLocalImports = 0;
  let totalExternalImports = 0;

  // Phase 1: Parse all files and resolve imports
  for (const filePath of files) {
    const normalized = normalizePath(filePath);
    const relativePath = normalizePath(path.relative(projectRoot, filePath));

    const importInfos = parseImports(filePath);
    const edges: DependencyEdge[] = [];

    for (const info of importInfos) {
      const external = isExternalImport(info.source);

      if (external) {
        // Check if it matches a path alias — if so, try to resolve it
        let resolved: string | null = null;
        let actuallyExternal = true;

        resolved = resolveImport(info.source, filePath, projectRoot, aliases);
        if (resolved) {
          actuallyExternal = false;
        }

        if (actuallyExternal) {
          const pkgName = getPackageName(info.source);
          if (!externalPackages.has(pkgName)) {
            externalPackages.set(pkgName, {
              name: pkgName,
              importedBy: [],
              importCount: 0,
            });
          }
          const pkg = externalPackages.get(pkgName)!;
          if (!pkg.importedBy.includes(relativePath)) {
            pkg.importedBy.push(relativePath);
          }
          pkg.importCount++;
          totalExternalImports++;
        } else {
          totalLocalImports++;
        }

        edges.push({
          source: info.source,
          resolved: resolved ? normalizePath(resolved) : null,
          isExternal: actuallyExternal,
          type: info.type,
        });
      } else {
        // Relative import
        const resolved = resolveImport(info.source, filePath, projectRoot, aliases);
        edges.push({
          source: info.source,
          resolved: resolved ? normalizePath(resolved) : null,
          isExternal: false,
          type: info.type,
        });
        totalLocalImports++;
      }

      totalImports++;
    }

    fileNodes.set(normalized, {
      id: normalized,
      relativePath,
      imports: edges,
      importedBy: [],
    });
  }

  // Phase 2: Build reverse references (importedBy)
  for (const [filePath, node] of fileNodes) {
    for (const edge of node.imports) {
      if (edge.resolved && fileNodes.has(edge.resolved)) {
        const targetNode = fileNodes.get(edge.resolved)!;
        const sourceRelative = normalizePath(path.relative(projectRoot, filePath));
        if (!targetNode.importedBy.includes(sourceRelative)) {
          targetNode.importedBy.push(sourceRelative);
        }
      }
    }
  }

  // Phase 3: Detect circular dependencies
  const circularDeps = detectCircularDependencies(fileNodes);

  return {
    projectRoot: normalizePath(projectRoot),
    files: fileNodes,
    externalPackages,
    stats: {
      totalFiles: fileNodes.size,
      totalImports,
      totalExternalPackages: externalPackages.size,
      totalLocalImports,
      totalExternalImports,
      circularDependencies: circularDeps,
    },
  };
}

/**
 * Detect circular dependencies using DFS.
 */
function detectCircularDependencies(files: Map<string, FileNode>): string[][] {
  const visited = new Set<string>();
  const inStack = new Set<string>();
  const cycles: string[][] = [];

  function dfs(nodeId: string, pathStack: string[]) {
    if (inStack.has(nodeId)) {
      // Found a cycle
      const cycleStart = pathStack.indexOf(nodeId);
      if (cycleStart !== -1) {
        cycles.push(pathStack.slice(cycleStart).concat(nodeId));
      }
      return;
    }

    if (visited.has(nodeId)) return;

    visited.add(nodeId);
    inStack.add(nodeId);
    pathStack.push(nodeId);

    const node = files.get(nodeId);
    if (node) {
      for (const edge of node.imports) {
        if (edge.resolved && !edge.isExternal) {
          dfs(edge.resolved, [...pathStack]);
        }
      }
    }

    inStack.delete(nodeId);
  }

  for (const nodeId of files.keys()) {
    dfs(nodeId, []);
  }

  return cycles;
}
