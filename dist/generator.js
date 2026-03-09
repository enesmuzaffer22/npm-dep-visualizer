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
exports.generateHTML = generateHTML;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
/**
 * Load PNG icons from assets directory and convert to base64 data URIs.
 */
function loadIcons() {
    const assetsDir = path.resolve(__dirname, '..', 'assets');
    const icons = {};
    const iconFiles = ['folder', 'open-folder', 'package', 'search', 'mouse', 'file'];
    for (const name of iconFiles) {
        const filePath = path.join(assetsDir, `${name}.png`);
        try {
            const data = fs.readFileSync(filePath);
            icons[name] = `data:image/png;base64,${data.toString('base64')}`;
        }
        catch {
            icons[name] = '';
        }
    }
    return icons;
}
/**
 * Convert the analysis result to a JSON-serializable tree structure for the HTML visualization.
 */
function buildTreeData(result) {
    const { files, externalPackages, projectRoot } = result;
    const root = {
        name: path.basename(projectRoot),
        path: '',
        type: 'directory',
        children: [],
    };
    // Add local files to tree
    const sortedFiles = Array.from(files.values()).sort((a, b) => a.relativePath.localeCompare(b.relativePath));
    for (const fileNode of sortedFiles) {
        const parts = fileNode.relativePath.split('/');
        let current = root;
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            const isFile = i === parts.length - 1;
            if (isFile) {
                current.children.push({
                    name: part,
                    path: fileNode.relativePath,
                    type: 'file',
                    children: [],
                    imports: fileNode.imports.map(e => ({
                        source: e.source,
                        resolved: e.resolved ? path.relative(projectRoot, e.resolved).replace(/\\/g, '/') : null,
                        isExternal: e.isExternal,
                        type: e.type,
                    })),
                    importedBy: fileNode.importedBy,
                    importCount: fileNode.imports.length,
                    size: fileNode.size,
                    isOrphan: fileNode.isOrphan,
                    isDeadCode: fileNode.isDeadCode,
                });
            }
            else {
                let dir = current.children.find(c => c.name === part && c.type === 'directory');
                if (!dir) {
                    dir = { name: part, path: parts.slice(0, i + 1).join('/'), type: 'directory', children: [] };
                    current.children.push(dir);
                }
                current = dir;
            }
        }
    }
    // Add external packages node
    const externalNode = {
        name: 'External Packages',
        path: '__external__',
        type: 'directory',
        children: Array.from(externalPackages.values())
            .sort((a, b) => b.importCount - a.importCount)
            .map(pkg => ({
            name: pkg.name,
            path: `__external__/${pkg.name}`,
            type: 'external',
            children: [],
            importedBy: pkg.importedBy,
            importCount: pkg.importCount,
        })),
    };
    return { root, externalNode };
}
/**
 * Generate a self-contained HTML file with the dependency visualization.
 */
