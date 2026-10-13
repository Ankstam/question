export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 1. 边缘 AI 代理端口：解决移动端请求第三方 LLM 接口时的 CORS 跨域限制
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

    // 3. 输出自包含现代 Web 应用
    return new Response(buildDocumentHTML(DEFAULT_PRESET), {
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
  <title>ExamCraft AI - 现代化数理题库与错题闭环引擎</title>
  
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/mhchem.min.js"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"></script>
  <script defer src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>

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

      /* 打印排版参数 */
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

    /* 顶栏现代化毛玻璃效果 */
    .app-header {
      position: sticky; top: 0; z-index: 50;
      background: rgba(255, 255, 255, 0.85);
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

    /* 选项卡胶囊设计 */
    .tabs {
      display: flex; gap: 4px; padding: 4px 12px 10px; overflow-x: auto;
    }
    .tab-btn {
      flex: 1; padding: 9px 12px; border: none; background: transparent;
      font-size: 12.5px; font-weight: 600; color: var(--text-sub);
      border-radius: 8px; cursor: pointer; transition: all 0.2s ease;
      white-space: nowrap; text-align: center;
    }
    .tab-btn.active {
      background: #ffffff; color: var(--primary);
      box-shadow: 0 1px 3px rgba(0,0,0,0.08); font-weight: 700;
    }

    .main-body { padding: 14px; margin-bottom: 85px; max-width: 900px; margin-left: auto; margin-right: auto; }
    .panel { display: none; }
    .panel.active { display: block; }

    /* 现代化卡片 */
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
      display: inline-flex; align-items: center; gap: 4px; transition: all 0.15s;
    }
    .btn-sm:active { transform: scale(0.98); background: #f1f5f9; }
    .btn-sm.active-preset { background: var(--primary); color: #ffffff; border-color: var(--primary); }

    input[type="text"], input[type="password"], textarea, select {
      width: 100%; padding: 10px 12px; border: 1px solid var(--border); border-radius: 8px;
      font-size: 13px; outline: none; background: #fafafa; color: var(--text-main);
      transition: border 0.2s;
    }
    input:focus, textarea:focus, select:focus {
      border-color: var(--primary); background: #ffffff;
      box-shadow: 0 0 0 2px var(--primary-light);
    }
    textarea { font-family: "SF Mono", Menlo, Consolas, monospace; min-height: 200px; line-height: 1.5; }

    .slider-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .slider-item { display: flex; flex-direction: column; gap: 4px; }
    .slider-item label { font-size: 11px; color: var(--text-sub); display: flex; justify-content: space-between; font-weight: 600; }
    .slider-item input[type="range"] { width: 100%; margin: 6px 0; }

    /* 预览控制栏 */
    .preview-bar {
      display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; gap: 8px; flex-wrap: wrap;
    }
    .mistake-counter {
      font-size: 12px; font-weight: 600; color: var(--danger);
      background: var(--danger-light); padding: 4px 10px; border-radius: 6px;
    }

    .paper-scroller {
      width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; padding-bottom: 20px;
    }

    /* 试卷纸张排版（保真打印） */
    .paper-sheet {
      background: #ffffff !important; margin: 0 auto;
      font-family: "Songti SC", "SimSun", "Times New Roman", "Yu Mincho", serif;
      color: #000000; font-size: var(--paper-font-size); line-height: var(--paper-line-height);
    }
    .paper-sheet.mobile-fit { width: 100% !important; padding: 12px 6px; }
    .paper-sheet.mobile-fit .q-flex-box { flex-direction: column; align-items: center; }
    .paper-sheet.mobile-fit .q-graphic-box { width: 100% !important; margin-top: 10px; }

    .paper-sheet.a4-exact {
      width: 210mm !important; min-height: 297mm; padding: 16mm 15mm;
      border: 1px solid var(--border); box-shadow: var(--shadow);
    }
    .paper-sheet.a4-exact .q-flex-box { flex-direction: row; align-items: flex-start; }
    .paper-sheet.a4-exact .q-graphic-box { width: var(--diagram-width); flex-shrink: 0; }

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

    /* 错题操作按钮悬浮徽标 */
    .mistake-tag-btn {
      position: absolute; right: 0; top: -6px;
      font-size: 11px; padding: 2px 8px; border-radius: 4px;
      border: 1px solid var(--border); background: #ffffff; color: var(--text-sub);
      cursor: pointer; display: flex; align-items: center; gap: 4px; transition: all 0.2s;
    }
    .question-row.is-mistake .mistake-tag-btn {
      background: var(--danger); color: #ffffff; border-color: var(--danger); font-weight: bold;
    }

    .q-flex-box { display: flex; justify-content: space-between; gap: 14px; }
    .q-content { flex: 1; min-width: 0; }
    .q-graphic-box { display: flex; justify-content: center; align-items: center; }

    .options-grid { margin: 8px 0 4px; }
    .options-grid.cols-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
    .options-grid.cols-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; }
    .options-grid.cols-1 { display: flex; flex-direction: column; gap: 4px; }

    /* 方案 B：纯白留白作答区（无划线） */
    .blank-space { margin-top: 6px; width: 100%; display: flex; flex-direction: column; }
    .rule-blank { width: 100%; height: var(--rule-height); border-bottom: 1px solid transparent !important; }

    /* 底部操作工具栏 */
    .bottom-bar {
      position: fixed; bottom: 0; left: 0; right: 0;
      background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(10px);
      padding: 10px 16px calc(10px + env(safe-area-inset-bottom));
      border-top: 1px solid var(--border); display: flex; gap: 10px; z-index: 60;
    }
    .btn {
      flex: 1; padding: 12px 0; border-radius: 10px; border: none; font-size: 13.5px; font-weight: 700;
      cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;
      transition: all 0.2s;
    }
    .btn-secondary { background: #f1f5f9; color: var(--text-main); }
    .btn-primary { background: linear-gradient(135deg, #4f46e5, #4338ca); color: #ffffff; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25); }
    .btn-danger { background: linear-gradient(135deg, #ef4444, #dc2626); color: #ffffff; }

    /* 导出弹窗 Action Sheet */
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
      border-radius: 10px; display: flex; justify-content: space-between; align-items: center; cursor: pointer;
    }
    .export-item.highlight { border-color: var(--primary); background: #f5f3ff; }
    .export-item:active { background: #f8fafc; }

    /* 打印样式（打印时不包含错题按钮与顶底栏） */
    @media print {
      @page {
        size: A4 portrait; margin: 15mm 15mm 15mm 15mm;
        @bottom-center {
          content: "— 第 " counter(page) " 页 / 共 " counter(pages) " 页 —";
          font-family: "Songti SC", "SimSun", "Times New Roman", serif; font-size: 9.5pt; color: #000;
        }
      }
      html, body { background: #fff !important; color: #000 !important; margin: 0 !important; }
      .app-header, .bottom-bar, #panel-ai, #panel-edit, .preview-bar, .modal-overlay, .mistake-tag-btn { display: none !important; }
      #panel-preview { display: block !important; margin: 0 !important; padding: 0 !important; }
      .paper-sheet { width: 100% !important; margin: 0 !important; padding: 0 !important; border: none !important; box-shadow: none !important; }
      .paper-sheet .q-flex-box { flex-direction: row !important; }
      .paper-sheet .q-graphic-box { width: var(--diagram-width) !important; flex-shrink: 0; }
    }
  </style>
</head>
<body>

  <header class="app-header">
    <div class="header-bar">
      <h2>ExamCraft AI <span class="badge">Next-Gen</span></h2>
      <div style="font-size: 11px; color: var(--text-sub);">边缘免运维架构</div>
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
          <span style="font-size: 11px; color: var(--text-sub);">本地持久化存储</span>
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
            <label style="font-size: 11px; color: var(--text-sub); font-weight: 600;">模型名称 (Model)</label>
            <input type="text" id="ai-model-name" placeholder="deepseek-chat / gpt-4o / claude-3-5-sonnet">
          </div>
          <button class="btn-sm" style="align-self: flex-start;" onclick="saveAISettings()">💾 保存 API 配置</button>
        </div>
      </div>

      <div class="card">
        <div class="card-title">
          <span>AI 极速组卷与闭环训练</span>
          <span id="ai-status-badge" class="badge" style="display: none; background: #fef3c7; color: #b45309;">AI 正在思考中...</span>
        </div>
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <div>
            <label style="font-size: 11px; color: var(--text-sub); font-weight: 600;">出题 Prompt 描述 / 强化变式要求</label>
            <textarea id="ai-user-prompt" placeholder="例如：出一套高三物理电磁感应综合卷，包含单棒切割动力学、有界磁场粒子偏转，2道选择，2道大题，附带矢量图SVG参数..."></textarea>
          </div>
          <div class="action-row">
            <button class="btn btn-primary" onclick="triggerAIGeneration('create')">🚀 AI 一键生成全新试卷</button>
            <button class="btn btn-danger" onclick="triggerAIGeneration('mistake_variants')">🎯 针对已标记错题生成同类变式卷</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 模块 2：数据与版面定制 -->
    <div id="panel-edit" class="panel">
      <div class="card">
        <div class="card-title">文件导出设置</div>
        <input type="text" id="custom-filename-input" placeholder="输入自定义文件名（留空则自动以精确到秒的时间戳命名）">
      </div>

      <div class="card">
        <div class="card-title">版面间距与字号控制</div>
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
          <div class="slider-item">
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

    <!-- 模块 3：卷面预览与错题归纳 -->
    <div id="panel-preview" class="panel">
      <div class="preview-bar">
        <div style="display: flex; gap: 6px;">
          <button class="btn-sm" id="btn-fit" style="background:var(--primary); color:#fff;" onclick="setPreviewMode('mobile-fit')">📱 手机适屏</button>
          <button class="btn-sm" id="btn-a4" onclick="setPreviewMode('a4-exact')">📄 标准 A4</button>
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
          <span class="mistake-counter" id="mistake-count-text">已标错题: 0 道</span>
          <button class="btn-sm" onclick="filterMistakesView()">🔍 仅看错题/看全卷</button>
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

  <!-- 导出多功能弹窗 -->
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
        <button class="export-item" style="border-color: #fca5a5; background: #fff1f2;" onclick="triggerChromePrint(true)">
          <div>
            <div style="color:var(--danger); font-weight:700;">📑 专属错题集打印 / 导出 PDF</div>
            <div style="font-size:11px; color:var(--text-sub); margin-top:2px;">仅打印勾选的错题，自动重编序号</div>
          </div>
          <span>➔</span>
        </button>
        <button class="export-item" onclick="exportMistakeJSONPrompt()">
          <div>
            <div style="font-weight:700;">🎯 导出错题参数并填入 AI 变式工作台</div>
            <div style="font-size:11px; color:var(--text-sub); margin-top:2px;">闭环训练：让 AI 重新生成同类弱点题</div>
          </div>
          <span>➔</span>
        </button>
        <button class="export-item" onclick="exportDirectPDF()">
          <div>
            <div>📑 直接下载 PDF 文件 (.pdf)</div>
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
    // ---------- 全局状态与持久化 ----------
    let currentPaperData = null;
    let mistakeQuestionIds = new Set();
    let isFilteringMistakes = false;

    window.addEventListener('DOMContentLoaded', () => {
      loadSavedAISettings();
      renderPaperFromTextarea();
    });

    // ---------- AI API 模块与出题闭环 ----------
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
      const baseUrl = document.getElementById('ai-base-url').value.trim();
      const apiKey = document.getElementById('ai-api-key').value.trim();
      const model = document.getElementById('ai-model-name').value.trim();

      if (!baseUrl || !apiKey || !model) {
        alert("请先填写并保存完整的 API Base URL、API Key 与 Model 名称！");
        return;
      }

      let systemPrompt = "你是一名顶尖的高中数理化试卷出题专家。必须严格输出符合以下 Schema 的纯 JSON 格式（不要包含 markdown 代码块反引号，直接以 { 开头）：\\n";
      systemPrompt += "{\\"paper_title\\": string, \\"meta\\": {\\"subject\\": string, \\"time\\": string, \\"total_score\\": number}, \\"sections\\": [{\\"title\\": string, \\"questions\\": [{\\"id\\": number, \\"score\\": number, \\"stem\\": string, \\"options\\": string[] | null, \\"blank_lines\\": number, \\"diagram\\": {\\"engine\\": \\"raw_svg\\", \\"svg\\": string} | null}]}]}\\n";
      systemPrompt += "注意：公式中的 LaTeX 必须严格进行 JSON 双重反斜杠转义（如 \\\\mathrm, \\\\sqrt, \\\\alpha, \\\\mu, \\\\perp）；需要绘图的题目，diagram.svg 必须包含标准直角坐标系或物理模型的纯矢量 SVG 字符串。大题 blank_lines 设置为 6。";

      let userMsg = document.getElementById('ai-user-prompt').value.trim();

      if (type === 'mistake_variants') {
        if (mistakeQuestionIds.size === 0) {
          alert("当前尚未标记任何错题！请在‘卷面批改与错题归纳’中勾选至少一道错题。");
          return;
        }
        const mistakes = getMistakeQuestionsList();
        userMsg = "【错题同类变式靶向训练任务】以下是学生在练习中做错的题：\\n" + JSON.stringify(mistakes, null, 2);
        userMsg += "\\n请仔细分析上述错题考察的核心考点、物理模型与数学思想，保持考点难度相当或略高，生成一套全新的同类变式诊断卷（试卷标题注明‘错题变式强化专项’）。包含对应的详细题干、选项与高精度矢量 SVG 图形。";
      } else {
        if (!userMsg) userMsg = "请生成一套包含力学牛顿定律、电磁感应切割和圆锥曲线综合题的高三理科模拟卷，共4道大题。";
      }

      const badge = document.getElementById('ai-status-badge');
      badge.style.display = 'inline-block';
      badge.innerText = 'AI 正在推理生成中...';

      try {
        const res = await fetch('/api/ai/proxy', {
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

        const data = await res.json();
        badge.style.display = 'none';

        if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));

        let content = data.choices[0].message.content.trim();
        // 剔除可能存在的 markdown 代码块符号
        content = content.replace(/^\\`\\`\\`json/i, '').replace(/^\\`\\`\\`/i, '').replace(/\\`\\`\\`$/, '').trim();

        document.getElementById('paper-json').value = content;
        setTab('preview');
        renderPaperFromTextarea();
        alert("🎉 题目生成完成！已无缝渲染并排版为全新试卷。");
      } catch (err) {
        badge.style.display = 'none';
        alert("调用 AI 出题接口失败：" + err.message);
      }
    }

    // ---------- 错题标记与过滤流 ----------
    function toggleMistake(qId) {
      if (mistakeQuestionIds.has(qId)) {
        mistakeQuestionIds.delete(qId);
      } else {
        mistakeQuestionIds.add(qId);
      }
      updateMistakeUI();
    }

    function updateMistakeUI() {
      document.querySelectorAll('.question-row').forEach(row => {
        const id = parseInt(row.getAttribute('data-qid'));
        const isM = mistakeQuestionIds.has(id);
        row.classList.toggle('is-mistake', isM);
        const btn = row.querySelector('.mistake-tag-btn');
        if (btn) btn.innerHTML = isM ? '❌ 已标记错题' : '标为错题';
      });
      document.getElementById('mistake-count-text').innerText = '已标错题: ' + mistakeQuestionIds.size + ' 道';
    }

    function filterMistakesView() {
      isFilteringMistakes = !isFilteringMistakes;
      document.querySelectorAll('.question-row').forEach(row => {
        const id = parseInt(row.getAttribute('data-qid'));
        if (isFilteringMistakes) {
          row.style.display = mistakeQuestionIds.has(id) ? 'block' : 'none';
        } else {
          row.style.display = 'block';
        }
      });
    }

    function getMistakeQuestionsList() {
      if (!currentPaperData) return [];
      const list = [];
      (currentPaperData.sections || []).forEach(sec => {
        (sec.questions || []).forEach(q => {
          if (mistakeQuestionIds.has(q.id)) list.push(q);
        });
      });
      return list;
    }

    function exportMistakeJSONPrompt() {
      closeExportModal();
      const mistakes = getMistakeQuestionsList();
      if (mistakes.length === 0) {
        alert("尚未勾选任何错题！");
        return;
      }
      setTab('ai');
      document.getElementById('ai-user-prompt').value = "请针对以下 " + mistakes.length + " 道错题，为我定向出同等考点的巩固变式训练试题：\\n" + JSON.stringify(mistakes, null, 2);
      alert("✅ 已将错题提取为 Prompt 填入 AI 工坊，可直接点击‘针对错题生成同类变式卷’！");
    }

    // ---------- 版面变量与快速字号 ----------
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

    function getResolvedFileName(extension, isMistakeOnly) {
      let customName = (document.getElementById('custom-filename-input')?.value || '').trim();
      const prefix = isMistakeOnly ? '错题集_' : '试卷_';
      if (!customName) {
        const now = new Date();
        const pad = n => String(n).padStart(2, '0');
        customName = prefix + now.getFullYear() + pad(now.getMonth()+1) + pad(now.getDate()) + '_' + pad(now.getHours()) + pad(now.getMinutes()) + pad(now.getSeconds());
      } else {
        customName = (isMistakeOnly ? '错题集_' : '') + customName;
      }
      return customName + '.' + extension;
    }

    function setPreviewMode(mode) {
      const sheet = document.getElementById('paper-mount-point');
      const btnFit = document.getElementById('btn-fit');
      const btnA4 = document.getElementById('btn-a4');
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
      document.querySelectorAll('.tab-btn').forEach((b, i) => {
        b.classList.toggle('active', (name === 'ai' && i === 0) || (name === 'edit' && i === 1) || (name === 'preview' && i === 2));
      });
      document.getElementById('panel-ai').classList.toggle('active', name === 'ai');
      document.getElementById('panel-edit').classList.toggle('active', name === 'edit');
      document.getElementById('panel-preview').classList.toggle('active', name === 'preview');
    }

    function parseJSONWithTolerance(rawStr) {
      try {
        return JSON.parse(rawStr);
      } catch (err) {
        const repaired = rawStr.replace(/\\\\(?!["\\\\/bfnrt]|u[0-9a-fA-F]{4})/g, "\\\\\\\\");
        return JSON.parse(repaired);
      }
    }

    function getOptionGridClass(options) {
      if (!options || !options.length) return 'cols-4';
      const maxLen = Math.max(...options.map(o => (o || '').replace(/\\$[^\\$]*\\$/g, 'XXXX').length));
      if (maxLen <= 5) return 'cols-4';
      if (maxLen <= 15) return 'cols-2';
      return 'cols-1';
    }

    // ---------- DOM 试卷渲染器 ----------
    function renderPaperFromTextarea() {
      const raw = document.getElementById('paper-json').value.trim();
      if (!raw) return false;

      let data;
      try {
        data = parseJSONWithTolerance(raw);
        currentPaperData = data;
      } catch (err) {
        alert("JSON 语法解析错误：\\n" + err.message);
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
          html += '<div class="question-row" data-qid="' + q.id + '">';
          html += '  <button class="mistake-tag-btn" onclick="toggleMistake(' + q.id + ')">标为错题</button>';
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
            html += '    <div class="q-graphic-box">' + (q.diagram.svg || '') + '</div>';
          }
          html += '  </div>';

          // 方案 B 纯净留白
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

      if (window.renderMathInElement) {
        renderMathInElement(container, {
          delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "$", right: "$", display: false }
          ],
          throwOnError: false
        });
      }

      updateMistakeUI();
      return true;
    }

    // ---------- 导出与弹窗逻辑 ----------
    function openExportModal() {
      document.getElementById('export-modal').classList.add('active');
    }

    function closeExportModal() {
      document.getElementById('export-modal').classList.remove('active');
    }

    // Chrome 原生打印（支持仅打印错题）
    function triggerChromePrint(mistakeOnly) {
      closeExportModal();
      setPreviewMode('a4-exact');

      if (mistakeOnly) {
        if (mistakeQuestionIds.size === 0) {
          alert("尚未标记任何错题！");
          return;
        }
        document.querySelectorAll('.question-row').forEach(row => {
          const id = parseInt(row.getAttribute('data-qid'));
          row.style.display = mistakeQuestionIds.has(id) ? 'block' : 'none';
        });
      } else {
        document.querySelectorAll('.question-row').forEach(row => row.style.display = 'block');
      }

      setTimeout(() => {
        window.print();
        // 打印完成后恢复视图
        document.querySelectorAll('.question-row').forEach(row => row.style.display = 'block');
      }, 150);
    }

    async function exportDirectPDF() {
      closeExportModal();
      setPreviewMode('a4-exact');
      if (document.fonts) await document.fonts.ready;

      const element = document.getElementById('paper-mount-point');
      const filename = getResolvedFileName('pdf', false);

      const opt = {
        margin: [15, 14, 15, 14],
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff', width: 794, windowWidth: 794 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'], avoid: ['.question-row', '.section-title'] }
      };

      if (window.html2pdf) {
        window.html2pdf().set(opt).from(element).toPdf().get('pdf').then(function(pdf) {
          const totalPages = pdf.internal.getNumberOfPages();
          for (let i = 1; i <= totalPages; i++) {
            pdf.setPage(i);
            pdf.setFontSize(9.5);
            pdf.setTextColor(80, 80, 80);
            const text = '— ' + i + ' / ' + totalPages + ' —';
            pdf.text(text, pdf.internal.pageSize.getWidth() / 2, pdf.internal.pageSize.getHeight() - 8, { align: 'center' });
          }
        }).save();
      }
    }

    function exportStandaloneHTML() {
      closeExportModal();
      const filename = getResolvedFileName('html', false);
      const mount = document.getElementById('paper-mount-point').innerHTML;
      const fullHtml = \`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>\${filename}</title><link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css"><style>@page{size:A4 portrait;margin:15mm;}body{font-family:"Songti SC",SimSun,serif;padding:20px;font-size:10.5pt;line-height:1.65;}.paper-title{text-align:center;font-size:1.6em;}.paper-meta{display:flex;justify-content:space-around;border-bottom:2px solid #000;padding-bottom:10px;margin-bottom:20px;}.section-title{font-size:1.05em;font-weight:bold;margin:18px 0 12px;break-after:avoid;}.question-row{break-inside:avoid;margin-bottom:20px;}.q-flex-box{display:flex;justify-content:space-between;gap:14px;}.q-content{flex:1;}.q-graphic-box{width:190px;flex-shrink:0;}.options-grid.cols-4{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;}.options-grid.cols-2{display:grid;grid-template-columns:repeat(2,1fr);gap:6px;}.options-grid.cols-1{display:flex;flex-direction:column;gap:4px;}.rule-blank{height:24px;}</style></head><body>\${mount}</body></html>\`;
      
      const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
    }

    // ---------- 剪贴板与通用辅助 ----------
    async function pasteFromClipboard() {
      try {
        const text = await navigator.clipboard.readText();
        if (text) {
          document.getElementById('paper-json').value = text;
          alert("✅ 剪贴板内容已成功读入！");
        }
      } catch (err) {
        alert("请长按输入框使用系统粘贴，或改用导入文件。");
      }
    }
    function triggerFileInput() { document.getElementById('file-uploader').click(); }
    function handleFileUpload(event) {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = e => {
        document.getElementById('paper-json').value = e.target.result;
        alert("文件读取完成！");
      };
      reader.readAsText(file, "UTF-8");
      event.target.value = '';
    }
    function clearJson() {
      if (confirm("确定清空数据吗？")) document.getElementById('paper-json').value = '';
    }
  </script>
</body>
</html>`;
}

// 默认初始测试数据
const DEFAULT_PRESET = {
  paper_title: "2026年数理高阶模型综合压轴卷",
  meta: { subject: "物理与数学综合", time: "120分钟", total_score: 100 },
  sections: [
    {
      title: "第一部分：碰撞动力学与电磁感应综合",
      questions: [
        {
          id: 1,
          score: 12,
          stem: "如图所示，长为 $L$ 的不可伸长轻绳悬挂质量为 $m_1$ 的小球。光滑水平面上放有质量为 $M$ 的长木板，左端放有质量为 $m_2$ 的滑块。小球从 $\\theta = 60^\\circ$ 释放，摆至最低点与滑块发生弹性正碰。滑块与木板间动摩擦因数为 $\\mu$。(1) 求碰后瞬间小球与滑块的速度；(2) 若滑块未脱离木板，求木板的最小长度 $d$。",
          blank_lines: 6,
          diagram: {
            engine: "raw_svg",
            svg: "<svg width='190' height='130' viewBox='0 0 190 130'><line x1='15' y1='115' x2='175' y2='115' stroke='#000' stroke-width='1.5'/><rect x='30' y='100' width='120' height='15' fill='#f1f5f9' stroke='#000'/><rect x='45' y='82' width='18' height='18' fill='#e2e8f0' stroke='#000'/><circle cx='80' cy='90' r='7' fill='#cbd5e1' stroke='#000'/><line x1='115' y1='20' x2='80' y2='90' stroke='#000'/><circle cx='115' cy='20' r='2' fill='#000'/><text x='118' y='22' font-size='9'>O</text></svg>"
          }
        },
        {
          id: 2,
          score: 14,
          stem: "水平光滑导轨间距为 $L$，跨接电阻 $R$，匀强磁场垂直向下为 $B$。质量为 $m$、电阻为 $r$ 的导体棒以初速度 $v_0$ 滑出。(1) 证明导体棒受安培力 $F_A = \\frac{B^2L^2v}{R+r}$；(2) 求导体棒从开始到停下的总位移 $x$ 及电阻 $R$ 释放的热量 $Q_R$。",
          blank_lines: 6,
          diagram: {
            engine: "raw_svg",
            svg: "<svg width='190' height='120' viewBox='0 0 190 120'><line x1='35' y1='30' x2='165' y2='30' stroke='#000' stroke-width='2'/><line x1='35' y1='95' x2='165' y2='95' stroke='#000' stroke-width='2'/><rect x='28' y='50' width='14' height='26' fill='#fff' stroke='#000'/><text x='18' y='66' font-size='9'>R</text><rect x='90' y='20' width='8' height='85' fill='#cbd5e1' stroke='#000'/><line x1='95' y1='62' x2='125' y2='62' stroke='#2563eb' stroke-width='2'/><text x='128' y='66' font-size='9' fill='#2563eb'>v</text></svg>"
          }
        }
      ]
    }
  ]
};