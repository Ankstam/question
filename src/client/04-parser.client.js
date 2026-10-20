function sanitizeLatexJSON(rawStr) {
  var bs = String.fromCharCode(92);
  var out = '';
  for (var i = 0; i < rawStr.length; i++) {
    var ch = rawStr[i];
    if (ch === bs) {
      var next = rawStr[i+1] || '';
      if (next === bs) { out += bs+bs; i++; }
      else if (next === '"' || next === '/') { out += bs + next; i++; }
      else if (next === 'u' && /^[0-9a-fA-F]{4}$/.test(rawStr.substr(i+2,4))) { out += bs; }
      else if (/^[a-zA-Z]/.test(next)) { out += bs+bs; }
      else { out += bs+bs; }
    } else out += ch;
  }
  return out;
}

function autoRepairPaper(data) {
  if (!data || typeof data !== 'object') data = {};
  if (!data.paper_title) data.paper_title = '';
  if (!Array.isArray(data.sections)) data.sections = [];
  var qid = 1;
  data.sections.forEach(function(sec, si) {
    if (!sec || typeof sec !== 'object') data.sections[si] = { title: '', questions: [] };
    if (!Array.isArray(data.sections[si].questions)) data.sections[si].questions = [];
    data.sections[si].questions.forEach(function(q, qi) {
      if (!q || typeof q !== 'object') {
        data.sections[si].questions[qi] = { id: qid++, score: 5, stem: '', options: [], blank_lines: 0, tags: [] };
        return;
      }
      if (typeof q.id !== 'number') q.id = qid;
      qid = Math.max(qid, q.id + 1);
      if (typeof q.score !== 'number') q.score = 5;
      if (typeof q.stem !== 'string') q.stem = String(q.stem || '');
      if (!Array.isArray(q.options)) q.options = [];
      if (typeof q.blank_lines !== 'number') q.blank_lines = q.options.length ? 0 : 6;
      if (!Array.isArray(q.tags)) q.tags = [];
    });
  });
  return data;
}

function parseJSONWithTolerance(rawStr) {
  var data;
  try { data = JSON.parse(sanitizeLatexJSON(rawStr)); }
  catch(e1) { try { data = JSON.parse(rawStr); } catch(e2){ throw e1; } }
  return autoRepairPaper(data);
}

function forceRepairJSON() {
  var raw = document.getElementById('paper-json').value.trim();
  if (!raw) { showToast('没有内容可修复', 'warning'); return; }
  try {
    var data = parseJSONWithTolerance(raw);
    document.getElementById('paper-json').value = JSON.stringify(data, null, 2);
    renderPaperFromTextarea(true);
    showToast('已完成修复', 'success');
  } catch(e) { showToast('修复失败：'+(e.message||e), 'error'); }
}
