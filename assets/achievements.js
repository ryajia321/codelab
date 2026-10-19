/* CodeLab 成就系统 v1.0 —— 纯前端，localStorage 存档，无需登录。
 * 进度沿用 app.js 的 codelab_prog_<教程id>；成就存 codelab_achv（{成就id: 解锁时间戳}）。
 * 完成时间存 codelab_done（{教程id: 完成时间戳}），用于"一周三杀"等时间类成就。
 */
(function(){
"use strict";

var PYTHON_IDS = ["python-organize-files", "python-merge-excel", "python-clean-excel", "python-fetch-web"];
var WEB_IDS = ["web-github-query", "web-publish-site"];

var ACHIEVEMENTS = [
  { id: "first-step",  emoji: "🌱", name: "迈出第一步", desc: "勾选任意一篇教程的第 1 步" },
  { id: "tutorial-done", emoji: "🎉", name: "初露锋芒", desc: "完整做完任意一篇教程的全部步骤" },
  { id: "python-trio", emoji: "🐍", name: "Python 三剑客", desc: "做完任意 3 篇 Python 教程" },
  { id: "web-duo",     emoji: "🌐", name: "网页双子星", desc: "做完 2 篇网页教程" },
  { id: "all-six",     emoji: "🏆", name: "六边形战士", desc: "做完全部 6 篇教程" },
  { id: "webmaster",   emoji: "🚀", name: "站长诞生", desc: "做完《发布你的第一个网站》" },
  { id: "night-owl",   emoji: "🦉", name: "夜猫子", desc: "在凌晨 0–5 点勾选过步骤" },
  { id: "week-triple", emoji: "⚡", name: "一周三杀", desc: "7 天内做完 3 篇教程" },
  { id: "game-master", emoji: "🎮", name: "游戏达人", desc: "小游戏中单局拿到 100 分" },
  { id: "game-perfect", emoji: "💯", name: "全对通关", desc: "小游戏中一局全部答对" }
];

function lsGet(k, fb){ try{ var v = JSON.parse(localStorage.getItem(k)); return v || fb; }catch(e){ return fb; } }
function lsSet(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); return true; }catch(e){ return false; } }

/* progress: {教程id: {done: 已勾选数, total: 总步数}} —— 纯函数，可单测 */
function evaluate(progress, unlocked, nowHour, doneTimes){
  var fresh = [];
  function grant(id){ if(!unlocked[id]){ unlocked[id] = Date.now(); fresh.push(id); } }
  var tids = Object.keys(progress);
  var doneIds = tids.filter(function(t){ return progress[t].done >= progress[t].total && progress[t].total > 0; });

  if(tids.some(function(t){ return progress[t].done >= 1; })) grant("first-step");
  if(doneIds.length >= 1) grant("tutorial-done");
  if(doneIds.filter(function(t){ return PYTHON_IDS.indexOf(t) >= 0; }).length >= 3) grant("python-trio");
  if(doneIds.filter(function(t){ return WEB_IDS.indexOf(t) >= 0; }).length >= 2) grant("web-duo");
  if(doneIds.length >= 6) grant("all-six");
  if(doneIds.indexOf("web-publish-site") >= 0) grant("webmaster");
  if(nowHour >= 0 && nowHour < 5) grant("night-owl");
  var weekAgo = Date.now() - 7*24*3600*1000;
  var recent = doneTimes.filter(function(ts){ return ts >= weekAgo; }).length;
  if(recent >= 3) grant("week-triple");
  return fresh;
}

function buildProgress(){
  var ts = (window.TUTORIALS || []), p = {};
  ts.forEach(function(t){
    var prog = lsGet("codelab_prog_" + t.id, {}), n = 0;
    Object.keys(prog).forEach(function(k){ if(prog[k]) n++; });
    p[t.id] = { done: n, total: (t.steps || []).length };
  });
  return p;
}

function checkAndCelebrate(){
  var unlocked = lsGet("codelab_achv", {});
  var doneMap = lsGet("codelab_done", {});
  var fresh = evaluate(buildProgress(), unlocked,
                       new Date().getHours(), Object.keys(doneMap).map(function(k){ return doneMap[k]; }));
  if(fresh.length){
    lsSet("codelab_achv", unlocked);
    fresh.forEach(function(id, i){ setTimeout(function(){ toast(id); }, i * 900); });
    confetti();
  }
  return fresh;
}

/* 标记某篇教程完成（供 tutorial.html 在 100% 时调用） */
function markDone(tid){
  var doneMap = lsGet("codelab_done", {});
  if(!doneMap[tid]){ doneMap[tid] = Date.now(); lsSet("codelab_done", doneMap); }
}

function meta(id){
  for(var i = 0; i < ACHIEVEMENTS.length; i++)
    if(ACHIEVEMENTS[i].id === id) return ACHIEVEMENTS[i];
  return null;
}

function toast(id){
  var m = meta(id); if(!m) return;
  var el = document.createElement("div");
  el.className = "achv-toast";
  el.innerHTML = '<span class="achv-emoji">' + m.emoji + '</span>' +
    '<div><b>成就解锁：' + m.name + '</b><br><span>' + m.desc + '</span></div>';
  document.body.appendChild(el);
  setTimeout(function(){ el.classList.add("show"); }, 30);
  setTimeout(function(){ el.classList.remove("show"); setTimeout(function(){ el.remove(); }, 400); }, 3200);
}

