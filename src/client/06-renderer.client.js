function renderMathSafely(container) {
  if (typeof renderMathInElement === 'function') {
    renderMathInElement(container, {
      delimiters: [
        {left:"$$",right:"$$",display:true},
        {left:"$",right:"$",display:false},
        {left:"\\(",right:"\\)",display:false},
        {left:"\\[",right:"\\]",display:true}
      ],
      throwOnError: false
    });
  }
}

function getOptionGridClass(options, forceMode) {
  if (forceMode === 'oneline' || forceMode === 'inline-diagram') return 'cols-1';
  if (!options || !options.length) return 'cols-4';
  var maxLen = Math.max.apply(null, options.map(function(o){
    return (o||'').replace(/\$[^\$]*\$/g,'XXXX').length;
  }));
  if (maxLen <= 6) return 'cols-4';
  if (maxLen <= 18) return 'cols-2';
  return 'cols-1';
}

function renderPaperFromTextarea(force) {
  showRenderStatus(true);
  var raw = document.getElementById('paper-json').value.trim();
  if (!raw) {
    document.getElementById('paper-mount-point').innerHTML = '<div style="text-align:center;padding:48px 20px;color:#94a3b8;">暂无试卷数据</div>';
    showRenderStatus(false);
    return false;
  }
  var data;
  try {
    data = parseJSONWithTolerance(raw);
    currentPaperData = data;
  } catch(err) {
    showRenderStatus(false);
    if (force) showToast('JSON 解析错误：'+(err.message||err), 'error');
    return false;
  }

  var optionMode = document.getElementById('option-layout-mode').value;
  var qnumStyle = document.getElementById('qnum-style').value;
  var sheet = document.getElementById('paper-mount-point');
  sheet.classList.remove('layout-standard','layout-twocol','layout-compact','layout-option-newline','qnum-dot','qnum-bracket','qnum-right');
  sheet.classList.add('layout-' + currentLayoutTemplate);
  sheet.classList.add('qnum-' + qnumStyle);
  if (isCleanMode) sheet.classList.add('clean-mode');
  else sheet.classList.remove('clean-mode');

  var html = '';
  if (data.paper_title) html += '<h1 class="paper-title">' + data.paper_title + '</h1>';

  var useFlow = currentLayoutTemplate === 'twocol';
  if (useFlow) html += '<div class="questions-flow">';

  (data.sections || []).forEach(function(sec) {
    if (!useFlow && sec.title) html += '<div class="section-title">' + sec.title + '</div>';
    (sec.questions || []).forEach(function(q) {
      var isFullWidth = !!(q.is_full_width || (q.diagram && q.diagram.is_full_width));
      var isLong = !!(q.blank_lines && q.blank_lines >= 8);
      var rowClass = 'question-row' + (isFullWidth ? ' full-width-row' : '') + (isLong ? ' allow-break' : '');

      html += '<div class="' + rowClass + '" data-qid="' + q.id + '">';
      html += '<button class="mistake-btn" onclick="toggleMistake(' + q.id + ')">标为错题</button>';

      var numHtml = '';
      if (qnumStyle === 'right') {
        numHtml = '<div class="q-num-wrap"><span class="q-num">' + q.id + '.</span><span class="q-bracket">（  ）</span></div>';
      } else if (qnumStyle === 'bracket') {
        numHtml = '<span class="q-num">' + q.id + '</span> ';
      } else {
        numHtml = '<b class="q-num">' + q.id + '.</b> ';
      }

      html += '<div class="q-layout-box"><div class="q-cell-content">';
      html += numHtml + (isCleanMode ? '' : '<span class="q-score">(' + (q.score||'') + '分) </span>') + (q.stem||'');

      if (!isCleanMode && q.tags && q.tags.length) {
        html += '<div style="margin-top:4px;">' + q.tags.map(function(t){ return '<span class="tag">'+t+'</span>'; }).join('') + '</div>';
      }

      if (q.options && q.options.length) {
        var gridClass = getOptionGridClass(q.options, optionMode);
        html += '<div class="options-grid ' + gridClass + '">';
        var letters = ['A','B','C','D','E','F'];
        q.options.forEach(function(opt, idx) {
          html += '<div>' + (letters[idx]||'') + '．' + opt + '</div>';
        });
        html += '</div>';
      }
      html += '</div>';

      if (q.diagram && currentLayoutTemplate !== 'option-newline') {
        html += '<div class="q-cell-graphic">' + renderClientDiagram(q.diagram) + '</div>';
      }
      html += '</div>';

      if (q.blank_lines && q.blank_lines > 0) {
        html += '<div class="blank-space">';
        for (var i=0; i<q.blank_lines; i++) html += '<div class="rule-blank"></div>';
        html += '</div>';
      }
      html += '</div>';
    });
  });

  if (useFlow) html += '</div>';

  requestAnimationFrame(function() {
    sheet.innerHTML = html;
    renderMathSafely(sheet);
    updateMistakeUI();
    showRenderStatus(false);
  });
  return true;
}

function toggleMistake(qId) {
  if (mistakeQuestionIds.has(qId)) mistakeQuestionIds.delete(qId);
  else mistakeQuestionIds.add(qId);
  updateMistakeUI();
}

function updateMistakeUI() {
  document.querySelectorAll('.question-row').forEach(function(row){
    var id = parseInt(row.getAttribute('data-qid'));
    var isM = mistakeQuestionIds.has(id);
    row.classList.toggle('is-mistake', isM);
    var btn = row.querySelector('.mistake-btn');
    if (btn) btn.innerHTML = isM ? '❌ 已标错题' : '标为错题';
  });
  document.getElementById('mistake-count-text').innerText = '错题: ' + mistakeQuestionIds.size;
}

function filterMistakesView() {
  isFilteringMistakes = !isFilteringMistakes;
  document.querySelectorAll('.question-row').forEach(function(row){
    var id = parseInt(row.getAttribute('data-qid'));
    row.style.display = isFilteringMistakes ? (mistakeQuestionIds.has(id) ? 'block' : 'none') : 'block';
  });
  showToast(isFilteringMistakes ? '仅显示错题' : '显示全部题目', 'info');
}
