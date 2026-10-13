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

    return new Response(buildDocumentHTML(EMPTY_PAPER), {
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
  <title>ExamCraft · 纯净排版引擎</title>
  
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.css">
  <script defer src="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.js"></script>
  <script defer src="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/contrib/mhchem.min.js"></script>
  <script defer src="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/contrib/auto-render.min.js"></script>
  <script defer src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>

  <style>
    :root {
      --primary: #4f46e5;
      --primary-light: #e0e7ff;
      --primary-soft: #f5f3ff;
      --danger: #ef4444;
      --danger-light: #fee2e2;
      --surface: #ffffff;
      --bg: #f1f5f9;
      --text-main: #0f172a;
      --text-sub: #64748b;
      --border: #e2e8f0;
      --radius: 14px;
      --shadow: 0 4px 16px -2px rgba(15, 23, 42, 0.06);
      --shadow-lg: 0 12px 32px -4px rgba(15, 23, 42, 0.1);
      --paper-font-size: 10.5pt;
      --paper-line-height: 1.65;
      --q-spacing: 18px;
      --rule-height: 22px;
      --diagram-width: 160px;
      --paper-padding-v: 14mm;
      --paper-padding-h: 14mm;
      --option-gap: 4px;
      --stem-option-gap: 6px;
    }

    * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    body {
      margin: 0; padding: 0;
      background: var(--bg);
      color: var(--text-main);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    svg { overflow: visible !important; }

    .app-header {
      position: sticky; top: 0; z-index: 50;
      background: rgba(255,255,255,0.92);
      backdrop-filter: blur(16px) saturate(180%);
      border-bottom: 1px solid rgba(226,232,240,0.8);
    }
    .header-bar {
      padding: 12px 18px; display: flex; justify-content: space-between; align-items: center;
    }
    .header-bar h2 {
      margin: 0; font-size: 16px; font-weight: 800;
      background: linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    .badge {
      font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 9999px;
      background: var(--primary-light); color: var(--primary); margin-left: 4px;
    }
    .tabs { display: flex; gap: 6px; padding: 0 12px 10px; }
    .tab-btn {
      flex: 1; padding: 10px 12px; border: none; background: transparent;
      font-size: 13px; font-weight: 600; color: var(--text-sub);
      border-radius: 10px; cursor: pointer; min-height: 42px; transition: all 0.2s;
    }
    .tab-btn:hover { background: rgba(79,70,229,0.06); color: var(--primary); }
    .tab-btn.active {
      background: #fff; color: var(--primary);
      box-shadow: 0 2px 8px rgba(79,70,229,0.12); font-weight: 700;
    }

    .main-body { padding: 14px; padding-bottom: 140px; max-width: 1100px; margin: 0 auto; }
    .panel { display: none; animation: fadeIn 0.25s ease; }
    .panel.active { display: block; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }

    .card {
      background: var(--surface); padding: 16px; border-radius: var(--radius);
      border: 1px solid var(--border); box-shadow: var(--shadow); margin-bottom: 14px;
    }
    .card-title {
      font-size: 13.5px; font-weight: 700; margin-bottom: 12px;
      display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;
    }

    .action-row { display: flex; gap: 8px; margin-bottom: 10px; flex-wrap: wrap; }
    .btn-sm {
      padding: 7px 12px; font-size: 12px; font-weight: 600; border-radius: 9px;
      border: 1px solid var(--border); background: #fff; color: var(--text-main); cursor: pointer;
      min-height: 34px; transition: all 0.18s;
    }
    .btn-sm:hover { border-color: var(--primary); color: var(--primary); background: var(--primary-soft); }
    .btn-sm.active-preset { background: var(--primary); color: #fff; border-color: var(--primary); }
    .btn-sm.danger { border-color: #fca5a5; color: var(--danger); }

    input[type="text"], textarea, select {
      width: 100%; padding: 10px 12px; border: 1.5px solid var(--border); border-radius: 10px;
      font-size: 13px; outline: none; background: #f8fafc; color: var(--text-main);
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    input:focus, textarea:focus, select:focus {
      border-color: var(--primary); background: #fff;
      box-shadow: 0 0 0 3px rgba(79,70,229,0.12);
    }
    textarea { font-family: "SF Mono", Menlo, Consolas, monospace; min-height: 160px; line-height: 1.55; }
    select { cursor: pointer; }

    .slider-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .slider-item { display: flex; flex-direction: column; gap: 4px; }
    .slider-item label { font-size: 11.5px; color: var(--text-sub); display: flex; justify-content: space-between; font-weight: 600; }
    .slider-item input[type="range"] { width: 100%; margin: 4px 0; accent-color: var(--primary); }

    .layout-template-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 8px; margin-bottom: 12px; }
    .layout-tpl-btn {
      padding: 10px 8px; border: 1.5px solid var(--border); border-radius: 10px;
      background: #fff; font-size: 12px; font-weight: 600; cursor: pointer; text-align: center;
      transition: all 0.18s;
    }
    .layout-tpl-btn:hover { border-color: var(--primary); color: var(--primary); }
    .layout-tpl-btn.active { border-color: var(--primary); background: var(--primary-soft); color: var(--primary); }

    .history-list { max-height: 240px; overflow-y: auto; border-radius: 10px; }
    .history-item {
      display: flex; justify-content: space-between; align-items: center;
      padding: 10px 12px; border-bottom: 1px solid var(--border); font-size: 13px; gap: 8px;
    }
    .history-item:hover { background: #f8fafc; }
    .history-item .title { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; cursor: pointer; }
    .history-item .title:hover { color: var(--primary); }
    .history-item .time { color: var(--text-sub); font-size: 11px; }

    .tag {
      display: inline-block; padding: 1px 8px; margin: 1px 2px; border-radius: 9999px;
      font-size: 10.5px; background: var(--primary-light); color: #3730a3; font-weight: 600;
    }

    .preview-bar {
      display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; gap: 8px; flex-wrap: wrap;
    }
    .mistake-counter {
      font-size: 12px; font-weight: 700; color: var(--danger);
      background: var(--danger-light); padding: 5px 10px; border-radius: 8px;
    }

    .paper-scroller { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; padding-bottom: 20px; }
    .paper-sheet {
      background: #fffeff !important; margin: 0 auto;
      font-family: "Songti SC", "SimSun", "Times New Roman", "Yu Mincho", serif;
      color: #111; font-size: var(--paper-font-size); line-height: var(--paper-line-height);
    }
    .paper-sheet.mobile-fit { width: 100% !important; padding: 12px 8px; }
    .paper-sheet.desktop-mode {
      width: 100% !important; max-width: 920px; padding: 28px 32px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06), 0 16px 32px rgba(0,0,0,0.08);
      border: 1px solid #e5e7eb;
    }
    .paper-sheet.a4-exact {
      width: 210mm !important; min-height: 297mm;
      padding: var(--paper-padding-v) var(--paper-padding-h);
      box-shadow: 0 1px 3px rgba(0,0,0,0.05), 0 8px 20px rgba(0,0,0,0.08), 0 20px 40px rgba(0,0,0,0.06);
      border: 1px solid #e2e8f0;
      background: linear-gradient(to bottom, #fffeff 0%, #fdfcfa 100%) !important;
    }

    .paper-title { text-align: center; font-size: 1.55em; margin: 0 0 18px 0; font-weight: bold; }
    .section-title {
      font-size: 1.08em; font-weight: bold; margin: 16px 0 10px;
      break-after: avoid !important; page-break-after: avoid !important;
    }

    .question-row {
      position: relative;
      break-inside: avoid !important; page-break-inside: avoid !important;
      margin-bottom: var(--q-spacing); text-align: justify;
    }
    .question-row.is-mistake { background: rgba(239,68,68,0.04); border-radius: 8px; }
    .question-row.allow-break { break-inside: auto !important; page-break-inside: auto !important; }

    .mistake-btn {
      position: absolute; right: 0; top: -6px;
      font-size: 11px; padding: 3px 8px; border-radius: 6px;
      border: 1px solid var(--border); background: #fff; color: var(--text-sub); cursor: pointer;
      z-index: 5;
    }
    .question-row.is-mistake .mistake-btn {
      background: var(--danger); color: #fff; border-color: var(--danger); font-weight: bold;
    }

    /* 纯净模式：只保留标题和题目 */
    .clean-mode .mistake-btn,
    .clean-mode .tag,
    .clean-mode .q-score { display: none !important; }

    .layout-standard .q-layout-box { display: flex; justify-content: space-between; align-items: flex-start; gap: 14px; width: 100%; }
    .layout-standard .q-cell-content { flex: 1 1 auto; min-width: 0; }
    .layout-standard .q-cell-graphic { width: var(--diagram-width); flex: 0 0 var(--diagram-width); display: flex; justify-content: center; }

    .layout-twocol .questions-flow { column-count: 2; column-gap: 18px; column-rule: 1px solid #e2e8f0; }
    .layout-twocol .question-row { break-inside: avoid; }
    .layout-twocol .q-layout-box { display: block; }
    .layout-twocol .q-cell-graphic { width: 100%; max-width: 130px; margin: 6px auto; text-align: center; }

    .layout-compact .q-layout-box { display: flex; gap: 10px; align-items: flex-start; }
    .layout-compact .q-cell-content { flex: 1; min-width: 0; }
    .layout-compact .q-cell-graphic { width: 105px; flex: 0 0 105px; }
    .layout-compact .q-cell-graphic svg { max-width: 105px; height: auto; }

    .layout-option-newline .options-grid,
    .layout-option-newline .options-grid.cols-4,
    .layout-option-newline .options-grid.cols-2,
    .layout-option-newline .options-grid.cols-1 {
      display: flex !important; flex-direction: column !important; gap: 3px !important;
    }

    .qnum-dot .q-num { font-weight: bold; }
    .qnum-bracket .q-num::before { content: "（"; }
    .qnum-bracket .q-num::after { content: "）"; }
    .qnum-right .q-num-wrap { display: flex; justify-content: space-between; align-items: baseline; }
    .qnum-right .q-num { font-weight: bold; }
    .qnum-right .q-bracket { color: #64748b; font-size: 0.95em; }

    .options-grid { margin: var(--stem-option-gap) 0 3px; }
    .options-grid.cols-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--option-gap); }
    .options-grid.cols-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--option-gap); }
    .options-grid.cols-1 { display: flex; flex-direction: column; gap: var(--option-gap); }

    .blank-space { margin-top: 4px; width: 100%; display: flex; flex-direction: column; }
    .rule-blank { width: 100%; height: var(--rule-height); }

    .bottom-bar {
      position: fixed; bottom: 0; left: 0; right: 0;
      background: rgba(255,255,255,0.94); backdrop-filter: blur(14px);
      padding: 10px 14px calc(10px + env(safe-area-inset-bottom));
      border-top: 1px solid rgba(226,232,240,0.9); display: flex; gap: 10px; z-index: 60;
    }
    .btn {
      flex: 1; padding: 12px 0; border-radius: 12px; border: none; font-size: 13.5px; font-weight: 700;
      cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; min-height: 46px;
    }
    .btn-secondary { background: #f1f5f9; color: var(--text-main); }
    .btn-primary {
      background: linear-gradient(135deg, #4f46e5, #4338ca); color: #fff;
      box-shadow: 0 4px 14px rgba(79,70,229,0.3);
    }

    .modal-overlay {
      display: none; position: fixed; inset: 0;
      background: rgba(15,23,42,0.55); backdrop-filter: blur(6px); z-index: 100;
      justify-content: center; align-items: flex-end;
    }
    .modal-overlay.active { display: flex; }
    .modal-content {
      background: #fff; width: 100%; max-width: 520px; border-radius: 20px 20px 0 0;
      padding: 22px 18px calc(20px + env(safe-area-inset-bottom));
      max-height: 85vh; overflow-y: auto;
    }
    .modal-header { font-size: 16px; font-weight: 800; margin-bottom: 14px; text-align: center; }
    .export-grid { display: flex; flex-direction: column; gap: 8px; }
    .export-item {
      padding: 13px 14px; border: 1.5px solid var(--border); background: #fff;
      border-radius: 12px; display: flex; justify-content: space-between; align-items: center; cursor: pointer;
    }
    .export-item.highlight { border-color: var(--primary); background: var(--primary-soft); }

    .render-status {
      position: fixed; top: 64px; right: 14px; z-index: 70;
      background: #1e293b; color: #fff; padding: 7px 14px; border-radius: 10px;
      font-size: 12.5px; opacity: 0; transition: opacity 0.25s; pointer-events: none;
    }
    .render-status.show { opacity: 0.92; }

    #toast-container {
      position: fixed; top: 70px; left: 50%; transform: translateX(-50%);
      z-index: 200; display: flex; flex-direction: column; gap: 8px; pointer-events: none;
      width: min(92vw, 360px);
    }
    .toast {
      background: #1e293b; color: #fff; padding: 12px 16px; border-radius: 12px;
      font-size: 13.5px; font-weight: 500; box-shadow: 0 8px 24px rgba(0,0,0,0.18);
      animation: toastIn 0.3s ease;
    }
    .toast.success { background: linear-gradient(135deg, #059669, #10b981); }
    .toast.error { background: linear-gradient(135deg, #dc2626, #ef4444); }
    .toast.info { background: linear-gradient(135deg, #4f46e5, #6366f1); }
    .toast.warning { background: linear-gradient(135deg, #d97706, #f59e0b); }
    @keyframes toastIn { from { opacity: 0; transform: translateY(-12px); } to { opacity: 1; transform: none; } }
    .toast-out { animation: toastOut 0.25s ease forwards; }
    @keyframes toastOut { to { opacity: 0; transform: translateY(-8px); } }

    @media print {
      @page { size: A4 portrait; margin: 12mm; }
      .app-header, .bottom-bar, #panel-edit, .preview-bar, .modal-overlay, .mistake-btn, .render-status, #toast-container { display: none !important; }
      .main-body, #panel-preview, .paper-scroller { padding: 0 !important; margin: 0 !important; max-width: none !important; width: 100% !important; overflow: visible !important; }
      div.paper-sheet, div.paper-sheet.a4-exact, div.paper-sheet.mobile-fit, div.paper-sheet.desktop-mode {
        width: 100% !important; max-width: 100% !important; min-height: auto !important;
        margin: 0 !important; padding: 0 !important; border: none !important; box-shadow: none !important;
        background: #fff !important;
      }
      .question-row { break-inside: avoid !important; }
      .question-row.allow-break { break-inside: auto !important; }
      .section-title { break-after: avoid !important; }
      .layout-twocol .questions-flow { column-count: 2; }
      .clean-mode .mistake-btn, .clean-mode .tag, .clean-mode .q-score { display: none !important; }
    }
  </style>
</head>
<body>
  <div id="toast-container"></div>
  <div class="render-status" id="render-status">渲染中...</div>

  <header class="app-header">
    <div class="header-bar">
      <h2>ExamCraft <span class="badge">纯净版</span></h2>
      <div style="font-size:11.5px;color:var(--text-sub);" id="offline-status">在线</div>
    </div>
    <div class="tabs">
      <button class="tab-btn active" id="tab-nav-edit" onclick="setTab('edit')">✏️ 数据与排版</button>
      <button class="tab-btn" id="tab-nav-preview" onclick="setTab('preview')">📄 预览与错题</button>
    </div>
  </header>

  <main class="main-body">
    <!-- 编辑面板 -->
    <div id="panel-edit" class="panel active">
      <div class="card">
        <div class="card-title">
          <span>试卷本地历史库</span>
          <button class="btn-sm" onclick="saveCurrentToHistory()">💾 保存当前试卷</button>
        </div>
        <div class="history-list" id="history-list">
          <div style="padding:16px;color:var(--text-sub);font-size:12.5px;text-align:center;">暂无历史记录</div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">文件导出命名</div>
        <input type="text" id="custom-filename-input" placeholder="留空则按时间戳自动生成">
      </div>

      <div class="card">
        <div class="card-title">
          <span>排版模板与模式</span>
          <button class="btn-sm" onclick="resetLayoutToDefault()">↺ 恢复默认</button>
        </div>

        <div style="margin-bottom:10px;">
          <label style="font-size:11.5px;color:var(--text-sub);font-weight:600;">排版模板</label>
          <div class="layout-template-grid">
            <button class="layout-tpl-btn active" data-tpl="standard" onclick="setLayoutTemplate('standard')">标准单栏</button>
            <button class="layout-tpl-btn" data-tpl="twocol" onclick="setLayoutTemplate('twocol')">双栏流式</button>
            <button class="layout-tpl-btn" data-tpl="compact" onclick="setLayoutTemplate('compact')">紧凑微型图</button>
            <button class="layout-tpl-btn" data-tpl="option-newline" onclick="setLayoutTemplate('option-newline')">选项全换行</button>
          </div>
        </div>

        <div class="slider-grid" style="margin-bottom:12px;">
          <div class="slider-item">
            <label>选项排版模式</label>
            <select id="option-layout-mode" onchange="saveLayoutSettings()">
              <option value="auto">自动网格</option>
              <option value="oneline">每选项一行</option>
              <option value="inline-diagram">选项区+微型图</option>
            </select>
          </div>
          <div class="slider-item">
            <label>题号样式</label>
            <select id="qnum-style" onchange="saveLayoutSettings()">
              <option value="dot">1. （默认）</option>
              <option value="bracket">（1）</option>
              <option value="right">右对齐括号栏</option>
            </select>
          </div>
        </div>

        <div class="action-row" style="margin-bottom:12px;">
          <button class="btn-sm" id="btn-size-9" onclick="setQuickFontSize(9,'btn-size-9')">小五 9pt</button>
          <button class="btn-sm active-preset" id="btn-size-105" onclick="setQuickFontSize(10.5,'btn-size-105')">五号 10.5pt</button>
          <button class="btn-sm" id="btn-size-12" onclick="setQuickFontSize(12,'btn-size-12')">小四 12pt</button>
        </div>

        <div class="slider-grid">
          <div class="slider-item">
            <label>正文字号: <span id="val-font-size">10.5pt</span></label>
            <input type="range" id="input-range-fontsize" min="8.5" max="14" step="0.5" value="10.5" oninput="updateStyleVar('--paper-font-size',this.value+'pt','val-font-size')">
          </div>
          <div class="slider-item">
            <label>行高: <span id="val-line-height">1.65</span></label>
            <input type="range" id="input-range-lineheight" min="1.3" max="2.0" step="0.05" value="1.65" oninput="updateStyleVar('--paper-line-height',this.value,'val-line-height')">
          </div>
          <div class="slider-item">
            <label>大题间距: <span id="val-q-spacing">18px</span></label>
            <input type="range" id="input-range-qspacing" min="8" max="36" value="18" oninput="updateStyleVar('--q-spacing',this.value+'px','val-q-spacing')">
          </div>
          <div class="slider-item">
            <label>留白行高: <span id="val-rule-height">22px</span></label>
            <input type="range" id="input-range-ruleheight" min="14" max="32" value="22" oninput="updateStyleVar('--rule-height',this.value+'px','val-rule-height')">
          </div>
          <div class="slider-item">
            <label>图栏宽度: <span id="val-diag-width">160px</span></label>
            <input type="range" id="input-range-diagwidth" min="100" max="240" value="160" oninput="updateStyleVar('--diagram-width',this.value+'px','val-diag-width')">
          </div>
          <div class="slider-item">
            <label>选项间距: <span id="val-option-gap">4px</span></label>
            <input type="range" id="input-range-optiongap" min="2" max="12" value="4" oninput="updateStyleVar('--option-gap',this.value+'px','val-option-gap')">
          </div>
        </div>

        <div style="margin-top:14px;">
          <label style="font-size:11.5px;color:var(--text-sub);font-weight:600;">高级自定义 CSS</label>
          <textarea id="custom-css" style="min-height:80px;font-size:12px;" placeholder=".question-row { margin-bottom: 12px; }"></textarea>
          <button class="btn-sm" style="margin-top:6px;" onclick="applyCustomCSS()">应用自定义 CSS</button>
        </div>
      </div>

      <div class="card">
        <div class="card-title">
          <span>试卷 JSON 数据</span>
          <span style="font-size:10px;color:var(--text-sub);">仅保留标题 + 题目</span>
        </div>
        <div class="action-row">
          <button class="btn-sm" onclick="pasteFromClipboard()">📋 粘贴</button>
          <button class="btn-sm" onclick="triggerFileInput()">📂 导入</button>
          <button class="btn-sm" onclick="forceRepairJSON()">🔧 强制修复</button>
          <button class="btn-sm danger" onclick="clearJson()">🗑️ 清空</button>
          <input type="file" id="file-uploader" accept=".json,.txt" style="display:none;" onchange="handleFileUpload(event)">
        </div>
        <textarea id="paper-json" spellcheck="false">${jsonStr}</textarea>
      </div>
    </div>

    <!-- 预览面板 -->
    <div id="panel-preview" class="panel">
      <div class="preview-bar">
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          <button class="btn-sm" id="btn-fit" style="background:var(--primary);color:#fff;" onclick="setPreviewMode('mobile-fit')">📱 手机</button>
          <button class="btn-sm" id="btn-desktop" onclick="setPreviewMode('desktop')">💻 电脑</button>
          <button class="btn-sm" id="btn-a4" onclick="setPreviewMode('a4-exact')">📄 A4</button>
          <button class="btn-sm" id="btn-clean" style="background:var(--primary);color:#fff;" onclick="toggleCleanMode()">🧹 纯净模式</button>
        </div>
        <div style="display:flex;align-items:center;gap:6px;">
          <span class="mistake-counter" id="mistake-count-text">错题: 0</span>
          <button class="btn-sm" onclick="filterMistakesView()">🔍 仅错题</button>
        </div>
      </div>
      <div class="paper-scroller">
        <div class="paper-sheet mobile-fit layout-standard clean-mode" id="paper-mount-point"></div>
      </div>
    </div>
  </main>

  <div class="bottom-bar">
    <button class="btn btn-secondary" onclick="renderPaperFromTextarea(true)">🔄 同步</button>
    <button class="btn btn-primary" onclick="openExportModal()">📥 导出/打印</button>
  </div>

  <div class="modal-overlay" id="export-modal" onclick="closeExportModal(event)">
    <div class="modal-content" onclick="event.stopPropagation()">
      <div class="modal-header">导出中心</div>
      <div class="export-grid">
        <button class="export-item highlight" onclick="triggerChromePrint(false)">
          <div>
            <div style="color:var(--primary);font-weight:700;">🖨️ 原生矢量打印 / PDF（整卷）</div>
            <div style="font-size:11.5px;color:var(--text-sub);margin-top:2px;">推荐 · 100% 矢量无损</div>
          </div><span>➔</span>
        </button>
        <button class="export-item" style="border-color:#fca5a5;background:#fff1f2;" onclick="triggerChromePrint(true)">
          <div><div style="color:var(--danger);font-weight:700;">📑 仅错题矢量打印 / PDF</div></div><span>➔</span>
        </button>
        <button class="export-item" onclick="exportDirectPDF(false)">
          <div><div style="font-weight:600;">📑 整卷直接下载 PDF</div></div><span>➔</span>
        </button>
        <button class="export-item" onclick="exportStandaloneHTML()">
          <div><div style="font-weight:600;">🌐 导出独立 HTML</div></div><span>➔</span>
        </button>
      </div>
      <button class="btn-sm" style="width:100%;margin-top:12px;justify-content:center;padding:10px 0;" onclick="closeExportModal()">取消</button>
    </div>
  </div>

  <script>
    var currentPaperData = null;
    var mistakeQuestionIds = new Set();
    var isFilteringMistakes = false;
    var currentLayoutTemplate = 'standard';
    var isCleanMode = true; // 默认开启纯净模式
    var renderTimer = null;
    var HISTORY_KEY = 'examcraft_history_v1';
    var MAX_HISTORY = 30;

    var DEFAULT_LAYOUT = {
      '--paper-font-size': '10.5pt',
      '--paper-line-height': '1.65',
      '--q-spacing': '18px',
      '--rule-height': '22px',
      '--diagram-width': '160px',
      '--option-gap': '4px',
      '--stem-option-gap': '6px',
      '--paper-padding-v': '14mm',
      '--paper-padding-h': '14mm'
    };

    function showToast(msg, type) {
      type = type || 'info';
      var container = document.getElementById('toast-container');
      var el = document.createElement('div');
      el.className = 'toast ' + type;
      el.textContent = msg;
      container.appendChild(el);
      setTimeout(function() {
        el.classList.add('toast-out');
        setTimeout(function() { if (el.parentNode) el.parentNode.removeChild(el); }, 260);
      }, 2600);
    }

    window.addEventListener('DOMContentLoaded', function() {
      loadSavedLayout();
      renderHistoryList();
      renderPaperFromTextarea(true);
      updateOnlineStatus();
      window.addEventListener('online', updateOnlineStatus);
      window.addEventListener('offline', updateOnlineStatus);

      var jsonEl = document.getElementById('paper-json');
      if (jsonEl) jsonEl.addEventListener('input', function(){ debouncedRender(); });
    });

    function updateOnlineStatus() {
      var el = document.getElementById('offline-status');
      el.textContent = navigator.onLine ? '在线' : '离线模式';
      el.style.color = navigator.onLine ? '' : '#ef4444';
    }

    function showRenderStatus(show) {
      var el = document.getElementById('render-status');
      if (show) el.classList.add('show'); else el.classList.remove('show');
    }

    function debouncedRender() {
      if (renderTimer) clearTimeout(renderTimer);
      renderTimer = setTimeout(function(){ renderPaperFromTextarea(false); }, 380);
    }

    // 历史库
    function getHistory() {
      try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch(e){ return []; }
    }
    function saveHistory(list) {
      try { localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, MAX_HISTORY))); } catch(e){}
    }
    function saveCurrentToHistory() {
      var raw = document.getElementById('paper-json').value.trim();
      if (!raw) { showToast('当前没有试卷数据', 'warning'); return; }
      var data;
      try { data = parseJSONWithTolerance(raw); } catch(e){ showToast('JSON 无效', 'error'); return; }
      var list = getHistory();
      list.unshift({
        id: Date.now().toString(36),
        title: data.paper_title || '未命名试卷',
        time: new Date().toLocaleString(),
        data: data
      });
      saveHistory(list);
      renderHistoryList();
      showToast('已保存到历史库', 'success');
    }
    function loadFromHistory(id) {
      var item = getHistory().find(function(x){ return x.id === id; });
      if (!item) return;
      document.getElementById('paper-json').value = JSON.stringify(item.data, null, 2);
      renderPaperFromTextarea(true);
      setTab('preview');
      showToast('已加载历史试卷', 'success');
    }
    function deleteFromHistory(id) {
      if (!confirm('确定删除？')) return;
      saveHistory(getHistory().filter(function(x){ return x.id !== id; }));
      renderHistoryList();
      showToast('已删除', 'info');
    }
    function renderHistoryList() {
      var list = getHistory();
      var container = document.getElementById('history-list');
      if (!list.length) {
        container.innerHTML = '<div style="padding:16px;color:var(--text-sub);font-size:12.5px;text-align:center;">暂无历史记录</div>';
        return;
      }
      container.innerHTML = list.map(function(item){
        return '<div class="history-item">' +
          '<div class="title" onclick="loadFromHistory(\\''+item.id+'\\')">'+(item.title||'未命名')+'</div>' +
          '<div class="time">'+item.time+'</div>' +
          '<button class="btn-sm danger" style="padding:4px 8px;font-size:11px;" onclick="deleteFromHistory(\\''+item.id+'\\')">删</button></div>';
      }).join('');
    }

    // 排版
    function loadSavedLayout() {
      try {
        var saved = localStorage.getItem('paper_layout_v2');
        if (saved) {
          var obj = JSON.parse(saved);
          if (obj.vars) Object.keys(obj.vars).forEach(function(k){
            document.documentElement.style.setProperty(k, obj.vars[k]);
            updateLabelFromVar(k, obj.vars[k]);
          });
          if (obj.template) setLayoutTemplate(obj.template, true);
          if (obj.optionMode) document.getElementById('option-layout-mode').value = obj.optionMode;
          if (obj.qnumStyle) document.getElementById('qnum-style').value = obj.qnumStyle;
          if (obj.customCSS) document.getElementById('custom-css').value = obj.customCSS;
          syncSlidersFromVars();
          applyCustomCSS(true);
        }
      } catch(e){}
    }
    function saveLayoutSettings() {
      try {
        var vars = {};
        Object.keys(DEFAULT_LAYOUT).forEach(function(k){
          vars[k] = getComputedStyle(document.documentElement).getPropertyValue(k).trim() || DEFAULT_LAYOUT[k];
        });
        localStorage.setItem('paper_layout_v2', JSON.stringify({
          vars: vars,
          template: currentLayoutTemplate,
          optionMode: document.getElementById('option-layout-mode').value,
          qnumStyle: document.getElementById('qnum-style').value,
          customCSS: document.getElementById('custom-css').value
        }));
      } catch(e){}
      debouncedRender();
    }
    function setLayoutTemplate(tpl, silent) {
      currentLayoutTemplate = tpl;
      document.querySelectorAll('.layout-tpl-btn').forEach(function(b){
        b.classList.toggle('active', b.getAttribute('data-tpl') === tpl);
      });
      var sheet = document.getElementById('paper-mount-point');
      if (sheet) {
        sheet.classList.remove('layout-standard','layout-twocol','layout-compact','layout-option-newline');
        sheet.classList.add('layout-' + tpl);
      }
      if (!silent) saveLayoutSettings();
    }
    function updateStyleVar(varName, value, labelId) {
      document.documentElement.style.setProperty(varName, value);
      if (labelId) {
        var el = document.getElementById(labelId);
        if (el) el.innerText = value;
      }
      saveLayoutSettings();
    }
    function updateLabelFromVar(varName, value) {
      var map = {'--paper-font-size':'val-font-size','--paper-line-height':'val-line-height','--q-spacing':'val-q-spacing','--rule-height':'val-rule-height','--diagram-width':'val-diag-width','--option-gap':'val-option-gap'};
      var id = map[varName];
      if (id) { var el = document.getElementById(id); if (el) el.innerText = value; }
    }
    function syncSlidersFromVars() {
      var get = function(v){ return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); };
      if (document.getElementById('input-range-fontsize')) document.getElementById('input-range-fontsize').value = parseFloat(get('--paper-font-size'))||10.5;
      if (document.getElementById('input-range-lineheight')) document.getElementById('input-range-lineheight').value = parseFloat(get('--paper-line-height'))||1.65;
      if (document.getElementById('input-range-qspacing')) document.getElementById('input-range-qspacing').value = parseInt(get('--q-spacing'))||18;
      if (document.getElementById('input-range-ruleheight')) document.getElementById('input-range-ruleheight').value = parseInt(get('--rule-height'))||22;
      if (document.getElementById('input-range-diagwidth')) document.getElementById('input-range-diagwidth').value = parseInt(get('--diagram-width'))||160;
      if (document.getElementById('input-range-optiongap')) document.getElementById('input-range-optiongap').value = parseInt(get('--option-gap'))||4;
    }
    function setQuickFontSize(pt, btnId) {
      document.querySelectorAll('.action-row .btn-sm').forEach(function(b){ b.classList.remove('active-preset'); });
      if (btnId) document.getElementById(btnId).classList.add('active-preset');
      updateStyleVar('--paper-font-size', pt+'pt', 'val-font-size');
      var s = document.getElementById('input-range-fontsize');
      if (s) s.value = pt;
    }
    function resetLayoutToDefault() {
      Object.keys(DEFAULT_LAYOUT).forEach(function(k){
        document.documentElement.style.setProperty(k, DEFAULT_LAYOUT[k]);
        updateLabelFromVar(k, DEFAULT_LAYOUT[k]);
      });
      setLayoutTemplate('standard', true);
      document.getElementById('option-layout-mode').value = 'auto';
      document.getElementById('qnum-style').value = 'dot';
      document.getElementById('custom-css').value = '';
      document.querySelectorAll('.action-row .btn-sm').forEach(function(b){ b.classList.remove('active-preset'); });
      document.getElementById('btn-size-105').classList.add('active-preset');
      syncSlidersFromVars();
      applyCustomCSS(true);
      saveLayoutSettings();
      showToast('已恢复默认排版', 'success');
    }
    function applyCustomCSS(silent) {
      var css = document.getElementById('custom-css').value || '';
      var old = document.getElementById('user-custom-style');
      if (old) old.remove();
      if (css.trim()) {
        var style = document.createElement('style');
        style.id = 'user-custom-style';
        style.textContent = css;
        document.head.appendChild(style);
      }
      if (!silent) { saveLayoutSettings(); showToast('自定义 CSS 已应用', 'success'); }
    }

    function toggleCleanMode() {
      isCleanMode = !isCleanMode;
      var sheet = document.getElementById('paper-mount-point');
      var btn = document.getElementById('btn-clean');
      if (isCleanMode) {
        sheet.classList.add('clean-mode');
        btn.style.background = 'var(--primary)';
        btn.style.color = '#fff';
        showToast('已开启纯净模式（仅标题+题目）', 'info');
      } else {
        sheet.classList.remove('clean-mode');
        btn.style.background = '';
        btn.style.color = '';
        showToast('已关闭纯净模式', 'info');
      }
      renderPaperFromTextarea(true);
    }

    // JSON 处理
    function sanitizeLatexJSON(rawStr) {
      var bs = String.fromCharCode(92);
      var out = '';
      for (var i = 0; i < rawStr.length; i++) {
        var ch = rawStr[i];
        if (ch === bs) {
          var next = rawStr[i+1] || '';
          if (next === bs) { out += bs+bs; i++; }
          else if (next === '"' || next === '/') { out += bs + next; i++; }
          else if (next === 'u' && /^[0-9a-fA-F]{4}$/.test(rawStr.substr(i+2,4))) { out += bs; }
          else if (/^[a-zA-Z]/.test(next)) { out += bs+bs; }
          else { out += bs+bs; }
        } else out += ch;
      }
      return out;
    }
    function autoRepairPaper(data) {
      if (!data || typeof data !== 'object') data = {};
      if (!data.paper_title) data.paper_title = '';
      if (!Array.isArray(data.sections)) data.sections = [];
      var qid = 1;
      data.sections.forEach(function(sec, si) {
        if (!sec || typeof sec !== 'object') data.sections[si] = { title: '', questions: [] };
        if (!Array.isArray(data.sections[si].questions)) data.sections[si].questions = [];
        data.sections[si].questions.forEach(function(q, qi) {
          if (!q || typeof q !== 'object') {
            data.sections[si].questions[qi] = { id: qid++, score: 5, stem: '', options: [], blank_lines: 0, tags: [] };
            return;
          }
          if (typeof q.id !== 'number') q.id = qid;
          qid = Math.max(qid, q.id + 1);
          if (typeof q.score !== 'number') q.score = 5;
          if (typeof q.stem !== 'string') q.stem = String(q.stem || '');
          if (!Array.isArray(q.options)) q.options = [];
          if (typeof q.blank_lines !== 'number') q.blank_lines = q.options.length ? 0 : 6;
          if (!Array.isArray(q.tags)) q.tags = [];
        });
      });
      return data;
    }
    function parseJSONWithTolerance(rawStr) {
      var data;
      try { data = JSON.parse(sanitizeLatexJSON(rawStr)); }
      catch(e1) { try { data = JSON.parse(rawStr); } catch(e2){ throw e1; } }
      return autoRepairPaper(data);
    }
    function forceRepairJSON() {
      var raw = document.getElementById('paper-json').value.trim();
      if (!raw) { showToast('没有内容可修复', 'warning'); return; }
      try {
        var data = parseJSONWithTolerance(raw);
        document.getElementById('paper-json').value = JSON.stringify(data, null, 2);
        renderPaperFromTextarea(true);
        showToast('已完成修复', 'success');
      } catch(e) { showToast('修复失败：'+(e.message||e), 'error'); }
    }

    function renderMathSafely(container) {
      if (typeof renderMathInElement === 'function') {
        renderMathInElement(container, {
          delimiters: [
            {left:"$$",right:"$$",display:true},
            {left:"$",right:"$",display:false},
            {left:"\\\\(",right:"\\\\)",display:false},
            {left:"\\\\[",right:"\\\\]",display:true}
          ],
          throwOnError: false
        });
      }
    }

    function getOptionGridClass(options, forceMode) {
      if (forceMode === 'oneline' || forceMode === 'inline-diagram') return 'cols-1';
      if (!options || !options.length) return 'cols-4';
      var maxLen = Math.max.apply(null, options.map(function(o){
        return (o||'').replace(/\\$[^\\$]*\\$/g,'XXXX').length;
      }));
      if (maxLen <= 6) return 'cols-4';
      if (maxLen <= 18) return 'cols-2';
      return 'cols-1';
    }

    // 带自动背面消隐的 wireframe_3d
    function renderClientDiagram(diagram) {
      if (!diagram) return '';
      if (diagram.engine === 'raw_svg' || diagram.svg) return diagram.svg || '';

      if (diagram.engine === 'wireframe_3d') {
        var w = 160, h = 130;
        var rx = ((diagram.rotation && diagram.rotation.rx) || 15) * Math.PI / 180;
        var ry = ((diagram.rotation && diagram.rotation.ry) || -30) * Math.PI / 180;
        var scale = diagram.scale || 0.95;

        function rotatePoint(c) {
          var x = c[0], y = c[1], z = c[2];
          var cosY = Math.cos(ry), sinY = Math.sin(ry);
          var cosX = Math.cos(rx), sinX = Math.sin(rx);
          var x1 = x * cosY + z * sinY;
          var z1 = -x * sinY + z * cosY;
          var y2 = y * cosX - z1 * sinX;
          var z2 = y * sinX + z1 * cosX;
          return { x: x1, y: y2, z: z2 };
        }
        function project(c) {
          var p = rotatePoint(c);
          return [w/2 + p.x*scale, h/2 - p.y*scale];
        }

        var nodes = diagram.nodes || {};
        var pts2d = {}, pts3d = {};
        for (var k in nodes) {
          pts3d[k] = rotatePoint(nodes[k]);
          pts2d[k] = project(nodes[k]);
        }

        var solidLines = [], dashedLines = [];

        if (Array.isArray(diagram.faces) && diagram.faces.length > 0) {
          var visibleEdgeSet = new Set();
          var allEdgeSet = new Set();

          diagram.faces.forEach(function(face) {
            if (!Array.isArray(face) || face.length < 3) return;
            for (var i = 0; i < face.length; i++) {
              var a = face[i], b = face[(i+1)%face.length];
              if (!pts3d[a] || !pts3d[b]) continue;
              allEdgeSet.add([a,b].sort().join('--'));
            }
            var p0 = pts3d[face[0]], p1 = pts3d[face[1]], p2 = pts3d[face[2]];
            if (!p0 || !p1 || !p2) return;
            var ux = p1.x-p0.x, uy = p1.y-p0.y, uz = p1.z-p0.z;
            var vx = p2.x-p0.x, vy = p2.y-p0.y, vz = p2.z-p0.z;
            var nz = ux*vy - uy*vx;
            if (nz > 0) {
              for (var j = 0; j < face.length; j++) {
                var pa = face[j], pb = face[(j+1)%face.length];
                if (pts3d[pa] && pts3d[pb]) visibleEdgeSet.add([pa,pb].sort().join('--'));
              }
            }
          });

          allEdgeSet.forEach(function(key) {
            var parts = key.split('--');
            if (visibleEdgeSet.has(key)) solidLines.push(parts);
            else dashedLines.push(parts);
          });
        } else {
          solidLines = Array.isArray(diagram.solid_lines) ? diagram.solid_lines : [];
          dashedLines = Array.isArray(diagram.dashed_lines) ? diagram.dashed_lines : [];
        }

        var linesSvg = solidLines.map(function(p){
          if (!pts2d[p[0]] || !pts2d[p[1]]) return '';
          return '<line x1="'+pts2d[p[0]][0]+'" y1="'+pts2d[p[0]][1]+'" x2="'+pts2d[p[1]][0]+'" y2="'+pts2d[p[1]][1]+'" stroke="#000" stroke-width="1.25"/>';
        }).join('');
        var dLinesSvg = dashedLines.map(function(p){
          if (!pts2d[p[0]] || !pts2d[p[1]]) return '';
          return '<line x1="'+pts2d[p[0]][0]+'" y1="'+pts2d[p[0]][1]+'" x2="'+pts2d[p[1]][0]+'" y2="'+pts2d[p[1]][1]+'" stroke="#000" stroke-width="1.1" stroke-dasharray="4,3"/>';
        }).join('');
        var texts = Object.keys(pts2d).map(function(k){
          return '<text x="'+(pts2d[k][0]+3)+'" y="'+(pts2d[k][1]-2)+'" font-family="Times New Roman,serif" font-style="italic" font-size="10">'+k+'</text>';
        }).join('');

        return '<svg width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'">'+dLinesSvg+linesSvg+texts+'</svg>';
      }
      return '';
    }

    function renderPaperFromTextarea(force) {
      showRenderStatus(true);
      var raw = document.getElementById('paper-json').value.trim();
      if (!raw) {
        document.getElementById('paper-mount-point').innerHTML = '<div style="text-align:center;padding:48px 20px;color:#94a3b8;">暂无试卷数据</div>';
        showRenderStatus(false);
        return false;
      }
      var data;
      try {
        data = parseJSONWithTolerance(raw);
        currentPaperData = data;
      } catch(err) {
        showRenderStatus(false);
        if (force) showToast('JSON 解析错误：'+(err.message||err), 'error');
        return false;
      }

      var optionMode = document.getElementById('option-layout-mode').value;
      var qnumStyle = document.getElementById('qnum-style').value;
      var sheet = document.getElementById('paper-mount-point');
      sheet.classList.remove('layout-standard','layout-twocol','layout-compact','layout-option-newline','qnum-dot','qnum-bracket','qnum-right');
      sheet.classList.add('layout-' + currentLayoutTemplate);
      sheet.classList.add('qnum-' + qnumStyle);
      if (isCleanMode) sheet.classList.add('clean-mode');
      else sheet.classList.remove('clean-mode');

      var html = '';
      // 纯净模式：只保留标题
      if (data.paper_title) html += '<h1 class="paper-title">' + data.paper_title + '</h1>';

      var useFlow = currentLayoutTemplate === 'twocol';
      if (useFlow) html += '<div class="questions-flow">';

      (data.sections || []).forEach(function(sec) {
        if (!useFlow && sec.title) html += '<div class="section-title">' + sec.title + '</div>';
        (sec.questions || []).forEach(function(q) {
          var isFullWidth = !!(q.is_full_width || (q.diagram && q.diagram.is_full_width));
          var isLong = !!(q.blank_lines && q.blank_lines >= 8);
          var rowClass = 'question-row' + (isFullWidth ? ' full-width-row' : '') + (isLong ? ' allow-break' : '');

          html += '<div class="' + rowClass + '" data-qid="' + q.id + '">';
          html += '<button class="mistake-btn" onclick="toggleMistake(' + q.id + ')">标为错题</button>';

          var numHtml = '';
          if (qnumStyle === 'right') {
            numHtml = '<div class="q-num-wrap"><span class="q-num">' + q.id + '.</span><span class="q-bracket">（　　）</span></div>';
          } else if (qnumStyle === 'bracket') {
            numHtml = '<span class="q-num">' + q.id + '</span> ';
          } else {
            numHtml = '<b class="q-num">' + q.id + '.</b> ';
          }

          html += '<div class="q-layout-box"><div class="q-cell-content">';
          html += numHtml + (isCleanMode ? '' : '<span class="q-score">(' + (q.score||'') + '分) </span>') + (q.stem||'');

          if (!isCleanMode && q.tags && q.tags.length) {
            html += '<div style="margin-top:4px;">' + q.tags.map(function(t){ return '<span class="tag">'+t+'</span>'; }).join('') + '</div>';
          }

          if (q.options && q.options.length) {
            var gridClass = getOptionGridClass(q.options, optionMode);
            html += '<div class="options-grid ' + gridClass + '">';
            var letters = ['A','B','C','D','E','F'];
            q.options.forEach(function(opt, idx) {
              html += '<div>' + (letters[idx]||'') + '．' + opt + '</div>';
            });
            html += '</div>';
          }
          html += '</div>';

          if (q.diagram && currentLayoutTemplate !== 'option-newline') {
            html += '<div class="q-cell-graphic">' + renderClientDiagram(q.diagram) + '</div>';
          }
          html += '</div>';

          if (q.blank_lines && q.blank_lines > 0) {
            html += '<div class="blank-space">';
            for (var i=0; i<q.blank_lines; i++) html += '<div class="rule-blank"></div>';
            html += '</div>';
          }
          html += '</div>';
        });
      });

      if (useFlow) html += '</div>';

      requestAnimationFrame(function() {
        sheet.innerHTML = html;
        renderMathSafely(sheet);
        updateMistakeUI();
        showRenderStatus(false);
      });
      return true;
    }

    function toggleMistake(qId) {
      if (mistakeQuestionIds.has(qId)) mistakeQuestionIds.delete(qId);
      else mistakeQuestionIds.add(qId);
      updateMistakeUI();
    }
    function updateMistakeUI() {
      document.querySelectorAll('.question-row').forEach(function(row){
        var id = parseInt(row.getAttribute('data-qid'));
        var isM = mistakeQuestionIds.has(id);
        row.classList.toggle('is-mistake', isM);
        var btn = row.querySelector('.mistake-btn');
        if (btn) btn.innerHTML = isM ? '❌ 已标错题' : '标为错题';
      });
      document.getElementById('mistake-count-text').innerText = '错题: ' + mistakeQuestionIds.size;
    }
    function filterMistakesView() {
      isFilteringMistakes = !isFilteringMistakes;
      document.querySelectorAll('.question-row').forEach(function(row){
        var id = parseInt(row.getAttribute('data-qid'));
        row.style.display = isFilteringMistakes ? (mistakeQuestionIds.has(id) ? 'block' : 'none') : 'block';
      });
      showToast(isFilteringMistakes ? '仅显示错题' : '显示全部题目', 'info');
    }

    function setPreviewMode(mode) {
      var sheet = document.getElementById('paper-mount-point');
      var btnFit = document.getElementById('btn-fit');
      var btnDesktop = document.getElementById('btn-desktop');
      var btnA4 = document.getElementById('btn-a4');
      sheet.classList.remove('mobile-fit', 'desktop-mode', 'a4-exact');
      btnFit.style.background = ''; btnFit.style.color = '';
      btnDesktop.style.background = ''; btnDesktop.style.color = '';
      btnA4.style.background = ''; btnA4.style.color = '';

      if (mode === 'mobile-fit') {
        sheet.classList.add('mobile-fit');
        btnFit.style.background = 'var(--primary)'; btnFit.style.color = '#fff';
      } else if (mode === 'desktop') {
        sheet.classList.add('desktop-mode');
        btnDesktop.style.background = 'var(--primary)'; btnDesktop.style.color = '#fff';
      } else {
        sheet.classList.add('a4-exact');
        btnA4.style.background = 'var(--primary)'; btnA4.style.color = '#fff';
      }
    }

    function setTab(name) {
      ['edit','preview'].forEach(function(t){
        var nav = document.getElementById('tab-nav-' + t);
        var panel = document.getElementById('panel-' + t);
        if (nav) nav.classList.toggle('active', t === name);
        if (panel) panel.classList.toggle('active', t === name);
      });
      if (name === 'preview') renderPaperFromTextarea(true);
      if (name === 'edit') renderHistoryList();
    }

    function getResolvedFileName(ext, isMistake) {
      var custom = (document.getElementById('custom-filename-input').value || '').trim();
      var prefix = isMistake ? '错题集_' : '试卷_';
      if (!custom) {
        var now = new Date();
        var p = function(n){ return String(n).padStart(2,'0'); };
        custom = prefix + now.getFullYear() + p(now.getMonth()+1) + p(now.getDate()) + '_' + p(now.getHours()) + p(now.getMinutes());
      } else {
        custom = (isMistake ? '错题集_' : '') + custom;
      }
      return custom + '.' + ext;
    }

    function openExportModal() {
      renderPaperFromTextarea(true);
      document.getElementById('export-modal').classList.add('active');
    }
    function closeExportModal() {
      document.getElementById('export-modal').classList.remove('active');
    }
    function downloadBlob(content, filename, type) {
      var blob = new Blob([content], {type: type});
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click();
      setTimeout(function(){ document.body.removeChild(a); URL.revokeObjectURL(url); }, 300);
    }

    async function triggerChromePrint(mistakeOnly) {
      closeExportModal();
      window.scrollTo(0,0);
      if (mistakeOnly) {
        if (mistakeQuestionIds.size === 0) { showToast('请先勾选错题', 'warning'); return; }
        document.querySelectorAll('.question-row').forEach(function(row){
          var id = parseInt(row.getAttribute('data-qid'));
          row.style.display = mistakeQuestionIds.has(id) ? 'block' : 'none';
        });
      } else {
        document.querySelectorAll('.question-row').forEach(function(row){ row.style.display = 'block'; });
      }
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
      await new Promise(function(r){ requestAnimationFrame(r); });
      await new Promise(function(r){ setTimeout(r, 80); });
      window.print();
      document.querySelectorAll('.question-row').forEach(function(row){ row.style.display = 'block'; });
    }

    async function exportDirectPDF(mistakeOnly) {
      closeExportModal();
      setPreviewMode('a4-exact');
      if (mistakeOnly) {
        if (mistakeQuestionIds.size === 0) { showToast('请先勾选错题', 'warning'); return; }
        document.querySelectorAll('.question-row').forEach(function(row){
          var id = parseInt(row.getAttribute('data-qid'));
          row.style.display = mistakeQuestionIds.has(id) ? 'block' : 'none';
        });
      }
      if (document.fonts) await document.fonts.ready;
      var element = document.getElementById('paper-mount-point');
      var filename = getResolvedFileName('pdf', !!mistakeOnly);
      var opt = {
        margin: [12,12,12,12],
        filename: filename,
        image: {type:'jpeg', quality:0.98},
        html2canvas: {scale:2, useCORS:true, backgroundColor:'#ffffff'},
        jsPDF: {unit:'mm', format:'a4', orientation:'portrait'},
        pagebreak: {mode:['avoid-all','css','legacy'], avoid:['.question-row','.section-title']}
      };
      if (window.html2pdf) {
        window.html2pdf().set(opt).from(element).save().then(function(){
          document.querySelectorAll('.question-row').forEach(function(row){ row.style.display='block'; });
          showToast('PDF 已生成', 'success');
        });
      }
    }

    function exportStandaloneHTML() {
      closeExportModal();
      var filename = getResolvedFileName('html', false);
      var mount = document.getElementById('paper-mount-point').innerHTML;
      var fullHtml = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>'+filename+'</title><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.css"><style>@page{size:A4;margin:12mm;}body{font-family:"Songti SC",SimSun,serif;padding:16px;font-size:10.5pt;line-height:1.65;}.paper-title{text-align:center;font-size:1.5em;margin-bottom:18px;}.section-title{font-weight:bold;margin:14px 0 8px;}.question-row{break-inside:avoid;margin-bottom:16px;}.q-layout-box{display:flex;gap:12px;}.q-cell-content{flex:1;}.q-cell-graphic{width:140px;}.options-grid.cols-4{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;}.options-grid.cols-2{display:grid;grid-template-columns:repeat(2,1fr);gap:4px;}.options-grid.cols-1{display:flex;flex-direction:column;gap:3px;}.rule-blank{height:20px;}</style></head><body>'+mount+'</body></html>';
      downloadBlob(fullHtml, filename, 'text/html;charset=utf-8');
      showToast('HTML 已导出', 'success');
    }

    async function pasteFromClipboard() {
      try {
        var text = await navigator.clipboard.readText();
        if (text) {
          document.getElementById('paper-json').value = text;
          if (renderPaperFromTextarea(true)) { setTab('preview'); showToast('已载入', 'success'); }
        }
      } catch(e) { showToast('请长按输入框粘贴或使用导入', 'warning'); }
    }
    function triggerFileInput() { document.getElementById('file-uploader').click(); }
    function handleFileUpload(event) {
      var file = event.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function(e) {
        document.getElementById('paper-json').value = e.target.result;
        if (renderPaperFromTextarea(true)) { setTab('preview'); showToast('文件已载入', 'success'); }
      };
      reader.readAsText(file, 'UTF-8');
      event.target.value = '';
    }
    function clearJson() {
      if (confirm('确定清空？')) {
        document.getElementById('paper-json').value = '';
        renderPaperFromTextarea(true);
        showToast('已清空', 'info');
      }
    }
  </script>
</body>
</html>`;
}

const EMPTY_PAPER = {
  "paper_title": "",
  "sections": []
};