function confetti(){
  var c = document.createElement("canvas");
  c.className = "achv-confetti";
  document.body.appendChild(c);
  var ctx = c.getContext("2d");
  c.width = window.innerWidth; c.height = window.innerHeight;
  var colors = ["#f0b429", "#58a6ff", "#3fb950", "#f85149", "#bc8cff", "#39c5cf"];
  var ps = [];
  for(var i = 0; i < 90; i++){
    ps.push({ x: Math.random()*c.width, y: -20 - Math.random()*c.height*0.3,
      w: 6+Math.random()*6, h: 8+Math.random()*8,
      vy: 2+Math.random()*3, vx: -1.5+Math.random()*3,
      r: Math.random()*Math.PI, vr: -0.1+Math.random()*0.2,
      c: colors[i % colors.length] });
  }
  var t0 = Date.now();
  (function tick(){
    ctx.clearRect(0, 0, c.width, c.height);
    ps.forEach(function(p){
      p.x += p.vx; p.y += p.vy; p.r += p.vr;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
      ctx.fillStyle = p.c; ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
      ctx.restore();
    });
    if(Date.now() - t0 < 2600) requestAnimationFrame(tick);
    else c.remove();
  })();
}

/* 每日编程冷知识 + 今日编程宜忌（按日期确定性轮换） */
var FACTS = [
  "Python 的名字来自英国喜剧团体 Monty Python，不是蟒蛇。",
  "第一个程序 bug 是 1947 年一只飞进继电器的飞蛾，debug 由此得名。",
  "GitHub 上 star 最多的仓库之一是 freeCodeCamp，一个免费学编程的网站。",
  "HTML 不是编程语言，它是标记语言——负责搭网页的骨架。",
  "API 的全称是 Application Programming Interface，你查 star 数时就在用它。",
  "JSON 里的 J 是 JavaScript，但现在几乎所有语言都在用它传数据。",
  "404 这个数字来自欧洲核子研究中心最早放服务器的 404 房间。",
  "QWERTY 键盘布局是为了让打字机不卡键而故意放慢打字速度的。",
  "第一版 Python 发布于 1991 年，比很多读者的年龄都大。",
  "localhost 指的就是你自己的电脑，127.0.0.1 是它的数字名字。",
  "Markdown 是 2004 年发明的，初衷是「用纯文本写出好看的排版」。",
  "世界上第一个网站 info.cern.ch 至今还能访问，1991 年上线的。",
  "Python 里 True + True 等于 2，因为布尔值本质上是 1 和 0。",
  "第一台 iPhone 发布于 2007 年，比 GitHub（2008）还早一年。",
  "CSS 的全称是 Cascading Style Sheets，层叠样式表。",
  "Linux 的吉祥物是一只叫 Tux 的企鹅。",
  "JavaScript 和 Java 除了名字像，几乎没有关系。",
  "Stack Overflow 上被浏览最多的 Python 问题是关于字典排序的。",
  "HTTP 状态码 418 的意思是「我是一个茶壶」（愚人节玩笑转正）。",
  "VS Code 是目前全球使用最多的代码编辑器。",
  "UTF-8 能表示全世界几乎所有文字，一个中文通常占 3 个字节。",
  "世界上第一位程序员是 Ada Lovelace，比计算机发明早了一个世纪。"
];
var YI = ["写注释", "重构代码", "学一个新函数", "备份文件", "读报错信息", "给变量起好名字", "跑一遍测试", "早点睡觉"];
var JI = ["删库", "--force 覆盖", "复制粘贴不看", "熬夜调 bug", "在主分支直接改", "不写注释", "跳过报错", "同时开十个需求"];

function seededPick(arr, seed, n){
  var out = [], used = {};
  var s = seed;
  while(out.length < n){
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    var i = s % arr.length;
    if(!used[i]){ used[i] = 1; out.push(arr[i]); }
  }
  return out;
}
function daySeed(){ var d = new Date(); return d.getFullYear()*1000 + dayOfYear(); }
function dayOfYear(){ var d = new Date(); return Math.floor((d - new Date(d.getFullYear(),0,0)) / 86400000); }
function dailyFact(){ return FACTS[dayOfYear() % FACTS.length]; }
function dailyYiJi(){ var s = daySeed(); return { yi: seededPick(YI, s, 2), ji: seededPick(JI, s+7, 2) }; }

/* 成就墙渲染（首页用） */
function renderWall(elId){
  var el = document.getElementById(elId); if(!el) return;
  var unlocked = lsGet("codelab_achv", {});
  el.innerHTML = ACHIEVEMENTS.map(function(a){
    var un = !!unlocked[a.id];
    return '<div class="achv-card' + (un ? ' on' : '') + '">' +
      '<div class="achv-emoji">' + (un ? a.emoji : '🔒') + '</div>' +
      '<b>' + a.name + '</b><span>' + (un ? a.desc : '???') + '</span></div>';
  }).join('');
}

function grant(id){
  var unlocked = lsGet("codelab_achv", {});
  if(!unlocked[id]){
    unlocked[id] = Date.now();
    lsSet("codelab_achv", unlocked);
    toast(id);
  }
}

window.Achv = {
  list: ACHIEVEMENTS, evaluate: evaluate, check: checkAndCelebrate, markDone: markDone,
  grant: grant,
  renderWall: renderWall, dailyFact: dailyFact, dailyYiJi: dailyYiJi, toast: toast
};
})();
