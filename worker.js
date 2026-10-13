export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // API 接口：支持第三方系统或 AI 管道 POST 批量数据，直接返回独立 HTML
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

    // 默认展示移动端与桌面端自适应管理面板
    return new Response(buildDocumentHTML(PRESET_DATABASE.math_complex), {
      headers: { "Content-Type": "text/html;charset=UTF-8" }
    });
  }
};

// --------------------------- 矢量图形渲染引擎 ---------------------------
function renderGraphicEngine(diagram) {
  if (!diagram) return '';

  // 1. 无限扩展：原生 SVG 直接渲染
  if (diagram.engine === "raw_svg" || diagram.svg) {
    return diagram.svg;
  }

  // 2. 数学 3D 线框立体几何投影引擎
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
      `<line x1="${pts[p1][0]}" y1="${pts[p1][1]}" x2="${pts[p2][0]}" y2="${pts[p2][1]}" stroke="#000" stroke-width="1.3"/>` : '').join('');

    const dLines = (diagram.dashed_lines || []).map(([p1, p2]) => pts[p1] && pts[p2] ? 
      `<line x1="${pts[p1][0]}" y1="${pts[p1][1]}" x2="${pts[p2][0]}" y2="${pts[p2][1]}" stroke="#000" stroke-width="1.2" stroke-dasharray="4,3"/>` : '').join('');

    const texts = Object.entries(pts).map(([k, [x, y]]) => 
      `<text x="${x + 4}" y="${y - 3}" font-family="Times New Roman, serif" font-style="italic" font-size="11">${k}</text>`
    ).join('');

    return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${dLines}${lines}${texts}</svg>`;
  }

  // 3. 数学 2D 函数坐标系引擎
  if (diagram.engine === "func_2d") {
    return `
      <svg width="200" height="160" viewBox="0 0 200 160">
        <defs>
          <marker id="arr" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#000"/>
          </marker>
        </defs>
        <line x1="20" y1="130" x2="185" y2="130" stroke="#000" stroke-width="1.2" marker-end="url(#arr)"/>
        <line x1="40" y1="150" x2="40" y2="15" stroke="#000" stroke-width="1.2" marker-end="url(#arr)"/>
        <text x="185" y="142" font-size="11" font-style="italic">x</text>
        <text x="28" y="20" font-size="11" font-style="italic">y</text>
        <text x="28" y="142" font-size="10">O</text>
        <path d="M 40 120 Q 80 15, 120 70 T 170 20" fill="none" stroke="#2563eb" stroke-width="1.5"/>
        <line x1="120" y1="130" x2="120" y2="70" stroke="#64748b" stroke-width="1" stroke-dasharray="3,2"/>
        <text x="115" y="143" font-size="10">x₁</text>
      </svg>
    `;
  }

  // 4. 地理等高线地形图引擎
  if (diagram.engine === "geography_2d") {
    return `
      <svg width="200" height="160" viewBox="0 0 200 160">
        <ellipse cx="100" cy="80" rx="80" ry="60" fill="none" stroke="#64748b" stroke-width="1.2"/>
        <ellipse cx="95" cy="78" rx="60" ry="44" fill="none" stroke="#64748b" stroke-width="1.2"/>
        <ellipse cx="90" cy="75" rx="38" ry="28" fill="none" stroke="#64748b" stroke-width="1.2"/>
        <circle cx="85" cy="72" r="3" fill="#000"/>
        <text x="92" y="75" font-size="10" font-weight="bold">▲ 850m</text>
        <text x="145" y="90" font-size="9" fill="#475569">600m</text>
        <text x="130" y="115" font-size="9" fill="#475569">400m</text>
        <line x1="20" y1="145" x2="60" y2="145" stroke="#000" stroke-width="2"/>
        <text x="65" y="148" font-size="9">1:50,000</text>
      </svg>
    `;
  }

  // 5. 雅思 Task 1 数据统计图引擎
  if (diagram.engine === "ielts_chart") {
    return `
      <svg width="220" height="160" viewBox="0 0 220 160">
        <line x1="30" y1="130" x2="200" y2="130" stroke="#000" stroke-width="1"/>
        <line x1="30" y1="130" x2="30" y2="20" stroke="#000" stroke-width="1"/>
        <rect x="45" y="50" width="20" height="80" fill="#3b82f6"/>
        <rect x="70" y="70" width="20" height="60" fill="#93c5fd"/>
        <rect x="110" y="30" width="20" height="100" fill="#3b82f6"/>
        <rect x="135" y="60" width="20" height="70" fill="#93c5fd"/>
        <text x="50" y="145" font-size="9">2010</text>
        <text x="115" y="145" font-size="9">2020</text>
        <text x="8" y="35" font-size="9">%</text>
      </svg>
    `;
  }

  return '';
}

// --------------------------- 全科预设数据 ---------------------------
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
            stem: "函数 $f(x) = \\frac{\\sin x}{x^2 + 1}$ 在区间 $[-\\pi, \\pi]$ 上的部分图象大致为右图所示。设其极值点为 $x_1$，则 $f'(x_1)$ 的值为（  ）",
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
            stem: "如图所示，在四棱锥 $P-ABCD$ 中，底面 $ABCD$ 为菱形，$\\angle ABC = 60^\\circ$，$PA \\perp \\text{平面 } ABCD$，$PA = AB = 2$。点 $M$ 为 $PD$ 的中点。(1) 证明：$PB \\parallel \\text{平面 } MAC$；(2) 求二面角 $M-AC-D$ 的余弦值。",
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
  },
  geography_physics: {
    paper_title: "高中理综与地理素养综合诊断卷",
    meta: { subject: "综合科", time: "90分钟", total_score: 100 },
    sections: [
      {
        title: "第一部分 地理学科能力（等高线与地质构造）",
        questions: [
          {
            id: 1,
            score: 8,
            stem: "读右侧某区域等高线地形图，该区域最高峰海拔为 $850\\text{m}$。若拟在图示两河汇合处修建水库大坝，其坝顶设计海拔为 $500\\text{m}$，请简述该水利枢纽选址的有利自然条件与淹没区防范措施。",
            blank_lines: 6,
            diagram: { engine: "geography_2d" }
          }
        ]
      },
      {
        title: "第二部分 物理力学与能量转化",
        questions: [
          {
            id: 2,
            score: 12,
            stem: "质量 $M = 2\\text{ kg}$ 的木板静止在光滑水平地面上，一物块 $m = 1\\text{ kg}$ 以 $v_0 = 4\\text{ m/s}$ 的初速度滑上木板。已知物块与木板间的动摩擦因数 $\\mu = 0.2$，$g = 10\\text{ m/s}^2$。求从开始滑动到相对静止的过程中系统产生的内能 $Q$。",
            blank_lines: 6,
            diagram: null
          }
        ]
      }
    ]
  },
  jlpt_n2: {
    paper_title: "日本語能力試験 N2 模擬テスト（文字・語彙・文法）",
    meta: { subject: "日本語", time: "105分", total_score: 180 },
    sections: [
      {
        title: "問題 1 次の文の言葉の読み方として最もよいものを、1・2・3・4から一つ選びなさい。",
        questions: [
          {
            id: 1,
            score: 2,
            stem: "この計画を<ruby>実行<rt>じっこう</rt></ruby>に移すには、事前の<ruby>綿密<rt>めんみつ</rt></ruby>な調査が【  】不可欠である。",
            options: ["決して", "極めて", "大して", "割に"],
            blank_lines: 0
          },
          {
            id: 2,
            score: 2,
            stem: "会議の資料は事前に目を通しておく<u>べきだ</u>。",
            options: ["通すほうがいい", "通さなければならない", "通す予定だ", "通すことができる"],
            blank_lines: 0
          }
        ]
      },
      {
        title: "問題 2 読解（短文）",
        questions: [
          {
            id: 3,
            score: 6,
            stem: "次の文章を読んで、後の問いに対する答えとして最もよいものを一つ選びなさい。<br><div style='padding:8px; background:#f8fafc; border-left:3px solid #64748b; margin:6px 0;'>現代社会において、情報のスピード化は生活を便利にした一方で、じっくりと思考を深める時間を奪っている側面も否定できない。私たちは常に「次に何をすべきか」に追われ、「今何を感じているか」を見失いがちである。</div>筆者が最も言いたいことは何か。",
            options: [
              "情報化社会は便利なので今の生活を維持すべきだ",
              "スピードに追われず、思考を深める時間を確保することが大切だ",
              "何をするかよりも何を感じるかだけを優先すべきだ",
              "現代社会では思考することは無駄である"
            ],
            blank_lines: 0
          }
        ]
      }
    ]
  },
  ielts_academic: {
    paper_title: "IELTS Academic Writing & Reading Simulation",
    meta: { subject: "English", time: "60 mins", total_score: 9 },
    sections: [
      {
        title: "Writing Task 1 (Report on Graphical Data)",
        questions: [
          {
            id: 1,
            score: 9,
            stem: "The chart below shows the percentage of households with internet access in two regions between 2010 and 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.",
            blank_lines: 10,
            diagram: { engine: "ielts_chart" }
          }
        ]
      }
    ]
  }
};

// --------------------------- 页面组装器 ---------------------------
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
      --primary: #1e40af;
      --bg: #f8fafc;
      --border: #cbd5e1;
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
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
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

    .card { background: #fff; padding: 14px; border-radius: 8px; border: 1px solid var(--border); margin-bottom: 12px; }
    .card label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px; color: #334155; }
    select, textarea {
      width: 100%; padding: 8px 10px; border: 1px solid var(--border); border-radius: 6px;
      font-size: 13px; outline: none; background: #fdfdfd; font-family: inherit;
    }
    textarea {
      font-family: "SF Mono", Menlo, Consolas, monospace;
      font-size: 11.5px; min-height: 300px;
    }

    /* 试卷容器 */
    .paper-scroller { overflow-x: auto; padding-bottom: 16px; }
    .paper-sheet {
      width: 210mm; min-height: 297mm; background: #fff; margin: 0 auto;
      padding: 20mm 18mm; box-shadow: 0 4px 14px rgba(0,0,0,0.08);
      font-family: "Songti SC", "SimSun", "Times New Roman", "Yu Mincho", serif;
      color: #000;
    }

    .paper-title { text-align: center; font-size: 18pt; margin: 0 0 10px 0; letter-spacing: 0.5px; }
    .paper-meta {
      display: flex; justify-content: space-around; font-size: 9.5pt;
      border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px;
    }

    .section-title { font-size: 11pt; font-weight: bold; margin: 16px 0 10px; }

    .question-row {
      break-inside: avoid; page-break-inside: avoid;
      margin-bottom: 18px; font-size: 10.5pt; line-height: 1.65;
    }
    .q-flex-box { display: flex; justify-content: space-between; align-items: flex-start; gap: 14px; }
    .q-content { flex: 1; text-align: justify; }
    .q-graphic-box { width: 210px; flex-shrink: 0; display: flex; justify-content: center; }

    /* 选择题网格选项 */
    .options-grid {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin: 8px 0 4px;
      font-family: "Times New Roman", "Songti SC", serif;
    }
    @media screen and (max-width: 600px) {
      .options-grid { grid-template-columns: repeat(2, 1fr); }
    }

    .blank-space {
      margin-top: 8px; width: 100%;
      background: repeating-linear-gradient(to bottom, transparent, transparent 23px, #e2e8f0 24px);
      border-bottom: 1px solid #e2e8f0;
    }

    /* 移动端专属浮动控制条 */
    .bottom-bar {
      position: fixed; bottom: 0; left: 0; right: 0;
      background: #fff; padding: 10px 16px calc(10px + env(safe-area-inset-bottom));
      border-top: 1px solid var(--border); display: flex; gap: 10px; z-index: 60;
    }
    .btn {
      flex: 1; padding: 11px 0; border-radius: 6px; border: none; font-size: 14px; font-weight: 600; cursor: pointer;
    }
    .btn-update { background: #e2e8f0; color: #1e293b; }
    .btn-print { background: var(--primary); color: #fff; }

    /* 打印与另存为 PDF 标准规整 */
    @media print {
      @page { size: A4 portrait; margin: 15mm 16mm; }
      body { background: #fff; margin: 0; padding: 0; }
      .app-header, .bottom-bar, #panel-edit { display: none !important; }
      #panel-preview { display: block !important; }
      .main-body { padding: 0; margin: 0; }
      .paper-scroller { overflow: visible; }
      .paper-sheet { width: 100%; margin: 0; padding: 0; box-shadow: none; }
      .blank-space {
        background: repeating-linear-gradient(to bottom, transparent, transparent 23px, #cbd5e1 24px);
        border-bottom: 1px solid #cbd5e1;
      }
    }
  </style>
</head>
<body>

  <header class="app-header">
    <div class="header-bar">
      <h2>Edge Question Bank Studio</h2>
      <span style="font-size: 11px; background: #e0e7ff; color: #3730a3; padding: 2px 6px; border-radius: 4px;">Universal Engine</span>
    </div>
    <div class="tabs">
      <button class="tab-btn active" onclick="setTab('edit')">数据与题库配置</button>
      <button class="tab-btn" onclick="setTab('preview')">全学科卷面预览</button>
    </div>
  </header>

  <main class="main-body">
    <div id="panel-edit" class="panel active">
      <div class="card">
        <label>载入多学科模板：</label>
        <select id="preset-select" onchange="applyPreset()">
          <option value="math_complex">数学：立体几何、解析函数与选择题矩阵</option>
          <option value="geography_physics">理综与地理：等高线地形图与动力学</option>
          <option value="jlpt_n2">日语 JLPT：汉字假名注音 (Ruby) 与阅读理解</option>
          <option value="ielts_academic">英语与雅思：Task 1 统计图表与大段落写作</option>
        </select>
      </div>

      <div class="card">
        <label>题库协议 JSON 编辑：</label>
        <textarea id="paper-json" spellcheck="false">${jsonStr}</textarea>
      </div>
    </div>

    <div id="panel-preview" class="panel">
      <div class="paper-scroller">
        <div class="paper-sheet" id="paper-mount-point"></div>
      </div>
    </div>
  </main>

  <div class="bottom-bar">
    <button class="btn btn-update" onclick="renderFromTextarea()">同步并更新卷面</button>
    <button class="btn btn-print" onclick="triggerPrint()">打印 / 导出标准 PDF</button>
  </div>

  <script>
    const PRESETS = ${JSON.stringify(PRESET_DATABASE)};

    function setTab(name) {
      document.querySelectorAll('.tab-btn').forEach((b, i) => {
        b.classList.toggle('active', (name === 'edit' && i === 0) || (name === 'preview' && i === 1));
      });
      document.getElementById('panel-edit').classList.toggle('active', name === 'edit');
      document.getElementById('panel-preview').classList.toggle('active', name === 'preview');
      if (name === 'preview') renderFromTextarea();
    }

    function applyPreset() {
      const key = document.getElementById('preset-select').value;
      if (PRESETS[key]) {
        document.getElementById('paper-json').value = JSON.stringify(PRESETS[key], null, 2);
        renderFromTextarea();
      }
    }

    function renderFromTextarea() {
      try {
        const data = JSON.parse(document.getElementById('paper-json').value);
        renderPaperDOM(data);
      } catch (err) {
        alert("JSON 语法解析失败：" + err.message);
      }
    }

    function renderPaperDOM(data) {
      const container = document.getElementById('paper-mount-point');
      let html = '';

      // 卷头
      html += '<h1 class="paper-title">' + (data.paper_title || "标准化测试卷") + '</h1>';
      html += '<div class="paper-meta">';
      html += '<span>科目：' + (data.meta?.subject || "通用") + '</span>';
      html += '<span>考试时长：' + (data.meta?.time || "120分钟") + '</span>';
      html += '<span>满分：' + (data.meta?.total_score || "100") + '分</span>';
      html += '<span>姓名：_________</span>';
      html += '<span>得分：_________</span>';
      html += '</div>';

      // 多模块与大题渲染
      (data.sections || []).forEach(sec => {
        html += '<div class="section-title">' + sec.title + '</div>';
        (sec.questions || []).forEach(q => {
          html += '<div class="question-row">';
          html += '  <div class="q-flex-box">';
          html += '    <div class="q-content">';
          html += '      <b>' + q.id + '.</b> (' + q.score + '分) ' + q.stem;
          
          // 选择题选项支持
          if (q.options && q.options.length) {
            const letters = ['A', 'B', 'C', 'D'];
            html += '<div class="options-grid">';
            q.options.forEach((opt, idx) => {
              html += '<div>' + (letters[idx] || '') + '．' + opt + '</div>';
            });
            html += '</div>';
          }

          html += '    </div>';

          // 矢量图挂载
          if (q.diagram) {
            html += '    <div class="q-graphic-box">' + ${renderGraphicEngine.toString()}(q.diagram) + '</div>';
          }

          html += '  </div>';

          // 答题留白横线
          if (q.blank_lines) {
            html += '<div class="blank-space" style="height: ' + (q.blank_lines * 24) + 'px;"></div>';
          }

          html += '</div>';
        });
      });

      container.innerHTML = html;

      // 公式解析引擎
      if (window.renderMathInElement) {
        renderMathInElement(container, {
          delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "$", right: "$", display: false }
          ],
          throwOnError: false
        });
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