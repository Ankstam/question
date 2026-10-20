export const TEMPLATE_TYPES = {
  STANDARD: 'standard',
  COMPACT: 'compact',
  SOLUTION: 'solution-compact'
};

export const SOLUTION_TEMPLATE_CONFIG = {
  pageSize: 'A4',
  columns: 2,
  columnGap: '6mm',
  columnRule: '0.5pt solid #e2e8f0',
  fontSize: '9pt',
  lineHeight: 1.35,
  mathCompact: true,
  pageMargin: '8mm 10mm 10mm 10mm'
};

export const EMPTY_PAPER = {
  paper_title: "试卷标题与标准答案",
  template: TEMPLATE_TYPES.SOLUTION,
  sections: [
    {
      section_title: "第一部分：试题解析与评分细则",
      questions: [
        {
          id: 1,
          title: "1.【第1题标准解答与评分细则】",
          content: "(1) 计算步骤与推导过程：[2分]\n由动能定理得公式。\n(2) 最终结论与得分：[1分]"
        }
      ]
    }
  ]
};
