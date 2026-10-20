import { parseContentByTemplate } from './04-parser.client.js';
import { recalculateLayout } from './03-layout.client.js';

export function renderPaper(paperData, targetElement) {
  if (!targetElement) return;

  const currentTemplate = paperData.template || 'solution-compact';

  // 1. 设置根容器类名
  targetElement.className = 'paper-root';
  if (currentTemplate === 'solution-compact') {
    targetElement.classList.add('tpl-solution');
  } else if (currentTemplate === 'compact') {
    targetElement.classList.add('tpl-compact');
  }

  // 2. 组装 HTML 结构
  let html = '';

  // 试卷大标题 (跨列显示)
  if (paperData.paper_title) {
    html += `
      <header class="paper-header">
        <h1 class="paper-title">${escapeHtml(paperData.paper_title)}</h1>
      </header>
    `;
  }

  // 题块与解析列表
  (paperData.sections || []).forEach(section => {
    if (section.section_title) {
      html += `<div class="section-header">${escapeHtml(section.section_title)}</div>`;
    }

    (section.questions || []).forEach(question => {
      html += `
        <article class="question-card" data-qid="${question.id || ''}">
          ${question.title ? `<div class="question-title">${escapeHtml(question.title)}</div>` : ''}
          <div class="question-body">
            ${parseContentByTemplate(question.content || '', currentTemplate)}
          </div>
        </article>
      `;
    });
  });

  targetElement.innerHTML = html;

  // 3. 渲染 KaTeX 数学公式
  if (window.renderMathInElement) {
    window.renderMathInElement(targetElement, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false }
      ],
      throwOnError: false
    });
  }

  // 4. 重算分页与排版高度
  recalculateLayout(targetElement, currentTemplate);
}

function escapeHtml(str) {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
