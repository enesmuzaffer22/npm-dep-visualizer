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
        name: '📦 External Packages',
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
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dependency Visualizer — ${path.basename(result.projectRoot)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

    :root {
      --bg-primary: #0f0f17;
      --bg-secondary: #181825;
      --bg-tertiary: #1e1e2e;
      --bg-surface: #252538;
      --bg-hover: #2a2a40;
      --border-color: #313149;
      --border-accent: #45457a;
      --text-primary: #e2e2f0;
      --text-secondary: #a0a0bc;
      --text-muted: #6c6c8a;
      --accent-blue: #7aa2f7;
      --accent-purple: #bb9af7;
      --accent-green: #9ece6a;
      --accent-orange: #e0af68;
      --accent-red: #f7768e;
      --accent-cyan: #73daca;
      --accent-pink: #ff79c6;
      --gradient-1: linear-gradient(135deg, #7aa2f7, #bb9af7);
      --gradient-2: linear-gradient(135deg, #9ece6a, #73daca);
      --gradient-3: linear-gradient(135deg, #e0af68, #f7768e);
      --shadow-sm: 0 1px 3px rgba(0,0,0,0.3);
      --shadow-md: 0 4px 14px rgba(0,0,0,0.4);
      --shadow-lg: 0 10px 40px rgba(0,0,0,0.5);
      --radius-sm: 6px;
      --radius-md: 10px;
      --radius-lg: 16px;
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
      min-height: 100vh;
      overflow-x: hidden;
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
      flex-wrap: wrap;
      gap: 16px;
    }

    .header-title {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .header-title .logo {
      width: 40px;
      height: 40px;
      background: var(--gradient-1);
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      box-shadow: 0 4px 14px rgba(122,162,247,0.25);
    }

    .header-title h1 {
      font-size: 20px;
      font-weight: 600;
      letter-spacing: -0.02em;
    }

    .header-title h1 span {
      background: var(--gradient-1);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
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
      max-width: 420px;
      min-width: 240px;
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
      box-shadow: 0 0 0 3px rgba(122,162,247,0.15);
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
      background: rgba(122,162,247,0.12);
      border-color: var(--accent-blue);
      color: var(--accent-blue);
    }

    .filter-btn .count {
      font-size: 11px;
      font-family: 'JetBrains Mono', monospace;
      background: rgba(255,255,255,0.06);
      padding: 1px 6px;
      border-radius: 4px;
    }

    .filter-btn.active .count {
      background: rgba(122,162,247,0.15);
    }

    /* ─── Layout ─── */
    .main-container {
      width: 100%;
      padding: 24px;
      display: grid;
      grid-template-columns: 1fr 480px;
      gap: 24px;
      min-height: calc(100vh - 84px);
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

    /* ─── Detail Panel ─── */
    .detail-panel {
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      overflow: hidden;
      flex: 1;
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
      max-height: 500px;
      overflow-y: auto;
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
      border: 1px solid rgba(247,118,142,0.25);
      border-radius: var(--radius-md);
      overflow: hidden;
    }

    .circular-panel-header {
      padding: 14px 20px;
      border-bottom: 1px solid rgba(247,118,142,0.15);
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--accent-red);
      font-size: 13px;
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
      max-height: calc(100vh - 200px);
      overflow-y: auto;
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
      background: rgba(122,162,247,0.1);
      border-left: 2px solid var(--accent-blue);
    }

    .tree-node-row.highlight {
      background: rgba(158,206,106,0.1);
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
      font-size: 15px;
      width: 20px;
      text-align: center;
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
      background: rgba(122,162,247,0.1);
      color: var(--accent-blue);
    }

    .tree-badge.usage-count {
      background: rgba(115,218,202,0.1);
      color: var(--accent-cyan);
    }

    .tree-children {
      overflow: hidden;
    }

    .tree-children.collapsed {
      display: none;
    }

    .search-match .tree-label {
      background: rgba(224,175,104,0.2);
      padding: 0 3px;
      border-radius: 3px;
    }

    /* ─── Animations ─── */
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
  <!-- Header -->
  <header class="header">
    <div class="header-content">
      <div class="header-title">
        <div class="logo">🔍</div>
        <div>
          <h1><span>Dep Visualizer</span></h1>
          <div class="project-name" id="projectName"></div>
        </div>
      </div>

      <div class="search-container">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
        </svg>
        <input type="text" class="search-input" id="searchInput" placeholder="Search files and packages..." />
        <span class="search-results-count" id="searchResultsCount"></span>
      </div>

      <div class="filter-group">
        <button class="filter-btn active" data-filter="all" id="filterAll">
          All <span class="count" id="countAll"></span>
        </button>
        <button class="filter-btn" data-filter="local" id="filterLocal">
          📄 Local <span class="count" id="countLocal"></span>
        </button>
        <button class="filter-btn" data-filter="external" id="filterExternal">
          📦 External <span class="count" id="countExternal"></span>
        </button>
      </div>
    </div>
  </header>

  <!-- Main Content -->
  <div class="main-container">
    <!-- Tree Panel -->
    <div class="tree-panel">
      <div class="tree-panel-header">
        <h2>📂 Dependency Tree</h2>
        <div class="tree-actions">
          <button class="tree-action-btn" id="expandAllBtn">Expand All</button>
          <button class="tree-action-btn" id="collapseAllBtn">Collapse All</button>
        </div>
      </div>
      <div class="tree-body" id="treeBody"></div>
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
      </div>

      <!-- Detail Panel -->
      <div class="detail-panel">
        <div class="detail-panel-header">
          <span>📋</span>
          <h3 id="detailTitle">File Details</h3>
        </div>
        <div class="detail-panel-content" id="detailContent">
          <div class="detail-empty">
            <div class="icon">🖱️</div>
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
    </div>
  </div>

  <script>
    // ─── Data ───
    const DATA = ${dataJSON};

    // ─── State ───
    let currentFilter = 'all';
    let searchQuery = '';
    let selectedNode = null;
    const expandedNodes = new Set();

    // ─── Init ───
    function init() {
      // Set project name
      document.getElementById('projectName').textContent = DATA.root.name;

      // Set stats
      document.getElementById('statFiles').textContent = DATA.stats.totalFiles;
      document.getElementById('statImports').textContent = DATA.stats.totalImports;
      document.getElementById('statLocal').textContent = DATA.stats.totalLocalImports;
      document.getElementById('statExternal').textContent = DATA.stats.totalExternalPackages;

      // Set filter counts
      document.getElementById('countAll').textContent = DATA.stats.totalFiles + DATA.stats.totalExternalPackages;
      document.getElementById('countLocal').textContent = DATA.stats.totalFiles;
      document.getElementById('countExternal').textContent = DATA.stats.totalExternalPackages;

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
      document.getElementById('expandAllBtn').addEventListener('click', expandAll);
      document.getElementById('collapseAllBtn').addEventListener('click', collapseAll);
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
      icon.textContent = getNodeIcon(node);
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
        badge.textContent = node.importCount + ' imp';
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
      if (node.type === 'external') return '📦';
      if (node.type === 'directory') {
        if (node.path === '__external__') return '📦';
        return expandedNodes.has(node.path) ? '📂' : '📁';
      }
      const ext = node.name.split('.').pop()?.toLowerCase() || '';
      const icons = {
        'ts': '🟦', 'tsx': '⚛️', 'js': '🟨', 'jsx': '⚛️',
        'vue': '💚', 'svelte': '🧡', 'css': '🎨', 'scss': '🎨',
        'json': '📋', 'mjs': '🟨', 'mts': '🟦',
      };
      return icons[ext] || '📄';
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

    // ─── Detail Panel ───
    function showDetail(node) {
      const title = document.getElementById('detailTitle');
      const content = document.getElementById('detailContent');

      title.textContent = node.name;

      let html = '';

      if (node.type === 'file' && node.imports) {
        const localImports = node.imports.filter(i => !i.isExternal);
        const externalImports = node.imports.filter(i => i.isExternal);

        if (localImports.length > 0) {
          html += '<div class="detail-section"><h4>📄 Local Imports (' + localImports.length + ')</h4>';
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
          html += '<div class="detail-section"><h4>📦 External Imports (' + externalImports.length + ')</h4>';
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
          html += '<div class="detail-empty"><div class="icon">✨</div><div>No imports — standalone file</div></div>';
        }
      }

      if (node.importedBy && node.importedBy.length > 0) {
        html += '<div class="detail-section"><h4>🔗 Imported By (' + node.importedBy.length + ')</h4>';
        for (const by of node.importedBy) {
          html += '<div class="detail-item">' +
            '<span class="dot reverse"></span>' +
            '<span>' + escapeHtml(by) + '</span>' +
            '</div>';
        }
        html += '</div>';
      } else if (node.type === 'file') {
        html += '<div class="detail-section"><h4>🔗 Imported By</h4>' +
          '<div class="detail-item" style="color: var(--text-muted);">Not imported by any file</div></div>';
      }

      if (node.type === 'external' && node.importedBy) {
        html += '<div class="detail-section"><h4>📄 Used By Files (' + node.importedBy.length + ')</h4>';
        for (const by of node.importedBy) {
          html += '<div class="detail-item">' +
            '<span class="dot reverse"></span>' +
            '<span>' + escapeHtml(by) + '</span>' +
            '</div>';
        }
        html += '</div>';
      }

      content.innerHTML = html || '<div class="detail-empty"><div class="icon">📋</div><div>No details available</div></div>';
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

    // ─── Start ───
    document.addEventListener('DOMContentLoaded', init);
  </script>
</body>
</html>`;
}
//# sourceMappingURL=generator.js.map