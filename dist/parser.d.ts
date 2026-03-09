export interface ImportInfo {
    source: string;
    type: 'import' | 'require' | 'dynamic-import' | 're-export';
}
/**
 * Parse a JavaScript/TypeScript file and extract all import/require statements.
 * Uses regex-based parsing — framework-agnostic, works with JSX/TSX/Vue/Angular/plain JS.
 */
export declare function parseImports(filePath: string): ImportInfo[];
/**
 * Check whether a file has any export statements (ES or CommonJS).
 * Used to distinguish dead code (no imports AND no exports) from entry points.
 */
export declare function hasExports(filePath: string): boolean;
//# sourceMappingURL=parser.d.ts.map