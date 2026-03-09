import * as fs from 'fs';

export interface ImportInfo {
  source: string;
  type: 'import' | 'require' | 'dynamic-import' | 're-export';
}

/**
 * Parse a JavaScript/TypeScript file and extract all import/require statements.
 * Uses regex-based parsing — framework-agnostic, works with JSX/TSX/Vue/Angular/plain JS.
 */
export function parseImports(filePath: string): ImportInfo[] {
  let content: string;
  try {
    content = fs.readFileSync(filePath, 'utf-8');
  } catch {
    return [];
  }

  const imports: ImportInfo[] = [];
  const seen = new Set<string>();

  const addImport = (source: string, type: ImportInfo['type']) => {
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
  let match: RegExpExecArray | null;
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
