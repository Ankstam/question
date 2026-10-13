export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/api/paper") {
      try {
        const payload = await request.json();
        return new Response(buildDocumentHTML(payload), {
          headers: { "Content-Type": "text/html;charset=UTF-8" }
        });
      } catch (err) {
        return new Response(JSON.stringify({ code: 400, message: err.message }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    return new Response(buildDocumentHTML(PRESET_DATABASE.math_complex), {
      headers: { "Content-Type": "text/html;charset=UTF-8" }
    });
  }
};

const PRESET_DATABASE = {
  math_complex: {
    paper_title: "2026年高中数学全国统一模拟卷",
    meta: { subject: "数学", time: "120分钟", total_score: 150 },
    sections: [
      {
        title: "一、单项选择题（每小题 5 分，共 20 分）",
        questions: [
          {
            id: 1,
            score: 5,
            stem: "已知集合 $A = \\{x \\mid x^2 - 3x + 2 = 0\\}$，$B = \\{x \\mid 0 < x < 5, x \\in \\mathbf{N}\\}$，则 $A \\cap B =$（  ）",
            options: ["$\\{1\\}$", "$\\{2\\}$", "$\\{1, 2\\}$", "$\\{0, 1, 2\\}$"],
            blank_lines: 0
          },
          {
            id: 2,
            score: 5,
            stem: "函数 $f(x) = \\frac{\\sin x}{x^2 + 1}$ 在区间 $[-\\pi, \\pi]$ 上的部分图象大致如右图所示。设其极值点为 $x_1$，则 $f'(x_1)$ 的值为（  ）",
            options: ["$0$", "$1$", "$-1$", "$\\frac{1}{2}$"],
            diagram: { engine: "func_2d" }
          }
        ]
      },
      {
        title: "二、综合解答题（共 24 分）",
        questions: [
          {
            id: 3,
            score: 12,
            stem: "如图所示，在四棱锥 $P-ABCD$ 中，底面 $ABCD$ 为正方形，$PA \\perp \\text{底面 } ABCD$，$PA = AB = 2$。点 $M$ 为 $PD$ 的中点。(1) 证明：$PB \\parallel \\text{平面 } MAC$；(2) 求二面角 $P-CD-A$ 的大小。",
            blank_lines: 8,
            diagram: {
              engine: "wireframe_3d",
              scale: 1.1,
              rotation: { rx: 16, ry: -34 },
              nodes: {
                "P": [0, 65, 0], "A": [-45, -35, 35], "B": [45, -35, 35],
                "C": [65, -35, -35], "D": [-25, -35, -35], "M": [-12.5, 15, -17.5]
              },
              solid_lines: [["P","A"],["P","B"],["P","C"],["P","D"],["A","B"],["B","C"],["A","M"],["M","C"]],
              dashed_lines: [["A","D"],["C","D"],["A","C"]]
            }
          }
        ]
      }
    ]
  }
};

function buildDocumentHTML(initialData) {
  const jsonStr = JSON.stringify(initialData, null, 2);

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>多学科通用试卷与题库排版引擎</title>
  
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/mhchem.min.js"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"></script>

  <style>
    :root {
      --primary: #2563eb;
      --bg: #f8fafc;
      --border: #cbd5e1;
      /* 动态自定义版面参数 */
      --q-spacing: 20px;
      --paper-font-size: 10.5pt;
      --paper-line-height: 1.65;
      --rule-height: 24px;
      --diagram-width: 200px;
    }

    * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    body {
      margin: 0; padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Hiragino Sans GB", "Yu Gothic", sans-serif;
      background: var(--bg);
      color: #0f172a;
    }

    .app-header {
      position: sticky; top: 0; z-index: 50;
      background: #fff; border-bottom: 1px solid var(--border);
    }
    .header-bar {
      padding: 10px 16px; display: flex; justify-content: space-between; align-items: center;
    }
    .header-bar h2 { margin: 0; font-size: 15px; font-weight: 700; color: #1e293b; }
    .tabs { display: flex; border-top: 1px solid #f1f5f9; }
    .tab-btn {
      flex: 1; padding: 11px 0; border: none; background: transparent;
      font-size: 13px; font-weight: 600; color: #64748b; cursor: pointer; position: relative;
    }
    .tab-btn.active { color: var(--primary); }
    .tab-btn.active::after {
      content: ''; position: absolute; bottom: 0; left: 25%; width: 50%; height: 2px;
      background: var(--primary);
    }

    .main-body { padding: 12px; margin-bottom: 75px; }
    .panel { display: none; }
    .panel.active { display: block; }

    .card {
      background: #fff; padding: 14px; border-radius: 8px;
      border: 1px solid var(--border); margin-bottom: 12px;
    }
    .card-title {
      font-size: 13px; font-weight: 700; margin-bottom: 10px; color: #1e293b;
      display: flex; justify-content: space-between; align-items: center;
    }

    /* 快捷功能按钮栏 */
    .action-row {
      display: flex; gap: 8px; margin-bottom: 10px; flex-wrap: wrap;
    }
    .btn-sm {
      padding: 6px 12px; font-size: 12px; font-weight: 600; border-radius: 6px;
      border: 1px solid var(--border); background: #f1f5f9; color: #334155; cursor: pointer;
    }
    .btn-sm:active { background: #e2e8f0; }

    textarea {
      width: 100%; padding: 8px 10px; border: 1px solid var(--border); border-radius: 6px;
      font-size: 11.5px; outline: none; background: #fafafa;
      font-family: "SF Mono", Menlo, Consolas, monospace; min-height: 240px;
    }

    /* 自定义排版滑块面板 */
    .slider-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
    }
    .slider-item { display: flex; flex-direction: column; gap: 4px; }
    .slider-item label { font-size: 11px; color: #64748b; display: flex; justify-content: space-between; }
    .slider-item input[type="range"] { width: 100%; margin: 4px 0; }

    /* 移动端排版自适应容器 */
    .preview-mode-switch {
      display: flex; gap: 6px; margin-bottom: 10px;
    }
    .paper-scroller {
      width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; padding-bottom: 16px;
    }

    /* 试卷容器：移动端流式排版 vs 标准 A4 */
    .paper-sheet {
      background: #fff; margin: 0 auto;
      font-family: "Songti SC", "SimSun", "Times New Roman", "Yu Mincho", serif;
      color: #000; transition: all 0.2s ease;
      font-size: var(--paper-font-size);
      line-height: var(--paper-line-height);
    }

    /* 手机流式排版（默认适应任何手机屏幕宽度） */
    .paper-sheet.mobile-fit {
      width: 100% !important;
      min-height: auto;
      padding: 16px 14px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    }
    .paper-sheet.mobile-fit .q-flex-box {
      flex-direction: column;
      align-items: center;
    }
    .paper-sheet.mobile-fit .q-graphic-box {
      width: 100% !important;
      margin-top: 10px;
    }
    .paper-sheet.mobile-fit .options-grid {
      grid-template-columns: repeat(2, 1fr) !important;
    }

    /* 标准 A4 纸张排版（可横向拖动预览原貌） */
    .paper-sheet.a4-exact {
      width: 210mm !important;
      min-height: 297mm;
      padding: 20mm 18mm;
      box-shadow: 0 4px 14px rgba(0,0,0,0.08);
    }
    .paper-sheet.a4-exact .q-flex-box {
      flex-direction: row;
      align-items: flex-start;
    }
    .paper-sheet.a4-exact .q-graphic-box {
      width: var(--diagram-width);
      flex-shrink: 0;
    }
    .paper-sheet.a4-exact .options-grid {
      grid-template-columns: repeat(4, 1fr);
    }

    .paper-title { text-align: center; font-size: 1.6em; margin: 0 0 10px 0; }
    .paper-meta {
      display: flex; justify-content: space-around; font-size: 0.85em;
      border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px;
    }
    .section-title { font-size: 1.05em; font-weight: bold; margin: 16px 0 10px; }

    .question-row {
      break-inside: avoid; page-break-inside: avoid;
      margin-bottom: var(--q-spacing); text-align: justify;
    }
    .q-flex-box { display: flex; justify-content: space-between; gap: 14px; }
    .q-content { flex: 1; }
    .q-graphic-box { display: flex; justify-content: center; align-items: center; }

    .options-grid { display: grid; gap: 6px; margin: 8px 0 4px; }
    .blank-space {
      margin-top: 8px; width: 100%;
      background: repeating-linear-gradient(to bottom, transparent, transparent calc(var(--rule-height) - 1px), #e2e8f0 var(--rule-height));
      border-bottom: 1px solid #e2e8f0;
    }

    /* 底部操作条 */
    .bottom-bar {
      position: fixed; bottom: 0; left: 0; right: 0;
      background: #fff; padding: 10px 16px calc(10px + env(safe-area-inset-bottom));
      border-top: 1px solid var(--border); display: flex; gap: 10px; z-index: 60;
    }
    .btn { flex: 1; padding: 11px 0; border-radius: 6px; border: none; font-size: 14px; font-weight: 600; cursor: pointer; }
    .btn-update { background: #e2e8f0; color: #1e293b; }
    .btn-print { background: var(--primary); color: #fff; }

    /* 打印与导出 PDF 模式（强制转回标准 A4） */
    @media print {
      @page { size: A4 portrait; margin: 15mm 16mm; }
      body { background: #fff; margin: 0; padding: 0; }
      .app-header, .bottom-bar, #panel-edit, .preview-mode-switch { display: none !important; }
      #panel-preview { display: block !important; }
      .main-body { padding: 0; margin: 0; }
      .paper-scroller { overflow: visible; }
      .paper-sheet {
        width: 100% !important; min-height: auto; margin: 0; padding: 0; box-shadow: none;
      }
      .paper-sheet .q-flex-box { flex-direction: row !important; }
      .paper-sheet .q-graphic-box { width: var(--diagram-width) !important; flex-shrink: 0; }
      .paper-sheet .options-grid { grid-template-columns: repeat(4, 1fr) !important; }
      .blank-space {
        background: repeating-linear-gradient(to bottom, transparent, transparent calc(var(--rule-height) - 1px), #cbd5e1 var(--rule-height));
        border-bottom: 1px solid #cbd5e1;
      }
    }
  </style>
</head>
<body>

  <header class="app-header">
    <div class="header-bar">
      <h2>Universal Exam Engine</h2>
      <span style="font-size: 11px; background: #e0e7ff; color: #3730a3; padding: 2px 6px; border-radius: 4px;">Mobile Pro</span>
    </div>
    <div class="tabs">
      <button class="tab-btn active" onclick="setTab('edit')">数据与版面定制</button>
      <button class="tab-btn" onclick="setTab('preview')">试卷效果预览</button>
    </div>
  </header>

  <main class="main-body">
    <!-- 编辑与自定义视图 -->
    <div id="panel-edit" class="panel active">
      <!-- 快捷数据导入操作区 -->
      <div class="card">
        <div class="card-title">
          <span>数据导入与编辑</span>
          <span style="font-size: 10px; color: #64748b;">支持无损长文本</span>
        </div>
        <div class="action-row">
          <button class="btn-sm" onclick="pasteFromClipboard()">📋 从剪贴板粘贴（防丢字）</button>
          <button class="btn-sm" onclick="triggerFileInput()">📂 导入文本/JSON文件</button>
          <button class="btn-sm" onclick="clearJson()">🗑️ 清空</button>
          <input type="file" id="file-uploader" accept=".json,.txt" style="display: none;" onchange="handleFileUpload(event)">
        </div>
        <textarea id="paper-json" spellcheck="false" placeholder="在此粘贴或导入题库 JSON 数据...">${jsonStr}</textarea>
      </div>

      <!-- 版面细节实时调整面板 -->
      <div class="card">
        <div class="card-title">版面间距与样式自定义</div>
        <div class="slider-grid">
          <div class="slider-item">
            <label>题目间距: <span id="val-q-spacing">20px</span></label>
            <input type="range" min="10" max="45" value="20" oninput="updateStyleVar('--q-spacing', this.value + 'px', 'val-q-spacing')">
          </div>
          <div class="slider-item">
            <label>字号大小: <span id="val-font-size">10.5pt</span></label>
            <input type="range" min="9" max="14" step="0.5" value="10.5" oninput="updateStyleVar('--paper-font-size', this.value + 'pt', 'val-font-size')">
          </div>
          <div class="slider-item">
            <label>行高比例: <span id="val-line-height">1.65</span></label>
            <input type="range" min="1.3" max="2.2" step="0.05" value="1.65" oninput="updateStyleVar('--paper-line-height', this.value, 'val-line-height')">
          </div>
          <div class="slider-item">
            <label>答题格行高: <span id="val-rule-height">24px</span></label>
            <input type="range" min="18" max="36" value="24" oninput="updateStyleVar('--rule-height', this.value + 'px', 'val-rule-height')">
          </div>
          <div class="slider-item" style="grid-column: span 2;">
            <label>图形栏宽度 (A4模式): <span id="val-diag-width">200px</span></label>
            <input type="range" min="150" max="280" value="200" oninput="updateStyleVar('--diagram-width', this.value + 'px', 'val-diag-width')">
          </div>
        </div>
      </div>
    </div>

    <!-- 预览视图 -->
    <div id="panel-preview" class="panel">
      <div class="preview-mode-switch">
        <button class="btn-sm" id="btn-fit" style="background:#2563eb; color:#fff;" onclick="setPreviewMode('mobile-fit')">📱 手机流式排版 (适屏读题)</button>
        <button class="btn-sm" id="btn-a4" onclick="setPreviewMode('a4-exact')">📄 标准 A4 纸张排版 (带图栏)</button>
      </div>
      <div class="paper-scroller">
        <div class="paper-sheet mobile-fit" id="paper-mount-point"></div>
      </div>
    </div>
  </main>

  <div class="bottom-bar">
    <button class="btn btn-update" onclick="renderFromTextarea()">同步并更新卷面</button>
    <button class="btn btn-print" onclick="triggerPrint()">打印 / 导出标准 PDF</button>
  </div>

  <script>
    // ---------- 剪贴板与文件安全上传模块 ----------
    async function pasteFromClipboard() {
      try {
        if (!navigator.clipboard || !navigator.clipboard.readText) {
          alert("当前浏览器环境限制直接访问剪贴板，请长按文本框选择系统‘粘贴’，或使用‘导入文件’功能。");
          return;
        }
        const text = await navigator.clipboard.readText();
        if (!text) {
          alert("剪贴板中没有读取到内容！");
          return;
        }
        document.getElementById('paper-json').value = text;
        renderFromTextarea();
        alert("已成功从系统剪贴板完整导入（无丢失）！");
      } catch (err) {
        alert("读取剪贴板失败，请允许浏览器剪贴板权限，或改用‘导入文本/JSON文件’。\\n错误信息：" + err.message);
      }
    }

    function triggerFileInput() {
      document.getElementById('file-uploader').click();
    }

    function handleFileUpload(event) {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function(e) {
        document.getElementById('paper-json').value = e.target.result;
        renderFromTextarea();
        alert("文件已成功读取并载入！");
      };
      reader.onerror = function() {
        alert("读取文件失败，请重试！");
      };
      reader.readAsText(file, "UTF-8");
      event.target.value = ''; // 清空选择
    }

    function clearJson() {
      if (confirm("确定清空编辑器中的内容吗？")) {
        document.getElementById('paper-json').value = '';
      }
    }

    // ---------- 自定义版面变量控制 ----------
    function updateStyleVar(varName, value, labelId) {
      document.documentElement.style.setProperty(varName, value);
      if (labelId) document.getElementById(labelId).innerText = value;
    }

    function setPreviewMode(mode) {
      const sheet = document.getElementById('paper-mount-point');
      const btnFit = document.getElementById('btn-fit');
      const btnA4 = document.getElementById('btn-a4');

      if (mode === 'mobile-fit') {
        sheet.className = 'paper-sheet mobile-fit';
        btnFit.style.background = '#2563eb'; btnFit.style.color = '#fff';
        btnA4.style.background = '#f1f5f9'; btnA4.style.color = '#334155';
      } else {
        sheet.className = 'paper-sheet a4-exact';
        btnA4.style.background = '#2563eb'; btnA4.style.color = '#fff';
        btnFit.style.background = '#f1f5f9'; btnFit.style.color = '#334155';
      }
    }

    // ---------- 导航与页面逻辑 ----------
    function setTab(name) {
      document.querySelectorAll('.tab-btn').forEach((b, i) => {
        b.classList.toggle('active', (name === 'edit' && i === 0) || (name === 'preview' && i === 1));
      });
      document.getElementById('panel-edit').classList.toggle('active', name === 'edit');
      document.getElementById('panel-preview').classList.toggle('active', name === 'preview');
      if (name === 'preview') renderFromTextarea();
    }

    // ---------- 矢量图形引擎 ----------
    function renderClientDiagram(diagram) {
      if (!diagram) return '';

      if (diagram.engine === "raw_svg" || diagram.svg) {
        return diagram.svg;
      }

      if (diagram.engine === "wireframe_3d") {
        const w = 210, h = 180;
        const rx = ((diagram.rotation?.rx || 15) * Math.PI) / 180;
        const ry = ((diagram.rotation?.ry || -30) * Math.PI) / 180;
        const scale = diagram.scale || 1.0;

        const project = ([x, y, z]) => {
          const cosY = Math.cos(ry), sinY = Math.sin(ry);
          const cosX = Math.cos(rx), sinX = Math.sin(rx);
          const x1 = x * cosY + z * sinY;
          const z1 = -x * sinY + z * cosY;
          const y2 = y * cosX - z1 * sinX;
          return [w / 2 + x1 * scale, h / 2 - y2 * scale];
        };

        const pts = {};
        for (const [k, coord] of Object.entries(diagram.nodes || {})) {
          pts[k] = project(coord);
        }

        const lines = (diagram.solid_lines || []).map(([p1, p2]) => pts[p1] && pts[p2] ? 
          \`<line x1="\${pts[p1][0]}" y1="\${pts[p1][1]}" x2="\${pts[p2][0]}" y2="\${pts[p2][1]}" stroke="#000" stroke-width="1.3"/>\` : '').join('');

        const dLines = (diagram.dashed_lines || []).map(([p1, p2]) => pts[p1] && pts[p2] ? 
          \`<line x1="\${pts[p1][0]}" y1="\${pts[p1][1]}" x2="\${pts[p2][0]}" y2="\${pts[p2][1]}" stroke="#000" stroke-width="1.2" stroke-dasharray="4,3"/>\` : '').join('');

        const texts = Object.entries(pts).map(([k, [x, y]]) => 
          \`<text x="\${x + 4}" y="\${y - 3}" font-family="Times New Roman, serif" font-style="italic" font-size="11">\${k}</text>\`
        ).join('');

        return \`<svg width="\${w}" height="\${h}" viewBox="0 0 \${w} \${h}">\${dLines}\${lines}\${texts}</svg>\`;
      }

      if (diagram.engine === "func_2d") {
        return \`
          <svg width="200" height="150" viewBox="0 0 200 150">
            <defs>
              <marker id="arr" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#000"/>
              </marker>
            </defs>
            <line x1="20" y1="120" x2="185" y2="120" stroke="#000" stroke-width="1.2" marker-end="url(#arr)"/>
            <line x1="40" y1="140" x2="40" y2="15" stroke="#000" stroke-width="1.2" marker-end="url(#arr)"/>
            <text x="185" y="132" font-size="11" font-style="italic">x</text>
            <text x="28" y="20" font-size="11" font-style="italic">y</text>
            <text x="28" y="132" font-size="10">O</text>
            <path d="M 40 110 Q 80 15, 120 70 T 170 20" fill="none" stroke="#2563eb" stroke-width="1.5"/>
            <line x1="120" y1="120" x2="120" y2="70" stroke="#64748b" stroke-width="1" stroke-dasharray="3,2"/>
            <text x="115" y="133" font-size="10">x₁</text>
          </svg>
        \`;
      }

      if (diagram.engine === "geography_2d") {
        return \`
          <svg width="200" height="150" viewBox="0 0 200 150">
            <ellipse cx="100" cy="75" rx="75" ry="55" fill="none" stroke="#64748b" stroke-width="1.2"/>
            <ellipse cx="95" cy="73" rx="55" ry="40" fill="none" stroke="#64748b" stroke-width="1.2"/>
            <ellipse cx="90" cy="70" rx="35" ry="25" fill="none" stroke="#64748b" stroke-width="1.2"/>
            <circle cx="85" cy="67" r="3" fill="#000"/>
            <text x="92" y="70" font-size="10" font-weight="bold">▲ 850m</text>
            <text x="140" y="85" font-size="9" fill="#475569">600m</text>
            <text x="125" y="110" font-size="9" fill="#475569">400m</text>
          </svg>
        \`;
      }

      if (diagram.engine === "ielts_chart") {
        return \`
          <svg width="210" height="150" viewBox="0 0 210 150">
            <line x1="30" y1="120" x2="190" y2="120" stroke="#000" stroke-width="1"/>
            <line x1="30" y1="120" x2="30" y2="20" stroke="#000" stroke-width="1"/>
            <rect x="45" y="45" width="18" height="75" fill="#3b82f6"/>
            <rect x="68" y="65" width="18" height="55" fill="#93c5fd"/>
            <rect x="110" y="25" width="18" height="95" fill="#3b82f6"/>
            <rect x="133" y="55" width="18" height="65" fill="#93c5fd"/>
            <text x="48" y="135" font-size="9">2010</text>
            <text x="115" y="135" font-size="9">2020</text>
            <text x="10" y="30" font-size="9">%</text>
          </svg>
        \`;
      }

      return '';
    }

    // ---------- DOM 试卷渲染器 ----------
    function renderFromTextarea() {
      const raw = document.getElementById('paper-json').value.trim();
      if (!raw) return;

      try {
        const data = JSON.parse(raw);
        const container = document.getElementById('paper-mount-point');
        let html = '';

        html += '<h1 class="paper-title">' + (data.paper_title || "标准化测试卷") + '</h1>';
        html += '<div class="paper-meta">';
        html += '<span>科目：' + (data.meta?.subject || "综合") + '</span>';
        html += '<span>考试时长：' + (data.meta?.time || "120分钟") + '</span>';
        html += '<span>满分：' + (data.meta?.total_score || "100") + '分</span>';
        html += '<span>姓名：_________</span>';
        html += '<span>得分：_________</span>';
        html += '</div>';

        (data.sections || []).forEach(sec => {
          html += '<div class="section-title">' + sec.title + '</div>';
          (sec.questions || []).forEach(q => {
            html += '<div class="question-row">';
            html += '  <div class="q-flex-box">';
            html += '    <div class="q-content">';
            html += '      <b>' + q.id + '.</b> (' + q.score + '分) ' + q.stem;
            
            if (q.options && q.options.length) {
              const letters = ['A', 'B', 'C', 'D'];
              html += '<div class="options-grid">';
              q.options.forEach((opt, idx) => {
                html += '<div>' + (letters[idx] || '') + '．' + opt + '</div>';
              });
              html += '</div>';
            }
            html += '    </div>';

            if (q.diagram) {
              html += '    <div class="q-graphic-box">' + renderClientDiagram(q.diagram) + '</div>';
            }
            html += '  </div>';

            if (q.blank_lines) {
              html += '<div class="blank-space" style="height: calc(' + q.blank_lines + ' * var(--rule-height));"></div>';
            }
            html += '</div>';
          });
        });

        container.innerHTML = html;

        if (window.renderMathInElement) {
          renderMathInElement(container, {
            delimiters: [
              { left: "$$", right: "$$", display: true },
              { left: "$", right: "$", display: false }
            ],
            throwOnError: false
          });
        }
      } catch (err) {
        alert("JSON 语法解析错误：\\n" + err.message);
      }
    }

    function triggerPrint() {
      setTab('preview');
      setTimeout(() => { window.print(); }, 200);
    }

    window.addEventListener('DOMContentLoaded', () => {
      renderFromTextarea();
    });
  </script>
</body>
</html>`;
}