function generateHTML(result) {
    const { root, externalNode } = buildTreeData(result);
    const dataJSON = JSON.stringify({ root, externalNode, stats: result.stats });
    const icons = loadIcons();
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dependency Visualizer — ${path.basename(result.projectRoot)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

    :root {
      /* Light Theme (Default) */
      --bg-primary: #ffffff;
      --bg-secondary: #f4f4f5;
      --bg-tertiary: #e4e4e7;
      --bg-surface: #ffffff;
      --bg-hover: #e4e4e7;
      --border-color: #d4d4d8;
      --border-accent: #a1a1aa;
      --text-primary: #18181b;
      --text-secondary: #3f3f46;
      --text-muted: #71717a;
      
      --accent-blue: #000000;
      --accent-purple: #3f3f46;
      --accent-green: #18181b;
      --accent-orange: #52525b;
      --accent-red: #000000;
      --accent-cyan: #3f3f46;
      --accent-pink: #18181b;
      
      --gradient-1: linear-gradient(135deg, #000000, #3f3f46);
      --gradient-2: linear-gradient(135deg, #000000, #52525b);
      --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
      --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
      --shadow-lg: 0 10px 15px rgba(0,0,0,0.1);
      
      --radius-sm: 6px;
      --radius-md: 10px;
      --radius-lg: 16px;
    }

    /* Dark Theme */
    [data-theme='dark'] {
      --bg-primary: #09090b;
      --bg-secondary: #000000;
      --bg-tertiary: #18181b;
      --bg-surface: #09090b;
      --bg-hover: #27272a;
      --border-color: #27272a;
      --border-accent: #3f3f46;
      --text-primary: #fafafa;
      --text-secondary: #d4d4d8;
      --text-muted: #a1a1aa;
      
      --accent-blue: #ffffff;
      --accent-purple: #d4d4d8;
      --accent-green: #fafafa;
      --accent-orange: #a1a1aa;
      --accent-red: #ffffff;
      --accent-cyan: #d4d4d8;
      --accent-pink: #fafafa;
      
      --gradient-1: linear-gradient(135deg, #ffffff, #d4d4d8);
      --gradient-2: linear-gradient(135deg, #ffffff, #a1a1aa);
      --shadow-sm: 0 1px 3px rgba(0,0,0,0.3);
      --shadow-md: 0 4px 14px rgba(0,0,0,0.4);
      --shadow-lg: 0 10px 40px rgba(0,0,0,0.5);
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: var(--bg-primary);
      color: var(--text-primary);
      height: 100vh;
      overflow: hidden;
    }

    /* ─── Header ─── */
    .header {
      background: var(--bg-secondary);
      border-bottom: 1px solid var(--border-color);
      padding: 20px 24px;
      position: sticky;
      top: 0;
      z-index: 100;
      backdrop-filter: blur(20px);
    }

    .header-content {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 24px;
      flex: 1;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .header-title {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .header-title .logo {
      width: 40px;
      height: 40px;
      background: var(--bg-tertiary);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      color: var(--text-primary);
    }

    .header-title h1 {
      font-size: 20px;
      font-weight: 600;
      letter-spacing: -0.02em;
      color: var(--text-primary);
    }

    .theme-toggle-btn {
      background: var(--bg-tertiary);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      width: 36px;
      height: 36px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
      padding: 0;
    }
    .theme-toggle-btn svg {
      width: 18px;
      height: 18px;
      display: block;
    }
    .theme-toggle-btn:hover {
      background: var(--bg-hover);
      border-color: var(--border-accent);
    }

    .header-title .project-name {
      font-size: 13px;
      color: var(--text-muted);
      font-weight: 400;
      font-family: 'JetBrains Mono', monospace;
    }

    /* ─── Search ─── */
    .search-container {
      position: relative;
      flex: 1;
      max-width: 320px;
      min-width: 200px;
    }

    .search-container svg {
      position: absolute;
      left: 14px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
      width: 16px;
      height: 16px;
      pointer-events: none;
    }

    .search-input {
      width: 100%;
      padding: 10px 14px 10px 42px;
      background: var(--bg-tertiary);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      color: var(--text-primary);
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      outline: none;
      transition: all 0.2s ease;
    }

    .search-input::placeholder {
      color: var(--text-muted);
    }

    .search-input:focus {
      border-color: var(--accent-blue);
      box-shadow: 0 0 0 3px var(--bg-tertiary);
    }

    .search-results-count {
      position: absolute;
      right: 14px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 11px;
      color: var(--text-muted);
      font-family: 'JetBrains Mono', monospace;
    }

    /* ─── Filter Buttons ─── */
    .filter-group {
      display: flex;
      gap: 6px;
    }

    .filter-btn {
      padding: 8px 16px;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      background: var(--bg-tertiary);
      color: var(--text-secondary);
      font-family: 'Inter', sans-serif;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .filter-btn:hover {
      background: var(--bg-hover);
      border-color: var(--border-accent);
    }

    .filter-btn.active {
      background: var(--text-primary);
      border-color: var(--text-primary);
      color: var(--bg-primary);
    }
    
    .filter-btn.active img {
      filter: invert(1) brightness(100) !important;
    }

    .filter-btn .count {
      font-size: 11px;
      font-family: 'JetBrains Mono', monospace;
      background: rgba(255,255,255,0.06);
      padding: 1px 6px;
      border-radius: 4px;
    }

    .filter-btn.active .count {
      background: var(--bg-secondary);
      color: var(--text-primary);
    }

    /* ─── Layout ─── */
    .main-container {
      width: 100%;
      padding: 24px;
      display: grid;
      grid-template-columns: 1fr 480px;
      gap: 24px;
      height: calc(100vh - 84px);
      overflow: hidden;
    }

    @media (max-width: 1100px) {
      .main-container {
        grid-template-columns: 1fr;
      }
    }

    /* ─── Stats Cards ─── */
    .sidebar {
      display: flex;
      flex-direction: column;
      gap: 20px;
      height: 100%;
      overflow-y: auto;
      padding-right: 4px;
    }
    
    .sidebar::-webkit-scrollbar {
      width: 6px;
    }
    .sidebar::-webkit-scrollbar-track {
      background: transparent;
    }
    .sidebar::-webkit-scrollbar-thumb {
      background: var(--border-color);
      border-radius: 3px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .stat-card {
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 18px;
      transition: all 0.25s ease;
    }

    .stat-card:hover {
      border-color: var(--border-accent);
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }

    .stat-card .stat-value {
      font-size: 28px;
      font-weight: 700;
      letter-spacing: -0.02em;
      margin-bottom: 4px;
    }

    .stat-card .stat-label {
      font-size: 12px;
      color: var(--text-muted);
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .stat-card:nth-child(1) .stat-value { color: var(--accent-blue); }
    .stat-card:nth-child(2) .stat-value { color: var(--accent-green); }
    .stat-card:nth-child(3) .stat-value { color: var(--accent-purple); }
    .stat-card:nth-child(4) .stat-value { color: var(--accent-orange); }
    .stat-card:nth-child(5) .stat-value { color: var(--text-primary); }
    .stat-card:nth-child(6) .stat-value { color: var(--accent-red); }

    /* ─── Detail Panel ─── */
    .detail-panel {
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      overflow: hidden;
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
    }

    .detail-panel-header {
      padding: 16px 20px;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .detail-panel-header h3 {
      font-size: 14px;
      font-weight: 600;
    }

    .detail-panel-content {
      padding: 20px;
      overflow-y: auto;
      flex: 1;
    }

    .detail-panel-content::-webkit-scrollbar {
      width: 6px;
    }
    .detail-panel-content::-webkit-scrollbar-track {
      background: transparent;
    }
    .detail-panel-content::-webkit-scrollbar-thumb {
      background: var(--border-color);
      border-radius: 3px;
    }

    .detail-empty {
      text-align: center;
      padding: 40px 20px;
      color: var(--text-muted);
    }

    .detail-empty .icon {
      font-size: 36px;
      margin-bottom: 12px;
    }

    .detail-section {
      margin-bottom: 20px;
    }

    .detail-section:last-child {
      margin-bottom: 0;
    }

    .detail-section h4 {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-muted);
      margin-bottom: 10px;
      font-weight: 600;
    }

    .detail-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 7px 10px;
      border-radius: var(--radius-sm);
      font-size: 13px;
      font-family: 'JetBrains Mono', monospace;
      transition: background 0.15s ease;
      cursor: default;
    }

    .detail-item:hover {
      background: var(--bg-hover);
    }

    .detail-item .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .detail-item .dot.local { background: var(--accent-green); }
    .detail-item .dot.external { background: var(--accent-orange); }
    .detail-item .dot.reverse { background: var(--accent-cyan); }

    .detail-item .badge {
      font-size: 10px;
      padding: 1px 6px;
      border-radius: 4px;
      font-weight: 500;
      margin-left: auto;
      flex-shrink: 0;
    }

    .detail-item .badge.import-type {
      background: rgba(122,162,247,0.12);
      color: var(--accent-blue);
    }

    /* ─── Circular Dependencies ─── */
    .circular-panel {
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      overflow: hidden;
    }

    .circular-panel-header {
      padding: 14px 20px;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--text-primary);
      font-weight: 600;
    }

    .circular-item {
      padding: 10px 20px;
      font-size: 12px;
      font-family: 'JetBrains Mono', monospace;
      color: var(--text-secondary);
      border-bottom: 1px solid var(--border-color);
    }

    .circular-item:last-child {
      border-bottom: none;
    }

    .circular-arrow {
      color: var(--accent-red);
      margin: 0 4px;
    }

    /* ─── Tree View ─── */
    .tree-panel {
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .tree-panel-header {
      padding: 16px 20px;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .tree-panel-header h2 {
      font-size: 15px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .tree-actions {
      display: flex;
      gap: 6px;
    }

    .tree-action-btn {
      padding: 5px 12px;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      background: var(--bg-tertiary);
      color: var(--text-muted);
      font-family: 'Inter', sans-serif;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .tree-action-btn:hover {
      background: var(--bg-hover);
      color: var(--text-secondary);
    }

    .tree-body {
      padding: 12px 8px;
      overflow-y: auto;
      flex: 1;
    }

    .tree-body::-webkit-scrollbar {
      width: 6px;
    }
    .tree-body::-webkit-scrollbar-track {
      background: transparent;
    }
    .tree-body::-webkit-scrollbar-thumb {
      background: var(--border-color);
      border-radius: 3px;
    }

    /* Tree node styles */
    .tree-node {
      user-select: none;
    }

    .tree-node-row {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      padding-left: var(--indent, 8px);
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: all 0.12s ease;
      font-size: 13px;
      min-height: 32px;
    }

    .tree-node-row:hover {
      background: var(--bg-hover);
    }

    .tree-node-row.selected {
      background: var(--bg-tertiary);
    }

    .tree-node-row.highlight {
      background: var(--bg-tertiary);
    }

    .tree-node-row.hidden {
      display: none;
    }

    .tree-toggle {
      width: 18px;
      height: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      color: var(--text-muted);
      transition: transform 0.15s ease;
    }

    .tree-toggle.expanded {
      transform: rotate(90deg);
    }

    .tree-toggle.empty {
      visibility: hidden;
    }

    .tree-icon {
      flex-shrink: 0;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .tree-icon img {
      width: 18px;
      height: 18px;
      object-fit: contain;
    }

    .icon-img {
      width: 18px;
      height: 18px;
      object-fit: contain;
      vertical-align: middle;
    }

    .icon-img.inline {
      width: 14px;
      height: 14px;
      margin-right: 2px;
    }

    .detail-empty .icon img {
      width: 48px;
      height: 48px;
    }

    .tree-label {
      flex: 1;
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .tree-label.file-label { color: var(--text-primary); }
    .tree-label.dir-label { color: var(--accent-blue); font-weight: 500; }
    .tree-label.ext-label { color: var(--accent-orange); }

    .tree-badge {
      font-size: 10px;
      padding: 1px 6px;
      border-radius: 4px;
      font-family: 'JetBrains Mono', monospace;
      flex-shrink: 0;
    }

    .tree-badge.import-count {
      background: var(--bg-tertiary);
      color: var(--text-primary);
    }

    .tree-badge.usage-count {
      background: var(--bg-tertiary);
      color: var(--text-secondary);
    }
    
    .tree-badge.size {
      background: transparent;
      color: var(--text-muted);
      border: 1px solid var(--border-color);
    }
    
    .tree-badge.orphan {
      background: rgba(0,0,0,0.05);
      color: var(--text-primary);
      border: 1px solid var(--text-primary);
      font-weight: 500;
    }

    .tree-badge.dead-code {
      background: rgba(180, 0, 0, 0.07);
      color: #b91c1c;
      border: 1px solid rgba(180, 0, 0, 0.3);
      font-weight: 600;
    }
    [data-theme='dark'] .tree-badge.dead-code {
      background: rgba(255, 80, 80, 0.1);
      color: #f87171;
      border-color: rgba(255, 80, 80, 0.35);
    }

    .dead-code-panel {
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      overflow: hidden;
    }

    .dead-code-panel-header {
      padding: 14px 20px;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      font-size: 14px;
    }

    .dead-code-item {
      padding: 10px 20px;
      font-size: 12px;
      font-family: 'JetBrains Mono', monospace;
      color: var(--text-secondary);
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      transition: background 0.15s ease;
    }
    .dead-code-item:hover { background: var(--bg-hover); }
    .dead-code-item:last-child { border-bottom: none; }

    .tree-children {
      overflow: hidden;
    }

    .tree-children.collapsed {
      display: none;
    }

    .search-match .tree-label {
      background: var(--bg-tertiary);
      padding: 0 3px;
      border-radius: 3px;
      font-weight: bold;
    }

    /* ─── View Toggle ─── */
    .view-toggle {
      display: flex;
      background: var(--bg-tertiary);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      overflow: hidden;
    }

    .view-toggle-btn {
      padding: 6px 16px;
      border: none;
      background: transparent;
      color: var(--text-muted);
      font-family: 'Inter', sans-serif;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .view-toggle-btn:hover {
      color: var(--text-secondary);
      background: var(--bg-hover);
    }

    .view-toggle-btn.active {
      background: var(--text-primary);
      color: var(--bg-primary);
    }

    /* ─── Graph Panel ─── */
    .graph-panel {
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      overflow: hidden;
      display: none;
      position: relative;
    }

    .graph-panel.visible {
      display: block;
    }

    .graph-panel-header {
      padding: 16px 20px;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .graph-panel-header h2 {
      font-size: 15px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .graph-canvas-container {
      width: 100%;
      flex: 1;
      position: relative;
      cursor: grab;
      overflow: hidden;
    }

    .graph-canvas-container:active {
      cursor: grabbing;
    }

    .graph-canvas-container canvas {
      width: 100%;
      height: 100%;
    }

    .graph-legend {
      position: absolute;
      bottom: 16px;
      left: 16px;
      background: var(--bg-tertiary);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      padding: 12px 16px;
      font-size: 11px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .graph-legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--text-secondary);
    }

    .graph-legend-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .graph-controls {
      position: absolute;
      top: 16px;
      right: 16px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .graph-control-btn {
      width: 32px;
      height: 32px;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      background: var(--bg-tertiary);
      color: var(--text-secondary);
      font-size: 16px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;
    }

    .graph-control-btn:hover {
      background: var(--bg-hover);
      border-color: var(--border-accent);
    }

    .graph-settings {
      position: absolute;
      top: 16px;
      left: 16px;
      background: var(--bg-tertiary);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      padding: 12px 16px;
      font-size: 11px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      min-width: 180px;
      z-index: 5;
    }

    .graph-settings-title {
      font-weight: 600;
      font-size: 12px;
      color: var(--text-primary);
      margin-bottom: 2px;
    }

    .graph-setting-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      color: var(--text-secondary);
    }

    .graph-setting-row label {
      white-space: nowrap;
    }

    .graph-setting-row input[type=range] {
      width: 70px;
      accent-color: var(--text-primary);
    }

    .graph-setting-row input[type=checkbox] {
      accent-color: var(--text-primary);
    }

    .graph-setting-row select {
      background: var(--bg-surface);
      color: var(--text-primary);
      border: 1px solid var(--border-color);
      border-radius: 4px;
      padding: 2px 4px;
      font-size: 11px;
      cursor: pointer;
    }

    .graph-tooltip {
      position: absolute;
      background: var(--bg-surface);
      border: 1px solid var(--border-accent);
      border-radius: var(--radius-sm);
      padding: 8px 12px;
      font-size: 12px;
      font-family: 'JetBrains Mono', monospace;
      color: var(--text-primary);
      pointer-events: none;
      z-index: 10;
      max-width: 300px;
      box-shadow: var(--shadow-md);
      display: none;
    }

    /* --- Main Column --- */
    .main-column {
      display: flex;
      flex-direction: column;
      gap: 0;
      height: 100%;
      overflow: hidden;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .animate-in {
      animation: fadeIn 0.3s ease forwards;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    /* ─── Responsive ─── */
    @media (max-width: 768px) {
      .header-content { flex-direction: column; }
      .main-container { padding: 16px; }
      .stats-grid { grid-template-columns: 1fr; }
      .search-container { max-width: 100%; }
      .filter-group { flex-wrap: wrap; }
    }
  </style>
</head>
<body>
  <header class="header">
    <div class="header-content">
      <div class="header-left">
        <div class="header-title">
          <div>
            <h1><span>Dep Visualizer</span></h1>
            <div class="project-name" id="projectName"></div>
          </div>
        </div>

        <div class="search-container">
          <img src="${icons['search']}" alt="search" style="position:absolute;left:14px;top:50%;transform:translateY(-50%);width:16px;height:16px;pointer-events:none; filter: grayscale(100%);">
          <input type="text" class="search-input" id="searchInput" placeholder="Search files and packages..." />
          <span class="search-results-count" id="searchResultsCount"></span>
        </div>
      </div>

      <div class="header-right">
        <div class="filter-group">
          <button class="filter-btn active" data-filter="all" id="filterAll">
            All <span class="count" id="countAll"></span>
          </button>
          <button class="filter-btn" data-filter="local" id="filterLocal">
             Local <span class="count" id="countLocal"></span>
          </button>
           <button class="filter-btn" data-filter="external" id="filterExternal">
             External <span class="count" id="countExternal"></span>
          </button>
           <button class="filter-btn" data-filter="orphan" id="filterOrphan">
             Orphan <span class="count" id="countOrphan"></span>
          </button>
          <button class="filter-btn" data-filter="dead" id="filterDead">
               Dead <span class="count" id="countDead"></span>
          </button>
        </div>
        
        <button class="theme-toggle-btn" id="themeToggleBtn" title="Toggle Theme">
          <span id="themeIcon" style="display:flex; align-items:center; justify-content:center;">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
          </span>
        </button>
      </div>
    </div>
  </header>

  <!-- Main Content -->
  <div class="main-container">
    <!-- View Toggle -->
    <div class="main-column">
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px; flex-shrink: 0;">
        <div class="view-toggle">
          <button class="view-toggle-btn active" id="viewTreeBtn">Tree View</button>
          <button class="view-toggle-btn" id="viewGraphBtn">Graph View</button>
        </div>
      </div>

      <!-- Tree Panel -->
      <div class="tree-panel" id="treePanelContainer">
        <div class="tree-panel-header">
          <h2><img src="${icons['open-folder']}" class="icon-img" alt="tree" style="width:20px;height:20px;margin-right:6px;"> Dependency Tree</h2>
          <div class="tree-actions">
            <button class="tree-action-btn" id="expandAllBtn">Expand All</button>
            <button class="tree-action-btn" id="collapseAllBtn">Collapse All</button>
          </div>
        </div>
        <div class="tree-body" id="treeBody"></div>
      </div>

      <!-- Graph Panel -->
      <div class="graph-panel" id="graphPanelContainer" style="display: none; flex-direction: column; height: 100%;">
        <div class="graph-panel-header">
          <h2><img src="${icons['open-folder']}" class="icon-img" alt="graph" style="width:20px;height:20px;margin-right:6px;"> Dependency Graph</h2>
          <div class="tree-actions">
            <button class="tree-action-btn" id="resetGraphBtn">Reset View</button>
          </div>
        </div>
        <div class="graph-canvas-container" id="graphContainer">
          <canvas id="graphCanvas"></canvas>
          <div class="graph-tooltip" id="graphTooltip"></div>
          <div class="graph-controls">
            <button class="graph-control-btn" id="zoomInBtn" title="Zoom In">+</button>
            <button class="graph-control-btn" id="zoomOutBtn" title="Zoom Out">−</button>
            <button class="graph-control-btn" id="fitBtn" title="Fit to Screen">⊡</button>
          </div>
          <div class="graph-settings">
            <div class="graph-settings-title">Settings</div>
            <div class="graph-setting-row">
              <label>Direction</label>
              <select id="layoutDirectionSelect">
                <option value="TB" selected>Top → Bottom</option>
                <option value="LR">Left → Right</option>
              </select>
            </div>
            <div class="graph-setting-row">
              <label>Spacing</label>
              <input type="range" id="spacingSlider" min="50" max="200" value="150">
            </div>
            <div class="graph-setting-row">
              <label>Group by Folder</label>
              <input type="checkbox" id="groupByFolderToggle" checked>
            </div>
          </div>
          <div class="graph-legend">
            <div class="graph-legend-item"><div class="graph-legend-dot" style="background: var(--accent-blue);"></div> Local File</div>
            <div class="graph-legend-item"><div class="graph-legend-dot" style="background: var(--accent-orange);"></div> External Package</div>
            <div class="graph-legend-item"><div class="graph-legend-dot" style="border: 2px dashed rgba(180,0,0,0.7); background: rgba(180,0,0,0.08);"></div> Dead Code</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Sidebar -->
    <div class="sidebar">
      <!-- Stats -->
      <div class="stats-grid">
        <div class="stat-card animate-in">
          <div class="stat-value" id="statFiles">0</div>
          <div class="stat-label">Source Files</div>
        </div>
        <div class="stat-card animate-in">
          <div class="stat-value" id="statImports">0</div>
          <div class="stat-label">Total Imports</div>
        </div>
        <div class="stat-card animate-in">
          <div class="stat-value" id="statLocal">0</div>
          <div class="stat-label">Local Imports</div>
        </div>
        <div class="stat-card animate-in">
          <div class="stat-value" id="statExternal">0</div>
          <div class="stat-label">External Packages</div>
        </div>
        <div class="stat-card animate-in">
          <div class="stat-value" id="statSize">0</div>
          <div class="stat-label">Total Size</div>
        </div>
        <div class="stat-card animate-in">
          <div class="stat-value" id="statOrphans">0</div>
          <div class="stat-label">Orphan Files</div>
        </div>
      </div>

      <!-- Detail Panel -->
      <div class="detail-panel">
        <div class="detail-panel-header">
           <span><img src="${icons['folder']}" class="icon-img" alt="details"></span>
          <h3 id="detailTitle">File Details</h3>
        </div>
        <div class="detail-panel-content" id="detailContent">
           <div class="detail-empty">
             <div class="icon"><img src="${icons['mouse']}" alt="click"></div>
             <div>Click a file in the tree to view its dependencies</div>
          </div>
        </div>
      </div>

      <!-- Circular Dependencies -->
      <div class="circular-panel" id="circularPanel" style="display: none;">
        <div class="circular-panel-header">
          ⚠️ <span>Circular Dependencies</span>
        </div>
        <div id="circularContent"></div>
      </div>

      <!-- Dead Code Panel -->
      <div class="dead-code-panel" id="deadCodePanel" style="display: none;">
        <div class="dead-code-panel-header">
            <span>Dead Code Files</span>
          <span style="margin-left:auto;font-size:11px;color:var(--text-muted);font-weight:400;">Not imported · No exports</span>
        </div>
        <div id="deadCodeContent"></div>
      </div>
    </div>
  </div>

  <script>
    // ─── Data ───
    const DATA = ${dataJSON};

    // ─── Icon Data URIs ───
    const ICONS = {
      folder: '${icons['folder']}',
      openFolder: '${icons['open-folder']}',
      package: '${icons['package']}',
      search: '${icons['search']}',
      mouse: '${icons['mouse']}',
      file: '${icons['file']}',
    };

    // ─── State ───
    let currentFilter = 'all';
    let searchQuery = '';
    let selectedNode = null;
    const expandedNodes = new Set();
    let currentView = 'tree';
    let graphInitialized = false;

    // ─── Formatting ───
    function formatBytes(bytes, decimals = 1) {
      if (!bytes || bytes === 0) return '0 Bytes';
      const k = 1024;
      const dm = decimals < 0 ? 0 : decimals;
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    // ─── Init ───
    function init() {
      // Set project name
      document.getElementById('projectName').textContent = DATA.root.name;

      // Set stats
      document.getElementById('statFiles').textContent = DATA.stats.totalFiles;
      document.getElementById('statImports').textContent = DATA.stats.totalImports;
      document.getElementById('statLocal').textContent = DATA.stats.totalLocalImports;
      document.getElementById('statExternal').textContent = DATA.stats.totalExternalPackages;
      document.getElementById('statSize').textContent = formatBytes(DATA.stats.totalSize || 0);
      document.getElementById('statOrphans').textContent = DATA.stats.orphanCount || 0;

      // Set filter counts
      document.getElementById('countAll').textContent = DATA.stats.totalFiles + DATA.stats.totalExternalPackages;
      document.getElementById('countLocal').textContent = DATA.stats.totalFiles;
      document.getElementById('countExternal').textContent = DATA.stats.totalExternalPackages;
      document.getElementById('countOrphan').textContent = DATA.stats.orphanCount || 0;
      const deadEl = document.getElementById('countDead');
      if (deadEl) deadEl.textContent = DATA.stats.deadCodeCount || 0;

      // Show circular dependencies
      if (DATA.stats.circularDependencies && DATA.stats.circularDependencies.length > 0) {
        const panel = document.getElementById('circularPanel');
        panel.style.display = 'block';
        const content = document.getElementById('circularContent');
        content.innerHTML = DATA.stats.circularDependencies.map(cycle => {
          const parts = cycle.map(p => {
            const segments = p.replace(/\\\\/g, '/').split('/');
            return segments[segments.length - 1];
          });
          return '<div class="circular-item">' +
            parts.join('<span class="circular-arrow"> → </span>') +
            '</div>';
        }).join('');
      }

      // Show dead code panel
      const deadFiles = [];
      function collectDeadCode(node) {
        if (node.isDeadCode) deadFiles.push(node);
        if (node.children) node.children.forEach(collectDeadCode);
      }
      collectDeadCode(DATA.root);
      if (deadFiles.length > 0) {
        document.getElementById('deadCodePanel').style.display = 'block';
        const deadCodeContent = document.getElementById('deadCodeContent');
        deadCodeContent.innerHTML = deadFiles.map(n => {
          return '<div class="dead-code-item" data-path="' + escapeHtml(n.path) + '">' +
            '<span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="' + escapeHtml(n.path) + '">' + escapeHtml(n.name) + '</span>' +
            '<span style="font-size:10px;color:var(--text-muted);flex-shrink:0;">' + (n.size ? formatBytes(n.size, 0) : '') + '</span>' +
            '</div>';
        }).join('');
        deadCodeContent.querySelectorAll('.dead-code-item').forEach(el => {
          el.addEventListener('click', () => selectDeadCodeFile(el.dataset.path));
        });
      }

      // Expand root by default
      expandedNodes.add('');
      expandedNodes.add('__external__');

      // Build tree
      renderTree();

      // Event listeners
      document.getElementById('searchInput').addEventListener('input', onSearch);
      document.getElementById('filterAll').addEventListener('click', () => setFilter('all'));
      document.getElementById('filterLocal').addEventListener('click', () => setFilter('local'));
      document.getElementById('filterExternal').addEventListener('click', () => setFilter('external'));
      document.getElementById('filterOrphan').addEventListener('click', () => setFilter('orphan'));
      document.getElementById('filterDead').addEventListener('click', () => setFilter('dead'));
      document.getElementById('expandAllBtn').addEventListener('click', expandAll);
      document.getElementById('collapseAllBtn').addEventListener('click', collapseAll);

      // Theme Toggle logic
      const themeBtn = document.getElementById('themeToggleBtn');
      const themeIcon = document.getElementById('themeIcon');
      const moonIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>';
      const sunIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>';

      function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        themeIcon.innerHTML = newTheme === 'dark' ? sunIcon : moonIcon;
        
        // Retrigger graph render to update colors
        if (graphInitialized && currentView === 'graph') {
           drawGraph();
        }
      }
      themeBtn.addEventListener('click', toggleTheme);

      // View Toggles
      document.getElementById('viewTreeBtn').addEventListener('click', () => setView('tree'));
      document.getElementById('viewGraphBtn').addEventListener('click', () => setView('graph'));
    }

    function setView(view) {
      if (currentView === view) return;
      currentView = view;
      document.getElementById('viewTreeBtn').classList.toggle('active', view === 'tree');
      document.getElementById('viewGraphBtn').classList.toggle('active', view === 'graph');
      
      const treePanel = document.getElementById('treePanelContainer');
      const graphPanel = document.getElementById('graphPanelContainer');
      
      if (view === 'tree') {
        treePanel.style.display = 'flex';
        graphPanel.style.display = 'none';
      } else {
        treePanel.style.display = 'none';
        graphPanel.style.display = 'flex';
        if (!graphInitialized) {
          initGraph();
          graphInitialized = true;
        }
      }
    }

    // ─── Tree Rendering ───
    function renderTree() {
      const container = document.getElementById('treeBody');
      container.innerHTML = '';

      if (currentFilter !== 'external') {
        container.appendChild(renderNode(DATA.root, 0));
      }
      if (currentFilter !== 'local') {
        container.appendChild(renderNode(DATA.externalNode, 0));
      }
    }

    function renderNode(node, depth) {
      const div = document.createElement('div');
      div.className = 'tree-node';
      div.dataset.path = node.path;

      const isExpanded = expandedNodes.has(node.path);
      const hasChildren = node.children && node.children.length > 0;
      const matchesSearch = matchesQuery(node);

      // Check if any child matches search
      const anyChildMatches = hasChildren && hasChildMatch(node);

      // Filtering logic BEFORE early return
      if (currentFilter === 'local' && node.type === 'external') return div;
      if (currentFilter === 'local' && node.path === '__external__') return div;
      if (currentFilter === 'external' && node.type !== 'external' && node.path !== '__external__') return div;
      
      if (currentFilter === 'orphan') {
         if (node.path === '__external__' || node.type === 'external') return div;
         if (!hasOrphanMatch(node)) return div;
      }

      if (currentFilter === 'dead') {
         if (node.path === '__external__' || node.type === 'external') return div;
         if (!hasDeadCodeMatch(node)) return div;
      }

      // If search active and nothing matches, hide
      if (searchQuery && !matchesSearch && !anyChildMatches) {
        div.style.display = 'none';
        return div;
      }

      // Row
      const row = document.createElement('div');
      row.className = 'tree-node-row';
      if (selectedNode === node.path) row.classList.add('selected');
      if (searchQuery && matchesSearch) row.classList.add('search-match');
      row.style.setProperty('--indent', (depth * 20 + 8) + 'px');

      // Toggle arrow
      const toggle = document.createElement('span');
      toggle.className = 'tree-toggle';
      if (hasChildren) {
        toggle.innerHTML = '▶';
        if (isExpanded) toggle.classList.add('expanded');
      } else {
        toggle.classList.add('empty');
      }
      row.appendChild(toggle);

      // Icon
      const icon = document.createElement('span');
      icon.className = 'tree-icon';
      icon.innerHTML = getNodeIcon(node);
      row.appendChild(icon);

      // Label
      const label = document.createElement('span');
      label.className = 'tree-label';
      if (node.type === 'directory') label.classList.add('dir-label');
      else if (node.type === 'external') label.classList.add('ext-label');
      else label.classList.add('file-label');
      label.textContent = node.name;
      label.title = node.path;
      row.appendChild(label);

      // Badges
      if (node.importCount !== undefined && node.importCount > 0) {
        const badge = document.createElement('span');
        badge.className = 'tree-badge import-count';
        badge.textContent = node.importCount + ' imports';
        badge.title = node.importCount + ' imports';
        row.appendChild(badge);
      }
      if (node.importedBy && node.importedBy.length > 0) {
        const badge = document.createElement('span');
        badge.className = 'tree-badge usage-count';
        badge.textContent = node.importedBy.length + ' used';
        badge.title = 'Used by ' + node.importedBy.length + ' files';
        row.appendChild(badge);
      }
      if (node.isOrphan) {
        const badge = document.createElement('span');
        badge.className = 'tree-badge orphan';
        badge.textContent = 'Orphan';
        badge.title = 'Not imported by any file';
        row.appendChild(badge);
      }
      if (node.isDeadCode) {
        const badge = document.createElement('span');
        badge.className = 'tree-badge dead-code';
        badge.textContent = '  Dead';
        badge.title = 'Dead code — not imported and has no exports';
        row.appendChild(badge);
      }
      if (node.size !== undefined) {
        const badge = document.createElement('span');
        badge.className = 'tree-badge size';
        badge.textContent = formatBytes(node.size, 0);
        row.appendChild(badge);
      }

      // Click handlers
      row.addEventListener('click', (e) => {
        if (hasChildren) {
          if (isExpanded) {
            expandedNodes.delete(node.path);
          } else {
            expandedNodes.add(node.path);
          }
        }
        if (node.type === 'file' || node.type === 'external') {
          selectedNode = node.path;
          showDetail(node);
        }
        renderTree();
      });

      div.appendChild(row);

      // Children
      if (hasChildren) {
        const childContainer = document.createElement('div');
        childContainer.className = 'tree-children' + (isExpanded ? '' : ' collapsed');

        // If searching, auto-expand matching branches
        if (searchQuery && anyChildMatches) {
          childContainer.classList.remove('collapsed');
          expandedNodes.add(node.path);
        }

        for (const child of node.children) {
          childContainer.appendChild(renderNode(child, depth + 1));
        }
        div.appendChild(childContainer);
      }

      return div;
    }

    function getNodeIcon(node) {
      if (node.type === 'external') return '<img src="' + ICONS.package + '" class="icon-img" alt="pkg">';
      if (node.type === 'directory') {
        if (node.path === '__external__') return '<img src="' + ICONS.package + '" class="icon-img" alt="pkg">';
        return expandedNodes.has(node.path)
          ? '<img src="' + ICONS.openFolder + '" class="icon-img" alt="dir">'
          : '<img src="' + ICONS.folder + '" class="icon-img" alt="dir">';
      }
      // For files, use file icon
      return '<img src="' + ICONS.file + '" class="icon-img" alt="file">';
    }

    function matchesQuery(node) {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return node.name.toLowerCase().includes(q) ||
             (node.path && node.path.toLowerCase().includes(q));
    }

    function hasChildMatch(node) {
      if (!node.children) return false;
      for (const child of node.children) {
        if (matchesQuery(child) || hasChildMatch(child)) return true;
      }
      return false;
    }

    function hasOrphanMatch(node) {
      if (node.isOrphan) return true;
      if (!node.children) return false;
      for (const child of node.children) {
        if (hasOrphanMatch(child)) return true;
      }
      return false;
    }

    function hasDeadCodeMatch(node) {
      if (node.isDeadCode) return true;
      if (!node.children) return false;
      for (const child of node.children) {
        if (hasDeadCodeMatch(child)) return true;
      }
      return false;
    }

    // ─── Detail Panel ───
    function showDetail(node) {
      const title = document.getElementById('detailTitle');
      const content = document.getElementById('detailContent');

      title.textContent = node.name;

      let html = '';

      if (node.isDeadCode) {
        html += '<div style="margin-bottom:12px;"><span class="tree-badge dead-code" style="font-size:12px;padding:4px 10px;">  Dead Code — not imported &amp; no exports</span></div>';
      } else if (node.isOrphan) {
        html += '<div style="margin-bottom: 12px;"><span class="tree-badge orphan" style="font-size:12px; padding: 4px 8px;">🗑 Orphan (Unused)</span></div>';
      }
      if (node.size !== undefined) {
         html += '<div style="margin-bottom: 12px; color: var(--text-muted); font-size: 13px;">File Size: <strong>' + formatBytes(node.size) + '</strong></div>';
      }

      if (node.type === 'file' && node.imports) {
        const localImports = node.imports.filter(i => !i.isExternal);
        const externalImports = node.imports.filter(i => i.isExternal);

        if (localImports.length > 0) {
          html += '<div class="detail-section"><h4><img src="' + ICONS.folder + '" class="icon-img inline" alt="local"> Local Imports (' + localImports.length + ')</h4>';
          for (const imp of localImports) {
            html += '<div class="detail-item">' +
              '<span class="dot local"></span>' +
              '<span>' + escapeHtml(imp.resolved || imp.source) + '</span>' +
              '<span class="badge import-type">' + imp.type + '</span>' +
              '</div>';
          }
          html += '</div>';
        }

        if (externalImports.length > 0) {
          html += '<div class="detail-section"><h4><img src="' + ICONS.package + '" class="icon-img inline" alt="pkg"> External Imports (' + externalImports.length + ')</h4>';
          for (const imp of externalImports) {
            html += '<div class="detail-item">' +
              '<span class="dot external"></span>' +
              '<span>' + escapeHtml(imp.source) + '</span>' +
              '<span class="badge import-type">' + imp.type + '</span>' +
              '</div>';
          }
          html += '</div>';
        }

        if (node.imports.length === 0) {
          html += '<div class="detail-empty"><div class="icon"><img src="' + ICONS.search + '" class="icon-img" style="width:36px;height:36px;" alt="empty"></div><div>No imports — standalone file</div></div>';
        }
      }

      if (node.importedBy && node.importedBy.length > 0) {
        html += '<div class="detail-section"><h4>↩ Imported By (' + node.importedBy.length + ')</h4>';
        for (const by of node.importedBy) {
          html += '<div class="detail-item">' +
            '<span class="dot reverse"></span>' +
            '<span>' + escapeHtml(by) + '</span>' +
            '</div>';
        }
        html += '</div>';
      } else if (node.type === 'file') {
        html += '<div class="detail-section"><h4>↩ Imported By</h4>' +
          '<div class="detail-item" style="color: var(--text-muted);">Not imported by any file</div></div>';
      }

      if (node.type === 'external' && node.importedBy) {
        html += '<div class="detail-section"><h4><img src="' + ICONS.folder + '" class="icon-img inline" alt="files"> Used By Files (' + node.importedBy.length + ')</h4>';
        for (const by of node.importedBy) {
          html += '<div class="detail-item">' +
            '<span class="dot reverse"></span>' +
            '<span>' + escapeHtml(by) + '</span>' +
            '</div>';
        }
        html += '</div>';
      }

      content.innerHTML = html || '<div class="detail-empty"><div class="icon"><img src="' + ICONS.folder + '" class="icon-img" style="width:36px;height:36px;" alt="empty"></div><div>No details available</div></div>';
    }

    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    // ─── Search ───
    function onSearch(e) {
      searchQuery = e.target.value.trim();
      const countEl = document.getElementById('searchResultsCount');

      if (searchQuery) {
        const count = countMatches(DATA.root) + countMatches(DATA.externalNode);
        countEl.textContent = count + ' found';
      } else {
        countEl.textContent = '';
      }

      renderTree();
      if (currentView === 'graph') drawGraph();
    }

    function countMatches(node) {
      let count = matchesQuery(node) && (node.type === 'file' || node.type === 'external') ? 1 : 0;
      if (node.children) {
        for (const child of node.children) {
          count += countMatches(child);
        }
      }
      return count;
    }

    // ─── Filters ───
    function setFilter(filter) {
      currentFilter = filter;
      document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
      document.getElementById('filter' + filter.charAt(0).toUpperCase() + filter.slice(1)).classList.add('active');
      renderTree();
      if (currentView === 'graph') drawGraph();
    }

    // ─── Expand/Collapse ───
    function expandAll() {
      addAllPaths(DATA.root);
      addAllPaths(DATA.externalNode);
      renderTree();
    }

    function collapseAll() {
      expandedNodes.clear();
      renderTree();
    }

    function addAllPaths(node) {
      if (node.children && node.children.length > 0) {
        expandedNodes.add(node.path);
        for (const child of node.children) {
          addAllPaths(child);
        }
      }
    }

    // ─── Graph Engine (Flowchart / Hierarchical Layout) ───
    let graph = { nodes: [], edges: [], clusters: {}, layers: [] };
    let canvas, ctx;
    let transform = { x: 0, y: 0, k: 1 };
    let isDragging = false;
    let dragStart = { x: 0, y: 0 };
    let hoveredNode = null;

    // Flowchart node dimensions
    const NODE_W = 140;
    const NODE_H = 34;
    const NODE_R = 8;

    // Settings
    let graphSettings = {
      direction: 'TB',
      spacingMult: 1.5,
      groupByFolder: true
    };

    // Colors per cluster
    const CLUSTER_COLORS = [
      { bg: 'rgba(59,130,246,0.07)', border: 'rgba(59,130,246,0.3)' },
      { bg: 'rgba(168,85,247,0.07)', border: 'rgba(168,85,247,0.3)' },
      { bg: 'rgba(34,197,94,0.07)', border: 'rgba(34,197,94,0.3)' },
      { bg: 'rgba(249,115,22,0.07)', border: 'rgba(249,115,22,0.3)' },
      { bg: 'rgba(236,72,153,0.07)', border: 'rgba(236,72,153,0.3)' },
      { bg: 'rgba(20,184,166,0.07)', border: 'rgba(20,184,166,0.3)' },
      { bg: 'rgba(245,158,11,0.07)', border: 'rgba(245,158,11,0.3)' },
      { bg: 'rgba(99,102,241,0.07)', border: 'rgba(99,102,241,0.3)' },
    ];

    function initGraph() {
      canvas = document.getElementById('graphCanvas');
      ctx = canvas.getContext('2d');
      
      const resizeCanvas = () => {
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        if (graph.nodes.length > 0) drawGraph();
      };
      window.addEventListener('resize', resizeCanvas);
      resizeCanvas();
      
      canvas.addEventListener('mousedown', onGraphMouseDown);
      window.addEventListener('mousemove', onGraphMouseMove);
      window.addEventListener('mouseup', onGraphMouseUp);
      canvas.addEventListener('wheel', onGraphWheel, { passive: false });
      
      document.getElementById('resetGraphBtn').addEventListener('click', () => { rebuildLayout(); fitGraph(); });
      document.getElementById('zoomInBtn').addEventListener('click', () => { zoom(1.3); });
      document.getElementById('zoomOutBtn').addEventListener('click', () => { zoom(0.7); });
      document.getElementById('fitBtn').addEventListener('click', fitGraph);
      
      // Settings controls
      document.getElementById('layoutDirectionSelect').addEventListener('change', (ev) => {
        graphSettings.direction = ev.target.value;
        rebuildLayout();
        fitGraph();
      });
      document.getElementById('spacingSlider').addEventListener('input', (ev) => {
        graphSettings.spacingMult = ev.target.value / 100;
        rebuildLayout();
        fitGraph();
      });
      document.getElementById('groupByFolderToggle').addEventListener('change', (ev) => {
        graphSettings.groupByFolder = ev.target.checked;
        rebuildLayout();
        fitGraph();
      });
      
      buildGraphData();
      computeLayout();
      fitGraph();
    }

    function rebuildLayout() {
      computeLayout();
      drawGraph();
    }

    function buildGraphData() {
      const nodesMap = new Map();
      graph.nodes = [];
      graph.edges = [];
      graph.clusters = {};
      
      function addNode(n) {
        if (n.type === 'directory') {
          for (const child of n.children) addNode(child);
          return;
        }
        
        const isEx = n.type === 'external';
        const id = n.path;
        const cluster = isEx ? '__external__' : (id.substring(0, id.lastIndexOf('/')) || '/');
        
        const nodeObj = {
          id,
          label: n.name,
          type: n.type,
          isExternal: isEx,
          cluster,
          imports: n.imports || [],
          x: 0, y: 0,
          w: NODE_W, h: NODE_H,
          layer: 0, order: 0,
          color: '',
          nodeRef: n
        };
        nodesMap.set(id, nodeObj);
        graph.nodes.push(nodeObj);
        
        if (!graph.clusters[cluster]) graph.clusters[cluster] = [];
        graph.clusters[cluster].push(nodeObj);
      }
      
      addNode(DATA.root);
      addNode(DATA.externalNode);
      
      for (const node of graph.nodes) {
        for (const imp of node.imports) {
          const targetId = imp.resolved ? imp.resolved : ('__external__/' + imp.source);
          let targetNode = nodesMap.get(targetId);
          if (!targetNode && imp.isExternal) {
             for (const n of graph.nodes) { 
                if (n.isExternal && n.label === imp.source) { targetNode = n; break; } 
             }
          }
          if (targetNode) {
            graph.edges.push({ source: node, target: targetNode });
          }
        }
      }
    }

    // ── Hierarchical layout (Sugiyama-style) ──
    function computeLayout() {
      const isLR = graphSettings.direction === 'LR';
      const spaceMult = graphSettings.spacingMult;
      const LAYER_GAP = (isLR ? 220 : 100) * spaceMult;
      const NODE_GAP = (isLR ? 46 : 50) * spaceMult;

      // 1) Assign layers via longest-path from roots
      const inDegree = new Map();
      const outAdj = new Map();
      for (const n of graph.nodes) { inDegree.set(n, 0); outAdj.set(n, []); }
      for (const e of graph.edges) {
        inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
        outAdj.get(e.source).push(e.target);
      }

      const roots = graph.nodes.filter(n => inDegree.get(n) === 0);
      const layerOf = new Map();
      const visited = new Set();
      const queue = [];
      for (const r of roots) { layerOf.set(r, 0); queue.push(r); visited.add(r); }
      for (const n of graph.nodes) {
        if (!visited.has(n)) { layerOf.set(n, 0); queue.push(n); visited.add(n); }
      }

      let head = 0;
      while (head < queue.length) {
        const cur = queue[head++];
        const curLayer = layerOf.get(cur);
        for (const child of outAdj.get(cur)) {
          const newLayer = curLayer + 1;
          if (!layerOf.has(child) || layerOf.get(child) < newLayer) {
            layerOf.set(child, newLayer);
          }
          if (!visited.has(child)) {
            visited.add(child);
            queue.push(child);
          }
        }
      }

      let maxLayer = 0;
      for (const n of graph.nodes) {
        n.layer = layerOf.get(n) || 0;
        if (n.layer > maxLayer) maxLayer = n.layer;
      }

      // 2) Group into layers
      const layers = [];
      for (let i = 0; i <= maxLayer; i++) layers.push([]);
      for (const n of graph.nodes) layers[n.layer].push(n);

      for (const layer of layers) {
        layer.sort((a, b) => {
          if (graphSettings.groupByFolder) {
            const ca = a.cluster.localeCompare(b.cluster);
            if (ca !== 0) return ca;
          }
          return a.label.localeCompare(b.label);
        });
      }

      // 3) Reduce crossings: barycenter heuristic
      for (let pass = 0; pass < 4; pass++) {
        for (let li = 1; li < layers.length; li++) {
          for (const n of layers[li]) {
            const parents = graph.edges
              .filter(e => e.target === n && e.source.layer === li - 1)
              .map(e => layers[li-1].indexOf(e.source))
              .filter(idx => idx >= 0);
            n._bary = parents.length > 0
              ? parents.reduce((a,b) => a+b, 0) / parents.length
              : layers[li].indexOf(n);
          }
          layers[li].sort((a, b) => a._bary - b._bary);
        }
        for (let li = layers.length - 2; li >= 0; li--) {
          for (const n of layers[li]) {
            const children = graph.edges
              .filter(e => e.source === n && e.target.layer === li + 1)
              .map(e => layers[li+1].indexOf(e.target))
              .filter(idx => idx >= 0);
            n._bary = children.length > 0
              ? children.reduce((a,b) => a+b, 0) / children.length
              : layers[li].indexOf(n);
          }
          layers[li].sort((a, b) => a._bary - b._bary);
        }
      }

      // 4) Assign coordinates
      for (let li = 0; li < layers.length; li++) {
        const layer = layers[li];
        const totalWidth = layer.length * (NODE_W + NODE_GAP) - NODE_GAP;
        const startOffset = -totalWidth / 2;
        for (let ni = 0; ni < layer.length; ni++) {
          const n = layer[ni];
          n.order = ni;
          if (isLR) {
            n.x = li * (NODE_W + LAYER_GAP);
            n.y = startOffset + ni * (NODE_H + NODE_GAP);
          } else {
            n.x = startOffset + ni * (NODE_W + NODE_GAP);
            n.y = li * (NODE_H + LAYER_GAP);
          }
        }
      }

      graph.layers = layers;
    }

    function isNodeVisible(n) {
      if (currentFilter === 'local' && n.isExternal) return false;
      if (currentFilter === 'external' && !n.isExternal) return false;
      if (currentFilter === 'orphan') {
         return n.nodeRef && n.nodeRef.isOrphan;
      }
      if (currentFilter === 'dead') {
         return n.nodeRef && n.nodeRef.isDeadCode;
      }
      if (searchQuery && !n.label.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    }

    function isConnected(a, b) {
      for (const e of graph.edges) {
        if ((e.source === a && e.target === b) || (e.source === b && e.target === a)) return true;
      }
      return false;
    }

    function hitTest(px, py, n) {
      return px >= n.x && px <= n.x + n.w && py >= n.y && py <= n.y + n.h;
    }

    function nodeAtPoint(px, py) {
      for (let i = graph.nodes.length - 1; i >= 0; i--) {
        const n = graph.nodes[i];
        if (!isNodeVisible(n)) continue;
        if (hitTest(px, py, n)) return n;
      }
      return null;
    }

    function drawRoundedRect(x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    }

    function drawGraph() {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const lineColor = getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim();
      const highlightColor = getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim();
      const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim();
      const mutedColor = getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim() || '#71717a';
      const isLR = graphSettings.direction === 'LR';

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(canvas.width/2 + transform.x, canvas.height/2 + transform.y);
      ctx.scale(transform.k, transform.k);

      // ── Cluster group backgrounds ──
      if (graphSettings.groupByFolder) {
        const clusterKeys = Object.keys(graph.clusters).filter(k => k !== '__external__');
        let ci = 0;
        for (const key of clusterKeys) {
          const members = graph.clusters[key].filter(n => isNodeVisible(n));
          if (members.length === 0) { ci++; continue; }
          let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
          for (const m of members) {
            if (m.x < minX) minX = m.x;
            if (m.y < minY) minY = m.y;
            if (m.x + m.w > maxX) maxX = m.x + m.w;
            if (m.y + m.h > maxY) maxY = m.y + m.h;
          }
          const pad = 18 / transform.k;
          const col = CLUSTER_COLORS[ci % CLUSTER_COLORS.length];
          ctx.save();
          ctx.globalAlpha = hoveredNode ? 0.25 : 0.55;
          drawRoundedRect(minX - pad, minY - pad - 16/transform.k, maxX - minX + pad*2, maxY - minY + pad*2 + 16/transform.k, 10/transform.k);
          ctx.fillStyle = col.bg;
          ctx.fill();
          ctx.setLineDash([6/transform.k, 4/transform.k]);
          ctx.strokeStyle = col.border;
          ctx.lineWidth = 1.2 / transform.k;
          ctx.stroke();
          ctx.setLineDash([]);
          // cluster label
          if (transform.k > 0.25) {
            ctx.globalAlpha = 0.65;
            ctx.fillStyle = col.border;
            ctx.font = 'bold ' + (10/transform.k) + 'px "Inter"';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'bottom';
            const lbl = key === '/' ? '(root)' : key.split('/').pop();
            ctx.fillText(lbl, minX - pad + 6/transform.k, minY - pad);
          }
          ctx.restore();
          ci++;
        }
      }

      // ── Draw edges (bezier connectors) ──
      for (const e of graph.edges) {
        const srcVis = isNodeVisible(e.source);
        const tgtVis = isNodeVisible(e.target);
        if (!srcVis && !tgtVis) continue;

        let isHL = false;
        if (hoveredNode && (e.source === hoveredNode || e.target === hoveredNode)) isHL = true;

        if (hoveredNode && !isHL) {
          ctx.globalAlpha = 0.04;
          ctx.strokeStyle = isDark ? 'rgba(255,255,255,1)' : 'rgba(0,0,0,1)';
        } else if (!srcVis || !tgtVis) {
          ctx.globalAlpha = 0.12;
          ctx.strokeStyle = lineColor;
        } else if (isHL) {
          ctx.globalAlpha = 1;
          ctx.strokeStyle = highlightColor;
        } else {
          ctx.globalAlpha = 0.35;
          ctx.strokeStyle = lineColor;
        }

        ctx.lineWidth = isHL ? 2 / transform.k : 0.8 / transform.k;

        // connector points: center of right/bottom edge → center of left/top edge
        let sx, sy, tx, ty;
        if (isLR) {
          sx = e.source.x + e.source.w; sy = e.source.y + e.source.h / 2;
          tx = e.target.x;              ty = e.target.y + e.target.h / 2;
        } else {
          sx = e.source.x + e.source.w / 2; sy = e.source.y + e.source.h;
          tx = e.target.x + e.target.w / 2; ty = e.target.y;
        }

        const midMain = isLR ? (sx + tx) / 2 : (sy + ty) / 2;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        if (isLR) {
          ctx.bezierCurveTo(midMain, sy, midMain, ty, tx, ty);
        } else {
          ctx.bezierCurveTo(sx, midMain, tx, midMain, tx, ty);
        }
        ctx.stroke();

        // arrowhead
        if (isHL || ctx.globalAlpha > 0.1) {
          const aLen = 7 / transform.k;
          const angle = Math.atan2(ty - sy, tx - sx);
          ctx.beginPath();
          ctx.moveTo(tx, ty);
          ctx.lineTo(tx - aLen * Math.cos(angle - Math.PI/7), ty - aLen * Math.sin(angle - Math.PI/7));
          ctx.lineTo(tx - aLen * Math.cos(angle + Math.PI/7), ty - aLen * Math.sin(angle + Math.PI/7));
          ctx.closePath();
          ctx.fillStyle = ctx.strokeStyle;
          ctx.fill();
        }
      }

      ctx.globalAlpha = 1;

      // ── Draw nodes (rounded rectangles) ──
      for (const n of graph.nodes) {
        const visible = isNodeVisible(n);
        let opacity = visible ? 1 : 0.05;
        if (visible && hoveredNode && hoveredNode !== n && !isConnected(n, hoveredNode)) opacity = 0.15;

        const isDeadCode = !n.isExternal && n.nodeRef && n.nodeRef.isDeadCode;

        ctx.save();
        ctx.globalAlpha = opacity;

        // Node background
        const fillCol = isDeadCode
          ? (isDark ? 'rgba(100,30,30,0.9)' : 'rgba(220,80,80,0.7)')
          : n.isExternal
            ? (isDark ? '#27272a' : '#f4f4f5')
            : (isDark ? '#18181b' : '#ffffff');

        drawRoundedRect(n.x, n.y, n.w, n.h, NODE_R);
        ctx.fillStyle = fillCol;
        ctx.fill();

        // Dead code dashed border
        if (isDeadCode && visible) {
          ctx.setLineDash([4/transform.k, 3/transform.k]);
          ctx.strokeStyle = isDark ? 'rgba(248,113,113,0.9)' : 'rgba(185,28,28,0.8)';
          ctx.lineWidth = 2 / transform.k;
          ctx.stroke();
          ctx.setLineDash([]);
        } else {
          ctx.strokeStyle = (hoveredNode === n)
            ? highlightColor
            : (isDark ? '#3f3f46' : '#d4d4d8');
          ctx.lineWidth = (hoveredNode === n ? 2 : 1) / transform.k;
          ctx.stroke();
        }

        // Label inside node
        if (transform.k > 0.15) {
          const fontSize = Math.max(6, Math.min(11, 11 / transform.k));
          ctx.fillStyle = isDeadCode ? (isDark ? '#f87171' : '#b91c1c')
            : n.isExternal ? mutedColor : textColor;
          ctx.font = fontSize + 'px "JetBrains Mono"';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const maxChars = Math.floor(n.w / (fontSize * 0.62));
          let lbl = n.label;
          if (lbl.length > maxChars) lbl = lbl.slice(0, maxChars - 1) + '\u2026';
          ctx.fillText(lbl, n.x + n.w / 2, n.y + n.h / 2);
        }

        ctx.restore();
      }

      ctx.restore();
    }

    function getPointerPos(e) {
      const rect = canvas.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left - canvas.width/2 - transform.x) / transform.k,
        y: (e.clientY - rect.top - canvas.height/2 - transform.y) / transform.k
      };
    }

    function onGraphMouseDown(e) {
      if (currentView !== 'graph') return;
      const p = getPointerPos(e);
      const found = nodeAtPoint(p.x, p.y);

      if (found) {
        selectedNode = found.id;
        showDetail(found.nodeRef);
      } else {
        isDragging = true;
        dragStart = { x: e.clientX, y: e.clientY };
      }
    }

    function onGraphMouseMove(e) {
      if (currentView !== 'graph') return;
      const p = getPointerPos(e);

      if (isDragging) {
        transform.x += (e.clientX - dragStart.x);
        transform.y += (e.clientY - dragStart.y);
        dragStart = { x: e.clientX, y: e.clientY };
        drawGraph();
      } else {
        const found = nodeAtPoint(p.x, p.y);
        if (found !== hoveredNode) {
          hoveredNode = found;
          updateTooltip(e, found);
          drawGraph();
          canvas.style.cursor = found ? 'pointer' : 'grab';
        } else if (found) {
          updateTooltip(e, found);
        }
      }
    }

    function onGraphMouseUp(e) {
      isDragging = false;
    }

    function onGraphWheel(e) {
      if (currentView !== 'graph') return;
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      zoom(zoomFactor, e.clientX, e.clientY);
    }

    function zoom(factor, cx, cy) {
      if (cx === undefined) {
         const rect = canvas.getBoundingClientRect();
         cx = rect.left + rect.width/2;
         cy = rect.top + rect.height/2;
      }
      
      const rect = canvas.getBoundingClientRect();
      const px = cx - rect.left - canvas.width/2 - transform.x;
      const py = cy - rect.top - canvas.height/2 - transform.y;
      
      const newK = Math.max(0.05, Math.min(transform.k * factor, 8));
      const scaleChange = newK - transform.k;
      
      transform.x -= px * (scaleChange / transform.k);
      transform.y -= py * (scaleChange / transform.k);
      transform.k = newK;
      
      drawGraph();
    }

    function fitGraph() {
      if (graph.nodes.length === 0) return;
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      const useAll = (arr) => {
        for (const n of arr) {
          if (n.x < minX) minX = n.x;
          if (n.x + n.w > maxX) maxX = n.x + n.w;
          if (n.y < minY) minY = n.y;
          if (n.y + n.h > maxY) maxY = n.y + n.h;
        }
      };
      const vis = graph.nodes.filter(n => isNodeVisible(n));
      useAll(vis.length > 0 ? vis : graph.nodes);

      const width = Math.max(maxX - minX, 100);
      const height = Math.max(maxY - minY, 100);
      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;

      transform.x = -cx;
      transform.y = -cy;

      const pad = 120;
      const scaleX = canvas.width / (width + pad);
      const scaleY = canvas.height / (height + pad);
      transform.k = Math.max(0.05, Math.min(scaleX, scaleY, 2));

      drawGraph();
    }

    function updateTooltip(e, node) {
      const tooltip = document.getElementById('graphTooltip');
      if (!node) {
        tooltip.style.display = 'none';
        return;
      }

      const isDeadCode = !node.isExternal && node.nodeRef && node.nodeRef.isDeadCode;
      const importedByCount = node.nodeRef && node.nodeRef.importedBy ? node.nodeRef.importedBy.length : 0;

      tooltip.innerHTML = '<strong>' + (isDeadCode ? '  ' : '') + escapeHtml(node.label) + '</strong><br>' +
        '<span style="color:var(--text-muted)">' + (node.isExternal ? 'External Package' : 'Local File') + '</span><br>' +
        'Imports: ' + node.imports.length +
        (importedByCount > 0 ? '<br>Imported by: ' + importedByCount + ' files' : '') +
        (isDeadCode ? '<br><span style="color:#ef4444;font-weight:600;">  Dead Code</span>' : '');

      tooltip.style.display = 'block';
      tooltip.style.left = (e.clientX - canvas.getBoundingClientRect().left + 15) + 'px';
      tooltip.style.top = (e.clientY - canvas.getBoundingClientRect().top + 15) + 'px';
    }

    function selectDeadCodeFile(filePath) {
      const parts = filePath.split('/');
      for (let i = 1; i < parts.length; i++) {
        expandedNodes.add(parts.slice(0, i).join('/'));
      }
      expandedNodes.add('');
      function findNode(node, p) {
        if (node.path === p) return node;
        if (node.children) {
          for (const c of node.children) { const r = findNode(c, p); if (r) return r; }
        }
        return null;
      }
      const found = findNode(DATA.root, filePath);
      if (found) {
        selectedNode = found.path;
        showDetail(found);
        if (currentView !== 'tree') setView('tree');
        renderTree();
        setTimeout(() => {
          const rows = document.querySelectorAll('.tree-node-row.selected');
          if (rows.length) rows[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 150);
      }
    }

    // ─── Start ───
    document.addEventListener('DOMContentLoaded', init);
  </script>
</body>
</html>`;
}
//# sourceMappingURL=generator.js.map