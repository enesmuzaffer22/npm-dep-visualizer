export interface FileNode {
    id: string;
    relativePath: string;
    imports: DependencyEdge[];
    importedBy: string[];
    size: number;
    isOrphan: boolean;
}
export interface DependencyEdge {
    source: string;
    resolved: string | null;
    isExternal: boolean;
    type: 'import' | 'require' | 'dynamic-import' | 're-export';
}
export interface ExternalPackage {
    name: string;
    importedBy: string[];
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
        totalSize: number;
        orphanCount: number;
        circularDependencies: string[][];
        hotspots: Array<{
            path: string;
            importedByCount: number;
        }>;
    };
}
export interface AnalyzerOptions {
    dir: string;
    exclude?: string[];
}
/**
 * Analyze a project directory and build the full dependency graph.
 */
export declare function analyze(options: AnalyzerOptions): AnalysisResult;
//# sourceMappingURL=analyzer.d.ts.map