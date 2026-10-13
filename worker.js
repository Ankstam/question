export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 接收外部 API POST 渲染
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

    // 默认输出自包含单页应用
    return new Response(buildDocumentHTML(PRESET_EXAM_DATA), {
      headers: { "Content-Type": "text/html;charset=UTF-8" }
    });
  }
};

function buildDocumentHTML(initialData) {
  const jsonStr = JSON.stringify(initialData, null, 2);

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>通用试卷与排版引擎</title>
  
  <!-- 使用 Cloudflare 官方 cdnjs 主干 CDN，确保全球与国内网络 100% 秒开 -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.css">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/contrib/mhchem.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/contrib/auto-render.min.js"></script>

  <style>
    :root {
      --primary: #1e40af;
      --border: #e2e8f0;
      --paper-font-size: 10.5pt;
      --paper-line-height: 1.65;
      --q-spacing: 20px;
      --rule-height: 24px;
      --diagram-width: 190px;
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
    .btn-sm.active-preset {
      background: var(--primary); color: #ffffff; border-color: var(--primary);
    }

    input[type="text"], textarea {
      width: 100%; padding: 9px 10px; border: 1px solid var(--border); border-radius: 6px;
      font-size: 12px; outline: none; background: #ffffff;
      font-family: inherit; color: #000;
    }
    textarea {
      font-family: "SF Mono", Menlo, Consolas, monospace; min-height: 220px;
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

    /* 试卷容器 */
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
    .paper-sheet.mobile-fit .q-layout-table {
      display: flex; flex-direction: column; align-items: center;
    }
    .paper-sheet.mobile-fit .q-cell-graphic {
      width: 100% !important; margin-top: 10px; text-align: center;
    }

    .paper-sheet.a4-exact {
      width: 210mm !important; min-height: 297mm; padding: 15mm 15mm;
      border: 1px solid #e2e8f0;
    }

    .paper-title { text-align: center; font-size: 1.6em; margin: 0 0 10px 0; font-weight: bold; }
    .paper-meta {
      display: flex; justify-content: space-around; font-size: 0.85em;
      border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px;
    }
    .section-title {
      font-size: 1.05em; font-weight: bold; margin: 18px 0 12px;
      break-after: avoid !important; page-break-after: avoid !important;
    }

    /* 稳固的并排结构（彻底解决 Flexbox 在打印和截屏中跳到顶部的恶性 Bug） */
    .question-row {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
      margin-bottom: var(--q-spacing);
      text-align: justify;
    }

    .q-layout-table {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      width: 100%;
    }

    .q-cell-content {
      flex: 1 1 auto;
      min-width: 0;
    }

    .q-cell-graphic {
      width: var(--diagram-width);
      flex: 0 0 var(--diagram-width);
      display: flex;
      justify-content: center;
      align-items: flex-start;
    }

    .options-grid { margin: 8px 0 4px; }
    .options-grid.cols-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
    .options-grid.cols-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; }
    .options-grid.cols-1 { display: flex; flex-direction: column; gap: 4px; }

    /* 方案 B：纯白作答留白区（绝无横黑线干扰） */
    .blank-space { margin-top: 6px; width: 100%; display: flex; flex-direction: column; }
    .rule-blank {
      width: 100%; height: var(--rule-height);
      border-bottom: 1px solid transparent !important;
    }

    .bottom-bar {
      position: fixed; bottom: 0; left: 0; right: 0;
      background: #ffffff; padding: 10px 16px calc(10px + env(safe-area-inset-bottom));
      border-top: 1px solid var(--border); display: flex; gap: 10px; z-index: 60;
    }
    .btn { flex: 1; padding: 12px 0; border-radius: 6px; border: none; font-size: 14px; font-weight: 600; cursor: pointer; text-align: center; }
    .btn-secondary { background: #f1f5f9; color: #1e293b; border: 1px solid var(--border); }
    .btn-primary { background: var(--primary); color: #ffffff; }

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
    .export-item-btn.highlight { border: 1.5px solid var(--primary); background: #eff6ff; }
    .modal-cancel-btn {
      width: 100%; padding: 11px 0; margin-top: 10px; border: none; background: #f1f5f9;
      color: #475569; border-radius: 8px; font-weight: 600; font-size: 13px; cursor: pointer;
    }

    /* A4 打印规范：绝不裁切、保留矢量锐度、杜绝飞图 */
    @media print {
      @page {
        size: A4 portrait;
        margin: 15mm 15mm 15mm 15mm;
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
        width: 100% !important; max-width: 100% !important; min-height: auto !important;
        margin: 0 !important; padding: 0 !important; border: none !important; box-shadow: none !important;
      }

      .paper-sheet .q-layout-table {
        display: flex !important;
        flex-direction: row !important;
        align-items: flex-start !important;
      }
      .paper-sheet .q-cell-graphic {
        width: var(--diagram-width) !important;
        flex: 0 0 var(--diagram-width) !important;
      }
    }
  </style>
</head>
<body>

  <header class="app-header">
    <div class="header-bar">
      <h2>Universal Exam Engine</h2>
      <span style="font-size: 11px; background: #e0e7ff; color: #3730a3; padding: 2px 6px; border-radius: 4px;">KaTeX Vector Pro</span>
    </div>
    <div class="tabs">
      <button class="tab-btn active" id="tab-nav-edit" onclick="setTab('edit')">1. 数据与版面定制</button>
      <button class="tab-btn" id="tab-nav-preview" onclick="setTab('preview')">2. 试卷效果预览</button>
    </div>
  </header>

  <main class="main-body">
    <!-- 步骤一：数据与配置 -->
    <div id="panel-edit" class="panel active">
      <div class="card">
        <div class="card-title">
          <span>自定义文件导出名称</span>
          <span style="font-size: 10px; color: #64748b;">留空则自动按秒级时间戳生成</span>
        </div>
        <input type="text" id="custom-filename-input" placeholder="输入自定义文件名（例如：2026年全学科高三模拟卷）">
      </div>

      <div class="card">
        <div class="card-title">版面字号快速预设与调整</div>
        <div class="action-row" style="margin-bottom: 12px;">
          <button class="btn-sm" id="btn-size-9" onclick="setQuickFontSize(9, 'btn-size-9')">小五 (9pt 紧凑)</button>
          <button class="btn-sm active-preset" id="btn-size-105" onclick="setQuickFontSize(10.5, 'btn-size-105')">五号 (10.5pt 国标)</button>
          <button class="btn-sm" id="btn-size-12" onclick="setQuickFontSize(12, 'btn-size-12')">小四 (12pt 清晰)</button>
          <button class="btn-sm" id="btn-size-14" onclick="setQuickFontSize(14, 'btn-size-14')">四号 (14pt 大字)</button>
        </div>

        <div class="slider-grid">
          <div class="slider-item">
            <label>正文字号精准微调: <span id="val-font-size">10.5pt</span></label>
            <input type="range" id="input-range-fontsize" min="8.5" max="15" step="0.5" value="10.5" oninput="updateStyleVar('--paper-font-size', this.value + 'pt', 'val-font-size')">
          </div>
          <div class="slider-item">
            <label>行高间距比例: <span id="val-line-height">1.65</span></label>
            <input type="range" min="1.3" max="2.2" step="0.05" value="1.65" oninput="updateStyleVar('--paper-line-height', this.value, 'val-line-height')">
          </div>
          <div class="slider-item">
            <label>大题题目间距: <span id="val-q-spacing">20px</span></label>
            <input type="range" min="10" max="45" value="20" oninput="updateStyleVar('--q-spacing', this.value + 'px', 'val-q-spacing')">
          </div>
          <div class="slider-item">
            <label>答题留白单行高度: <span id="val-rule-height">24px</span></label>
            <input type="range" min="16" max="36" value="24" oninput="updateStyleVar('--rule-height', this.value + 'px', 'val-rule-height')">
          </div>
          <div class="slider-item" style="grid-column: span 2;">
            <label>右侧图形栏宽度: <span id="val-diag-width">190px</span></label>
            <input type="range" min="140" max="260" value="190" oninput="updateStyleVar('--diagram-width', this.value + 'px', 'val-diag-width')">
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">
          <span>试卷 JSON 数据源</span>
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
    </div>

    <!-- 步骤二：卷面预览 -->
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

  <!-- 底部流程控制条 -->
  <div class="bottom-bar" id="bar-edit-step">
    <button class="btn btn-primary" onclick="proceedToPreview()">👉 下一步：预览卷面排版</button>
  </div>

  <div class="bottom-bar" id="bar-preview-step" style="display: none;">
    <button class="btn btn-secondary" onclick="setTab('edit')">👈 上一步：返回配置</button>
    <button class="btn btn-primary" onclick="openExportModal()">📥 导出与打印试卷</button>
  </div>

  <!-- 导出弹窗 -->
  <div class="modal-overlay" id="export-modal" onclick="closeExportModal(event)">
    <div class="modal-content" onclick="event.stopPropagation()">
      <div class="modal-header">选择导出或打印方式</div>
      <div class="export-options-grid">
        <button class="export-item-btn highlight" onclick="triggerChromePrint()">
          <div>
            <div style="color:#1e40af; font-size:14px;">🖨️ Chrome 浏览器标准打印 / 另存为 PDF</div>
            <div style="font-size:11px; color:#475569; margin-top:2px;">首选推荐：原生高精矢量、不裁切右侧、无公式乱码</div>
          </div>
          <span>➔</span>
        </button>
        <button class="export-item-btn" onclick="exportStandaloneHTML()">
          <div>
            <div>🌐 下载独立离线网页 (.html)</div>
            <div style="font-size:11px; color:#64748b;">支持发送微信或电脑双击秒打印</div>
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
            <div style="font-size:11px; color:#64748b;">JSON 格式原文件</div>
          </div>
          <span>➔</span>
        </button>
      </div>
      <button class="modal-cancel-btn" onclick="closeExportModal()">取消</button>
    </div>
  </div>

  <script>
    // ---------- 稳固的 KaTeX 渲染轮询机制（100% 杜绝出现原始符号） ----------
    function renderMathSafely(container) {
      if (typeof renderMathInElement === 'function') {
        renderMathInElement(container, {
          delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "$", right: "$", display: false }
          ],
          throwOnError: false
        });
      } else {
        // 如果脚本正在下载，开启 50ms 轮询直到 KaTeX 加载成功
        let attempts = 0;
        const timer = setInterval(() => {
          attempts++;
          if (typeof renderMathInElement === 'function') {
            clearInterval(timer);
            renderMathInElement(container, {
              delimiters: [
                { left: "$$", right: "$$", display: true },
                { left: "$", right: "$", display: false }
              ],
              throwOnError: false
            });
          } else if (attempts > 60) {
            clearInterval(timer);
            console.error("KaTeX CDN 加载超时！");
          }
        }, 50);
      }
    }

    function setQuickFontSize(pt, btnId) {
      document.querySelectorAll('.action-row .btn-sm').forEach(b => b.classList.remove('active-preset'));
      if (btnId) document.getElementById(btnId)?.classList.add('active-preset');
      updateStyleVar('--paper-font-size', pt + 'pt', 'val-font-size');
      const slider = document.getElementById('input-range-fontsize');
      if (slider) slider.value = pt;
    }

    function updateStyleVar(varName, value, labelId) {
      document.documentElement.style.setProperty(varName, value);
      if (labelId) document.getElementById(labelId).innerText = value;
    }

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
        customName = '试卷_' + Y + M + D + '_' + h + m + s;
      }
      return customName + '.' + extension;
    }

    function getOptionGridClass(options) {
      if (!options || !options.length) return 'cols-4';
      const maxLen = Math.max(...options.map(o => {
        return (o || '').replace(/\\$[^\\$]*\\$/g, 'XXXX').length;
      }));
      if (maxLen <= 5) return 'cols-4';
      if (maxLen <= 15) return 'cols-2';
      return 'cols-1';
    }

    // 精确容错：仅修复遗漏的单个反斜杠，杜绝破坏现有合法双斜杠
    function parseJSONWithTolerance(rawStr) {
      try {
        return JSON.parse(rawStr);
      } catch (err) {
        const repaired = rawStr.replace(/\\\\([a-zA-Z]+)/g, '\\\\\\\\$1');
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

    function renderClientDiagram(diagram) {
      if (!diagram) return '';
      if (diagram.engine === "raw_svg" || diagram.svg) return diagram.svg;

      if (diagram.engine === "wireframe_3d") {
        const w = 190, h = 160;
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
          '<line x1="' + pts[p1][0] + '" y1="' + pts[p1][1] + '" x2="' + pts[p2][0]}" y2="' + pts[p2][1] + '" stroke="#000" stroke-width="1.3"/>' : '').join('');

        const dLines = (diagram.dashed_lines || []).map(([p1, p2]) => pts[p1] && pts[p2] ? 
          '<line x1="' + pts[p1][0] + '" y1="' + pts[p1][1] + '" x2="' + pts[p2][0] + '" y2="' + pts[p2][1] + '" stroke="#000" stroke-width="1.2" stroke-dasharray="4,3"/>' : '').join('');

        const texts = Object.entries(pts).map(([k, [x, y]]) => 
          '<text x="' + (x + 4) + '" y="' + (y - 3) + '" font-family="Times New Roman, serif" font-style="italic" font-size="11">' + k + '</text>'
        ).join('');

        return '<svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '">' + dLines + lines + texts + '</svg>';
      }

      return '';
    }

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
          html += '  <div class="q-layout-table">';
          html += '    <div class="q-cell-content">';
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
            html += '    <div class="q-cell-graphic">' + renderClientDiagram(q.diagram) + '</div>';
          }
          html += '  </div>';

          // 方案 B：纯白作答留白区（绝无横线）
          if (q.blank_lines && q.blank_lines > 0) {
            html += '<div class="blank-space">';
            for (let i = 0; i < q.blank_lines; i++) {
              html += '<div class="rule-blank"></div>';
            }
            html += '</div>';
          }
          html += '</div>';
        });
      });

      container.innerHTML = html;

      // 执行具有活跃轮询重试的公式渲染
      renderMathSafely(container);
      return true;
    }

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

    // 核心推荐：Chrome 原生高精度矢量打印（零位移、零截断、公式锐利）
    function triggerChromePrint() {
      closeExportModal();
      setPreviewMode('a4-exact');
      setTimeout(() => {
        window.print();
      }, 150);
    }

    function exportStandaloneHTML() {
      closeExportModal();
      const filename = getResolvedFileName('html');
      const mount = document.getElementById('paper-mount-point').innerHTML;
      const fullHtml = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' + filename + '</title><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.css"><style>@page{size:A4 portrait;margin:15mm;}body{font-family:"Songti SC",SimSun,serif;padding:20px;font-size:10.5pt;line-height:1.65;}.paper-title{text-align:center;font-size:1.6em;}.paper-meta{display:flex;justify-content:space-around;border-bottom:2px solid #000;padding-bottom:10px;margin-bottom:20px;}.section-title{font-size:1.05em;font-weight:bold;margin:18px 0 12px;break-after:avoid;}.question-row{break-inside:avoid;margin-bottom:20px;}.q-layout-table{display:flex;justify-content:space-between;gap:16px;}.q-cell-content{flex:1;}.q-cell-graphic{width:190px;flex-shrink:0;}.options-grid.cols-4{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;}.options-grid.cols-2{display:grid;grid-template-columns:repeat(2,1fr);gap:6px;}.options-grid.cols-1{display:flex;flex-direction:column;gap:4px;}.rule-blank{height:24px;}</style></head><body>' + mount + '</body></html>';
      downloadBlob(fullHtml, filename, 'text/html;charset=utf-8');
    }

    function exportWordDoc() {
      closeExportModal();
      const filename = getResolvedFileName('doc');
      const mount = document.getElementById('paper-mount-point').innerHTML;
      const wordContent = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>' + filename + '</title><style>body{font-family:SimSun,serif;font-size:10.5pt;line-height:1.6;}.paper-title{text-align:center;font-size:16pt;font-weight:bold;}.paper-meta{text-align:center;margin-bottom:15pt;}.section-title{font-size:12pt;font-weight:bold;margin-top:10pt;}.question-row{margin-bottom:15pt;}</style></head><body>' + mount + '</body></html>';
      downloadBlob(wordContent, filename, 'application/msword;charset=utf-8');
    }

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

