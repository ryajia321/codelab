/* CodeLab 码上实践 — 通用脚本 */
(function(){
"use strict";
// 代码复制：优先 Clipboard API，失败走 textarea+execCommand（iOS），再失败弹手动复制
window.copyCode = async function(btn){
  var block = btn.closest('.codeblock');
  var code = block ? block.querySelector('code').innerText : '';
  if(!code) return;
  var okMark = function(){ var t=btn.textContent; btn.textContent='已复制'; setTimeout(function(){btn.textContent=t;},1500); };
  try{
    if(navigator.clipboard && window.isSecureContext !== false){
      await navigator.clipboard.writeText(code); okMark(); return;
    }
    throw new Error('no clipboard api');
  }catch(e){
    try{
      var ta = document.createElement('textarea');
      ta.value = code; ta.setAttribute('readonly','');
      ta.style.cssText = 'position:fixed;top:0;left:0;width:10px;height:10px;opacity:0;';
      document.body.appendChild(ta);
      ta.focus(); ta.setSelectionRange(0, ta.value.length);
      var ok = document.execCommand('copy');
      ta.remove();
      if(ok){ okMark(); return; }
    }catch(e2){}
    // 终极降级：让用户手动复制
    window.prompt('自动复制失败，请手动全选复制：', code.slice(0, 200) + (code.length>200 ? '...(过长，仅显示前200字，请在页面上手动复制)' : ''));
  }
};
// 学习进度：localStorage 按教程+步骤存
window.progGet = function(tid){
  try{ return JSON.parse(localStorage.getItem('codelab_prog_'+tid)) || {}; }catch(e){ return {}; }
};
window.progSet = function(tid, idx, done){
  try{
    var p = window.progGet(tid); p[idx] = !!done;
    localStorage.setItem('codelab_prog_'+tid, JSON.stringify(p));
  }catch(e){}
};
window.progCount = function(tid, total){
  var p = window.progGet(tid), n = 0;
  for(var i=0;i<total;i++){ if(p[i]) n++; }
  return n;
};
// 顶栏当前页高亮
document.addEventListener('DOMContentLoaded', function(){
  var path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav a').forEach(function(a){
    var href = a.getAttribute('href');
    if(href === path || (path === '' && href === 'index.html')) a.classList.add('on');
  });
});
})();
// HTML 转义（渲染教程数据时用）
window.esc = function(s){
  return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];
  });
};
