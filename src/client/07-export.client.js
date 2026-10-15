var pendingSharePdfFile = null;
var pendingSharePdfBlob = null;
var pendingShareFilename = '';

function getResolvedFileName(ext, isMistake) {
  var custom = (document.getElementById('custom-filename-input').value || '').trim();
  var prefix = isMistake ? '错题集_' : '试卷_';
  if (!custom) {
    var now = new Date();
    var p = function(n){ return String(n).padStart(2,'0'); };
    custom = prefix + now.getFullYear() + p(now.getMonth()+1) + p(now.getDate()) + '_' + p(now.getHours()) + p(now.getMinutes());
  } else {
    custom = (isMistake ? '错题集_' : '') + custom;
  }
  return custom + '.' + ext;
}

function openExportModal() {
  renderPaperFromTextarea(true);
  var banner = document.getElementById('ready-share-banner');
  if (banner) banner.style.display = 'none';
  document.getElementById('export-modal').classList.add('active');
}

function closeExportModal() {
  document.getElementById('export-modal').classList.remove('active');
}

function downloadBlob(content, filename, type) {
  var blob = new Blob([content], {type: type});
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  setTimeout(function(){ document.body.removeChild(a); URL.revokeObjectURL(url); }, 300);
}

async function openWithExternalPdfApp(mistakeOnly) {
  if (mistakeOnly && mistakeQuestionIds.size === 0) {
    showToast('请先在预览页勾选错题', 'warning');
    return;
  }

  closeExportModal();

  // 确保切换到预览面板，防止因 #panel-preview 处于隐藏状态导致 html2canvas 渲染出空白页
  setTab('preview');
  setPreviewMode('a4-exact');

  document.querySelectorAll('.question-row').forEach(function(row){
    var id = parseInt(row.getAttribute('data-qid'));
    row.style.display = mistakeOnly ? (mistakeQuestionIds.has(id) ? 'block' : 'none') : 'block';
  });

  showRenderStatus(true);
  showToast('正在生成高清 PDF 并调起外部应用...', 'info');

  if (document.fonts && document.fonts.ready) await document.fonts.ready;
  await new Promise(function(r){ requestAnimationFrame(r); });

  var element = document.getElementById('paper-mount-point');
  var filename = getResolvedFileName('pdf', !!mistakeOnly);
  var opt = {
    margin: [12, 12, 12, 12],
    filename: filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2.5, useCORS: true, backgroundColor: '#ffffff' },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'], avoid: ['.question-row', '.section-title'] }
  };

  try {
    var pdfBlob = await window.html2pdf().set(opt).from(element).outputPdf('blob');
    var pdfFile = new File([pdfBlob], filename, { type: 'application/pdf' });

    pendingSharePdfBlob = pdfBlob;
    pendingSharePdfFile = pdfFile;
    pendingShareFilename = filename;

    // 恢复所有题目显示
    document.querySelectorAll('.question-row').forEach(function(row){ row.style.display = 'block'; });
    showRenderStatus(false);

    // 1. 优先直接调起手机系统「用其他应用打开 / 分享」原生面板
    if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
      try {
        await navigator.share({
          files: [pdfFile],
          title: filename
        });
        return;
      } catch (shareErr) {
        if (shareErr && shareErr.name === 'AbortError') return; // 用户主动取消
        // 若因试卷较长导致生成耗时超过浏览器手势有效期 (NotAllowedError)，弹出单次点击横幅立即调起
        var banner = document.getElementById('ready-share-banner');
        if (banner) {
          banner.style.display = 'block';
          document.getElementById('export-modal').classList.add('active');
          return;
        }
      }
    }

    // 2. 电脑端或不支持文件级 Web Share 的浏览器：直接打开 PDF 流
    openPdfBlobFallback(pdfBlob, filename);
  } catch (err) {
    document.querySelectorAll('.question-row').forEach(function(row){ row.style.display = 'block'; });
    showRenderStatus(false);
    showToast('生成 PDF 失败：' + (err.message || err), 'error');
  }
}

async function triggerPendingPdfShare() {
  if (!pendingSharePdfFile) return;
  try {
    if (navigator.canShare && navigator.canShare({ files: [pendingSharePdfFile] })) {
      await navigator.share({
        files: [pendingSharePdfFile],
        title: pendingShareFilename
      });
      closeExportModal();
      return;
    }
  } catch (err) {
    if (err && err.name === 'AbortError') return;
  }
  closeExportModal();
  openPdfBlobFallback(pendingSharePdfBlob, pendingShareFilename);
}

