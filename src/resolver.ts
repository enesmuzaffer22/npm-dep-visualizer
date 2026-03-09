import * as path from 'path';
import * as fs from 'fs';

export interface PathAliasConfig {
  [alias: string]: string[];
}

/**
 * Read tsconfig.json (or jsconfig.json) and extract path aliases.
 */
export function readPathAliases(projectRoot: string): PathAliasConfig {
  const aliases: PathAliasConfig = {};

  const configPaths = [
    path.join(projectRoot, 'tsconfig.json'),
    path.join(projectRoot, 'jsconfig.json'),
  ];

  for (const configPath of configPaths) {
    if (!fs.existsSync(configPath)) continue;

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
          const resolvedTargets = (targets as string[]).map((t: string) =>
            path.resolve(baseDir, t)
          );
          aliases[aliasPattern] = resolvedTargets;
        }
      }

      break; // Use first found config
    } catch {
      // Skip invalid config
    }
  }

  return aliases;
}

const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.mts', '.vue', '.svelte'];

/**
 * Try to resolve a file path by appending extensions or looking for index files.
 */
function tryResolveFile(basePath: string): string | null {
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
export function isExternalImport(source: string): boolean {
  // Relative imports
  if (source.startsWith('.') || source.startsWith('/')) return false;
  return true;
}

/**
 * Resolve an import source to an absolute file path.
 * Returns null if external or can't be resolved.
 */
export function resolveImport(
  source: string,
  fromFile: string,
  projectRoot: string,
  aliases: PathAliasConfig
): string | null {
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
        if (result) return result;
      }
    }
  }

  // External module — return null
  return null;
}
