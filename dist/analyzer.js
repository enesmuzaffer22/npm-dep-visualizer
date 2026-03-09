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
exports.analyze = analyze;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const glob_1 = require("glob");
const parser_1 = require("./parser");
const resolver_1 = require("./resolver");
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
function getPackageName(source) {
    if (source.startsWith('@')) {
        const parts = source.split('/');
        return parts.slice(0, 2).join('/');
    }
    return source.split('/')[0];
}
/**
 * Normalize a file path to use forward slashes for consistency.
 */
function normalizePath(p) {
    return p.replace(/\\/g, '/');
}
/**
 * Analyze a project directory and build the full dependency graph.
 */
function analyze(options) {
    const projectRoot = path.resolve(options.dir);
    const excludePatterns = options.exclude || DEFAULT_EXCLUDE;
    // Read path aliases from tsconfig/jsconfig
    const aliases = (0, resolver_1.readPathAliases)(projectRoot);
    // Find all source files
    const files = (0, glob_1.globSync)('**/*.{ts,tsx,js,jsx,mjs,mts,vue,svelte}', {
        cwd: projectRoot,
        absolute: true,
        ignore: excludePatterns,
    });
    const fileNodes = new Map();
    const externalPackages = new Map();
    let totalImports = 0;
    let totalLocalImports = 0;
    let totalExternalImports = 0;
    let totalSize = 0;
    // Phase 1: Parse all files and resolve imports
    for (const filePath of files) {
        const normalized = normalizePath(filePath);
        const relativePath = normalizePath(path.relative(projectRoot, filePath));
        let fileSize = 0;
        try {
            fileSize = fs.statSync(filePath).size;
        }
        catch {
            // Ignored
        }
        totalSize += fileSize;
        const importInfos = (0, parser_1.parseImports)(filePath);
        const edges = [];
        for (const info of importInfos) {
            const external = (0, resolver_1.isExternalImport)(info.source);
            if (external) {
                // Check if it matches a path alias — if so, try to resolve it
                let resolved = null;
                let actuallyExternal = true;
                resolved = (0, resolver_1.resolveImport)(info.source, filePath, projectRoot, aliases);
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
                    const pkg = externalPackages.get(pkgName);
                    if (!pkg.importedBy.includes(relativePath)) {
                        pkg.importedBy.push(relativePath);
                    }
                    pkg.importCount++;
                    totalExternalImports++;
                }
                else {
                    totalLocalImports++;
                }
                edges.push({
                    source: info.source,
                    resolved: resolved ? normalizePath(resolved) : null,
                    isExternal: actuallyExternal,
                    type: info.type,
                });
            }
            else {
                // Relative import
                const resolved = (0, resolver_1.resolveImport)(info.source, filePath, projectRoot, aliases);
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
            size: fileSize,
            isOrphan: false,
        });
    }
    // Phase 2: Build reverse references (importedBy)
    for (const [filePath, node] of fileNodes) {
        for (const edge of node.imports) {
            if (edge.resolved && fileNodes.has(edge.resolved)) {
                const targetNode = fileNodes.get(edge.resolved);
                const sourceRelative = normalizePath(path.relative(projectRoot, filePath));
                if (!targetNode.importedBy.includes(sourceRelative)) {
                    targetNode.importedBy.push(sourceRelative);
                }
            }
        }
    }
    // Phase 3: Detect orphans
    let orphanCount = 0;
    for (const [, node] of fileNodes) {
        if (node.importedBy.length === 0 && fileNodes.size > 1) {
            node.isOrphan = true;
            orphanCount++;
        }
    }
    // Phase 4: Detect circular dependencies
    const circularDeps = detectCircularDependencies(fileNodes);
    // Compute top 5 hotspot files (most imported local files)
    const hotspots = Array.from(fileNodes.values())
        .filter(n => n.importedBy.length > 0)
        .sort((a, b) => b.importedBy.length - a.importedBy.length)
        .slice(0, 5)
        .map(n => ({ path: n.relativePath, importedByCount: n.importedBy.length }));
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
            totalSize,
            orphanCount,
            circularDependencies: circularDeps,
            hotspots,
        },
    };
}
/**
 * Detect circular dependencies using DFS.
 */
function detectCircularDependencies(files) {
    const visited = new Set();
    const inStack = new Set();
    const cycles = [];
    function dfs(nodeId, pathStack) {
        if (inStack.has(nodeId)) {
            // Found a cycle
            const cycleStart = pathStack.indexOf(nodeId);
            if (cycleStart !== -1) {
                cycles.push(pathStack.slice(cycleStart).concat(nodeId));
            }
            return;
        }
        if (visited.has(nodeId))
            return;
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
//# sourceMappingURL=analyzer.js.map