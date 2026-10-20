function loadSavedLayout() {
  try {
    var saved = localStorage.getItem('paper_layout_v2');
    if (saved) {
      var obj = JSON.parse(saved);
      if (obj.vars) Object.keys(obj.vars).forEach(function(k){
        document.documentElement.style.setProperty(k, obj.vars[k]);
        updateLabelFromVar(k, obj.vars[k]);
      });
      if (obj.template) setLayoutTemplate(obj.template, true);
      if (obj.optionMode) document.getElementById('option-layout-mode').value = obj.optionMode;
      if (obj.qnumStyle) document.getElementById('qnum-style').value = obj.qnumStyle;
      if (obj.customCSS) document.getElementById('custom-css').value = obj.customCSS;
      syncSlidersFromVars();
      applyCustomCSS(true);
    }
  } catch(e){}
}

function saveLayoutSettings() {
  try {
    var vars = {};
    Object.keys(DEFAULT_LAYOUT).forEach(function(k){
      vars[k] = getComputedStyle(document.documentElement).getPropertyValue(k).trim() || DEFAULT_LAYOUT[k];
    });
    localStorage.setItem('paper_layout_v2', JSON.stringify({
      vars: vars,
      template: currentLayoutTemplate,
      optionMode: document.getElementById('option-layout-mode').value,
      qnumStyle: document.getElementById('qnum-style').value,
      customCSS: document.getElementById('custom-css').value
    }));
  } catch(e){}
  debouncedRender();
}

function setLayoutTemplate(tpl, silent) {
  currentLayoutTemplate = tpl;
  document.querySelectorAll('.layout-tpl-btn').forEach(function(b){
    b.classList.toggle('active', b.getAttribute('data-tpl') === tpl);
  });
  var sheet = document.getElementById('paper-mount-point');
  if (sheet) {
    sheet.classList.remove('layout-standard','layout-twocol','layout-compact','layout-option-newline');
    sheet.classList.add('layout-' + tpl);
  }
  if (!silent) saveLayoutSettings();
}

function updateStyleVar(varName, value, labelId) {
  document.documentElement.style.setProperty(varName, value);
  if (labelId) {
    var el = document.getElementById(labelId);
    if (el) el.innerText = value;
  }
  saveLayoutSettings();
}

function updateLabelFromVar(varName, value) {
  var map = {
    '--paper-font-size':'val-font-size',
    '--paper-line-height':'val-line-height',
    '--q-spacing':'val-q-spacing',
    '--rule-height':'val-rule-height',
    '--diagram-width':'val-diag-width',
    '--option-gap':'val-option-gap'
  };
  var id = map[varName];
  if (id) { var el = document.getElementById(id); if (el) el.innerText = value; }
}

function syncSlidersFromVars() {
  var get = function(v){ return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); };
  if (document.getElementById('input-range-fontsize')) document.getElementById('input-range-fontsize').value = parseFloat(get('--paper-font-size'))||10.5;
  if (document.getElementById('input-range-lineheight')) document.getElementById('input-range-lineheight').value = parseFloat(get('--paper-line-height'))||1.65;
  if (document.getElementById('input-range-qspacing')) document.getElementById('input-range-qspacing').value = parseInt(get('--q-spacing'))||18;
  if (document.getElementById('input-range-ruleheight')) document.getElementById('input-range-ruleheight').value = parseInt(get('--rule-height'))||22;
  if (document.getElementById('input-range-diagwidth')) document.getElementById('input-range-diagwidth').value = parseInt(get('--diagram-width'))||160;
  if (document.getElementById('input-range-optiongap')) document.getElementById('input-range-optiongap').value = parseInt(get('--option-gap'))||4;
}

function setQuickFontSize(pt, btnId) {
  document.querySelectorAll('.action-row .btn-sm').forEach(function(b){ b.classList.remove('active-preset'); });
  if (btnId) document.getElementById(btnId).classList.add('active-preset');
  updateStyleVar('--paper-font-size', pt+'pt', 'val-font-size');
  var s = document.getElementById('input-range-fontsize');
  if (s) s.value = pt;
}

function resetLayoutToDefault() {
  Object.keys(DEFAULT_LAYOUT).forEach(function(k){
    document.documentElement.style.setProperty(k, DEFAULT_LAYOUT[k]);
    updateLabelFromVar(k, DEFAULT_LAYOUT[k]);
  });
  setLayoutTemplate('standard', true);
  document.getElementById('option-layout-mode').value = 'auto';
  document.getElementById('qnum-style').value = 'dot';
  document.getElementById('custom-css').value = '';
  document.querySelectorAll('.action-row .btn-sm').forEach(function(b){ b.classList.remove('active-preset'); });
  document.getElementById('btn-size-105').classList.add('active-preset');
  syncSlidersFromVars();
  applyCustomCSS(true);
  saveLayoutSettings();
  showToast('已恢复默认排版', 'success');
}

function applyCustomCSS(silent) {
  var css = document.getElementById('custom-css').value || '';
  var old = document.getElementById('user-custom-style');
  if (old) old.remove();
  if (css.trim()) {
    var style = document.createElement('style');
    style.id = 'user-custom-style';
    style.textContent = css;
    document.head.appendChild(style);
  }
  if (!silent) { saveLayoutSettings(); showToast('自定义 CSS 已应用', 'success'); }
}

function toggleCleanMode() {
  isCleanMode = !isCleanMode;
  var sheet = document.getElementById('paper-mount-point');
  var btn = document.getElementById('btn-clean');
  if (isCleanMode) {
    sheet.classList.add('clean-mode');
    btn.style.background = 'var(--primary)';
    btn.style.color = '#fff';
    showToast('已开启纯净模式（仅标题+题目）', 'info');
  } else {
    sheet.classList.remove('clean-mode');
    btn.style.background = '';
    btn.style.color = '';
    showToast('已关闭纯净模式', 'info');
  }
  renderPaperFromTextarea(true);
}

function setPreviewMode(mode) {
  var sheet = document.getElementById('paper-mount-point');
  var btnFit = document.getElementById('btn-fit');
  var btnDesktop = document.getElementById('btn-desktop');
  var btnA4 = document.getElementById('btn-a4');
  sheet.classList.remove('mobile-fit', 'desktop-mode', 'a4-exact');
  btnFit.style.background = ''; btnFit.style.color = '';
  btnDesktop.style.background = ''; btnDesktop.style.color = '';
  btnA4.style.background = ''; btnA4.style.color = '';

  if (mode === 'mobile-fit') {
    sheet.classList.add('mobile-fit');
    btnFit.style.background = 'var(--primary)'; btnFit.style.color = '#fff';
  } else if (mode === 'desktop') {
    sheet.classList.add('desktop-mode');
    btnDesktop.style.background = 'var(--primary)'; btnDesktop.style.color = '#fff';
  } else {
    sheet.classList.add('a4-exact');
    btnA4.style.background = 'var(--primary)'; btnA4.style.color = '#fff';
  }
}
