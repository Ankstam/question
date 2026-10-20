<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>试卷与解析排版系统</title>
  
  <!-- 引入样式表 -->
  <link rel="stylesheet" href="./styles.css">
  
  <!-- 引入 KaTeX -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/contrib/auto-render.min.js"></script>
</head>
<body>
  <!-- 顶部控制条（打印时自动隐藏） -->
  <div class="no-print" style="position: sticky; top: 0; background: #ffffff; border-bottom: 1px solid #e2e8f0; padding: 10px 20px; z-index: 100; display: flex; align-items: center; justify-content: space-between;">
    <div style="display: flex; align-items: center; gap: 12px;">
      <label for="templateSelector" style="font-size: 14px; font-weight: 600;">排版模板：</label>
      <select id="templateSelector" style="padding: 6px 12px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 14px;">
        <option value="solution-compact" selected>高密双栏解析版 (极度省纸)</option>
        <option value="standard">标准考卷 (答题留白)</option>
        <option value="compact">紧凑做题卷</option>
      </select>
    </div>
    <div>
      <button onclick="window.print()" style="padding: 6px 16px; background: #0284c7; color: #ffffff; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; font-weight: 500;">调用打印 / 导出 PDF</button>
    </div>
  </div>

  <!-- 试卷/解析挂载根节点 -->
  <main id="paperApp" class="paper-root tpl-solution"></main>

  <!-- 客户端脚本管道引入 -->
  <script type="module">
    import { EMPTY_PAPER } from '../config/constants.js';
    import { renderPaper } from './06-renderer.client.js';

    let currentPaperData = { ...EMPTY_PAPER };
    const rootEl = document.getElementById('paperApp');
    const selector = document.getElementById('templateSelector');

    function refresh() {
      currentPaperData.template = selector.value;
      renderPaper(currentPaperData, rootEl);
    }

    selector.addEventListener('change', refresh);

    // 监听外部 JSON 载入或默认初次渲染
    window.addEventListener('DOMContentLoaded', () => {
      refresh();
    });

    window.updatePaperSource = (newJson) => {
      currentPaperData = newJson;
      refresh();
    };
  </script>
</body>
</html>
