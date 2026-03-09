# dep-visualizer

> 🇬🇧 [English](#english) · 🇹🇷 [Türkçe](#türkçe)

---

## English

A framework-agnostic dependency analyzer and visualizer for JavaScript and TypeScript projects. Analyzes your project's import graph and generates a fully self-contained interactive HTML report — no server, no build step required to view it.

### Features

- **Flowchart / Tree layout** — hierarchical graph drawn with a Sugiyama-style layered layout; bezier curve connectors with arrowheads
- **File tree view** — collapsible folder / file tree with inline stats
- **Dead code detection** — files that are never imported and export nothing are flagged
- **Orphan detection** — files that are never imported by any other file
- **Circular dependency detection** — import cycles are reported in the stats panel
- **External package breakdown** — all third-party packages listed with import counts
- **Hotspot detection** — most-imported files highlighted
- **Search** — real-time file search across both views
- **Filters** — filter nodes to show only local files, external packages, orphans, or dead code
- **Dark / Light theme** — persisted in `localStorage`
- **Graph settings** — layout direction (Top→Bottom / Left→Right), spacing multiplier, group-by-folder cluster backgrounds
- **Self-contained output** — single `.html` file with zero external dependencies

### Requirements

- Node.js ≥ 18
- npm / pnpm / yarn

### Installation

```bash
# Install globally
npm install -g dep-visualizer

# Or as a dev dependency in your project
npm install --save-dev dep-visualizer
```

### Usage

#### CLI

```bash
# If installed globally
depviz -d ./my-project -o ./report.html

# If installed as a dev dependency
npx depviz -d ./my-project -o ./report.html
```

| Option | Alias | Description | Default |
|---|---|---|---|
| `--dir <path>` | `-d` | Root directory of the project to analyze | `.` |
| `--output <path>` | `-o` | Output HTML file path | `./dependency-report.html` |
| `--exclude <patterns...>` | `-e` | Additional glob patterns to exclude | — |

**Examples:**

```bash
# Analyze the current directory
depviz

# Analyze a Next.js project
depviz -d ./apps/web -o ./web-deps.html

# Exclude test files and stories
depviz -d ./src -e "**/*.test.*" "**/*.stories.*" -o ./report.html
```

You can also add it as a script in your `package.json`:

```json
{
  "scripts": {
    "deps": "depviz -d . -o ./dependency-report.html"
  }
}
```

```bash
npm run deps
```

#### Programmatic API

```ts
import { analyze, generateHTML } from 'dep-visualizer';
import fs from 'fs';

const result = analyze({ dir: './my-project' });
const html = generateHTML(result);
fs.writeFileSync('./report.html', html);
```

### Automatically Excluded Paths

The following paths are excluded by default (no configuration needed):

```
node_modules/   .git/   dist/   build/
.next/          .nuxt/  .output/  coverage/
*.config.*      *.d.ts
```

### Understanding the Report

#### Tree View
- Folder / file hierarchy of the project
- Each file shows: number of imports, how many files import it, file size
- Dead code files are marked with a red dashed border
- Click any file to open its detail panel (imports, imported-by, flags)

#### Graph View
- Hierarchical flowchart where **arrows point from importer → imported**
- Nodes are rectangular; color indicates local file vs. external package
- Hover over a node to highlight only its direct connections; all other nodes fade
- Click a node to open the detail panel
- Pan with drag; zoom with scroll wheel
- **Settings panel** (gear icon):
  - *Direction* — TB (top-to-bottom) or LR (left-to-right)
  - *Spacing* — increase/decrease gap between layers
  - *Group by folder* — draws a background region around files from the same directory

#### Filters (top bar)
| Filter | Shows |
|---|---|
| All | Every node |
| Local | Only local source files |
| External | Only third-party packages |
| Orphans | Files not imported by any other file |
| Dead Code | Orphan files with no exports |

### Development

```bash
# Watch mode
npx tsc --watch

# Run against a test project
node dist/cli.js -d ./tests/TEST-PROJECT -o ./test-output.html
```

### License

MIT

---

## Türkçe

JavaScript ve TypeScript projeleri için çerçeveden bağımsız bir bağımlılık analiz ve görselleştirme aracı. Projenizin import grafiğini analiz ederek tamamen bağımsız, tek dosyalık bir HTML raporu üretir. Raporu görüntülemek için sunucu veya ek kurulum gerekmez.

### Özellikler

- **Flowchart / Ağaç düzeni** — Sugiyama katmanlı algoritmasıyla çizilen hiyerarşik grafik; bezier eğrili bağlantılar ve yön okları
- **Dosya ağacı görünümü** — Açılıp kapanabilen klasör/dosya ağacı, her satırda özet istatistikler
- **Ölü kod tespiti** — Hiçbir dosya tarafından import edilmeyen ve export'u olmayan dosyalar işaretlenir
- **Yalnız (orphan) dosya tespiti** — Hiçbir dosya tarafından import edilmeyen dosyaları gösterir
- **Döngüsel bağımlılık tespiti** — Döngüsel import zincirleri istatistik panelinde raporlanır
- **Harici paket dökümü** — Tüm üçüncü taraf paketler kullanım sayısıyla listelenir
- **Hotspot tespiti** — En çok import edilen dosyalar öne çıkarılır
- **Arama** — Her iki görünümde anlık dosya/modül arama
- **Filtreler** — Yalnızca yerel dosyalar, harici paketler, yalnız dosyalar veya ölü kodu göster
- **Koyu / Açık tema** — `localStorage`'da kalıcı olarak saklanır
- **Graf ayarları** — Düzen yönü (Yukarıdan Aşağı / Soldan Sağa), aralık katsayısı, klasöre göre gruplama arka planı
- **Bağımsız çıktı** — Harici bağımlılığı olmayan tek `.html` dosyası

### Gereksinimler

- Node.js ≥ 18
- npm / pnpm / yarn

### Kurulum

```bash
# Global olarak kur
npm install -g dep-visualizer

# Ya da projeye geliştirici bağımlılığı olarak ekle
npm install --save-dev dep-visualizer
```

### Kullanım

#### CLI

```bash
# Global kurulumda
depviz -d ./benim-projem -o ./rapor.html

# Geliştirici bağımlılığı olarak kurulduysa
npx depviz -d ./benim-projem -o ./rapor.html
```

| Seçenek | Kısaltma | Açıklama | Varsayılan |
|---|---|---|---|
| `--dir <path>` | `-d` | Analiz edilecek projenin kök dizini | `.` |
| `--output <path>` | `-o` | Çıktı HTML dosya yolu | `./dependency-report.html` |
| `--exclude <patterns...>` | `-e` | Ek dışlama glob kalıpları | — |

**Örnekler:**

```bash
# Mevcut dizini analiz et
depviz

# Bir Next.js projesini analiz et
depviz -d ./apps/web -o ./web-deps.html

# Test ve story dosyalarını hariç tut
depviz -d ./src -e "**/*.test.*" "**/*.stories.*" -o ./rapor.html
```

`package.json` dosyasına script olarak da ekleyebilirsiniz:

```json
{
  "scripts": {
    "deps": "depviz -d . -o ./dependency-report.html"
  }
}
```

```bash
npm run deps
```

#### Programatik API

```ts
import { analyze, generateHTML } from 'dep-visualizer';
import fs from 'fs';

const result = analyze({ dir: './benim-projem' });
const html = generateHTML(result);
fs.writeFileSync('./rapor.html', html);
```

### Otomatik Dışlanan Yollar

Aşağıdaki yollar varsayılan olarak hariç tutulur, ek ayar gerekmez:

```
node_modules/   .git/   dist/   build/
.next/          .nuxt/  .output/  coverage/
*.config.*      *.d.ts
```

### Raporu Anlama

#### Ağaç Görünümü
- Projenin klasör/dosya hiyerarşisi
- Her dosyada: import sayısı, kaç dosyanın bu dosyayı import ettiği, dosya boyutu
- Ölü kod dosyaları kırmızı kesik kenarlıkla işaretlenir
- Herhangi bir dosyaya tıklandığında ayrıntı paneli açılır (import'ları, kim import ediyor, bayraklar)

#### Graf Görünümü
- **Oklar, import eden → import edilen** yönünde bir hiyerarşik flowchart
- Dikdörtgen düğümler; renk yerel dosya ile harici paketi ayırt eder
- Bir düğümün üzerine gelindiğinde yalnızca doğrudan bağlantıları öne çıkar, diğerleri solar
- Düğüme tıklandığında ayrıntı paneli açılır
- Sürükleyerek kaydır; fare tekerleğiyle yaklaştır/uzaklaştır
- **Ayarlar paneli** (dişli simgesi):
  - *Yön* — TB (yukarıdan aşağıya) veya LR (soldan sağa)
  - *Aralık* — Katmanlar arası mesafeyi artır/azalt
  - *Klasöre göre grupla* — Aynı dizindeki dosyaların etrafına arka plan bölgesi çizer

#### Filtreler (üst çubuk)
| Filtre | Gösterir |
|---|---|
| Tümü | Her düğüm |
| Yerel | Yalnızca yerel kaynak dosyalar |
| Harici | Yalnızca üçüncü taraf paketler |
| Yalnızlar | Hiçbir dosya tarafından import edilmeyenler |
| Ölü Kod | Export'u olmayan yalnız dosyalar |

### Geliştirme

```bash
# İzleme modu
npx tsc --watch

# Test projesiyle çalıştır
node dist/cli.js -d ./tests/TEST-PROJECT -o ./test-output.html
```

### Lisans

MIT
