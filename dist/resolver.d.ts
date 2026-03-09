export interface PathAliasConfig {
    [alias: string]: string[];
}
/**
 * Read tsconfig.json (or jsconfig.json) and extract path aliases.
 */
export declare function readPathAliases(projectRoot: string): PathAliasConfig;
/**
 * Determine whether an import source is external (node_modules).
 */
export declare function isExternalImport(source: string): boolean;
/**
 * Resolve an import source to an absolute file path.
 * Returns null if external or can't be resolved.
 */
export declare function resolveImport(source: string, fromFile: string, projectRoot: string, aliases: PathAliasConfig): string | null;
//# sourceMappingURL=resolver.d.ts.map