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
exports.readPathAliases = readPathAliases;
exports.isExternalImport = isExternalImport;
exports.resolveImport = resolveImport;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
/**
 * Read tsconfig.json (or jsconfig.json) and extract path aliases.
 */
function readPathAliases(projectRoot) {
    const aliases = {};
    const configPaths = [
        path.join(projectRoot, 'tsconfig.json'),
        path.join(projectRoot, 'jsconfig.json'),
    ];
    for (const configPath of configPaths) {
        if (!fs.existsSync(configPath))
            continue;
        try {
            const raw = fs.readFileSync(configPath, 'utf-8');
            // Strip comments from tsconfig (JSON with comments)
            const stripped = raw
                .replace(/\/\/.*$/gm, '')
                .replace(/\/\*[\s\S]*?\*\//g, '')
                .replace(/,(\s*[}\]])/g, '$1'); // trailing commas
            const config = JSON.parse(stripped);
            const paths = config?.compilerOptions?.paths;
            const baseUrl = config?.compilerOptions?.baseUrl || '.';
            const baseDir = path.resolve(projectRoot, baseUrl);
            if (paths) {
                for (const [aliasPattern, targets] of Object.entries(paths)) {
                    const resolvedTargets = targets.map((t) => path.resolve(baseDir, t));
                    aliases[aliasPattern] = resolvedTargets;
                }
            }
            break; // Use first found config
        }
        catch {
            // Skip invalid config
        }
    }
    return aliases;
}
const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.mts', '.vue', '.svelte'];
/**
 * Try to resolve a file path by appending extensions or looking for index files.
 */
function tryResolveFile(basePath) {
    // Exact file
    if (fs.existsSync(basePath) && fs.statSync(basePath).isFile()) {
        return basePath;
    }
    // Try with extensions
    for (const ext of EXTENSIONS) {
        const withExt = basePath + ext;
        if (fs.existsSync(withExt) && fs.statSync(withExt).isFile()) {
            return withExt;
        }
    }
    // Try as directory with index file
    if (fs.existsSync(basePath) && fs.statSync(basePath).isDirectory()) {
        for (const ext of EXTENSIONS) {
            const indexFile = path.join(basePath, `index${ext}`);
            if (fs.existsSync(indexFile) && fs.statSync(indexFile).isFile()) {
                return indexFile;
            }
        }
    }
    return null;
}
/**
 * Determine whether an import source is external (node_modules).
 */
function isExternalImport(source) {
    // Relative imports
    if (source.startsWith('.') || source.startsWith('/'))
        return false;
    return true;
}
/**
 * Resolve an import source to an absolute file path.
 * Returns null if external or can't be resolved.
 */
function resolveImport(source, fromFile, projectRoot, aliases) {
    // Relative imports
    if (source.startsWith('.')) {
        const dir = path.dirname(fromFile);
        const resolved = path.resolve(dir, source);
        return tryResolveFile(resolved);
    }
    // Check path aliases
    for (const [aliasPattern, targets] of Object.entries(aliases)) {
        // Convert alias patterns like "@/*" to a matchable form
        const aliasPrefix = aliasPattern.replace(/\*$/, '');
        if (source === aliasPrefix.slice(0, -1) || source.startsWith(aliasPrefix)) {
            const suffix = source.slice(aliasPrefix.length);
            for (const target of targets) {
                const targetBase = target.replace(/\*$/, '');
                const resolvedPath = path.resolve(targetBase, suffix);
                const result = tryResolveFile(resolvedPath);
                if (result)
                    return result;
            }
        }
    }
    // External module — return null
    return null;
}
//# sourceMappingURL=resolver.js.map