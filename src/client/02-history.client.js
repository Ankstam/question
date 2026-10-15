function getHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch(e){ return []; }
}

function saveHistory(list) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, MAX_HISTORY))); } catch(e){}
}

function saveCurrentToHistory() {
  var raw = document.getElementById('paper-json').value.trim();
  if (!raw) { showToast('当前没有试卷数据', 'warning'); return; }
  var data;
  try { data = parseJSONWithTolerance(raw); } catch(e){ showToast('JSON 无效', 'error'); return; }
  var list = getHistory();
  list.unshift({
    id: Date.now().toString(36),
    title: data.paper_title || '未命名试卷',
    time: new Date().toLocaleString(),
    data: data
  });
  saveHistory(list);
  renderHistoryList();
  showToast('已保存到历史库', 'success');
}

function loadFromHistory(id) {
  var item = getHistory().find(function(x){ return x.id === id; });
  if (!item) return;
  document.getElementById('paper-json').value = JSON.stringify(item.data, null, 2);
  renderPaperFromTextarea(true);
  setTab('preview');
  showToast('已加载历史试卷', 'success');
}

function deleteFromHistory(id) {
  if (!confirm('确定删除？')) return;
  saveHistory(getHistory().filter(function(x){ return x.id !== id; }));
  renderHistoryList();
  showToast('已删除', 'info');
}

function renderHistoryList() {
  var list = getHistory();
  var container = document.getElementById('history-list');
  if (!list.length) {
    container.innerHTML = '<div style="padding:16px;color:var(--text-sub);font-size:12.5px;text-align:center;">暂无历史记录</div>';
    return;
  }
  container.innerHTML = list.map(function(item){
    return '<div class="history-item">' +
      '<div class="title" onclick="loadFromHistory(\''+item.id+'\')">'+(item.title||'未命名')+'</div>' +
      '<div class="time">'+item.time+'</div>' +
      '<button class="btn-sm danger" style="padding:4px 8px;font-size:11px;" onclick="deleteFromHistory(\''+item.id+'\')">删</button></div>';
  }).join('');
}
