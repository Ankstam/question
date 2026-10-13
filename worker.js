export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // API 端口：支持外部程序或 AI 自动化 POST 导入 JSON
    if (request.method === "POST" && url.pathname === "/api/render") {
      try {
        const payload = await request.json();
        return new Response(generateFullAppHTML(payload), {
          headers: { "Content-Type": "text/html;charset=UTF-8" }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: "Invalid JSON", message: err.message }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    // 默认直接向手机与桌面端输出单页 Web 应用
    return new Response(generateFullAppHTML(getDefaultPreset()), {
      headers: { "Content-Type": "text/html;charset=UTF-8" }
    });
  }
};

function generateFullAppHTML(initialData) {
  const initialDataStr = JSON.stringify(initialData, null, 2);

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>高中试卷与笔记排版生成器</title>
  
  <!-- KaTeX 与化学方程式插件 mhchem -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/mhchem.min.js"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"></script>

  <style>
    :root {
      --primary: #2563eb;
      --primary-hover: #1d4ed8;
      --bg-gray: #f1f5f9;
      --border-color: #cbd5e1;
    }

    * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
      background: var(--bg-gray);
      color: #0f172a;
    }

    /* 移动端顶栏与选项卡 */
    .app-header {
      position: sticky;
      top: 0;
      z-index: 50;
      background: #ffffff;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }

    .header-title-bar {
      padding: 10px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header-title-bar h2 {
      margin: 0;
      font-size: 16px;
      font-weight: 700;
    }

    .tab-bar {
      display: flex;
      border-top: 1px solid #f1f5f9;
    }

    .tab-btn {
      flex: 1;
      padding: 10px 0;
      text-align: center;
      background: transparent;
      border: none;
      font-size: 14px;
      font-weight: 600;
      color: #64748b;
      cursor: pointer;
      position: relative;
    }

    .tab-btn.active {
      color: var(--primary);
    }

    .tab-btn.active::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 20%;
      width: 60%;
      height: 2px;
      background: var(--primary);
      border-radius: 2px;
    }

    /* 主内容视口容器 */
    .view-container {
      padding: 12px;
      margin-bottom: 70px;
    }

    .view-panel { display: none; }
    .view-panel.active { display: block; }

    /* 编辑面板控件 */
    .control-group {
      background: #ffffff;
      padding: 14px;
      border-radius: 8px;
      border: 1px solid var(--border-color);
      margin-bottom: 12px;
    }

    .control-group label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 6px;
      color: #334155;
    }

    select, textarea, input[type="text"] {
      width: 100%;
      padding: 9px 10px;
      border: 1px solid var(--border-color);
      border-radius: 6px;
      font-size: 14px;
      outline: none;
      background: #f8fafc;
      font-family: inherit;
    }

    textarea {
      font-family: "SF Mono", Consolas, "Liberation Mono", Menlo, Courier, monospace;
      font-size: 12px;
      min-height: 280px;
      resize: vertical;
    }

    /* 试卷纸张预览容器 (移动端缩放显示，打印时 100% 展开) */
    .preview-scroller {
      overflow-x: auto;
      padding-bottom: 10px;
      -webkit-overflow-scrolling: touch;
    }

    .paper-sheet {
      width: 210mm;
      min-height: 297mm;
      background: #ffffff;
      margin: 0 auto;
      padding: 18mm 16mm;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      font-family: "Songti SC", "SimSun", "Times New Roman", serif;
      color: #000;
    }

    .paper-header {
      text-align: center;
      margin-bottom: 20px;
      border-bottom: 2px solid #000;
      padding-bottom: 10px;
    }

    .paper-header h1 {
      margin: 0 0 6px 0;
      font-size: 17pt;
      letter-spacing: 1px;
    }

    .meta-fields {
      font-size: 9.5pt;
      display: flex;
      justify-content: space-around;
      margin-top: 8px;
    }

    .question-row {
      break-inside: avoid;
      page-break-inside: avoid;
      margin-bottom: 20px;
      font-size: 10.5pt;
      line-height: 1.6;
    }

    .q-main-layout {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
    }

    .q-text {
      flex: 1;
      text-align: justify;
    }

    .q-graphic {
      width: 200px;
      flex-shrink: 0;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    /* 答题辅助留白线 */
    .answer-ruled-space {
      margin-top: 10px;
      width: 100%;
      background: repeating-linear-gradient(to bottom, transparent, transparent 23px, #e2e8f0 24px);
      border-bottom: 1px solid #e2e8f0;
    }

    /* 底部操作浮动条（移动端友好） */
    .bottom-bar {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: #ffffff;
      padding: 8px 14px calc(8px + env(safe-area-inset-bottom));
      border-top: 1px solid var(--border-color);
      display: flex;
      gap: 10px;
      z-index: 60;
    }

    .btn {
      flex: 1;
      padding: 11px 0;
      border-radius: 6px;
      border: none;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 6px;
    }

    .btn-secondary { background: #e2e8f0; color: #334155; }
    .btn-primary { background: var(--primary); color: #ffffff; }

    /* 打印与另存为 PDF 专有样式 */
    @media print {
      @page {
        size: A4 portrait;
        margin: 15mm 16mm 15mm 16mm;
      }
      body {
        background: #fff;
        margin: 0;
        padding: 0;
      }
      .app-header, .bottom-bar, #panel-edit {
        display: none !important;
      }
      #panel-preview {
        display: block !important;
      }
      .view-container {
        padding: 0;
        margin: 0;
      }
      .preview-scroller {
        overflow: visible;
      }
      .paper-sheet {
        width: 100%;
        margin: 0;
        padding: 0;
        box-shadow: none;
      }
      .answer-ruled-space {
        background: repeating-linear-gradient(to bottom, transparent, transparent 23px, #cbd5e1 24px);
        border-bottom: 1px solid #cbd5e1;
      }
    }
  </style>
</head>
<body>

  <header class="app-header">
    <div class="header-title-bar">
      <h2>Edge Exam Layout</h2>
      <span style="font-size: 11px; color: #64748b; background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">Cloudflare Worker</span>
    </div>
    <div class="tab-bar">
      <button class="tab-btn active" onclick="switchTab('edit')">参数与数据配置</button>
      <button class="tab-btn" onclick="switchTab('preview')">试卷与笔记排版</button>
    </div>
  </header>

  <main class="view-container">
    <!-- 编辑视图 -->
    <section id="panel-edit" class="view-panel active">
      <div class="control-group">
        <label>快速预设模板载入</label>
        <select id="preset-selector" onchange="loadSelectedPreset()">
          <option value="math_3d">高三立体几何（四棱锥与空间角）</option>
          <option value="physics_force">高中物理受力分析（斜面体滑块系统）</option>
          <option value="chem_reaction">高中有机与化学反应平衡</option>
        </select>
      </div>

      <div class="control-group">
        <label>试卷 JSON 数据协议</label>
        <textarea id="json-editor" spellcheck="false">${initialDataStr}</textarea>
      </div>
    </section>

    <!-- 预览视图 -->
    <section id="panel-preview" class="view-panel">
      <div class="preview-scroller">
        <div class="paper-sheet" id="paper-render-target">
          <!-- 动态渲染内容 -->
        </div>
      </div>
    </section>
  </main>

  <div class="bottom-bar">
    <button class="btn btn-secondary" onclick="renderPaperFromEditor()">解析并更新排版</button>
    <button class="btn btn-primary" onclick="exportPDF()">打印 / 导出 PDF</button>
  </div>

  <script>
    // ---------------- 预设数据源 ----------------
    const PRESETS = {
      math_3d: ${JSON.stringify(getDefaultPreset())},
      physics_force: {
        paper_title: "2026届高三物理牛顿运动定律专题",
        meta: { student_info: true },
        questions: [
          {
            id: 1,
            score: 10,
            stem: "如图所示，倾角为 $\\theta = 37^\\circ$ 的固定斜面上放有一质量 $m = 2\\text{ kg}$ 的滑块。滑块与斜面间的动摩擦因数 $\\mu = 0.5$。现施加一水平推力 $F = 20\\text{ N}$。设重力加速度 $g = 10\\text{ m/s}^2$，$\\sin 37^\\circ = 0.6$，$\\cos 37^\\circ = 0.8$。求滑块沿斜面运动的加速度大小 $a$。",
            blank_lines: 6,
            diagram: {
              engine: "physics_incline_2d",
              angle: 37,
              forces: [
                { name: "F", dir: "right" },
                { name: "G", dir: "down" },
                { name: "F_N", dir: "normal" }
              ]
            }
          }
        ]
      },
      chem_reaction: {
        paper_title: "高中化学化学反应速率与平衡复习",
        meta: { student_info: true },
        questions: [
          {
            id: 1,
            score: 14,
            stem: "在容积为 $2\\text{ L}$ 的密闭容器中，通入物质的量各为 $2\\text{ mol}$ 的气体 $\\ce{A}$ 与 $\\ce{B}$，发生反应：$$\\ce{a A(g) + B(g) <=> 2 C(g)}$$ 达到平衡后测得 $c(\\ce{C}) = 0.8\\text{ mol/L}$。若反应速率 $v(\\ce{A}) = 0.1\\text{ mol/(L \\cdot min)}$，请计算化学计量数 $a$ 及该温度下的化学平衡常数 $K$。",
            blank_lines: 7,
            diagram: null
          }
        ]
      }
    };

    // ---------------- 矢量几何与物理图形引擎 ----------------
    function renderDiagram(diag) {
      if (!diag) return '';
      
      // 引擎 1：纯 3D 空间坐标线框投影
      if (diag.engine === "wireframe_3d") {
        const width = 200, height = 170;
        const rx = (diag.rotation.rx * Math.PI) / 180;
        const ry = (diag.rotation.ry * Math.PI) / 180;
        const scale = diag.scale || 1.0;

        const project = ([x, y, z]) => {
          const cosY = Math.cos(ry), sinY = Math.sin(ry);
          const cosX = Math.cos(rx), sinX = Math.sin(rx);
          const x1 = x * cosY + z * sinY;
          const z1 = -x * sinY + z * cosY;
          const y2 = y * cosX - z1 * sinX;
          return [width / 2 + x1 * scale, height / 2 - y2 * scale];
        };

        const pts = {};
        for (const [k, coord] of Object.entries(diag.nodes)) {
          pts[k] = project(coord);
        }

        const makeLines = (lines, isDashed) => lines.map(([p1, p2]) => \`
          <line x1="\${pts[p1][0]}" y1="\${pts[p1][1]}" x2="\${pts[p2][0]}" y2="\${pts[p2][1]}"
                stroke="#000000" stroke-width="1.3" \${isDashed ? 'stroke-dasharray="4,3"' : ''}/>
        \`).join('');

        const makeLabels = () => Object.entries(pts).map(([k, [x, y]]) => \`
          <text x="\${x + 4}" y="\${y - 3}" font-family="Times New Roman, serif" font-style="italic" font-size="11">\${k}</text>
        \`).join('');

        return \`
          <svg width="\${width}" height="\${height}" viewBox="0 0 \${width} \${height}">
            \${makeLines(diag.dashed_lines || [], true)}
            \${makeLines(diag.solid_lines || [], false)}
            \${makeLabels()}
          </svg>
        \`;
      }

      // 引擎 2：物理 2D 斜面与受力分析图
      if (diag.engine === "physics_incline_2d") {
        return \`
          <svg width="200" height="150" viewBox="0 0 200 150">
            <!-- 斜面底座 -->
            <polygon points="20,130 180,130 180,40" fill="none" stroke="#000" stroke-width="1.5" />
            <!-- 斜面角度标示 -->
            <path d="M 50,130 A 30 30 0 0 0 46,120" fill="none" stroke="#000" stroke-width="1"/>
            <text x="55" y="125" font-size="11" font-family="Times New Roman">θ</text>
            <!-- 滑块 (沿斜面旋转) -->
            <g transform="translate(115, 75) rotate(-29)">
              <rect x="-15" y="-20" width="30" height="20" fill="#f8fafc" stroke="#000" stroke-width="1.5"/>
              <!-- 重力箭头 G -->
              <line x1="0" y1="-10" x2="0" y2="35" stroke="#000" stroke-width="1.2" marker-end="url(#arrow)"/>
              <text x="5" y="32" font-size="10" font-family="Times New Roman">G</text>
              <!-- 支持力箭头 Fn -->
              <line x1="0" y1="-10" x2="0" y2="-45" stroke="#000" stroke-width="1.2"/>
              <text x="4" y="-38" font-size="10" font-family="Times New Roman">F_N</text>
            </g>
          </svg>
        \`;
      }

      return '';
    }

    // ---------------- 界面逻辑与渲染 ----------------
    function switchTab(tab) {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.view-panel').forEach(p => p.classList.remove('active'));

      if (tab === 'edit') {
        document.querySelectorAll('.tab-btn')[0].classList.add('active');
        document.getElementById('panel-edit').classList.add('active');
      } else {
        document.querySelectorAll('.tab-btn')[1].classList.add('active');
        document.getElementById('panel-preview').classList.add('active');
        renderPaperFromEditor();
      }
    }

    function loadSelectedPreset() {
      const type = document.getElementById('preset-selector').value;
      if (PRESETS[type]) {
        document.getElementById('json-editor').value = JSON.stringify(PRESETS[type], null, 2);
        renderPaperFromEditor();
      }
    }

    function renderPaperFromEditor() {
      try {
        const data = JSON.parse(document.getElementById('json-editor').value);
        const container = document.getElementById('paper-render-target');
        
        container.innerHTML = \`
          <div class="paper-header">
            <h1>\${data.paper_title || "高中专项训练卷"}</h1>
            \${data.meta && data.meta.student_info ? \`
              <div class="meta-fields">
                <span>班级：___________</span>
                <span>姓名：___________</span>
                <span>学号：___________</span>
                <span>成绩：___________</span>
              </div>
            \` : ''}
          </div>
          <div class="paper-questions">
            \${data.questions.map(q => \`
              <div class="question-row">
                <div class="q-main-layout">
                  <div class="q-text">
                    <b>\${q.id}.</b> (\${q.score}分) \${q.stem}
                  </div>
                  \${q.diagram ? \`<div class="q-graphic">\${renderDiagram(q.diagram)}</div>\` : ''}
                </div>
                \${q.blank_lines ? \`<div class="answer-ruled-space" style="height: \${q.blank_lines * 24}px;"></div>\` : ''}
              </div>
            \`).join('')}
          </div>
        \`;

        // 调用 KaTeX 数学与化学方程式渲染
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
        alert("JSON 语法解析错误，请检查输入格式：" + err.message);
      }
    }

    function exportPDF() {
      // 切换到预览视图并调用浏览器系统打印（iOS/Android 将唤起标准保存 PDF 交互）
      switchTab('preview');
      setTimeout(() => {
        window.print();
      }, 200);
    }

    // 页面初次加载自动编译
    window.addEventListener('DOMContentLoaded', () => {
      renderPaperFromEditor();
    });
  </script>
</body>
</html>`;
}

// 默认立体几何四棱锥测试数据
function getDefaultPreset() {
  return {
    paper_title: "高三理科数学立体几何解题突破",
    meta: { student_info: true },
    questions: [
      {
        id: 1,
        score: 12,
        stem: "在四棱锥 $P-ABCD$ 中，已知底面 $ABCD$ 为正方形，$PA \\perp \\text{平面 } ABCD$，且 $PA = AB = 2$。若 $E$ 为线段 $PD$ 的中点。求证：$PB \\parallel \\text{平面 } AEC$，并求二面角 $P-CD-A$ 的平面角大小。",
        blank_lines: 6,
        diagram: {
          engine: "wireframe_3d",
          scale: 1.15,
          rotation: { rx: 16, ry: -34 },
          nodes: {
            "P": [0, 65, 0],
            "A": [-45, -35, 35],
            "B": [45, -35, 35],
            "C": [65, -35, -35],
            "D": [-25, -35, -35],
            "E": [-12.5, 15, -17.5]
          },
          solid_lines: [
            ["P", "A"], ["P", "B"], ["P", "C"], ["P", "D"],
            ["A", "B"], ["B", "C"], ["A", "E"], ["E", "C"]
          ],
          dashed_lines: [
            ["A", "D"], ["C", "D"], ["A", "C"]
          ]
        }
      }
    ]
  };
}
