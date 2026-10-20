/**
 * 试卷文本与解析语法预处理引擎
 */
export function parseSolutionContent(rawText) {
  if (!rawText) return '';

  let text = rawText;

  // 1. 将评分细则标记 [X分] 转化为行内右浮动徽标
  text = text.replace(/\[(\d+分)\]/g, '<span class="score-tag">[$1]</span>');

  // 2. 识别小题编号并添加结构化标签 (1) / (一) 等
  text = text.replace(/^(\([1-9]\d*|\([一二三四五六七八九十]\))/gm, '<span class="sub-question-label">$1</span>');

  // 3. 换行与段落格式化
  const paragraphs = text.split(/\n\s*\n/);
  return paragraphs.map(p => {
    const lines = p.split('\n').map(line => line.trim()).filter(Boolean);
    return `<p>${lines.join('<br>')}</p>`;
  }).join('');
}

/**
 * 统一解析调度器
 */
export function parseContentByTemplate(rawContent, templateType) {
  if (templateType === 'solution-compact') {
    return parseSolutionContent(rawContent);
  }
  
  // 基础默认排版处理
  const paragraphs = (rawContent || '').split(/\n\s*\n/);
  return paragraphs.map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
}
