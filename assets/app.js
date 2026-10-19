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
    // 终极降级：弹窗展示完整代码，让用户手动复制
    window.manualCopyFallback(code);
  }
};
// 学习进度：localStorage 按教程+步骤存。写入失败返回 false（调用方应提示用户）
window.progGet = function(tid){
  try{ return JSON.parse(localStorage.getItem('codelab_prog_'+tid)) || {}; }catch(e){ return {}; }
};
window.progSet = function(tid, idx, done){
  try{
    var p = window.progGet(tid); p[idx] = !!done;
    localStorage.setItem('codelab_prog_'+tid, JSON.stringify(p));
    return true;
  }catch(e){ return false; }
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
// HTML 消毒：只允许白名单标签/属性。纯 JS 实现（不依赖 DOM），可在 node 里单测。
// 用途：教程正文（body/expected/报错解决/练习题）确实需要 <code>/<a>/<div class="note|tip"> 等格式，
//      不能一律 esc（会杀死格式和站内链接），也不能直接 innerHTML（XSS）。
window.sanitizeHTML = (function(){
  var ALLOWED = {p:[],br:[],b:[],strong:[],i:[],em:[],code:[],ul:[],ol:[],li:[],a:['href'],div:['class'],span:[]};
  function cleanAttrs(tag, attrs){
    var allowed = ALLOWED[tag], out = '';
    String(attrs).replace(/([a-zA-Z_:][\w:.-]*)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/g, function(am, name, val){
      name = name.toLowerCase();
      if(allowed.indexOf(name) < 0) return '';
      var v = String(val).replace(/^['"]|['"]$/g, '');
      if(name === 'href'){
        if(/^\s*(javascript|data|vbscript):/i.test(v)) return '';  // 危险协议直接丢掉属性
        v = v.replace(/"/g, '&quot;');
      }else if(name === 'class'){
        var cls = v.split(/\s+/).filter(function(c){ return c === 'note' || c === 'tip'; });
        if(!cls.length) return '';
        v = cls.join(' ');
      }else{ return ''; }
      out += ' ' + name + '="' + v + '"';
      return '';
    });
    return out;
  }
  function cleanTag(tagStr){
    // tagStr 形如 <a href="..."> 或 </p>，已由分词器保证引号配对
    var m = tagStr.match(/^<(\/?)([a-zA-Z][a-zA-Z0-9]*)([\s\S]*?)>$/);
    if(!m) return '';
    var slash = m[1], tag = m[2].toLowerCase(), attrs = m[3] || '';
    if(!(tag in ALLOWED)) return '';   // 不在白名单的标签直接去掉（保留内部文本，不执行）
    if(slash) return '</' + tag + '>';
    return '<' + tag + cleanAttrs(tag, attrs) + '>';
  }
  return function(html){
    // 引号感知的分词：属性值里的 < > 不参与标签切分
    var s = String(html == null ? '' : html), out = '', i = 0;
    while(i < s.length){
      var lt = s.indexOf('<', i);
      if(lt < 0){ out += s.slice(i); break; }
      out += s.slice(i, lt);
      // HTML 注释整体丢掉
      if(s.slice(lt, lt + 4) === '<!--'){
        var ce = s.indexOf('-->', lt + 4);
        i = ce < 0 ? s.length : ce + 3;
        continue;
      }
      var j = lt + 1, quote = null;
      while(j < s.length){
        var ch = s[j];
        if(quote){ if(ch === quote) quote = null; }
        else if(ch === '"' || ch === "'") quote = ch;
        else if(ch === '>') break;
        j++;
      }
      if(j >= s.length){ out += s.slice(lt); break; }  // 未闭合，当纯文本
      out += cleanTag(s.slice(lt, j + 1));
      i = j + 1;
    }
    return out;
  };
})();
// 复制失败终极降级：弹窗展示完整代码让用户手动复制（不用 prompt 截断）
window.manualCopyFallback = function(code){
  var ov = document.createElement('div');
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.72);z-index:999;display:flex;align-items:center;justify-content:center;padding:20px;';
  var box = document.createElement('div');
  box.style.cssText = 'background:#161b22;border:1px solid #2a3342;border-radius:10px;padding:18px;max-width:560px;width:100%;';
  var p = document.createElement('p');
  p.style.cssText = 'margin-bottom:10px;font-size:14px;color:#e6edf3;';
  p.textContent = '自动复制失败，请在下方手动全选复制（完整代码）：';
  var ta = document.createElement('textarea');
  ta.setAttribute('readonly', '');
  ta.style.cssText = 'width:100%;height:240px;background:#0a0e14;color:#e6edf3;border:1px solid #2a3342;border-radius:8px;padding:10px;font-size:13px;font-family:ui-monospace,Menlo,Consolas,monospace;';
  ta.value = code;
  var btn = document.createElement('button');
  btn.className = 'copybtn'; btn.textContent = '关闭'; btn.style.marginTop = '12px';
  btn.addEventListener('click', function(){ ov.remove(); });
  ov.addEventListener('click', function(e){ if(e.target === ov) ov.remove(); });
  box.appendChild(p); box.appendChild(ta); box.appendChild(btn); ov.appendChild(box);
  document.body.appendChild(ov);
  ta.focus(); ta.select();
};
