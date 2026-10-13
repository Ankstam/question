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

    return new Response(buildDocumentHTML(DEFAULT_PRESET), {
      headers: { "Content-Type": "text/html;charset=UTF-8" }
    });
  }
};

const DEFAULT_PRESET = {
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
          blank_lines: 6,
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
};

function buildDocumentHTML(initialData) {
  const jsonStr = JSON.stringify(initialData, null, 2);

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>通用试卷与排版引擎</title>
  
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/mhchem.min.js"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"></script>
  <script defer src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>

  <style>
    :root {
      --primary: #1e40af;
      --border: #e2e8f0;
      --q-spacing: 20px;
      --paper-font-size: 10.5pt;
      --paper-line-height: 1.65;
      --rule-height: 24px;
      --diagram-width: 200px;
    }

    * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    
    html, body {
      margin: 0; padding: 0;
      background: #ffffff !important;
      color: #000000;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Hiragino Sans GB", "Yu Gothic", sans-serif;
      -webkit-font-smoothing: antialiased;
    }

    svg { overflow: visible !important; }

    .app-header {
      position: sticky; top: 0; z-index: 50;
      background: #ffffff; border-bottom: 1px solid var(--border);
    }
    .header-bar {
      padding: 10px 16px; display: flex; justify-content: space-between; align-items: center;
    }
    .header-bar h2 { margin: 0; font-size: 15px; font-weight: 700; color: #000; }
    .tabs { display: flex; border-top: 1px solid var(--border); }
    .tab-btn {
      flex: 1; padding: 11px 0; border: none; background: #ffffff;
      font-size: 13px; font-weight: 600; color: #64748b; cursor: pointer; position: relative;
    }
    .tab-btn.active { color: var(--primary); }
    .tab-btn.active::after {
      content: ''; position: absolute; bottom: 0; left: 20%; width: 60%; height: 2px;
      background: var(--primary);
    }

    .main-body { padding: 12px; margin-bottom: 75px; background: #ffffff; }
    .panel { display: none; }
    .panel.active { display: block; }

    .card {
      background: #ffffff; padding: 14px; border-radius: 8px;
      border: 1px solid var(--border); margin-bottom: 12px;
    }
    .card-title {
      font-size: 13px; font-weight: 700; margin-bottom: 10px; color: #000;
      display: flex; justify-content: space-between; align-items: center;
    }

    .action-row {
      display: flex; gap: 8px; margin-bottom: 10px; flex-wrap: wrap;
    }
    .btn-sm {
      padding: 6px 12px; font-size: 12px; font-weight: 600; border-radius: 6px;
      border: 1px solid var(--border); background: #ffffff; color: #1e293b; cursor: pointer;
    }
    .btn-sm:active { background: #f1f5f9; }

    input[type="text"], textarea {
      width: 100%; padding: 9px 10px; border: 1px solid var(--border); border-radius: 6px;
      font-size: 12px; outline: none; background: #ffffff;
      font-family: inherit; color: #000;
    }
    textarea {
      font-family: "SF Mono", Menlo, Consolas, monospace; min-height: 230px;
    }

    .slider-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
    }
    .slider-item { display: flex; flex-direction: column; gap: 4px; }
    .slider-item label { font-size: 11px; color: #475569; display: flex; justify-content: space-between; }
    .slider-item input[type="range"] { width: 100%; margin: 4px 0; }

    .preview-mode-switch {
      display: flex; gap: 6px; margin-bottom: 10px;
    }
    .paper-scroller {
      width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; padding-bottom: 16px;
      background: #ffffff;
    }

    /* 试卷容器排版 */
    .paper-sheet {
      background: #ffffff !important; margin: 0 auto;
      font-family: "Songti SC", "SimSun", "Times New Roman", "Yu Mincho", serif;
      color: #000000;
      font-size: var(--paper-font-size);
      line-height: var(--paper-line-height);
    }

    .paper-sheet.mobile-fit {
      width: 100% !important; min-height: auto; padding: 10px 4px;
    }
    .paper-sheet.mobile-fit .q-flex-box {
      flex-direction: column; align-items: center;
    }
    .paper-sheet.mobile-fit .q-graphic-box {
      width: 100% !important; margin-top: 10px;
    }

    .paper-sheet.a4-exact {
      width: 210mm !important; min-height: 297mm; padding: 18mm 16mm;
      border: 1px solid #e2e8f0;
    }
    .paper-sheet.a4-exact .q-flex-box {
      flex-direction: row; align-items: flex-start;
    }
    .paper-sheet.a4-exact .q-graphic-box {
      width: var(--diagram-width); flex-shrink: 0;
    }

    .paper-title { text-align: center; font-size: 1.6em; margin: 0 0 10px 0; font-weight: bold; }
    .paper-meta {
      display: flex; justify-content: space-around; font-size: 0.85em;
      border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px;
    }
    .section-title { font-size: 1.05em; font-weight: bold; margin: 18px 0 12px; }

    /* 严格防跨页截断 */
    .question-row {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
      margin-bottom: var(--q-spacing);
      text-align: justify;
    }
    .q-flex-box { display: flex; justify-content: space-between; gap: 14px; }
    .q-content { flex: 1; min-width: 0; }
    .q-graphic-box { display: flex; justify-content: center; align-items: center; }

    /* 智能选项网格：自动适配选项长度 */
    .options-grid { margin: 8px 0 4px; }
    .options-grid.cols-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
    .options-grid.cols-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; }
    .options-grid.cols-1 { display: flex; flex-direction: column; gap: 4px; }

    /* 物理级答题实体横线 */
    .blank-space { margin-top: 8px; width: 100%; display: flex; flex-direction: column; }
    .rule-line {
      width: 100%; height: var(--rule-height);
      border-bottom: 1px solid #cbd5e1;
    }

    /* 底部导航条 */
    .bottom-bar {
      position: fixed; bottom: 0; left: 0; right: 0;
      background: #ffffff; padding: 10px 16px calc(10px + env(safe-area-inset-bottom));
      border-top: 1px solid var(--border); display: flex; gap: 10px; z-index: 60;
    }
    .btn { flex: 1; padding: 12px 0; border-radius: 6px; border: none; font-size: 14px; font-weight: 600; cursor: pointer; text-align: center; }
    .btn-secondary { background: #f1f5f9; color: #1e293b; border: 1px solid var(--border); }
    .btn-primary { background: var(--primary); color: #ffffff; }

    /* 导出操作面板 */
    .modal-overlay {
      display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.5); z-index: 100;
      justify-content: center; align-items: flex-end;
    }
    .modal-overlay.active { display: flex; }
    .modal-content {
      background: #ffffff; width: 100%; max-width: 500px; border-radius: 14px 14px 0 0;
      padding: 18px 16px calc(18px + env(safe-area-inset-bottom));
      box-shadow: 0 -4px 20px rgba(0,0,0,0.15); animation: slideUp 0.25s ease-out;
    }
    @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
    .modal-header { font-size: 15px; font-weight: 700; margin-bottom: 14px; text-align: center; color: #000; }
    .export-options-grid { display: flex; flex-direction: column; gap: 8px; }
    .export-item-btn {
      width: 100%; padding: 13px 14px; border: 1px solid var(--border); background: #ffffff;
      border-radius: 8px; text-align: left; font-size: 13.5px; font-weight: 600;
      display: flex; justify-content: space-between; align-items: center; cursor: pointer;
    }
    .export-item-btn.highlight {
      border: 1.5px solid var(--primary); background: #eff6ff;
    }
    .export-item-btn:active { background: #f8fafc; }
    .modal-cancel-btn {
      width: 100%; padding: 11px 0; margin-top: 10px; border: none; background: #f1f5f9;
      color: #475569; border-radius: 8px; font-weight: 600; font-size: 13px; cursor: pointer;
    }

    /* Chrome 浏览器原生打印规范（A4 标准、绝无失真） */
    @media print {
      @page {
        size: A4 portrait;
        margin: 15mm 16mm 15mm 16mm;
      }

      html, body {
        background: #ffffff !important;
        color: #000000 !important;
        margin: 0 !important; padding: 0 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      .app-header, .bottom-bar, #panel-edit, .preview-mode-switch, .modal-overlay {
        display: none !important;
      }

      #panel-preview { display: block !important; margin: 0 !important; padding: 0 !important; }
      .main-body, .paper-scroller { padding: 0 !important; margin: 0 !important; overflow: visible !important; }

      .paper-sheet {
        width: 100% !important; min-height: auto !important; margin: 0 !important;
        padding: 0 !important; border: none !important; box-shadow: none !important;
      }

      .paper-sheet .q-flex-box { flex-direction: row !important; }
      .paper-sheet .q-graphic-box { width: var(--diagram-width) !important; flex-shrink: 0; }
      .rule-line { border-bottom: 1px solid #94a3b8 !important; }
    }
  </style>
</head>
<body>

  <header class="app-header">
    <div class="header-bar">
      <h2>Universal Exam Engine</h2>
      <span style="font-size: 11px; background: #e0e7ff; color: #3730a3; padding: 2px 6px; border-radius: 4px;">A4 Perfect Print</span>
    </div>
    <div class="tabs">
      <button class="tab-btn active" id="tab-nav-edit" onclick="setTab('edit')">1. 数据与版面定制</button>
      <button class="tab-btn" id="tab-nav-preview" onclick="setTab('preview')">2. 试卷效果预览</button>
    </div>
  </header>

  <main class="main-body">
    <!-- 步骤一：配置面板 -->
    <div id="panel-edit" class="panel active">
      <div class="card">
        <div class="card-title">
          <span>自定义文件导出名称</span>
          <span style="font-size: 10px; color: #64748b;">留空则精确到秒时间戳</span>
        </div>
        <input type="text" id="custom-filename-input" placeholder="输入自定义文件名（例如：2026高考数学综合特训）">
      </div>

      <div class="card">
        <div class="card-title">
          <span>数据导入与编辑</span>
          <span style="font-size: 10px; color: #64748b;">支持自动修复单斜杠</span>
        </div>
        <div class="action-row">
          <button class="btn-sm" onclick="pasteFromClipboard()">📋 从剪贴板粘贴</button>
          <button class="btn-sm" onclick="triggerFileInput()">📂 导入文本/JSON文件</button>
          <button class="btn-sm" onclick="clearJson()">🗑️ 清空</button>
          <input type="file" id="file-uploader" accept=".json,.txt" style="display: none;" onchange="handleFileUpload(event)">
        </div>
        <textarea id="paper-json" spellcheck="false" placeholder="在此粘贴或导入题库 JSON 数据...">${jsonStr}</textarea>
      </div>

      <div class="card">
        <div class="card-title">版面间距与样式微调</div>
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

    <!-- 步骤二：预览面板 -->
    <div id="panel-preview" class="panel">
      <div class="preview-mode-switch">
        <button class="btn-sm" id="btn-fit" style="background:#1e40af; color:#fff;" onclick="setPreviewMode('mobile-fit')">📱 手机适屏排版</button>
        <button class="btn-sm" id="btn-a4" onclick="setPreviewMode('a4-exact')">📄 标准 A4 纸张排版</button>
      </div>
      <div class="paper-scroller">
        <div class="paper-sheet mobile-fit" id="paper-mount-point"></div>
      </div>
    </div>
  </main>

  <!-- 底部动态流程控制条 -->
  <div class="bottom-bar" id="bar-edit-step">
    <button class="btn btn-primary" onclick="proceedToPreview()">👉 下一步：预览卷面排版</button>
  </div>

  <div class="bottom-bar" id="bar-preview-step" style="display: none;">
    <button class="btn btn-secondary" onclick="setTab('edit')">👈 上一步：修改数据</button>
    <button class="btn btn-primary" onclick="openExportModal()">📥 导出与打印试卷</button>
  </div>

  <!-- 步骤三：导出与打印选项弹窗 -->
  <div class="modal-overlay" id="export-modal" onclick="closeExportModal(event)">
    <div class="modal-content" onclick="event.stopPropagation()">
      <div class="modal-header">选择导出或打印方式</div>
      <div class="export-options-grid">
        <button class="export-item-btn highlight" onclick="triggerChromePrint()">
          <div>
            <div style="color:#1e40af; font-size:14px;">🖨️ Chrome 浏览器标准打印 / 另存为 PDF</div>
            <div style="font-size:11px; color:#475569; margin-top:2px;">强烈推荐：矢量无损、绝不截断、公式无横杠</div>
          </div>
          <span>➔</span>
        </button>
        <button class="export-item-btn" onclick="exportDirectPDF()">
          <div>
            <div>📑 直接下载 PDF 文件 (.pdf)</div>
            <div style="font-size:11px; color:#64748b;">客户端直出，自动规整页码</div>
          </div>
          <span>➔</span>
        </button>
        <button class="export-item-btn" onclick="exportStandaloneHTML()">
          <div>
            <div>🌐 下载独立离线网页 (.html)</div>
            <div style="font-size:11px; color:#64748b;">支持发送微信或电脑打开秒打印</div>
          </div>
          <span>➔</span>
        </button>
        <button class="export-item-btn" onclick="exportWordDoc()">
          <div>
            <div>📝 下载 Word 文档 (.doc)</div>
            <div style="font-size:11px; color:#64748b;">手机 WPS / Word 可编辑</div>
          </div>
          <span>➔</span>
        </button>
        <button class="export-item-btn" onclick="exportJSONBackup()">
          <div>
            <div>💾 备份题库数据 (.json)</div>
            <div style="font-size:11px; color:#64748b;">源数据备份</div>
          </div>
          <span>➔</span>
        </button>
      </div>
      <button class="modal-cancel-btn" onclick="closeExportModal()">取消</button>
    </div>
  </div>

  <script>
    // ---------- 文件名解析器 ----------
    function getResolvedFileName(extension) {
      let customName = (document.getElementById('custom-filename-input')?.value || '').trim();
      if (!customName) {
        const now = new Date();
        const pad = n => String(n).padStart(2, '0');
        const Y = now.getFullYear();
        const M = pad(now.getMonth() + 1);
        const D = pad(now.getDate());
        const h = pad(now.getHours());
        const m = pad(now.getMinutes());
        const s = pad(now.getSeconds());
        customName = \`试卷_\${Y}\${M}\${D}_\${h}\${m}\${s}\`;
      }
      return \`\${customName}.\${extension}\`;
    }

    // ---------- 选项长度智能排版算法 ----------
    function getOptionGridClass(options) {
      if (!options || !options.length) return 'cols-4';
      const maxLen = Math.max(...options.map(o => {
        return (o || '').replace(/\\$[^\\$]*\\$/g, 'XXXX').length;
      }));
      if (maxLen <= 5) return 'cols-4';
      if (maxLen <= 15) return 'cols-2';
      return 'cols-1';
    }

    // ---------- 容错 JSON 解析器 ----------
    function parseJSONWithTolerance(rawStr) {
      try {
        return JSON.parse(rawStr);
      } catch (err) {
        const repaired = rawStr.replace(/\\\\(?!["\\\\/bfnrt]|u[0-9a-fA-F]{4})/g, "\\\\\\\\");
        return JSON.parse(repaired);
      }
    }

    async function pasteFromClipboard() {
      try {
        if (!navigator.clipboard || !navigator.clipboard.readText) {
          alert("浏览器限制直接读取剪贴板，请长按输入框选择系统粘贴。");
          return;
        }
        const text = await navigator.clipboard.readText();
        if (!text) { alert("剪贴板为空！"); return; }
        document.getElementById('paper-json').value = text;
        alert("已成功从剪贴板读入！");
      } catch (err) {
        alert("读取剪贴板失败，请使用【导入文本/JSON文件】按钮。");
      }
    }

    function triggerFileInput() { document.getElementById('file-uploader').click(); }

    function handleFileUpload(event) {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function(e) {
        document.getElementById('paper-json').value = e.target.result;
        alert("文件读取载入成功！");
      };
      reader.readAsText(file, "UTF-8");
      event.target.value = '';
    }

    function clearJson() {
      if (confirm("确定清空数据吗？")) document.getElementById('paper-json').value = '';
    }

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
        btnFit.style.background = '#1e40af'; btnFit.style.color = '#fff';
        btnA4.style.background = '#ffffff'; btnA4.style.color = '#1e293b';
      } else {
        sheet.className = 'paper-sheet a4-exact';
        btnA4.style.background = '#1e40af'; btnA4.style.color = '#fff';
        btnFit.style.background = '#ffffff'; btnFit.style.color = '#1e293b';
      }
    }

    // ---------- 流程控制切换 ----------
    function setTab(name) {
      const isEdit = (name === 'edit');
      document.getElementById('tab-nav-edit').classList.toggle('active', isEdit);
      document.getElementById('tab-nav-preview').classList.toggle('active', !isEdit);
      document.getElementById('panel-edit').classList.toggle('active', isEdit);
      document.getElementById('panel-preview').classList.toggle('active', !isEdit);
      document.getElementById('bar-edit-step').style.display = isEdit ? 'flex' : 'none';
      document.getElementById('bar-preview-step').style.display = !isEdit ? 'flex' : 'none';
    }

    function proceedToPreview() {
      const ok = renderFromTextarea();
      if (ok) {
        setTab('preview');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }

    // ---------- 矢量几何与多学科图形引擎 ----------
    function renderClientDiagram(diagram) {
      if (!diagram) return '';
      if (diagram.engine === "raw_svg" || diagram.svg) return diagram.svg;

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
            <path d="M 40 110 Q 80 15, 120 70 T 170 20" fill="none" stroke="#1e40af" stroke-width="1.5"/>
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
      if (!raw) return false;

      let data;
      try {
        data = parseJSONWithTolerance(raw);
      } catch (err) {
        alert("JSON 语法解析错误，请检查输入格式：\\n" + err.message);
        return false;
      }

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
            const gridClass = getOptionGridClass(q.options);
            html += '<div class="options-grid ' + gridClass + '">';
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

          // 生成实体 DOM 答题线
          if (q.blank_lines && q.blank_lines > 0) {
            html += '<div class="blank-space">';
            for (let i = 0; i < q.blank_lines; i++) {
              html += '<div class="rule-line"></div>';
            }
            html += '</div>';
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
      return true;
    }

    // ---------- 导出与弹窗逻辑 ----------
    function openExportModal() {
      document.getElementById('export-modal').classList.add('active');
    }

    function closeExportModal() {
      document.getElementById('export-modal').classList.remove('active');
    }

    function downloadBlob(content, filename, type) {
      const blob = new Blob([content], { type: type });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 300);
    }

    // 1. Chrome 浏览器原生打印直出（首选核心）
    function triggerChromePrint() {
      closeExportModal();
      setPreviewMode('a4-exact');
      setTimeout(() => {
        window.print();
      }, 150);
    }

    // 2. 客户端直接下载 PDF（修复缩放、防右侧截断 + 标准 ASCII 页码）
    async function exportDirectPDF() {
      closeExportModal();
      setPreviewMode('a4-exact');

      if (document.fonts) await document.fonts.ready;

      const element = document.getElementById('paper-mount-point');
      const filename = getResolvedFileName('pdf');

      const opt = {
        margin: [15, 14, 15, 14],
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          width: 794,
          windowWidth: 794,
          scrollX: 0,
          scrollY: 0
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: {
          mode: ['avoid-all', 'css', 'legacy'],
          avoid: ['.question-row', '.section-title', '.paper-header']
        }
      };

      if (window.html2pdf) {
        window.html2pdf().set(opt).from(element).toPdf().get('pdf').then(function(pdf) {
          const totalPages = pdf.internal.getNumberOfPages();
          for (let i = 1; i <= totalPages; i++) {
            pdf.setPage(i);
            pdf.setFontSize(9.5);
            pdf.setTextColor(80, 80, 80);
            // 采用标准 ASCII 字符，彻底杜绝乱码
            const text = '— ' + i + ' / ' + totalPages + ' —';
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            pdf.text(text, pageWidth / 2, pageHeight - 8, { align: 'center' });
          }
        }).save();
      } else {
        alert("PDF 转换组件加载中，请稍候重试！");
      }
    }

    // 3. 导出独立 HTML
    function exportStandaloneHTML() {
      closeExportModal();
      const filename = getResolvedFileName('html');
      const mount = document.getElementById('paper-mount-point').innerHTML;
      const fullHtml = \`<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>\${filename}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
  <style>
    @page { size: A4 portrait; margin: 15mm 16mm; }
    body { font-family: "Songti SC", "SimSun", serif; margin: 0; padding: 20px; background: #fff; color: #000; font-size: 10.5pt; line-height: 1.65; }
    .paper-title { text-align: center; font-size: 1.6em; margin: 0 0 10px 0; font-weight: bold; }
    .paper-meta { display: flex; justify-content: space-around; font-size: 0.85em; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
    .section-title { font-size: 1.05em; font-weight: bold; margin: 16px 0 10px; }
    .question-row { break-inside: avoid; page-break-inside: avoid; margin-bottom: 20px; text-align: justify; }
    .q-flex-box { display: flex; justify-content: space-between; gap: 14px; }
    .q-content { flex: 1; }
    .q-graphic-box { width: 200px; flex-shrink: 0; display: flex; justify-content: center; }
    .options-grid.cols-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
    .options-grid.cols-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; }
    .options-grid.cols-1 { display: flex; flex-direction: column; gap: 4px; }
    .blank-space { margin-top: 8px; width: 100%; display: flex; flex-direction: column; }
    .rule-line { width: 100%; height: 24px; border-bottom: 1px solid #cbd5e1; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  \${mount}
</body>
</html>\`;
      downloadBlob(fullHtml, filename, 'text/html;charset=utf-8');
    }

    // 4. 导出 Word 文档
    function exportWordDoc() {
      closeExportModal();
      const filename = getResolvedFileName('doc');
      const mount = document.getElementById('paper-mount-point').innerHTML;
      const wordContent = \`<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset='utf-8'><title>\${filename}</title>
<style>
  body { font-family: SimSun, serif; font-size: 10.5pt; line-height: 1.6; }
  .paper-title { text-align: center; font-size: 16pt; font-weight: bold; }
  .paper-meta { text-align: center; margin-bottom: 15pt; }
  .section-title { font-size: 12pt; font-weight: bold; margin-top: 10pt; }
  .question-row { margin-bottom: 15pt; }
</style>
</head>
<body>\${mount}</body></html>\`;
      downloadBlob(wordContent, filename, 'application/msword;charset=utf-8');
    }

    // 5. 备份 JSON
    function exportJSONBackup() {
      closeExportModal();
      const filename = getResolvedFileName('json');
      const val = document.getElementById('paper-json').value;
      downloadBlob(val, filename, 'application/json;charset=utf-8');
    }

    window.addEventListener('DOMContentLoaded', () => {
      renderFromTextarea();
    });
  </script>
</body>
</html>`;
}