function openPdfBlobFallback(pdfBlob, filename) {
  if (!pdfBlob) return;
  var blobUrl = URL.createObjectURL(pdfBlob);
  var win = window.open(blobUrl, '_blank');
  if (!win) {
    downloadBlob(pdfBlob, filename, 'application/pdf');
  }
}

async function triggerChromePrint(mistakeOnly) {
  closeExportModal();
  window.scrollTo(0,0);
  if (mistakeOnly) {
    if (mistakeQuestionIds.size === 0) { showToast('请先勾选错题', 'warning'); return; }
    document.querySelectorAll('.question-row').forEach(function(row){
      var id = parseInt(row.getAttribute('data-qid'));
      row.style.display = mistakeQuestionIds.has(id) ? 'block' : 'none';
    });
  } else {
    document.querySelectorAll('.question-row').forEach(function(row){ row.style.display = 'block'; });
  }
  if (document.fonts && document.fonts.ready) await document.fonts.ready;
  await new Promise(function(r){ requestAnimationFrame(r); });
  await new Promise(function(r){ setTimeout(r, 80); });
  window.print();
  document.querySelectorAll('.question-row').forEach(function(row){ row.style.display = 'block'; });
}

async function exportDirectPDF(mistakeOnly) {
  if (mistakeOnly && mistakeQuestionIds.size === 0) {
    showToast('请先勾选错题', 'warning');
    return;
  }
  closeExportModal();
  setTab('preview');
  setPreviewMode('a4-exact');
  if (mistakeOnly) {
    document.querySelectorAll('.question-row').forEach(function(row){
      var id = parseInt(row.getAttribute('data-qid'));
      row.style.display = mistakeQuestionIds.has(id) ? 'block' : 'none';
    });
  }
  if (document.fonts) await document.fonts.ready;
  var element = document.getElementById('paper-mount-point');
  var filename = getResolvedFileName('pdf', !!mistakeOnly);
  var opt = {
    margin: [12,12,12,12],
    filename: filename,
    image: {type:'jpeg', quality:0.98},
    html2canvas: {scale:2, useCORS:true, backgroundColor:'#ffffff'},
    jsPDF: {unit:'mm', format:'a4', orientation:'portrait'},
    pagebreak: {mode:['avoid-all','css','legacy'], avoid:['.question-row','.section-title']}
  };
  if (window.html2pdf) {
    window.html2pdf().set(opt).from(element).save().then(function(){
      document.querySelectorAll('.question-row').forEach(function(row){ row.style.display='block'; });
      showToast('PDF 已生成', 'success');
    });
  }
}

function exportStandaloneHTML() {
  closeExportModal();
  var filename = getResolvedFileName('html', false);
  var mount = document.getElementById('paper-mount-point').innerHTML;
  var fullHtml = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>'+filename+'</title><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.css"><style>@page{size:A4;margin:12mm;}body{font-family:"Songti SC",SimSun,serif;padding:16px;font-size:10.5pt;line-height:1.65;}.paper-title{text-align:center;font-size:1.5em;margin-bottom:18px;}.section-title{font-weight:bold;margin:14px 0 8px;}.question-row{break-inside:avoid;margin-bottom:16px;}.q-layout-box{display:flex;gap:12px;}.q-cell-content{flex:1;}.q-cell-graphic{width:140px;}.options-grid.cols-4{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;}.options-grid.cols-2{display:grid;grid-template-columns:repeat(2,1fr);gap:4px;}.options-grid.cols-1{display:flex;flex-direction:column;gap:3px;}.rule-blank{height:20px;}</style></head><body>'+mount+'</body></html>';
  downloadBlob(fullHtml, filename, 'text/html;charset=utf-8');
  showToast('HTML 已导出', 'success');
}

async function pasteFromClipboard() {
  try {
    var text = await navigator.clipboard.readText();
    if (text) {
      document.getElementById('paper-json').value = text;
      if (renderPaperFromTextarea(true)) { setTab('preview'); showToast('已载入', 'success'); }
    }
  } catch(e) { showToast('请长按输入框粘贴或使用导入', 'warning'); }
}

function triggerFileInput() { document.getElementById('file-uploader').click(); }

function handleFileUpload(event) {
  var file = event.target.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(e) {
    document.getElementById('paper-json').value = e.target.result;
    if (renderPaperFromTextarea(true)) { setTab('preview'); showToast('文件已载入', 'success'); }
  };
  reader.readAsText(file, 'UTF-8');
  event.target.value = '';
}

function clearJson() {
  if (confirm('确定清空？')) {
    document.getElementById('paper-json').value = '';
    renderPaperFromTextarea(true);
    showToast('已清空', 'info');
  }
}