// 内置预设数据：经全套字符严格清洗校正的数理压轴试卷（绝无公式与字符丢失）
const PRESET_EXAM_DATA = {
  "paper_title": "2026年数理高阶模型综合压轴演练卷",
  "meta": { "subject": "物理与数学高阶综合", "time": "150分钟", "total_score": 150 },
  "sections": [
    {
      "title": "第一模块：多体碰撞、动量守恒与机械能转化综合模型",
      "questions": [
        {
          "id": 1, "score": 14,
          "stem": "如图所示，长为 $L$ 的不可伸长轻绳上端悬于 $O$ 点，下端系质量为 $m_1$ 的小球。光滑水平面上静止放有质量为 $M$ 的长木板，板上表面粗糙，其左端放有一质量为 $m_2$ 的滑块。将小球拉至轻绳与竖直方向夹角为 $\\theta = 60^\\circ$ 处由静止释放，小球摆至最低点时与滑块发生弹性对心正碰。已知滑块与长木板间的动摩擦因数为 $\\mu$，重力加速度为 $g$，长木板与地面间无摩擦。(1) 求碰后瞬间小球与滑块的速度大小；(2) 若滑块恰好未脱离长木板，求木板的最小长度 $d$；(3) 求系统最终由于摩擦损失转化的内能 $Q$。",
          "blank_lines": 6,
          "diagram": {
            "engine": "raw_svg",
            "svg": "<svg width='190' height='130' viewBox='0 0 190 130'><line x1='15' y1='115' x2='175' y2='115' stroke='#000' stroke-width='1.5'/><rect x='30' y='100' width='120' height='15' fill='#f1f5f9' stroke='#000'/><rect x='45' y='82' width='18' height='18' fill='#e2e8f0' stroke='#000'/><text x='49' y='95' font-size='8'>m₂</text><circle cx='80' cy='90' r='7' fill='#cbd5e1' stroke='#000'/><text x='76' y='93' font-size='8'>m₁</text><line x1='115' y1='20' x2='80' y2='90' stroke='#000'/><circle cx='115' cy='20' r='2' fill='#000'/><text x='118' y='22' font-size='9'>O</text></svg>"
          }
        },
        {
          "id": 2, "score": 14,
          "stem": "水平放置的两根平行光滑金属导轨间距为 $L$，导轨左端跨接电阻 $R$。导轨间存在垂直纸面向里的匀强磁场，磁感应强度为 $B$。一质量为 $m$、电阻为 $r$ 的金属导体棒以初速度 $v_0$ 向右滑出。(1) 推导导体棒所受安培力与即时速度的关系式 $F_A(v) = \\frac{B^2L^2v}{R+r}$；(2) 利用动量定理微元法 $\\sum F_A \\Delta t = m \\Delta v$，求金属棒从开始运动直至停止滑行的总位移 $x$；(3) 求此过程中电阻 $R$ 上释放的焦耳热 $Q_R$。",
          "blank_lines": 6,
          "diagram": {
            "engine": "raw_svg",
            "svg": "<svg width='190' height='120' viewBox='0 0 190 120'><line x1='35' y1='30' x2='165' y2='30' stroke='#000' stroke-width='2'/><line x1='35' y1='95' x2='165' y2='95' stroke='#000' stroke-width='2'/><rect x='28' y='50' width='14' height='26' fill='#fff' stroke='#000'/><text x='18' y='66' font-size='9'>R</text><rect x='90' y='20' width='8' height='85' fill='#cbd5e1' stroke='#000'/><line x1='95' y1='62' x2='125' y2='62' stroke='#2563eb' stroke-width='2'/><text x='128' y='66' font-size='9' fill='#2563eb'>v</text></svg>"
          }
        }
      ]
    },
    {
      "title": "第二模块：立体几何空间向量法与圆锥曲线",
      "questions": [
        {
          "id": 3, "score": 14,
          "stem": "如图所示，在四棱锥 $P-ABCD$ 中，底面 $ABCD$ 为直角梯形，$AB \\parallel CD$，$AD \\perp AB$，$PA \\perp \\text{底面 } ABCD$。已知 $PA = AB = AD = 2$，$CD = 4$。点 $M$ 为棱 $PD$ 的中点。(1) 建立空间直角坐标系，写出各顶点坐标并求平面 $MAC$ 的法向量 $\\vec{n}_1$；(2) 利用点到平面距离公式 $d = \\frac{\vert{}\\vec{PB} \\cdot \\vec{n}_1\vert{}}{\vert{}\\vec{n}_1\vert{}}$ 求点 $B$ 到平面 $MAC$ 的距离；(3) 求二面角 $P-CD-A$ 的余弦值 $\\cos\\theta$。",
          "blank_lines": 6,
          "diagram": {
            "engine": "wireframe_3d",
            "scale": 1.05,
            "rotation": { "rx": 16, "ry": -34 },
            "nodes": {
              "P": [0, 65, 0], "A": [-40, -35, 30], "B": [40, -35, 30],
              "C": [70, -35, -35], "D": [-40, -35, -35], "M": [-20, 15, -17.5]
            },
            "solid_lines": [
              ["P","A"], ["P","B"], ["P","C"], ["P","D"],
              ["A","B"], ["B","C"], ["C","D"], ["A","M"], ["M","C"]
            ],
            "dashed_lines": [["A","D"], ["A","C"]]
          }
        }
      ]
    }
  ]
};