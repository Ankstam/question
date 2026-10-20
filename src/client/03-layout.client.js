/**
 * 页面分栏与布局重排计算引擎
 */
export function recalculateLayout(container, templateType) {
  if (!container) return;

  // 解析模板完全依托 CSS 连续多栏与浏览器 Print 引擎，清理手动断页
  if (templateType === 'solution-compact') {
    clearManualPageBreaks(container);
    return;
  }

  // 做题卷与普通模板的分页切分逻辑
  executeStandardPagination(container);
}

function clearManualPageBreaks(container) {
  const breaks = container.querySelectorAll('.page-divider, .print-spacer');
  breaks.forEach(el => el.remove());
}

function executeStandardPagination(container) {
  // 原有试卷模板强制切页及保留答题空白的计算逻辑
  const items = container.querySelectorAll('.question-card');
  let currentHeight = 0;
  const pageLimit = 1000; // 标准页高像素参考值

  items.forEach(card => {
    currentHeight += card.offsetHeight;
    if (currentHeight > pageLimit) {
      const divider = document.createElement('div');
      divider.className = 'page-divider';
      card.parentNode.insertBefore(divider, card);
      currentHeight = card.offsetHeight;
    }
  });
}
