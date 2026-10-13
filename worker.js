export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 1. 边缘 AI 代理端口：解决跨域限制 (CORS)
    if (request.method === "POST" && url.pathname === "/api/ai/proxy") {
      try {
        const body = await request.json();
        const { baseUrl, apiKey, payload } = body;

        const targetUrl = baseUrl.endsWith("/") ? `${baseUrl}chat/completions` : `${baseUrl}/chat/completions`;
        const response = await fetch(targetUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          },
          body: JSON.stringify(payload)
        });

        const data = await response.text();
        return new Response(data, {
          status: response.status,
          headers: {
            "Content-Type": "application/json;charset=UTF-8",
            "Access-Control-Allow-Origin": "*"
          }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    // 2. 外部 JSON 渲染 API
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

    // 3. 输出自包含单页应用
    return new Response(buildDocumentHTML(PRESET_30_EXAM), {
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
  
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.css">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/contrib/mhchem.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/contrib/auto-render.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>

  <style>
    :root {
      --primary: #4f46e5;
      --primary-light: #e0e7ff;
      --primary-hover: #4338ca;
      --danger: #ef4444;
      --danger-light: #fee2e2;
      --surface: #ffffff;
      --bg: #f8fafc;
      --text-main: #0f172a;
      --text-sub: #64748b;
      --border: #e2e8f0;
      --radius: 12px;
      --shadow: 0 4px 20px -2px rgba(0,0,0,0.05);

      --paper-font-size: 10.5pt;
      --paper-line-height: 1.65;
      --q-spacing: 20px;
      --rule-height: 24px;
      --diagram-width: 190px;
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
      background: rgba(255, 255, 255, 0.92);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border);
    }
    .header-bar {
      padding: 12px 18px; display: flex; justify-content: space-between; align-items: center;
    }
    .header-bar h2 {
      margin: 0; font-size: 16px; font-weight: 800;
      background: linear-gradient(135deg, #4f46e5, #06b6d4);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      display: flex; align-items: center; gap: 6px;
    }
    .badge {
      font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 9999px;
      background: var(--primary-light); color: var(--primary);
    }

    .tabs {
      display: flex; gap: 6px; padding: 6px 12px 10px; overflow-x: auto;
    }
    .tab-btn {
      flex: 1; padding: 10px 14px; border: none; background: transparent;
      font-size: 13px; font-weight: 600; color: var(--text-sub);
      border-radius: 8px; cursor: pointer; transition: all 0.2s ease;
      white-space: nowrap; text-align: center; touch-action: manipulation;
    }
    .tab-btn.active {
      background: #ffffff; color: var(--primary);
      box-shadow: 0 1px 4px rgba(0,0,0,0.08); font-weight: 700;
    }

    .main-body {
      padding: 14px;
      padding-bottom: 140px;
      max-width: 900px;
      margin-left: auto;
      margin-right: auto;
    }
    .panel { display: none; }
    .panel.active { display: block; }

    .card {
      background: var(--surface); padding: 16px; border-radius: var(--radius);
      border: 1px solid var(--border); box-shadow: var(--shadow); margin-bottom: 14px;
    }
    .card-title {
      font-size: 13.5px; font-weight: 700; margin-bottom: 12px; color: var(--text-main);
      display: flex; justify-content: space-between; align-items: center;
    }

    .action-row {
      display: flex; gap: 8px; margin-bottom: 10px; flex-wrap: wrap;
    }
    .btn-sm {
      padding: 7px 12px; font-size: 12px; font-weight: 600; border-radius: 8px;
      border: 1px solid var(--border); background: #ffffff; color: var(--text-main); cursor: pointer;
      display: inline-flex; align-items: center; gap: 4px; transition: all 0.15s; touch-action: manipulation;
    }
    .btn-sm:active { transform: scale(0.98); background: #f1f5f9; }
    .btn-sm.active-preset { background: var(--primary); color: #ffffff; border-color: var(--primary); }

    input[type="text"], input[type="password"], textarea {
      width: 100%; padding: 10px 12px; border: 1px solid var(--border); border-radius: 8px;
      font-size: 13px; outline: none; background: #fafafa; color: var(--text-main);
      transition: border 0.2s;
    }
    input:focus, textarea:focus {
      border-color: var(--primary); background: #ffffff;
      box-shadow: 0 0 0 2px var(--primary-light);
    }
    textarea { font-family: "SF Mono", Menlo, Consolas, monospace; min-height: 200px; line-height: 1.5; }

    .slider-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .slider-item { display: flex; flex-direction: column; gap: 4px; }
    .slider-item label { font-size: 11px; color: var(--text-sub); display: flex; justify-content: space-between; font-weight: 600; }
    .slider-item input[type="range"] { width: 100%; margin: 6px 0; }

    .preview-bar {
      display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; gap: 8px; flex-wrap: wrap;
    }
    .mistake-counter {
      font-size: 12px; font-weight: 700; color: var(--danger);
      background: var(--danger-light); padding: 4px 10px; border-radius: 6px;
    }

    .paper-scroller {
      width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; padding-bottom: 20px;
    }

    .paper-sheet {
      background: #ffffff !important; margin: 0 auto;
      font-family: "Songti SC", "SimSun", "Times New Roman", "Yu Mincho", serif;
      color: #000000; font-size: var(--paper-font-size); line-height: var(--paper-line-height);
    }
    .paper-sheet.mobile-fit { width: 100% !important; padding: 12px 6px; }
    .paper-sheet.mobile-fit .q-layout-box { display: flex; flex-direction: column; align-items: center; }
    .paper-sheet.mobile-fit .q-cell-graphic { width: 100% !important; margin-top: 10px; text-align: center; }

    .paper-sheet.a4-exact {
      width: 210mm !important; min-height: 297mm; padding: 16mm 15mm;
      border: 1px solid var(--border); box-shadow: var(--shadow);
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

    .question-row {
      position: relative;
      break-inside: avoid !important; page-break-inside: avoid !important;
      margin-bottom: var(--q-spacing); text-align: justify;
      transition: background 0.2s;
    }
    .question-row.is-mistake {
      background: rgba(239, 68, 68, 0.03); border-radius: 6px;
    }

    .mistake-btn {
      position: absolute; right: 0; top: -6px;
      font-size: 11px; padding: 2px 8px; border-radius: 4px;
      border: 1px solid var(--border); background: #ffffff; color: var(--text-sub);
      cursor: pointer; display: flex; align-items: center; gap: 4px; transition: all 0.2s; touch-action: manipulation;
    }
    .question-row.is-mistake .mistake-btn {
      background: var(--danger); color: #ffffff; border-color: var(--danger); font-weight: bold;
    }

    .q-layout-box {
      display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; width: 100%;
    }
    .q-cell-content { flex: 1 1 auto; min-width: 0; }
    .q-cell-graphic { width: var(--diagram-width); flex: 0 0 var(--diagram-width); display: flex; justify-content: center; }

    .options-grid { margin: 8px 0 4px; }
    .options-grid.cols-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
    .options-grid.cols-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; }
    .options-grid.cols-1 { display: flex; flex-direction: column; gap: 4px; }

    .blank-space { margin-top: 6px; width: 100%; display: flex; flex-direction: column; }
    .rule-blank { width: 100%; height: var(--rule-height); border-bottom: 1px solid transparent !important; }

    .bottom-bar {
      position: fixed; bottom: 0; left: 0; right: 0;
      background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px);
      padding: 10px 16px calc(10px + env(safe-area-inset-bottom));
      border-top: 1px solid var(--border); display: flex; gap: 10px; z-index: 60;
    }
    .btn {
      flex: 1; padding: 12px 0; border-radius: 10px; border: none; font-size: 13.5px; font-weight: 700;
      cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;
      transition: all 0.2s; touch-action: manipulation;
    }
    .btn-secondary { background: #f1f5f9; color: var(--text-main); }
    .btn-primary { background: linear-gradient(135deg, #4f46e5, #4338ca); color: #ffffff; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25); }
    .btn-danger { background: linear-gradient(135deg, #ef4444, #dc2626); color: #ffffff; }

    .modal-overlay {
      display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); z-index: 100;
      justify-content: center; align-items: flex-end;
    }
    .modal-overlay.active { display: flex; }
    .modal-content {
      background: #ffffff; width: 100%; max-width: 520px; border-radius: 20px 20px 0 0;
      padding: 20px 18px calc(20px + env(safe-area-inset-bottom));
      box-shadow: 0 -4px 30px rgba(0,0,0,0.15); animation: slideUp 0.25s ease-out;
    }
    @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
    .modal-header { font-size: 16px; font-weight: 800; margin-bottom: 14px; text-align: center; }
    .export-grid { display: flex; flex-direction: column; gap: 8px; }
    .export-item {
      padding: 12px 14px; border: 1px solid var(--border); background: #ffffff;
      border-radius: 10px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; touch-action: manipulation;
    }
    .export-item.highlight { border-color: var(--primary); background: #f5f3ff; }

    @media print {
      @page {
        size: A4 portrait; margin: 15mm 15mm 15mm 15mm;
        @bottom-center {
          content: "— 第 " counter(page) " 页 / 共 " counter(pages) " 页 —";
          font-family: "Songti SC", "SimSun", "Times New Roman", serif; font-size: 9.5pt; color: #000;
        }
      }
      html, body { background: #fff !important; color: #000 !important; margin: 0 !important; }
      .app-header, .bottom-bar, #panel-ai, #panel-edit, .preview-bar, .modal-overlay, .mistake-btn { display: none !important; }
      #panel-preview { display: block !important; margin: 0 !important; padding: 0 !important; }
      .paper-sheet { width: 100% !important; margin: 0 !important; padding: 0 !important; border: none !important; box-shadow: none !important; }
      .paper-sheet .q-layout-box { display: flex !important; flex-direction: row !important; }
      .paper-sheet .q-cell-graphic { width: var(--diagram-width) !important; flex: 0 0 var(--diagram-width) !important; }
    }
  </style>
</head>
<body>

  <header class="app-header">
    <div class="header-bar">
      <h2>ExamCraft AI <span class="badge">Pro Studio</span></h2>
      <div style="font-size: 11px; color: var(--text-sub);">边缘引擎</div>
    </div>
    <div class="tabs">
      <button class="tab-btn active" id="tab-nav-ai" onclick="setTab('ai')">🤖 AI 智能出题与变式</button>
      <button class="tab-btn" id="tab-nav-edit" onclick="setTab('edit')">✏️ 试卷数据与版面定制</button>
      <button class="tab-btn" id="tab-nav-preview" onclick="setTab('preview')">📄 卷面批改与错题归纳</button>
    </div>
  </header>

  <main class="main-body">
    <!-- 模块 1：AI 闭环工作台 -->
    <div id="panel-ai" class="panel active">
      <div class="card">
        <div class="card-title">
          <span>大模型 API 配置 (OpenAI 协议兼容)</span>
          <span style="font-size: 11px; color: var(--text-sub);">持久化存储</span>
        </div>
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <div>
            <label style="font-size: 11px; color: var(--text-sub); font-weight: 600;">API Base URL 端点</label>
            <input type="text" id="ai-base-url" placeholder="例如：https://api.deepseek.com/v1 或 https://api.openai.com/v1">
          </div>
          <div>
            <label style="font-size: 11px; color: var(--text-sub); font-weight: 600;">API Key 密钥</label>
            <input type="password" id="ai-api-key" placeholder="sk-...">
          </div>
          <div>
            <label style="font-size: 11px; color: var(--text-sub); font-weight: 600;">模型名称 (Model Name)</label>
            <input type="text" id="ai-model-name" placeholder="deepseek-chat / gpt-4o / qwen-plus">
          </div>
          <button class="btn-sm" style="align-self: flex-start;" onclick="saveAISettings()">💾 保存 API 配置</button>
        </div>
      </div>

      <div class="card">
        <div class="card-title">
          <span>AI 极速出题与变式训练</span>
          <span id="ai-status-badge" class="badge" style="display: none; background: #fef3c7; color: #b45309;">AI 正在推理生成中...</span>
        </div>
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <div>
            <label style="font-size: 11px; color: var(--text-sub); font-weight: 600;">出题要求 / 变式提示词</label>
            <textarea id="ai-user-prompt" placeholder="例如：出两道立体几何空间向量大题、两道动量与机械能转化大题，要求包含详细坐标与纯矢量 SVG 插图参数..."></textarea>
          </div>
          <div class="action-row">
            <button class="btn btn-primary" onclick="triggerAIGeneration('create')">🚀 AI 一键生成全新试卷</button>
            <button class="btn btn-danger" onclick="triggerAIGeneration('mistake_variants')">🎯 针对勾选的错题生成同类变式卷</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 模块 2：试卷数据与版面定制 -->
    <div id="panel-edit" class="panel">
      <div class="card">
        <div class="card-title">文件导出命名</div>
        <input type="text" id="custom-filename-input" placeholder="输入自定义文件名（留空则自动按秒级时间戳生成）">
      </div>

      <div class="card">
        <div class="card-title">字号与版面微调</div>
        <div class="action-row" style="margin-bottom: 12px;">
          <button class="btn-sm" id="btn-size-9" onclick="setQuickFontSize(9, 'btn-size-9')">小五 (9pt 紧凑)</button>
          <button class="btn-sm active-preset" id="btn-size-105" onclick="setQuickFontSize(10.5, 'btn-size-105')">五号 (10.5pt 国标)</button>
          <button class="btn-sm" id="btn-size-12" onclick="setQuickFontSize(12, 'btn-size-12')">小四 (12pt 清晰)</button>
        </div>

        <div class="slider-grid">
          <div class="slider-item">
            <label>正文字号: <span id="val-font-size">10.5pt</span></label>
            <input type="range" id="input-range-fontsize" min="8.5" max="15" step="0.5" value="10.5" oninput="updateStyleVar('--paper-font-size', this.value + 'pt', 'val-font-size')">
          </div>
          <div class="slider-item">
            <label>大题题目间距: <span id="val-q-spacing">20px</span></label>
            <input type="range" min="10" max="45" value="20" oninput="updateStyleVar('--q-spacing', this.value + 'px', 'val-q-spacing')">
          </div>
          <div class="slider-item">
            <label>留白单行高度: <span id="val-rule-height">24px</span></label>
            <input type="range" min="16" max="36" value="24" oninput="updateStyleVar('--rule-height', this.value + 'px', 'val-rule-height')">
          </div>
          <div class="slider-item" style="grid-column: span 2;">
            <label>右侧图栏宽度: <span id="val-diag-width">190px</span></label>
            <input type="range" min="140" max="260" value="190" oninput="updateStyleVar('--diagram-width', this.value + 'px', 'val-diag-width')">
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">
          <span>试卷 JSON 数据协议</span>
          <span style="font-size: 10px; color: var(--text-sub);">双斜杠容错</span>
        </div>
        <div class="action-row">
          <button class="btn-sm" onclick="pasteFromClipboard()">📋 剪贴板粘贴</button>
          <button class="btn-sm" onclick="triggerFileInput()">📂 导入文件</button>
          <button class="btn-sm" onclick="clearJson()">🗑️ 清空</button>
          <input type="file" id="file-uploader" accept=".json,.txt" style="display: none;" onchange="handleFileUpload(event)">
        </div>
        <textarea id="paper-json" spellcheck="false">${jsonStr}</textarea>
      </div>
    </div>

    <!-- 模块 3：卷面预览与错题批改 -->
    <div id="panel-preview" class="panel">
      <div class="preview-bar">
        <div style="display: flex; gap: 6px;">
          <button class="btn-sm" id="btn-fit" style="background:var(--primary); color:#fff;" onclick="setPreviewMode('mobile-fit')">📱 手机适屏</button>
          <button class="btn-sm" id="btn-a4" onclick="setPreviewMode('a4-exact')">📄 标准 A4</button>
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
          <span class="mistake-counter" id="mistake-count-text">已勾选错题: 0 道</span>
          <button class="btn-sm" onclick="filterMistakesView()">🔍 仅看错题 / 全卷</button>
        </div>
      </div>

      <div class="paper-scroller">
        <div class="paper-sheet mobile-fit" id="paper-mount-point"></div>
      </div>
    </div>
  </main>

  <!-- 底部固定交互栏 -->
  <div class="bottom-bar">
    <button class="btn btn-secondary" onclick="renderPaperFromTextarea()">🔄 同步编译</button>
    <button class="btn btn-primary" onclick="openExportModal()">📥 导出 / 打印试卷</button>
  </div>

  <!-- 导出选项面板 Action Sheet -->
  <div class="modal-overlay" id="export-modal" onclick="closeExportModal(event)">
    <div class="modal-content" onclick="event.stopPropagation()">
      <div class="modal-header">试卷与错题本导出中心</div>
      <div class="export-grid">
        <button class="export-item highlight" onclick="triggerChromePrint(false)">
          <div>
            <div style="color:var(--primary); font-weight:700;">🖨️ Chrome 标准打印 / 另存为 PDF (整卷)</div>
            <div style="font-size:11px; color:var(--text-sub); margin-top:2px;">原生矢量高精无损，排版规范</div>
          </div>
          <span>➔</span>
        </button>
        <button class="export-item" style="border-color: #fca5a5; background: #fff1f2;" onclick="exportDirectPDF(true)">
          <div>
            <div style="color:var(--danger); font-weight:700;">📑 单纯错题直接下载 PDF 文件 (.pdf)</div>
            <div style="font-size:11px; color:var(--text-sub); margin-top:2px;">仅提取错题一键生成专属错题本</div>
          </div>
          <span>➔</span>
        </button>
        <button class="export-item" style="border-color: #fca5a5; background: #fff1f2;" onclick="triggerChromePrint(true)">
          <div>
            <div style="color:var(--danger); font-weight:700;">🖨️ 错题本 Chrome 打印 / 另存为 PDF</div>
            <div style="font-size:11px; color:var(--text-sub); margin-top:2px;">仅打印勾选的错题</div>
          </div>
          <span>➔</span>
        </button>
        <button class="export-item" onclick="exportMistakeJSONPrompt()">
          <div>
            <div style="font-weight:700;">🎯 导出错题给 AI 针对训练</div>
            <div style="font-size:11px; color:var(--text-sub); margin-top:2px;">将错题参数自动填入 AI 工坊进行变式训练</div>
          </div>
          <span>➔</span>
        </button>
        <button class="export-item" onclick="exportDirectPDF(false)">
          <div>
            <div>📑 整卷直接下载 PDF 文件 (.pdf)</div>
            <div style="font-size:11px; color:var(--text-sub);">免驱动客户端快速直出</div>
          </div>
          <span>➔</span>
        </button>
        <button class="export-item" onclick="exportStandaloneHTML()">
          <div>
            <div>🌐 导出独立离线网页 (.html)</div>
            <div style="font-size:11px; color:var(--text-sub);">双击即开，方便微信电脑传送</div>
          </div>
          <span>➔</span>
        </button>
      </div>
      <button class="btn-sm" style="width:100%; margin-top:12px; justify-content:center; padding:10px 0;" onclick="closeExportModal()">取消</button>
    </div>
  </div>

  <script>
    var currentPaperData = null;
    var mistakeQuestionIds = new Set();
    var isFilteringMistakes = false;

    window.addEventListener('DOMContentLoaded', function() {
      loadSavedAISettings();
      renderPaperFromTextarea();

      var jsonEl = document.getElementById('paper-json');
      if (jsonEl) {
        jsonEl.addEventListener('input', function() {
          renderPaperFromTextarea();
        });
      }
    });

    // 活跃重试检测 KaTeX，防止未加载时被静默跳过
    function renderMathSafely(container) {
      if (typeof renderMathInElement === 'function') {
        renderMathInElement(container, {
          delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "$", right: "$", display: false },
            { left: String.fromCharCode(92) + "(", right: String.fromCharCode(92) + ")", display: false },
            { left: String.fromCharCode(92) + "[", right: String.fromCharCode(92) + "]", display: true }
          ],
          throwOnError: false
        });
      } else {
        var attempts = 0;
        var timer = setInterval(function() {
          attempts++;
          if (typeof renderMathInElement === 'function') {
            clearInterval(timer);
            renderMathInElement(container, {
              delimiters: [
                { left: "$$", right: "$$", display: true },
                { left: "$", right: "$", display: false },
                { left: String.fromCharCode(92) + "(", right: String.fromCharCode(92) + ")", display: false },
                { left: String.fromCharCode(92) + "[", right: String.fromCharCode(92) + "]", display: true }
              ],
              throwOnError: false
            });
          } else if (attempts > 60) {
            clearInterval(timer);
          }
        }, 50);
      }
    }

    function loadSavedAISettings() {
      document.getElementById('ai-base-url').value = localStorage.getItem('ai_base_url') || 'https://api.deepseek.com/v1';
      document.getElementById('ai-api-key').value = localStorage.getItem('ai_api_key') || '';
      document.getElementById('ai-model-name').value = localStorage.getItem('ai_model_name') || 'deepseek-chat';
    }

    function saveAISettings() {
      localStorage.setItem('ai_base_url', document.getElementById('ai-base-url').value.trim());
      localStorage.setItem('ai_api_key', document.getElementById('ai-api-key').value.trim());
      localStorage.setItem('ai_model_name', document.getElementById('ai-model-name').value.trim());
      alert("✅ API 接口配置已成功保存在本地浏览器！");
    }

    async function triggerAIGeneration(type) {
      var baseUrl = document.getElementById('ai-base-url').value.trim();
      var apiKey = document.getElementById('ai-api-key').value.trim();
      var model = document.getElementById('ai-model-name').value.trim();

      if (!baseUrl || !apiKey || !model) {
        alert("请先填写并保存完整的 API Base URL、API Key 与 Model 名称！");
        return;
      }

      var systemPrompt = '你是一名顶尖的高中数理化试卷出题专家。必须严格输出符合规范的纯 JSON 格式：' +
        '{"paper_title": "试卷名", "meta": {"subject": "科目", "time": "120分钟", "total_score": 100}, ' +
        '"sections": [{"title": "大题标题", "questions": [{"id": 1, "score": 10, "stem": "题干", ' +
        '"options": ["A", "B", "C", "D"], "blank_lines": 6, "diagram": null}]}]}. ' +
        '注意：所有公式必须包裹在 $...$ 内且反斜杠双重转义（如 \\\\mu, \\\\alpha, \\\\sqrt{2}）。大题 blank_lines 为 6。';

      var userMsg = document.getElementById('ai-user-prompt').value.trim();

      if (type === 'mistake_variants') {
        if (mistakeQuestionIds.size === 0) {
          alert("当前尚未勾选任何错题！请在‘卷面批改与错题归纳’中勾选至少一道错题。");
          return;
        }
        var mistakes = getMistakeQuestionsList();
        userMsg = '【错题同类变式靶向训练任务】以下是做错的题目：\n' + JSON.stringify(mistakes, null, 2) +
          '\n请仔细分析上述错题考察的核心考点与数理模型，出同等难度的全新变式试卷，标题注明“错题变式强化专项卷”。包含完整题干与矢量 SVG 图形参数。';
      } else {
        if (!userMsg) {
          userMsg = '请生成一套包含力学牛顿定律、电磁感应和立体几何综合题的高三理科模拟卷，共4道大题。';
        }
      }

      var badge = document.getElementById('ai-status-badge');
      badge.style.display = 'inline-block';
      badge.innerText = 'AI 正在推理生成中...';

      try {
        var res = await fetch('/api/ai/proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            baseUrl: baseUrl,
            apiKey: apiKey,
            payload: {
              model: model,
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userMsg }
              ],
              temperature: 0.6
            }
          })
        });

        var data = await res.json();
        badge.style.display = 'none';

        if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));

        var content = data.choices[0].message.content.trim();
        var fence = String.fromCharCode(96, 96, 96);
        if (content.indexOf(fence) === 0) {
          var firstNl = content.indexOf('\n');
          if (firstNl !== -1) {
            content = content.substring(firstNl + 1);
          } else {
            content = content.substring(3);
          }
        }
        if (content.lastIndexOf(fence) !== -1) {
          content = content.substring(0, content.lastIndexOf(fence));
        }
        content = content.trim();

        document.getElementById('paper-json').value = content;
        if (renderPaperFromTextarea()) {
          setTab('preview');
          alert("🎉 题目生成完成！已无缝渲染并排版为全新试卷。");
        }
      } catch (err) {
        badge.style.display = 'none';
        alert("调用 AI 出题接口失败：" + err.message);
      }
    }

    function toggleMistake(qId) {
      if (mistakeQuestionIds.has(qId)) {
        mistakeQuestionIds.delete(qId);
      } else {
        mistakeQuestionIds.add(qId);
      }
      updateMistakeUI();
    }

    function updateMistakeUI() {
      document.querySelectorAll('.question-row').forEach(function(row) {
        var id = parseInt(row.getAttribute('data-qid'));
        var isM = mistakeQuestionIds.has(id);
        row.classList.toggle('is-mistake', isM);
        var btn = row.querySelector('.mistake-btn');
        if (btn) btn.innerHTML = isM ? '❌ 已标为错题' : '标为错题';
      });
      document.getElementById('mistake-count-text').innerText = '已勾选错题: ' + mistakeQuestionIds.size + ' 道';
    }

    function filterMistakesView() {
      isFilteringMistakes = !isFilteringMistakes;
      document.querySelectorAll('.question-row').forEach(function(row) {
        var id = parseInt(row.getAttribute('data-qid'));
        if (isFilteringMistakes) {
          row.style.display = mistakeQuestionIds.has(id) ? 'block' : 'none';
        } else {
          row.style.display = 'block';
        }
      });
    }

    function getMistakeQuestionsList() {
      if (!currentPaperData) return [];
      var list = [];
      (currentPaperData.sections || []).forEach(function(sec) {
        (sec.questions || []).forEach(function(q) {
          if (mistakeQuestionIds.has(q.id)) list.push(q);
        });
      });
      return list;
    }

    function exportMistakeJSONPrompt() {
      closeExportModal();
      var mistakes = getMistakeQuestionsList();
      if (mistakes.length === 0) {
        alert("尚未勾选任何错题！");
        return;
      }
      setTab('ai');
      document.getElementById('ai-user-prompt').value = "请针对以下 " + mistakes.length + " 道错题，为我定向出同等考点的巩固变式训练试题：\n" + JSON.stringify(mistakes, null, 2);
      alert("✅ 已将错题提取为 Prompt 填入 AI 工坊，可直接点击‘针对错题生成同类变式卷’！");
    }

    function setQuickFontSize(pt, btnId) {
      document.querySelectorAll('.action-row .btn-sm').forEach(function(b) { b.classList.remove('active-preset'); });
      if (btnId) document.getElementById(btnId).classList.add('active-preset');
      updateStyleVar('--paper-font-size', pt + 'pt', 'val-font-size');
      var slider = document.getElementById('input-range-fontsize');
      if (slider) slider.value = pt;
    }

    function updateStyleVar(varName, value, labelId) {
      document.documentElement.style.setProperty(varName, value);
      if (labelId) document.getElementById(labelId).innerText = value;
    }

    function getResolvedFileName(extension, isMistakeOnly) {
      var customName = (document.getElementById('custom-filename-input').value || '').trim();
      var prefix = isMistakeOnly ? '错题集_' : '试卷_';
      if (!customName) {
        var now = new Date();
        var pad = function(n) { return String(n).padStart(2, '0'); };
        customName = prefix + now.getFullYear() + pad(now.getMonth()+1) + pad(now.getDate()) + '_' + pad(now.getHours()) + pad(now.getMinutes()) + pad(now.getSeconds());
      } else {
        customName = (isMistakeOnly ? '错题集_' : '') + customName;
      }
      return customName + '.' + extension;
    }

    function setPreviewMode(mode) {
      var sheet = document.getElementById('paper-mount-point');
      var btnFit = document.getElementById('btn-fit');
      var btnA4 = document.getElementById('btn-a4');
      if (mode === 'mobile-fit') {
        sheet.className = 'paper-sheet mobile-fit';
        btnFit.style.background = 'var(--primary)'; btnFit.style.color = '#fff';
        btnA4.style.background = '#ffffff'; btnA4.style.color = 'var(--text-main)';
      } else {
        sheet.className = 'paper-sheet a4-exact';
        btnA4.style.background = 'var(--primary)'; btnA4.style.color = '#fff';
        btnFit.style.background = '#ffffff'; btnFit.style.color = 'var(--text-main)';
      }
    }

    function setTab(name) {
      var tabs = ['ai', 'edit', 'preview'];
      tabs.forEach(function(t) {
        var navBtn = document.getElementById('tab-nav-' + t);
        var panel = document.getElementById('panel-' + t);
        if (navBtn) {
          if (t === name) navBtn.classList.add('active');
          else navBtn.classList.remove('active');
        }
        if (panel) {
          if (t === name) panel.classList.add('active');
          else panel.classList.remove('active');
        }
      });

      if (name === 'preview') {
        renderPaperFromTextarea();
      }
    }

    // 采用逐字符精准解析，杜绝反斜杠多层转义冲突
    function parseJSONWithTolerance(rawStr) {
      try {
        return JSON.parse(rawStr);
      } catch (e1) {
        try {
          var bs = String.fromCharCode(92);
          var out = "";
          for (var i = 0; i < rawStr.length; i++) {
            var ch = rawStr[i];
            if (ch === bs) {
              var next = rawStr[i + 1] || "";
              if (next === bs) {
                out += bs + bs;
                i++;
              } else if ('"/bfnrt'.indexOf(next) !== -1) {
                out += bs;
              } else if (next === 'u' && /^[0-9a-fA-F]{4}$/.test(rawStr.substr(i + 2, 4))) {
                out += bs;
              } else {
                out += bs + bs;
              }
            } else {
              out += ch;
            }
          }
          return JSON.parse(out);
        } catch (e2) {
          throw e1;
        }
      }
    }

    function getOptionGridClass(options) {
      if (!options || !options.length) return 'cols-4';
      var maxLen = Math.max.apply(null, options.map(function(o) {
        return (o || '').replace(/\\$[^\\$]*\\$/g, 'XXXX').length;
      }));
      if (maxLen <= 5) return 'cols-4';
      if (maxLen <= 15) return 'cols-2';
      return 'cols-1';
    }

    function renderClientDiagram(diagram) {
      if (!diagram) return '';
      if (diagram.engine === "raw_svg" || diagram.svg) return diagram.svg;

      if (diagram.engine === "wireframe_3d") {
        var w = 190, h = 160;
        var rx = ((diagram.rotation && diagram.rotation.rx || 15) * Math.PI) / 180;
        var ry = ((diagram.rotation && diagram.rotation.ry || -30) * Math.PI) / 180;
        var scale = diagram.scale || 1.0;

        var project = function(coord) {
          var x = coord[0], y = coord[1], z = coord[2];
          var cosY = Math.cos(ry), sinY = Math.sin(ry);
          var cosX = Math.cos(rx), sinX = Math.sin(rx);
          var x1 = x * cosY + z * sinY;
          var z1 = -x * sinY + z * cosY;
          var y2 = y * cosX - z1 * sinX;
          return [w / 2 + x1 * scale, h / 2 - y2 * scale];
        };

        var pts = {};
        for (var k in (diagram.nodes || {})) {
          pts[k] = project(diagram.nodes[k]);
        }

        var lines = (diagram.solid_lines || []).map(function(pair) {
          var p1 = pair[0], p2 = pair[1];
          return pts[p1] && pts[p2] ? '<line x1="' + pts[p1][0] + '" y1="' + pts[p1][1] + '" x2="' + pts[p2][0] + '" y2="' + pts[p2][1] + '" stroke="#000" stroke-width="1.3"/>' : '';
        }).join('');

        var dLines = (diagram.dashed_lines || []).map(function(pair) {
          var p1 = pair[0], p2 = pair[1];
          return pts[p1] && pts[p2] ? '<line x1="' + pts[p1][0] + '" y1="' + pts[p1][1] + '" x2="' + pts[p2][0] + '" y2="' + pts[p2][1] + '" stroke="#000" stroke-width="1.2" stroke-dasharray="4,3"/>' : '';
        }).join('');

        var texts = Object.keys(pts).map(function(k) {
          return '<text x="' + (pts[k][0] + 4) + '" y="' + (pts[k][1] - 3) + '" font-family="Times New Roman, serif" font-style="italic" font-size="11">' + k + '</text>';
        }).join('');

        return '<svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '">' + dLines + lines + texts + '</svg>';
      }

      if (diagram.engine === "func_2d") {
        return '<svg width="190" height="130" viewBox="0 0 190 130"><line x1="15" y1="105" x2="175" y2="105" stroke="#000" stroke-width="1.2"/><line x1="35" y1="120" x2="35" y2="15" stroke="#000" stroke-width="1.2"/><text x="175" y="115" font-size="10">x</text><text x="25" y="20" font-size="10">y</text><path d="M 35 95 Q 70 15, 110 65 T 165 20" fill="none" stroke="#4f46e5" stroke-width="1.5"/><line x1="110" y1="105" x2="110" y2="65" stroke="#64748b" stroke-dasharray="3,2"/><text x="105" y="118" font-size="9">x₁</text></svg>';
      }

      if (diagram.engine === "geography_2d") {
        return '<svg width="180" height="120" viewBox="0 0 180 120"><ellipse cx="90" cy="60" rx="60" ry="40" fill="none" stroke="#64748b" stroke-width="1.2"/><ellipse cx="86" cy="58" rx="42" ry="28" fill="none" stroke="#64748b" stroke-width="1.2"/><ellipse cx="82" cy="55" rx="25" ry="16" fill="none" stroke="#64748b" stroke-width="1.2"/><circle cx="80" cy="52" r="2.5" fill="#000"/><text x="85" y="55" font-size="8" font-weight="bold">▲850m</text></svg>';
      }

      if (diagram.engine === "ielts_chart") {
        return '<svg width="180" height="120" viewBox="0 0 180 120"><line x1="25" y1="95" x2="165" y2="95" stroke="#000" stroke-width="1"/><line x1="25" y1="95" x2="25" y2="15" stroke="#000" stroke-width="1"/><rect x="40" y="35" width="15" height="60" fill="#4f46e5"/><rect x="60" y="50" width="15" height="45" fill="#93c5fd"/><rect x="100" y="20" width="15" height="75" fill="#4f46e5"/><rect x="120" y="40" width="15" height="55" fill="#93c5fd"/><text x="43" y="110" font-size="8">2010</text><text x="103" y="110" font-size="8">2030</text><text x="8" y="22" font-size="8">%</text></svg>';
      }

      return '';
    }

    function renderPaperFromTextarea() {
      var raw = document.getElementById('paper-json').value.trim();
      if (!raw) return false;

      var data;
      try {
        data = parseJSONWithTolerance(raw);
        currentPaperData = data;
      } catch (err) {
        alert("JSON 语法解析错误：" + (err.message || err));
        return false;
      }

      var container = document.getElementById('paper-mount-point');
      var html = '';

      html += '<h1 class="paper-title">' + (data.paper_title || "标准化测试卷") + '</h1>';
      html += '<div class="paper-meta">';
      html += '<span>科目：' + (data.meta && data.meta.subject || "综合") + '</span>';
      html += '<span>考试时长：' + (data.meta && data.meta.time || "120分钟") + '</span>';
      html += '<span>满分：' + (data.meta && data.meta.total_score || "100") + '分</span>';
      html += '<span>姓名：_________</span>';
      html += '<span>得分：_________</span>';
      html += '</div>';

      (data.sections || []).forEach(function(sec) {
        html += '<div class="section-title">' + sec.title + '</div>';
        (sec.questions || []).forEach(function(q) {
          html += '<div class="question-row" data-qid="' + q.id + '">';
          html += '  <button class="mistake-btn" onclick="toggleMistake(' + q.id + ')">标为错题</button>';
          html += '  <div class="q-layout-box">';
          html += '    <div class="q-cell-content">';
          html += '      <b>' + q.id + '.</b> (' + q.score + '分) ' + q.stem;
          
          if (q.options && q.options.length) {
            var letters = ['A', 'B', 'C', 'D'];
            var gridClass = getOptionGridClass(q.options);
            html += '<div class="options-grid ' + gridClass + '">';
            q.options.forEach(function(opt, idx) {
              html += '<div>' + (letters[idx] || '') + '．' + opt + '</div>';
            });
            html += '</div>';
          }
          html += '    </div>';

          if (q.diagram) {
            html += '    <div class="q-cell-graphic">' + renderClientDiagram(q.diagram) + '</div>';
          }
          html += '  </div>';

          if (q.blank_lines && q.blank_lines > 0) {
            html += '<div class="blank-space">';
            for (var i = 0; i < q.blank_lines; i++) {
              html += '<div class="rule-blank"></div>';
            }
            html += '</div>';
          }
          html += '</div>';
        });
      });

      container.innerHTML = html;

      renderMathSafely(container);
      updateMistakeUI();
      return true;
    }

    function openExportModal() {
      renderPaperFromTextarea();
      document.getElementById('export-modal').classList.add('active');
    }

    function closeExportModal() {
      document.getElementById('export-modal').classList.remove('active');
    }

    function downloadBlob(content, filename, type) {
      var blob = new Blob([content], { type: type });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(function() {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 300);
    }

    function triggerChromePrint(mistakeOnly) {
      closeExportModal();
      setPreviewMode('a4-exact');

      if (mistakeOnly) {
        if (mistakeQuestionIds.size === 0) {
          alert("尚未勾选任何错题！请先在题干右上角勾选‘标为错题’。");
          return;
        }
        document.querySelectorAll('.question-row').forEach(function(row) {
          var id = parseInt(row.getAttribute('data-qid'));
          row.style.display = mistakeQuestionIds.has(id) ? 'block' : 'none';
        });
      } else {
        document.querySelectorAll('.question-row').forEach(function(row) {
          row.style.display = 'block';
        });
      }

      setTimeout(function() {
        window.print();
        document.querySelectorAll('.question-row').forEach(function(row) {
          row.style.display = 'block';
        });
      }, 150);
    }

    async function exportDirectPDF(mistakeOnly) {
      closeExportModal();
      setPreviewMode('a4-exact');

      if (mistakeOnly) {
        if (mistakeQuestionIds.size === 0) {
          alert("尚未勾选任何错题！请先在题干右上角勾选‘标为错题’。");
          return;
        }
        document.querySelectorAll('.question-row').forEach(function(row) {
          var id = parseInt(row.getAttribute('data-qid'));
          row.style.display = mistakeQuestionIds.has(id) ? 'block' : 'none';
        });
      } else {
        document.querySelectorAll('.question-row').forEach(function(row) {
          row.style.display = 'block';
        });
      }

      if (document.fonts) await document.fonts.ready;

      var element = document.getElementById('paper-mount-point');
      var filename = getResolvedFileName('pdf', !!mistakeOnly);

      var opt = {
        margin: [15, 14, 15, 14],
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff', width: 794, windowWidth: 794 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'], avoid: ['.question-row', '.section-title'] }
      };

      if (window.html2pdf) {
        window.html2pdf().set(opt).from(element).toPdf().get('pdf').then(function(pdf) {
          var totalPages = pdf.internal.getNumberOfPages();
          for (var i = 1; i <= totalPages; i++) {
            pdf.setPage(i);
            pdf.setFontSize(9.5);
            pdf.setTextColor(80, 80, 80);
            var text = '— ' + i + ' / ' + totalPages + ' —';
            pdf.text(text, pdf.internal.pageSize.getWidth() / 2, pdf.internal.pageSize.getHeight() - 8, { align: 'center' });
          }
        }).save().then(function() {
          document.querySelectorAll('.question-row').forEach(function(row) {
            row.style.display = 'block';
          });
        });
      }
    }

    function exportStandaloneHTML() {
      closeExportModal();
      var filename = getResolvedFileName('html', false);
      var mount = document.getElementById('paper-mount-point').innerHTML;
      var fullHtml = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' + filename + '</title><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.css"><style>@page{size:A4 portrait;margin:15mm;}body{font-family:"Songti SC",SimSun,serif;padding:20px;font-size:10.5pt;line-height:1.65;}.paper-title{text-align:center;font-size:1.6em;}.paper-meta{display:flex;justify-content:space-around;border-bottom:2px solid #000;padding-bottom:10px;margin-bottom:20px;}.section-title{font-size:1.05em;font-weight:bold;margin:18px 0 12px;break-after:avoid;}.question-row{break-inside:avoid;margin-bottom:20px;}.q-layout-box{display:flex;justify-content:space-between;gap:16px;}.q-cell-content{flex:1;}.q-cell-graphic{width:190px;flex-shrink:0;}.options-grid.cols-4{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;}.options-grid.cols-2{display:grid;grid-template-columns:repeat(2,1fr);gap:6px;}.options-grid.cols-1{display:flex;flex-direction:column;gap:4px;}.rule-blank{height:24px;}</style></head><body>' + mount + '</body></html>';
      downloadBlob(fullHtml, filename, 'text/html;charset=utf-8');
    }

    async function pasteFromClipboard() {
      try {
        var text = await navigator.clipboard.readText();
        if (text) {
          document.getElementById('paper-json').value = text;
          if (renderPaperFromTextarea()) {
            setTab('preview');
            alert("✅ 剪贴板内容已成功读取并载入试卷！");
          }
        }
      } catch (err) {
        alert("请长按输入框使用系统粘贴，或改用导入文件。");
      }
    }
    function triggerFileInput() { document.getElementById('file-uploader').click(); }
    function handleFileUpload(event) {
      var file = event.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function(e) {
        document.getElementById('paper-json').value = e.target.result;
        if (renderPaperFromTextarea()) {
          setTab('preview');
          alert("✅ 文件已成功读取并载入试卷！");
        }
      };
      reader.readAsText(file, "UTF-8");
      event.target.value = '';
    }
    function clearJson() {
      if (confirm("确定清空数据吗？")) {
        document.getElementById('paper-json').value = '';
      }
    }
  </script>
</body>
</html>`;
}

// 预设数据：30道全学科高强度测试卷（方案 B：纯白留白）
const PRESET_30_EXAM = {
  "paper_title": "2026年全学科综合能力全真高强度测试卷",
  "meta": { "subject": "全科综合", "time": "180分钟", "total_score": 300 },
  "sections": [
    {
      "title": "第一部分：高中数学核心素养与空间解析能力（第 1-8 题，共 80 分）",
      "questions": [
        {
          "id": 1, "score": 5,
          "stem": "设复数 $z$ 满足 $(1 + 2\\mathrm{i})z = 3 - 4\\mathrm{i}$，其中 $\\mathrm{i}$ 为虚数单位，则复数 $z$ 的共轭复数 $\\bar{z}$ 在复平面内所对应的点位于（  ）",
          "options": ["第一象限", "第二象限", "第三象限", "第四象限"],
          "blank_lines": 0
        },
        {
          "id": 2, "score": 5,
          "stem": "已知定义在 $\\mathbf{R}$ 上的奇函数 $f(x)$ 满足 $f(x+2) = -f(x)$，且当 $x \\in (0, 1]$ 时，$f(x) = 2^x - 1$。若函数 $g(x) = f(x) - \\log_a(x+1)$ 在区间 $(-1, 7]$ 内恰有 $4$ 个零点，则实数 $a$ 的取值范围为（  ）",
          "options": ["$(1, \\sqrt{2})$", "$(\\sqrt{2}, 2)$", "$(2, 2\\sqrt{2})$", "$(2\\sqrt{2}, 4)$"],
          "blank_lines": 0
        },
        {
          "id": 3, "score": 5,
          "stem": "函数 $f(x) = x^3 - 3x^2 + ax + 1$ 在点 $(1, f(1))$ 处的切线与直线 $y = -2x + 5$ 垂直，其导函数零点分布如右图所示。则极值点 $x_1$ 对应的极小值为（  ）",
          "options": ["$-2$", "$-1$", "$0$", "$2$"],
          "diagram": { "engine": "func_2d" },
          "blank_lines": 0
        },
        {
          "id": 4, "score": 5,
          "stem": "已知双曲线 $C: \\frac{x^2}{a^2} - \\frac{y^2}{b^2} = 1\\ (a>0, b>0)$ 的右焦点为 $F_2(c, 0)$，过 $F_2$ 作渐近线的垂线交两渐近线于 $A, B$ 两点，若 $\\triangle OAB$ 为等边三角形，则双曲线的离心率 $e$ 的值为（  ）",
          "options": ["$\\sqrt{3}$", "$\\frac{2\\sqrt{3}}{3}$", "$2$", "$\\sqrt{5}$"],
          "diagram": {
            "engine": "raw_svg",
            "svg": "<svg width='190' height='140' viewBox='0 0 190 140'><line x1='15' y1='70' x2='175' y2='70' stroke='#000' stroke-width='1.2'/><line x1='95' y1='10' x2='95' y2='130' stroke='#000' stroke-width='1.2'/><path d='M 25 15 L 165 125' stroke='#94a3b8' stroke-dasharray='3,3'/><path d='M 25 125 L 165 15' stroke='#94a3b8' stroke-dasharray='3,3'/><path d='M 120 25 Q 105 70 120 115' fill='none' stroke='#4f46e5' stroke-width='1.5'/><path d='M 70 25 Q 85 70 70 115' fill='none' stroke='#4f46e5' stroke-width='1.5'/><circle cx='132' cy='70' r='2.5' fill='#000'/><text x='134' y='66' font-size='10'>F₂</text><text x='99' y='82' font-size='10'>O</text></svg>"
          },
          "blank_lines": 0
        },
        {
          "id": 5, "score": 12,
          "stem": "如图所示，在正四面体 $A-BCD$ 中，棱长均为 $4$，$E, F$ 分别为棱 $AB, CD$ 的中点。(1) 求证：$EF \\perp AB$ 且 $EF \\perp CD$；(2) 求异面直线 $AC$ 与 $BD$ 所成角的大小；(3) 求点 $B$ 到平面 $ACD$ 的距离。",
          "blank_lines": 6,
          "diagram": {
            "engine": "wireframe_3d", "scale": 1.1, "rotation": { "rx": 18, "ry": -30 },
            "nodes": { "A": [0, 65, 0], "B": [-50, -35, 40], "C": [55, -35, 30], "D": [0, -35, -50], "E": [-25, 15, 20], "F": [27.5, -35, -10] },
            "solid_lines": [["A","B"],["A","C"],["B","C"],["A","D"],["C","D"],["E","F"]],
            "dashed_lines": [["B","D"]]
          }
        },
        {
          "id": 6, "score": 15,
          "stem": "如图所示，在直六棱柱 $ABCDEF-A_1B_1C_1D_1E_1F_1$ 中，底面为边长为 $2$ 的正六边形，侧棱长为 $4$。点 $P$ 为棱 $CC_1$ 的中点。(1) 证明：直线 $A_1D_1 \\parallel \\text{平面 } BPE$；(2) 求二面角 $P-AB-C$ 的正切值；(3) 求三棱锥 $P-ABD$ 的体积。",
          "blank_lines": 7,
          "diagram": {
            "engine": "wireframe_3d", "scale": 0.8, "rotation": { "rx": 20, "ry": -34 },
            "nodes": {
              "A": [-40, -45, 20], "B": [-10, -45, 45], "C": [35, -45, 30], "D": [50, -45, -10], "E": [20, -45, -35], "F": [-25, -45, -20],
              "A1": [-40, 45, 20], "B1": [-10, 45, 45], "C1": [35, 45, 30], "D1": [50, 45, -10], "E1": [20, 45, -35], "F1": [-25, 45, -20],
              "P": [35, 0, 30]
            },
            "solid_lines": [
              ["A","B"],["B","C"],["C","D"],["A1","B1"],["B1","C1"],["C1","D1"],["D1","E1"],["E1","F1"],["F1","A1"],
              ["A","A1"],["B","B1"],["C","C1"],["D","D1"],["B","P"],["P","E"]
            ],
            "dashed_lines": [["D","E"],["E","F"],["F","A"],["E","E1"],["F","F1"],["B","E"]]
          }
        },
        {
          "id": 7, "score": 16,
          "stem": "某高科技园区进行自动化设备质检，设备寿命指标 $X \\sim \\mathcal{N}(\\mu, \\sigma^2)$。正态分布曲线如下图所示。已知 $P(X \\le 1000) = 0.1587$，$P(X \\ge 1200) = 0.0228$。根据 $3\\sigma$ 原则及正态对称性：(1) 求期望 $\\mu$ 和标准差 $\\sigma$；(2) 若从中随机抽取 $100$ 台设备，记寿命在区间 $[900, 1100]$ 内的台数为 $Y$，求 $E(Y)$ 与 $D(Y)$。",
          "blank_lines": 6,
          "diagram": {
            "engine": "raw_svg",
            "svg": "<svg width='190' height='135' viewBox='0 0 190 135'><line x1='15' y1='115' x2='175' y2='115' stroke='#000' stroke-width='1.2'/><path d='M 20 115 Q 70 115, 85 80 T 95 20 T 105 80 Q 120 115, 170 115' fill='rgba(79,70,229,0.1)' stroke='#4f46e5' stroke-width='1.8'/><line x1='95' y1='115' x2='95' y2='20' stroke='#dc2626' stroke-width='1.2' stroke-dasharray='4,2'/><text x='91' y='128' font-size='10'>μ</text><text x='62' y='128' font-size='9'>μ-σ</text><text x='120' y='128' font-size='9'>μ+σ</text><text x='152' y='35' font-size='10' fill='#4f46e5'>f(x)</text></svg>"
          }
        },
        {
          "id": 8, "score": 17,
          "stem": "已知函数 $f(x) = (x - 2)\\mathrm{e}^x + a(x - 1)^2$。(1) 当 $a = 1$ 时，讨论函数 $f(x)$ 的单调性；(2) 若对任意 $x \\ge 1$，恒有 $f(x) \\ge -1$ 成立，求实数 $a$ 的取值范围。",
          "blank_lines": 7, "diagram": null
        }
      ]
    },
    {
      "title": "第二部分：高中物理动力学、电磁学与热力学建模（第 9-14 题，共 60 分）",
      "questions": [
        {
          "id": 9, "score": 6,
          "stem": "如图所示的惠斯通电桥电路中，$R_1 = 10\\,\\Omega$，$R_2 = 20\\,\\Omega$，$R_3 = 30\\,\\Omega$。灵敏电流计 G 的内阻不计。若使电流计中的示数为零，则可调电阻 $R_x$ 的阻值应调节为（  ）",
          "options": ["$15\\,\\Omega$", "$40\\,\\Omega$", "$60\\,\\Omega$", "$80\\,\\Omega$"],
          "diagram": {
            "engine": "raw_svg",
            "svg": "<svg width='180' height='130' viewBox='0 0 180 130'><polygon points='90,15 140,65 90,115 40,65' fill='none' stroke='#000' stroke-width='1.5'/><line x1='40' y1='65' x2='140' y2='65' stroke='#000' stroke-width='1'/><circle cx='90' cy='65' r='10' fill='#fff' stroke='#000' stroke-width='1.2'/><text x='86' y='69' font-size='11' font-weight='bold'>G</text><rect x='56' y='32' width='14' height='8' fill='#fff' stroke='#000'/><text x='54' y='27' font-size='9'>R₁</text><rect x='110' y='32' width='14' height='8' fill='#fff' stroke='#000'/><text x='114' y='27' font-size='9'>R₂</text><rect x='56' y='88' width='14' height='8' fill='#fff' stroke='#000'/><text x='54' y='105' font-size='9'>R₃</text><rect x='110' y='88' width='14' height='8' fill='#fff' stroke='#000'/><text x='114' y='105' font-size='9'>R_x</text></svg>"
          },
          "blank_lines": 0
        },
        {
          "id": 10, "score": 6,
          "stem": "一定质量的理想气体经历如右图所示的 $p-V$ 封闭循环过程 $A \\to B \\to C \\to A$。其中 $A \\to B$ 为等温膨胀，$B \\to C$ 为等容降压，$C \\to A$ 为绝热压缩。下列说法正确的是（  ）",
          "options": [
            "$A \\to B$ 过程气体对外放热",
            "$B \\to C$ 过程气体内能保持不变",
            "全循环过程中气体对外做的净功等于封闭图形的几何面积",
            "全循环过程中气体从外界吸收的热量小于对外做的功"
          ],
          "diagram": {
            "engine": "raw_svg",
            "svg": "<svg width='180' height='130' viewBox='0 0 180 130'><line x1='25' y1='110' x2='165' y2='110' stroke='#000' stroke-width='1.2'/><line x1='25' y1='110' x2='25' y2='15' stroke='#000' stroke-width='1.2'/><text x='165' y='122' font-size='10' font-style='italic'>V</text><text x='15' y='20' font-size='10' font-style='italic'>p</text><path d='M 50 30 Q 95 40, 125 85 L 125 105 L 50 30' fill='rgba(79,70,229,0.1)' stroke='#4f46e5' stroke-width='1.5'/><text x='43' y='28' font-size='10' font-weight='bold'>A</text><text x='130' y='85' font-size='10' font-weight='bold'>B</text><text x='130' y='110' font-size='10' font-weight='bold'>C</text></svg>"
          },
          "blank_lines": 0
        },
        {
          "id": 11, "score": 10,
          "stem": "如图所示，倾角 $\\theta = 30^\\circ$ 的光滑斜面上，一轻质弹簧下端固定在斜面底端的挡板上。质量 $m = 1\\text{ kg}$ 的滑块从距离弹簧上端 $L = 0.8\\text{ m}$ 处由静止滑下，将弹簧压缩至最大形变量 $x = 0.2\\text{ m}$。重力加速度取 $g = 10\\text{ m/s}^2$。求：(1) 弹簧的最大弹性势能 $E_p$；(2) 滑块速度达到最大值时弹簧的压缩量。",
          "blank_lines": 6,
          "diagram": {
            "engine": "raw_svg",
            "svg": "<svg width='180' height='130' viewBox='0 0 180 130'><polygon points='15,115 160,115 160,35' fill='none' stroke='#000' stroke-width='1.5'/><rect x='150' y='28' width='10' height='18' fill='#475569'/><path d='M 155 35 L 125 50 L 135 55 L 115 65 L 125 70 L 105 80' fill='none' stroke='#000' stroke-width='1.5'/><g transform='translate(80, 75) rotate(-28)'><rect x='0' y='-15' width='22' height='14' fill='#e2e8f0' stroke='#000' stroke-width='1.2'/><text x='5' y='-4' font-size='9'>m</text></g><text x='35' y='110' font-size='10'>θ=30°</text></svg>"
          }
        },
        {
          "id": 12, "score": 12,
          "stem": "两根平行的光滑金属导轨间距 $L = 0.5\\text{ m}$，与水平面夹角 $\\alpha = 37^\\circ$，底端接有电阻 $R = 2\\,\\Omega$。磁感应强度 $B = 1\\text{ T}$ 的匀强磁场垂直于导轨平面向上。质量 $m = 0.1\\text{ kg}$、电阻 $r = 0.5\\,\\Omega$ 的导体棒自静止沿导轨滑下，导轨足够长。求：(1) 导体棒下滑过程中的最大速度 $v_m$；(2) 当速度达到 $v = 2\\text{ m/s}$ 时导体棒的加速度 $a$。",
          "blank_lines": 6,
          "diagram": {
            "engine": "raw_svg",
            "svg": "<svg width='180' height='130' viewBox='0 0 180 130'><line x1='20' y1='105' x2='150' y2='35' stroke='#000' stroke-width='2'/><line x1='40' y1='120' x2='170' y2='50' stroke='#000' stroke-width='2'/><rect x='18' y='101' width='20' height='18' fill='#fff' stroke='#000'/><text x='24' y='114' font-size='9'>R</text><g transform='translate(95,55) rotate(-28)'><rect x='-5' y='-10' width='10' height='36' fill='#94a3b8' stroke='#000'/><text x='-3' y='13' font-size='8' fill='#fff'>棒</text></g><line x1='105' y1='30' x2='105' y2='10' stroke='#4f46e5' stroke-width='1.5'/><text x='110' y='20' font-size='10' fill='#4f46e5'>B</text></svg>"
          }
        },
        {
          "id": 13, "score": 12,
          "stem": "如图所示，在 $xOy$ 平面内，第 I 象限内存在垂直纸面向外的匀强磁场 $B_1$，第 IV 象限内存在沿 $y$ 轴正方向的匀强电场 $E$。一质量为 $m$、电荷量为 $+q$ 的粒子从 $y$ 轴上的点 $P(0, d)$ 以初速度 $v_0$ 垂直于 $y$ 轴射入磁场，恰好垂直穿过 $x$ 轴进入电场。求：(1) 匀强磁场的磁感应强度 $B_1$；(2) 粒子在电场中运动至 $y = -d$ 时的动能 $E_k$。",
          "blank_lines": 6,
          "diagram": {
            "engine": "raw_svg",
            "svg": "<svg width='180' height='130' viewBox='0 0 180 130'><line x1='15' y1='65' x2='165' y2='65' stroke='#000' stroke-width='1.2'/><line x1='40' y1='120' x2='40' y2='10' stroke='#000' stroke-width='1.2'/><text x='165' y='61' font-size='10'>x</text><text x='32' y='15' font-size='10'>y</text><circle cx='70' cy='32' r='4' fill='none' stroke='#4f46e5'/><circle cx='70' cy='32' r='1.5' fill='#4f46e5'/><path d='M 40 32 A 32 32 0 0 1 72 65' fill='none' stroke='#dc2626' stroke-width='1.5' stroke-dasharray='4,2'/><circle cx='40' cy='32' r='2' fill='#000'/><text x='25' y='34' font-size='9'>P(0,d)</text><g stroke='#16a34a' stroke-width='1'><line x1='70' y1='115' x2='70' y2='75'/><line x1='100' y1='115' x2='100' y2='75'/></g><text x='110' y='95' font-size='10' fill='#16a34a'>E</text></svg>"
          }
        },
        {
          "id": 14, "score": 14,
          "stem": "简谐横波在 $t = 0$ 时刻的波形图如右图实线所示，经 $\\Delta t = 0.2\\text{ s}$ 后的波形图如图虚线所示。已知波沿 $x$ 轴正方向传播，且周期 $T > 0.2\\text{ s}$。(1) 求波的传播速度 $v$；(2) 写出质点 $P$（位于 $x = 2\\text{ m}$ 处）的振动方程。",
          "blank_lines": 6,
          "diagram": {
            "engine": "raw_svg",
            "svg": "<svg width='180' height='120' viewBox='0 0 180 120'><line x1='15' y1='60' x2='165' y2='60' stroke='#000' stroke-width='1.2'/><line x1='30' y1='110' x2='30' y2='10' stroke='#000' stroke-width='1.2'/><path d='M 30 60 Q 55 10, 80 60 T 130 60 T 165 60' fill='none' stroke='#000' stroke-width='1.5'/><path d='M 30 85 Q 55 35, 80 85 T 130 85 T 165 85' fill='none' stroke='#dc2626' stroke-width='1.2' stroke-dasharray='4,3'/><text x='165' y='55' font-size='10'>x/m</text><text x='15' y='15' font-size='10'>y/cm</text><text x='75' y='75' font-size='9'>P(2,0)</text></svg>"
          }
        }
      ]
    },
    {
      "title": "第三部分：高中化学微观结构、电化学与平衡热力学（第 15-19 题，共 50 分）",
      "questions": [
        {
          "id": 15, "score": 8,
          "stem": "$\\ce{NaCl}$ 晶胞为典型的面心立方结构，晶胞结构如右侧线框模型所示。若晶胞参数为 $a\\text{ pm}$，阿伏加德罗常数的值为 $N_A$。则：(1) 与每个 $\\ce{Na+}$ 距离最近且等距的 $\\ce{Cl-}$ 个数为 _______；(2) 该晶体的密度表达式为 $\\rho = $ ________ $\\text{g/cm}^3$。",
          "blank_lines": 5,
          "diagram": {
            "engine": "wireframe_3d", "scale": 1.0, "rotation": { "rx": 20, "ry": -32 },
            "nodes": {
              "A": [-38, -38, 38], "B": [38, -38, 38], "C": [38, -38, -38], "D": [-38, -38, -38],
              "A1": [-38, 38, 38], "B1": [38, 38, 38], "C1": [38, 38, -38], "D1": [-38, 38, -38],
              "F1": [0, -38, 0], "F2": [0, 38, 0], "F3": [0, 0, 38], "F4": [0, 0, -38]
            },
            "solid_lines": [["A","B"],["B","C"],["A","A1"],["B","B1"],["C","C1"],["A1","B1"],["B1","C1"],["C1","D1"],["D1","A1"]],
            "dashed_lines": [["A","D"],["C","D"],["D","D1"],["F1","F2"],["F3","F4"]]
          }
        },
        {
          "id": 16, "score": 10,
          "stem": "工业上利用阳离子交换膜电解饱和食盐水制备烧碱和氯气，装置如下图所示。(1) 电极 $\\ce{A}$ 为电源的 ________ 极（填“正”或“负”）；(2) 写出阴极室的电极反应式：____________________；(3) 简述阳离子交换膜在此电解过程中的关键作用。",
          "blank_lines": 5,
          "diagram": {
            "engine": "raw_svg",
            "svg": "<svg width='180' height='125' viewBox='0 0 180 125'><rect x='20' y='20' width='130' height='85' fill='none' stroke='#000' stroke-width='1.5'/><line x1='85' y1='20' x2='85' y2='105' stroke='#4f46e5' stroke-width='2' stroke-dasharray='4,3'/><rect x='35' y='32' width='12' height='60' fill='#475569'/><rect x='120' y='32' width='12' height='60' fill='#94a3b8'/><text x='30' y='27' font-size='9'>阳极(Ti)</text><text x='116' y='27' font-size='9'>阴极(Fe)</text><text x='70' y='116' font-size='8' fill='#4f46e5'>阳离子膜</text></svg>"
          }
        },
        {
          "id": 17, "score": 10,
          "stem": "恒容密闭容器中充入 $1\\text{ mol } \\ce{CO2}$ 与 $3\\text{ mol } \\ce{H2}$ 催化合成甲醇：$$\\ce{CO2(g) + 3H2(g) <=> CH3OH(g) + H2O(g)} \\quad \\Delta H < 0$$ 测得温度对平衡转化率的影响曲线如右图所示。(1) 分析 $T_1$ 与 $T_2$ 的大小关系；(2) 欲在 $T_1$ 下提高 $\\ce{CO2}$ 的转化率，可采取的措施包括 ________________。",
          "blank_lines": 5,
          "diagram": {
            "engine": "raw_svg",
            "svg": "<svg width='180' height='120' viewBox='0 0 180 120'><line x1='20' y1='100' x2='160' y2='100' stroke='#000' stroke-width='1.2'/><line x1='20' y1='100' x2='20' y2='15' stroke='#000' stroke-width='1.2'/><text x='160' y='112' font-size='9'>T/K</text><text x='8' y='20' font-size='9'>α%</text><path d='M 30 30 Q 80 55, 140 90' fill='none' stroke='#dc2626' stroke-width='1.8'/><text x='145' y='90' font-size='9' fill='#dc2626'>P₁</text><path d='M 30 50 Q 80 75, 140 98' fill='none' stroke='#4f46e5' stroke-width='1.5' stroke-dasharray='4,2'/><text x='145' y='104' font-size='9' fill='#4f46e5'>P₂</text></svg>"
          }
        },
        {
          "id": 18, "score": 12,
          "stem": "有机物 $\\ce{G}$ 的合成路线如下：已知化合物 $\\ce{A}$ 在光照下与 $\\ce{Cl2}$ 反应生成一氯代烃 $\\ce{B}$，经水解得到醇 $\\ce{C}$，氧化生成醛 $\\ce{D}$。(1) 写出 $\\ce{A}$ 的结构简式：____________；(2) $\\ce{D -> E}$ 的反应类型为 ____________；(3) 写出 $\\ce{E}$ 与足量乙醇发生酯化反应的化学方程式：________________________________。",
          "blank_lines": 6,
          "diagram": {
            "engine": "raw_svg",
            "svg": "<svg width='180' height='120' viewBox='0 0 180 120'><rect x='10' y='15' width='38' height='20' rx='4' fill='#f1f5f9' stroke='#000'/><text x='24' y='29' font-size='10' font-weight='bold'>A</text><line x1='48' y1='25' x2='80' y2='25' stroke='#000' stroke-width='1.2'/><text x='54' y='20' font-size='8'>Cl₂/光</text><rect x='80' y='15' width='38' height='20' rx='4' fill='#f1f5f9' stroke='#000'/><text x='94' y='29' font-size='10' font-weight='bold'>B</text><line x1='99' y1='35' x2='99' y2='68' stroke='#000' stroke-width='1.2'/><text x='104' y='53' font-size='8'>NaOH</text><rect x='80' y='68' width='38' height='20' rx='4' fill='#eff6ff' stroke='#4f46e5'/><text x='94' y='82' font-size='10' font-weight='bold' fill='#4f46e5'>C</text></svg>"
          }
        },
        {
          "id": 19, "score": 10,
          "stem": "$25^\\circ\\text{C}$ 时，用 $0.1000\\text{ mol/L } \\ce{NaOH}$ 溶液滴定 $20.00\\text{ mL } 0.1000\\text{ mol/L } \\ce{CH3COOH}$ 溶液，滴定曲线如下图所示。当加入 $V(\\ce{NaOH}) = 10.00\\text{ mL}$ 时，溶液中各离子浓度大小关系为 ________________________；当 $\\text{pH} = 7$ 时，比较 $c(\\ce{Na+})$ 与 $c(\\ce{CH3COO-})$ 的大小。",
          "blank_lines": 5,
          "diagram": {
            "engine": "raw_svg",
            "svg": "<svg width='180' height='120' viewBox='0 0 180 120'><line x1='20' y1='100' x2='160' y2='100' stroke='#000' stroke-width='1.2'/><line x1='20' y1='100' x2='20' y2='15' stroke='#000' stroke-width='1.2'/><text x='160' y='112' font-size='9'>V/mL</text><text x='8' y='20' font-size='9'>pH</text><path d='M 20 80 Q 65 70, 85 65 T 90 25 T 140 18' fill='none' stroke='#4f46e5' stroke-width='1.6'/><line x1='20' y1='52' x2='90' y2='52' stroke='#94a3b8' stroke-dasharray='3,2'/><text x='10' y='55' font-size='9'>7</text></svg>"
          }
        }
      ]
    },
    {
      "title": "第四部分：高中地理自然要素、地质与空间观测（第 20-23 题，共 40 分）",
      "questions": [
        {
          "id": 20, "score": 10,
          "stem": "读右侧某区域等高线地形图，图中河流由西向东流经峡谷。(1) 指出图示区域内陡崖的最大相对高度范围；(2) 若当地规划在图示鞍部处修建公路隧道，请从地质与防灾角度论述其选线合理性。",
          "blank_lines": 5,
          "diagram": { "engine": "geography_2d" }
        },
        {
          "id": 21, "score": 10,
          "stem": "下图为以极点为中心的极地俯视图，阴影部分表示黑夜，非阴影部分表示白昼。此时太阳直射点的地理坐标为 ____________；北京时间为 ____________ 时；并指出该日全球正午太阳高度角的纬度分布规律。",
          "blank_lines": 5,
          "diagram": {
            "engine": "raw_svg",
            "svg": "<svg width='180' height='130' viewBox='0 0 180 130'><circle cx='90' cy='65' r='50' fill='none' stroke='#000' stroke-width='1.2'/><circle cx='90' cy='65' r='33' fill='none' stroke='#94a3b8' stroke-dasharray='3,2'/><circle cx='90' cy='65' r='16' fill='none' stroke='#94a3b8' stroke-dasharray='3,2'/><path d='M 90 15 A 50 50 0 0 1 90 115 Z' fill='rgba(15,23,42,0.2)'/><circle cx='90' cy='65' r='2.5' fill='#000'/><text x='94' y='63' font-size='9'>N</text><line x1='40' y1='65' x2='140' y2='65' stroke='#000' stroke-width='1'/><text x='143' y='68' font-size='9'>0°</text></svg>"
          }
        },
        {
          "id": 22, "score": 10,
          "stem": "读某地地质剖面示意图，分析该区域地质构造演变历程。(1) 判定甲处的地质构造类型并说明其形成谷地的原因；(2) 说明岩浆岩侵入体乙与沉积岩层丙的形成先后顺序及依据。",
          "blank_lines": 5,
          "diagram": {
            "engine": "raw_svg",
            "svg": "<svg width='180' height='120' viewBox='0 0 180 120'><rect x='15' y='15' width='150' height='90' fill='none' stroke='#000' stroke-width='1.2'/><path d='M 15 65 Q 60 25, 95 65 T 165 45' fill='none' stroke='#64748b' stroke-width='1.5'/><path d='M 15 85 Q 60 45, 95 85 T 165 65' fill='none' stroke='#64748b' stroke-width='1.5'/><polygon points='115,105 128,40 145,60 132,105' fill='#cbd5e1' stroke='#000'/><text x='122' y='80' font-size='9'>乙</text><text x='55' y='50' font-size='10' font-weight='bold'>甲</text></svg>"
          }
        },
        {
          "id": 23, "score": 10,
          "stem": "下图为某天气系统过境示意图。根据锋面两侧气团性质与降水落区分布：(1) 判定该系统为 ______（填“冷锋”或“暖锋”）；(2) 说明雨区主要分布在锋线的前方还是后方，并描述过境后的气温与气压变化。",
          "blank_lines": 5,
          "diagram": {
            "engine": "raw_svg",
            "svg": "<svg width='180' height='120' viewBox='0 0 180 120'><line x1='15' y1='100' x2='165' y2='100' stroke='#000' stroke-width='1.2'/><path d='M 30 100 L 125 35' stroke='#4f46e5' stroke-width='2'/><path d='M 70 35 C 60 25, 90 15, 100 30 C 110 15, 135 20, 125 35 Z' fill='#94a3b8'/><g stroke='#4f46e5' stroke-dasharray='2,2'><line x1='90' y1='40' x2='85' y2='75'/><line x1='105' y1='40' x2='100' y2='75'/></g><text x='30' y='80' font-size='9' fill='#dc2626'>暖气团 →</text><text x='115' y='85' font-size='9' fill='#4f46e5'>冷气团</text></svg>"
          }
        }
      ]
    },
    {
      "title": "第五部分：英语高考与雅思学术图表写作（第 24-27 题，共 40 分）",
      "questions": [
        {
          "id": 24, "score": 15,
          "stem": "<b>IELTS Academic Writing Task 1:</b> The chart below gives information about global energy consumption by source in 2010 and projected data for 2030. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. (Write at least 150 words)",
          "blank_lines": 7,
          "diagram": { "engine": "ielts_chart" }
        },
        {
          "id": 25, "score": 10,
          "stem": "<b>Process Analysis:</b> The diagram below illustrates the multi-stage filtration and purification process of an industrial water recycling plant. Describe how contaminated runoff is transformed into potable water.",
          "blank_lines": 6,
          "diagram": {
            "engine": "raw_svg",
            "svg": "<svg width='180' height='100' viewBox='0 0 180 100'><rect x='5' y='30' width='42' height='30' fill='#f1f5f9' stroke='#000'/><text x='8' y='48' font-size='8'>Screening</text><line x1='47' y1='45' x2='65' y2='45' stroke='#000' stroke-width='1.2'/><rect x='65' y='25' width='46' height='40' fill='#e2e8f0' stroke='#000'/><text x='68' y='48' font-size='8'>Sediment</text><line x1='111' y1='45' x2='128' y2='45' stroke='#000' stroke-width='1.2'/><rect x='128' y='30' width='44' height='30' fill='#eff6ff' stroke='#4f46e5'/><text x='132' y='48' font-size='8' fill='#4f46e5'>Chlorine</text></svg>"
          }
        },
        {
          "id": 26, "score": 8,
          "stem": "Read the passage below and fill in each blank with ONE proper word, or the correct form of the given word:<br>Modern deep learning architectures, particularly Transformers, ________ (revolutionize) the field of natural language understanding. By relying entirely on self-attention mechanisms, they eliminate recurrence ________ (complete), allowing unprecedented degrees of parallel computing during large-scale pre-training.",
          "blank_lines": 4,
          "diagram": null
        },
        {
          "id": 27, "score": 7,
          "stem": "According to cognitive linguistics, metaphor is not merely an ornamental device of rhetoric, but a fundamental schema of conceptual mapping. Which of the following statements best aligns with this perspective?",
          "options": [
            "Metaphors only exist in poetic and literary discourse.",
            "Human reasoning and abstract thought are systematically grounded in metaphorical structuring.",
            "Metaphorical expressions hinder clear analytical thinking.",
            "Language comprehension is completely detached from physical experience."
          ],
          "blank_lines": 0
        }
      ]
    },
    {
      "title": "第六部分：日本語能力試験 JLPT 読解と言語知識（第 28-30 题，共 30 分）",
      "questions": [
        {
          "id": 28, "score": 6,
          "stem": "次の文の言葉の読み方として最もよいものを、1・2・3・4から一つ選びなさい。<br>新規事業の立ち上げをめぐって、役員会の議論は<ruby>紛糾<rt>ふんきゅう</rt></ruby>し、最終的な意思決定を【  】せざるを得なかった。",
          "options": [
            "<ruby>躊躇<rt>ちゅうちょ</rt></ruby>",
            "<ruby>模索<rt>もさく</rt></ruby>",
            "<ruby>延期<rt>えんき</rt></ruby>",
            "<ruby>断念<rt>だんねん</rt></ruby>"
          ],
          "blank_lines": 0
        },
        {
          "id": 29, "score": 8,
          "stem": "次の文の【 ★ 】に入る最もよいものを、1・2・3・4から一つ選びなさい。<br>たとえどんなに ________ ________ 【 ★ 】 ________ 決して諦めてはならない。<br>1. 困難な状況に 2. あろうとも 3. 陥ることが 4. 自分を見失って",
          "options": ["1", "2", "3", "4"],
          "blank_lines": 0
        },
        {
          "id": 30, "score": 16,
          "stem": "次のビジネス文書を読んで、後の問いに答えなさい。<br><div style='padding:8px; background:#ffffff; border:1px solid #cbd5e1; border-radius:4px; font-size:9.5pt; line-height:1.6; margin:6px 0;'><b>業務効率化に向けたリモートワーク制度改定のご案内</b><br>社員各位：来月1日より、コアタイム（11:00〜15:00）を廃止し、完全フルフレックス制度へ移行いたします。ただし、情報セキュリティ担保のため、指定の社内VPNを経由しない通信は一切遮断されます。また、週1回の部署定例ミーティングは原則対面参加とします。</div>問：新制度における社員の勤務形態として、本文の内容と合致しているものはどれか。",
          "options": [
            "コアタイム内であれば事前的連絡なしで自由に退勤できる",
            "自宅勤務の際も、週に一度はオフィスに出社して定例会に参加する必要がある",
            "社外のカフェ等从个人Wi-Fiで接続することが全面的に推奨されている",
            "フルフレックス制の导入に伴い、セキュリティ管理基準は大幅に緩和された"
          ],
          "blank_lines": 0
        }
      ]
    }
  ]
};