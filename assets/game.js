/* CodeLab 编程小游戏 v1.0 —— 猜输出 + 找Bug，纯前端，最高分存 localStorage。
 * 所有题目的正确答案都经过 Python 真机运行验证。 */
(function(){
"use strict";

var GUESS = [
  { code: 'print(2 + 3 * 4)', opts: ['20', '14', '24', '11'], ans: 1,
    why: '先算乘法 3*4=12，再加 2，得 14。' },
  { code: 'print("ab" * 3)', opts: ['ab3', 'ababab', 'aaabbb', '报错'], ans: 1,
    why: '字符串乘以数字 = 重复那么多次。' },
  { code: 'a = [1, 2, 3]\nprint(a[1:])', opts: ['[1, 2]', '[2, 3]', '[1, 2, 3]', '[2]'], ans: 1,
    why: '切片 [1:] 表示从下标 1 切到末尾。' },
  { code: 'print(len("你好世界"))', opts: ['4', '8', '12', '报错'], ans: 0,
    why: 'len 数的是字符数，中文一个字算一个。' },
  { code: 'd = {"a": 1}\nd["b"] = 2\nprint(len(d))', opts: ['1', '2', '3', '报错'], ans: 1,
    why: '字典新增了一个键，现在有 2 个键。' },
  { code: 'for i in range(3):\n    print(i, end=" ")\nprint()', opts: ['1 2 3', '0 1 2', '0 1 2 3', '报错'], ans: 1,
    why: 'range(3) 是 0、1、2，不包含 3。' },
  { code: 'print(7 // 2, 7 % 2)', opts: ['3.5 1', '3 1', '4 1', '3 3'], ans: 1,
    why: '// 是整除（舍去小数），% 是取余数。' },
  { code: 's = "hello"\nprint(s[::-1])', opts: ['hello', 'olleh', 'HELLO', '报错'], ans: 1,
    why: '[::-1] 是倒序切片，字符串反转的常用写法。' },
  { code: 'x = 5\nprint(f"{x}的平方是{x**2}")', opts: ['5的平方是10', '5的平方是25', 'x的平方是x**2', '报错'], ans: 1,
    why: 'f-string 里 {} 会被求值，** 是乘方。' },
  { code: 'a = [3, 1, 2]\na.sort()\nprint(a[0])', opts: ['3', '1', '2', '报错'], ans: 1,
    why: 'sort() 原地排序后是 [1, 2, 3]，第一个是 1。' },
  { code: 'print(bool([]), bool("0"))', opts: ['True True', 'False False', 'False True', 'True False'], ans: 2,
    why: '空列表是 False；非空字符串（哪怕内容是"0"）都是 True。' },
  { code: 'n = 10\nn += 5\nprint(n)', opts: ['10', '5', '15', '105'], ans: 2,
    why: 'n += 5 等价于 n = n + 5。' },
  { code: 'print("py" + "thon")', opts: ['python', 'py thon', 'py+thon', '报错'], ans: 0,
    why: '字符串用 + 就是拼接。' },
  { code: 'a = "  hi  "\nprint(a.strip())', opts: ['  hi  ', 'hi', '  hi', 'hi  '], ans: 1,
    why: 'strip() 去掉两头的空白。' },
  { code: 'print(list(range(2, 8, 2)))', opts: ['[2, 4, 6]', '[2, 3, 4, 5, 6, 7]', '[2, 4, 6, 8]', '[2, 8, 2]'], ans: 0,
    why: 'range(2, 8, 2) 从 2 开始、不到 8、步长 2。' },
  { code: 'x = [1, 2]\ny = x\ny.append(3)\nprint(x)', opts: ['[1, 2]', '[1, 2, 3]', '[3]', '报错'], ans: 1,
    why: 'y = x 不是复制！两个名字指向同一个列表，改 y 就是改 x。' },
  { code: 'print("a,b,c".split(","))', opts: ["['a', 'b', 'c']", "['a,b,c']", "['a', ',', 'b']", '报错'], ans: 0,
    why: 'split(",") 按逗号切成列表。' },
  { code: 'print(2 ** 3 ** 2)', opts: ['64', '512', '36', '18'], ans: 1,
    why: '乘方是右结合：先算 3**2=9，再算 2**9=512。' },
  { code: 't = (1, 2)\nprint(t[0])', opts: ['1', '2', '(1, 2)', '报错'], ans: 0,
    why: '圆括号是元组，和列表一样可以用下标取。' },
  { code: 'print("-".join(["2026", "10", "19"]))', opts: ['2026-10-19', '20261019', "['2026-10-19']", '报错'], ans: 0,
    why: 'join 是 split 的反操作：用 - 把列表拼成字符串。' }
];

var BUG = [
  { code: 'for i in range(5)\n    print(i)',
    opts: ['range 用法不对', '少了冒号 :', 'print 要加大括号', '缩进太多了'], ans: 1,
    why: 'for/if/def/while 这些语句行尾都要有冒号。' },
  { code: 'x = 5\nif x = 5:\n    print("相等")',
    opts: ['if 后面不能有空格', '赋值用 =，比较用 ==', 'print 缩进不对', 'x 不能等于 5'], ans: 1,
    why: 'if 条件里是比较，要用 ==；单个 = 是赋值。' },
  { code: 'print("hello)',
    opts: ['print 后面要加分号', '引号没有闭合', 'hello 要大写', '括号是中文的'], ans: 1,
    why: '左引号和右引号要配对，少了右边的 "。' },
  { code: 'a = [1, 2, 3]\nprint(a[3])',
    opts: ['列表不能用方括号', 'print 不能打印列表', '下标越界：只有 0、1、2', '3 不是整数'], ans: 2,
    why: '3 个元素的列表下标是 0、1、2，a[3] 不存在。' },
  { code: 'def greet():\nprint("hi")',
    opts: ['函数名太短', '函数体没有缩进', 'def 要大写', 'hi 要翻译成中文'], ans: 1,
    why: 'def 下面的代码块必须缩进，否则不算函数体。' },
  { code: 'age = input("年龄：")\nprint(age + 1)',
    opts: ['input 不能加提示文字', 'input 返回的是字符串，不能直接 + 1', '变量名不能叫 age', 'print 里不能做加法'], ans: 1,
    why: 'input() 永远返回字符串，要先 int(age) 转成数字。' },
  { code: 'while True\n    print("loop")',
    opts: ['True 要小写', 'while 行尾少了冒号 :', 'print 不能在循环里', 'loop 要加引号'], ans: 1,
    why: 'while 和 for 一样，行尾也要冒号。' },
  { code: 'print("结果：" + 42)',
    opts: ['引号是中文的', '字符串和数字不能直接用 + 拼接', '42 要加引号才对', 'print 里不能有中文'], ans: 1,
    why: '字符串 + 数字会 TypeError，要先 str(42) 转成字符串。' },
  { code: 'l = [1, 2, 3]\nprint(l.len())',
    opts: ['列表没有 .len() 方法，要用 len(l)', 'len 要大写', 'print 不能打印长度', '列表定义错了'], ans: 0,
    why: 'len() 是全局函数，不是列表的方法。' },
  { code: 'for i in range(3):\nprint(i)',
    opts: ['range 不能用在 for 里', '循环体没有缩进', 'i 不能做循环变量', 'print 要写在 for 前面'], ans: 1,
    why: 'for 下面的代码块必须缩进，不然 Python 不知道哪些算循环体。' }
];

var ORDER = [
  { lines: ['for i in range(1, 4):', '    print(i)'],
    hint: '循环 3 次，把 1、2、3 打印出来' },
  { lines: ['def add(a, b):', '    return a + b', 'print(add(2, 3))'],
    hint: '先定义函数，再调用它' },
  { lines: ['total = 0', 'for n in [1, 2, 3]:', '    total += n', 'print(total)'],
    hint: '累加 1+2+3，最后打印总数' },
  { lines: ['score = 85', 'if score >= 60:', '    print("及格")', 'else:', '    print("不及格")'],
    hint: '85 分，判断及格还是不及格' },
  { lines: ['n = 3', 'while n > 0:', '    print(n)', '    n -= 1'],
    hint: '倒数：3、2、1' }
];

var MODES = { guess: { name: '猜输出', qs: GUESS }, bug: { name: '找Bug', qs: BUG },
              order: { name: '排序代码', qs: ORDER } };

function shuffle(arr){
  var a = arr.slice();
  for(var i = a.length - 1; i > 0; i--){
    var j = Math.floor(Math.random() * (i + 1));
    var t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

function pointsFor(streak){ return streak >= 3 ? 15 : 10; }

var G = null;
function newGame(mode){
  G = { mode: mode, qs: shuffle(MODES[mode].qs), i: 0, score: 0, streak: 0,
        correct: 0, answered: false,
        best: parseInt(localStorage.getItem('codelab_game_best') || '0', 10) || 0 };
  render();
}

function render(){
  if(G.mode === 'order'){ renderOrder(); return; }
  var q = G.qs[G.i], total = G.qs.length;
  var el = document.getElementById('gameBox');
  var h = '<div class="game-meta"><span>第 ' + (G.i+1) + ' / ' + total + ' 题</span>' +
    '<span>得分 <b id="gScore">' + G.score + '</b></span>' +
    '<span>' + (G.streak >= 2 ? '🔥连击 x' + G.streak : '最高 ' + G.best) + '</span></div>' +
    '<div class="game-prog"><i style="width:' + Math.round(G.i/total*100) + '%"></i></div>' +
    '<pre class="game-code">' + escHtml(q.code) + '</pre>' +
    '<p class="game-q">' + (G.mode === 'guess' ? '这段代码会输出什么？' : '这段代码的 bug 是什么？') + '</p>' +
    '<div class="game-opts">' +
    q.opts.map(function(o, k){
      return '<button class="game-opt" data-k="' + k + '">' + escHtml(o) + '</button>';
    }).join('') + '</div><div class="game-why" id="gameWhy"></div>';
  el.innerHTML = h;
  el.querySelectorAll('.game-opt').forEach(function(b){
    b.addEventListener('click', function(){ answer(+b.getAttribute('data-k')); });
  });
}

/* ---- 排序代码模式 ---- */
function renderOrder(){
  var q = G.qs[G.i], total = G.qs.length;
  G.pool = shuffle(q.lines.map(function(_, k){ return k; }));
  G.picked = [];
  var el = document.getElementById('gameBox');
  el.innerHTML =
    '<div class="game-meta"><span>第 ' + (G.i+1) + ' / ' + total + ' 题</span>' +
    '<span>得分 <b id="gScore">' + G.score + '</b></span>' +
    '<span>最高 ' + G.best + '</span></div>' +
    '<div class="game-prog"><i style="width:' + Math.round(G.i/total*100) + '%"></i></div>' +
    '<p class="game-q">把代码行按正确顺序排好 <span style="color:#8b949e;font-weight:400">（' + escHtml(q.hint) + '）</span></p>' +
    '<div class="game-opts" id="orderPool"></div>' +
    '<p class="game-q" style="margin-top:14px">你的答案：</p>' +
    '<div class="game-opts" id="orderAns"><div class="order-empty">点上面的代码行，它们会按顺序排到这里</div></div>' +
    '<div class="game-why" id="gameWhy"></div>' +
    '<button class="btn" id="orderCheck" style="margin-top:12px">检查答案</button>';
  drawOrder();
  document.getElementById('orderCheck').addEventListener('click', checkOrder);
}

function drawOrder(){
  var q = G.qs[G.i];
  var pool = document.getElementById('orderPool');
  pool.innerHTML = '';
  G.pool.forEach(function(k){
    var b = document.createElement('button');
    b.className = 'game-opt'; b.textContent = q.lines[k] || '（空行）';
    b.addEventListener('click', function(){ G.picked.push(k); G.pool.splice(G.pool.indexOf(k), 1); drawOrder(); });
    pool.appendChild(b);
  });
  var ans = document.getElementById('orderAns');
  ans.innerHTML = '';
  if(!G.picked.length){
    ans.innerHTML = '<div class="order-empty">点上面的代码行，它们会按顺序排到这里</div>';
  }
  G.picked.forEach(function(k){
    var b = document.createElement('button');
    b.className = 'game-opt picked'; b.textContent = q.lines[k] || '（空行）';
    b.addEventListener('click', function(){ G.pool.push(k); G.picked.splice(G.picked.indexOf(k), 1); drawOrder(); });
    ans.appendChild(b);
  });
}

function checkOrder(){
  var q = G.qs[G.i];
  var correct = q.lines.map(function(_, k){ return k; });
  var ok = G.picked.length === correct.length &&
           G.picked.every(function(k, i){ return k === correct[i]; });
  var whyEl = document.getElementById('gameWhy');
  if(ok){
    G.score += 20; G.correct++;
    document.getElementById('gScore').textContent = G.score;
    whyEl.innerHTML = '<div class="why-ok">✅ 顺序正确！+20 分</div>';
  } else {
    whyEl.innerHTML = '<div class="why-no">❌ 顺序不对</div><p>正确顺序：</p>' +
      '<pre class="game-code">' + escHtml(q.lines.filter(function(l){ return l !== ''; }).join('\n')) + '</pre>';
  }
  whyEl.innerHTML += '<button class="btn" id="nextBtn" style="margin-top:10px">' +
    (G.i + 1 < G.qs.length ? '下一题 →' : '看成绩 →') + '</button>';
  document.getElementById('nextBtn').addEventListener('click', next);
  document.getElementById('orderCheck').disabled = true;
}

function escHtml(s){
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function answer(k){
  if(G.answered) return;
  G.answered = true;
  var q = G.qs[G.i], ok = (k === q.ans);
  var btns = document.getElementById('gameBox').querySelectorAll('.game-opt');
  btns[q.ans].classList.add('right');
  if(ok){
    G.score += pointsFor(G.streak + 1);
    G.streak++; G.correct++;
    document.getElementById('gScore').textContent = G.score;
  } else {
    btns[k].classList.add('wrong');
    G.streak = 0;
  }
  btns.forEach(function(b){ b.disabled = true; });
  document.getElementById('gameWhy').innerHTML =
    '<div class="' + (ok ? 'why-ok' : 'why-no') + '">' + (ok ? '✅ 答对了！' : '❌ 答错了') +
    '</div><p>' + escHtml(q.why) + '</p>' +
    '<button class="btn" id="nextBtn">' + (G.i + 1 < G.qs.length ? '下一题 →' : '看成绩 →') + '</button>';
  document.getElementById('nextBtn').addEventListener('click', next);
}

function next(){
  G.i++; G.answered = false;
  if(G.i < G.qs.length) render();
  else finish();
}

function finish(){
  var total = G.qs.length, acc = Math.round(G.correct / total * 100);
  var isBest = G.score > G.best;
  if(isBest){ G.best = G.score; localStorage.setItem('codelab_game_best', String(G.best)); }
  var perfect = (G.correct === total);
  var el = document.getElementById('gameBox');
  var medal = acc === 100 ? '🏆' : acc >= 70 ? '🥈' : acc >= 40 ? '🥉' : '💪';
  el.innerHTML = '<div class="game-end"><div class="game-medal">' + medal + '</div>' +
    '<h3>' + MODES[G.mode].name + '完成！</h3>' +
    '<p>答对 ' + G.correct + ' / ' + total + '（' + acc + '%）</p>' +
    '<p>本局得分 <b>' + G.score + '</b>' + (isBest ? ' <span class="newbest">🎉 新纪录！</span>' : '（最高 ' + G.best + '）') + '</p>' +
    '<div class="cta-row"><button class="btn" id="againBtn">再来一局</button>' +
    '<button class="btn ghost" id="switchBtn">换' + (G.mode === 'guess' ? '找Bug' : '猜输出') + '</button></div></div>';
  document.getElementById('againBtn').addEventListener('click', function(){ newGame(G.mode); });
  var others = { guess: ['bug', '找Bug'], bug: ['order', '排序代码'], order: ['guess', '猜输出'] };
  var sw = others[G.mode];
  document.getElementById('switchBtn').textContent = '换' + sw[1];
  document.getElementById('switchBtn').addEventListener('click', function(){ newGame(sw[0]); setTab(); });
  if(window.Achv){
    if(G.score >= 100) window.Achv.grant('game-master');
    if(perfect) window.Achv.grant('game-perfect');
  }
}

function setTab(){
  document.querySelectorAll('.game-tab').forEach(function(t){
    t.classList.toggle('on', t.getAttribute('data-m') === G.mode);
  });
}

function init(){
  document.querySelectorAll('.game-tab').forEach(function(t){
    t.addEventListener('click', function(){ newGame(t.getAttribute('data-m')); setTab(); });
  });
  newGame('guess'); setTab();
}

window.Game = { init: init, newGame: newGame, pointsFor: pointsFor,
                guessCount: GUESS.length, bugCount: BUG.length, orderCount: ORDER.length,
                getState: function(){ return G; } };
})();
