export const TEMPLATES = {
  standard: {
    name: '标准单栏',
    columns: 1,
    fontSize: 10.5,
    lineHeight: 1.65,
    sectionGap: 18,
    blankHeight: 22,
    diagramWidth: 160,
    optionGap: 4,
    customCss: ''
  },
  double: {
    name: '双栏流式',
    columns: 2,
    fontSize: 10.5,
    lineHeight: 1.5,
    sectionGap: 14,
    blankHeight: 16,
    diagramWidth: 140,
    optionGap: 3,
    customCss: ''
  },
  compact: {
    name: '紧凑微型图',
    columns: 2,
    fontSize: 9,
    lineHeight: 1.4,
    sectionGap: 10,
    blankHeight: 10,
    diagramWidth: 100,
    optionGap: 2,
    customCss: ''
  },
  optionWrap: {
    name: '选项全换行',
    columns: 1,
    fontSize: 10.5,
    lineHeight: 1.65,
    sectionGap: 18,
    blankHeight: 22,
    diagramWidth: 160,
    optionGap: 6,
    customCss: ''
  },
  answer: {
    name: '答案高密专版',
    columns: 2,
    fontSize: 9,
    lineHeight: 1.22,
    sectionGap: 3,
    blankHeight: 0,
    diagramWidth: 100,
    optionGap: 2,
    customCss: `
.answer-space, .blank-line, .fill-blank-line, .writing-area { display: none !important; height: 0 !important; }
.katex-display { margin: 1.5px 0 !important; }
.question-row { margin-bottom: 4px !important; padding-bottom: 3px !important; break-inside: auto !important; page-break-inside: auto !important; }
.score-tag { float: right !important; font-size: 7.5pt !important; padding: 0 3px !important; }
p { margin: 1.5px 0 !important; }
`
  }
};

export const DEFAULT_TEMPLATE = 'answer';
