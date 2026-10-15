var currentPaperData = null;
var mistakeQuestionIds = new Set();
var isFilteringMistakes = false;
var currentLayoutTemplate = 'standard';
var isCleanMode = true; // 默认开启纯净模式
var renderTimer = null;
var HISTORY_KEY = 'examcraft_history_v1';
var MAX_HISTORY = 30;

var DEFAULT_LAYOUT = {
  '--paper-font-size': '10.5pt',
  '--paper-line-height': '1.65',
  '--q-spacing': '18px',
  '--rule-height': '22px',
  '--diagram-width': '160px',
  '--option-gap': '4px',
  '--stem-option-gap': '6px',
  '--paper-padding-v': '14mm',
  '--paper-padding-h': '14mm'
};

function showToast(msg, type) {
  type = type || 'info';
  var container = document.getElementById('toast-container');
  var el = document.createElement('div');
  el.className = 'toast ' + type;
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(function() {
    el.classList.add('toast-out');
    setTimeout(function() { if (el.parentNode) el.parentNode.removeChild(el); }, 260);
  }, 2600);
}

window.addEventListener('DOMContentLoaded', function() {
  loadSavedLayout();
  renderHistoryList();
  renderPaperFromTextarea(true);
  updateOnlineStatus();
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);

  var jsonEl = document.getElementById('paper-json');
  if (jsonEl) jsonEl.addEventListener('input', function(){ debouncedRender(); });
});

function updateOnlineStatus() {
  var el = document.getElementById('offline-status');
  el.textContent = navigator.onLine ? '在线' : '离线模式';
  el.style.color = navigator.onLine ? '' : '#ef4444';
}

function showRenderStatus(show) {
  var el = document.getElementById('render-status');
  if (show) el.classList.add('show'); else el.classList.remove('show');
}

function debouncedRender() {
  if (renderTimer) clearTimeout(renderTimer);
  renderTimer = setTimeout(function(){ renderPaperFromTextarea(false); }, 380);
}

function setTab(name) {
  ['edit','preview'].forEach(function(t){
    var nav = document.getElementById('tab-nav-' + t);
    var panel = document.getElementById('panel-' + t);
    if (nav) nav.classList.toggle('active', t === name);
    if (panel) panel.classList.toggle('active', t === name);
  });
  if (name === 'preview') renderPaperFromTextarea(true);
  if (name === 'edit') renderHistoryList();
}
