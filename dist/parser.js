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
exports.parseImports = parseImports;
exports.hasExports = hasExports;
const fs = __importStar(require("fs"));
/**
 * Parse a JavaScript/TypeScript file and extract all import/require statements.
 * Uses regex-based parsing — framework-agnostic, works with JSX/TSX/Vue/Angular/plain JS.
 */
function parseImports(filePath) {
    let content;
    try {
        content = fs.readFileSync(filePath, 'utf-8');
    }
    catch {
        return [];
    }
    const imports = [];
    const seen = new Set();
    const addImport = (source, type) => {
        const trimmed = source.trim();
        if (trimmed && !seen.has(`${type}:${trimmed}`)) {
            seen.add(`${type}:${trimmed}`);
            imports.push({ source: trimmed, type });
        }
    };
    // Remove single-line comments
    const noSingleLineComments = content.replace(/\/\/.*$/gm, '');
    // Remove multi-line comments
    const noComments = noSingleLineComments.replace(/\/\*[\s\S]*?\*\//g, '');
    // ES import: import ... from 'source'
    const esImportRegex = /import\s+(?:[\s\S]*?)\s+from\s+['"]([^'"]+)['"]/g;
    let match;
    while ((match = esImportRegex.exec(noComments)) !== null) {
        addImport(match[1], 'import');
    }
    // Side-effect import: import 'source' or import "source"
    const sideEffectImportRegex = /import\s+['"]([^'"]+)['"]/g;
    while ((match = sideEffectImportRegex.exec(noComments)) !== null) {
        addImport(match[1], 'import');
    }
    // Dynamic import: import('source')
    const dynamicImportRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    while ((match = dynamicImportRegex.exec(noComments)) !== null) {
        addImport(match[1], 'dynamic-import');
    }
    // CommonJS require: require('source')
    const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    while ((match = requireRegex.exec(noComments)) !== null) {
        addImport(match[1], 'require');
    }
    // Re-exports: export ... from 'source'
    const reExportRegex = /export\s+(?:[\s\S]*?)\s+from\s+['"]([^'"]+)['"]/g;
    while ((match = reExportRegex.exec(noComments)) !== null) {
        addImport(match[1], 're-export');
    }
    return imports;
}
/**
 * Check whether a file has any export statements (ES or CommonJS).
 * Used to distinguish dead code (no imports AND no exports) from entry points.
 */
function hasExports(filePath) {
    let content;
    try {
        content = fs.readFileSync(filePath, 'utf-8');
    }
    catch {
        return false;
    }
    const noSingleLineComments = content.replace(/\/\/.*$/gm, '');
    const noComments = noSingleLineComments.replace(/\/\*[\s\S]*?\*\//g, '');
    // ES export: export default / export const|let|var|function|class|type|interface|enum / export { / export *
    if (/\bexport\s+(default|const|let|var|function|class|type|interface|enum|abstract|\{|\*)/m.test(noComments)) {
        return true;
    }
    // CommonJS: module.exports = ... or exports.xxx = ...
    if (/\bmodule\.exports\s*=|\bexports\.\w+\s*=/m.test(noComments)) {
        return true;
    }
    return false;
}
//# sourceMappingURL=parser.js.map