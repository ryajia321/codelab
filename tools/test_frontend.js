// CodeLab 前端测试：node tools/test_frontend.js（在 codelab-site 目录下执行）
const fs = require('fs'), vm = require('vm'), path = require('path');
const site = path.dirname(__dirname);
let p = 0, f = 0;
const eq = (n, g, w) => { const ok = JSON.stringify(g) === JSON.stringify(w); ok ? p++ : f++; console.log((ok ? 'PASS ' : 'FAIL ') + n + (ok ? '' : ' got=' + JSON.stringify(g))); };
// ---- 数据 ----
global.window = {};
vm.runInContext(fs.readFileSync(site + '/data/tutorials.js', 'utf8'), vm.createContext(global));
const TS = global.window.TUTORIALS;
const t = TS[0];
eq('教程1有7步', t.steps.length, 7);
eq('步骤2有Windows代码块', !!t.steps[1].code2, true);
eq('展示代码==实测文件', t.steps[2].code.text === fs.readFileSync(site + '/tutorials/python-organize-files/organize.py', 'utf8'), true);
eq('教程3有7步', TS[2].steps.length, 7);
eq('教程3步骤2有Windows代码块', !!TS[2].steps[1].code2, true);
eq('教程3清理脚本==实测文件', TS[2].steps[2].code.text === fs.readFileSync(site + '/tutorials/python-clean-excel/clean_excel.py', 'utf8'), true);
eq('教程3生成脚本==实测文件', TS[2].steps[1].code3.text === fs.readFileSync(site + '/tutorials/python-clean-excel/make_dirty_samples.py', 'utf8'), true);
eq('教程3含--check', TS[2].steps[3].code.text.includes('--check'), true);
eq('教程3说明公式拒绝', TS[2].steps[2].body.includes('无法可靠地保留公式'), true);
eq('教程3说明时间拒绝', TS[2].steps[2].body.includes('绝不静默截断'), true);
eq('教程3有公式报错条目', TS[2].errors.some(e => e.t.includes('公式')), true);
eq('教程3生成器不覆盖说明', TS[2].steps[1].body.includes('不覆盖'), true);
eq('教程3验收清单9项', TS[2].checklist.length, 9);
// ---- app.js 沙箱 ----
const mkEl = () => ({ style: {}, textContent: '', innerHTML: '', value: '',
  setAttribute() {}, focus() {}, select() {}, setSelectionRange() {}, remove() {},
  appendChild() {}, addEventListener() {}, querySelector() { return mkEl(); } });
const store = {};
const sb = { console, setTimeout,
  localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } },
  navigator: {}, window: {},
  document: { addEventListener() {}, createElement: () => mkEl(), body: mkEl(), execCommand: () => true } };
sb.window = sb; vm.createContext(sb);
vm.runInContext(fs.readFileSync(site + '/assets/app.js', 'utf8'), sb);
// ---- 消毒器 ----
const S = vm.runInContext('sanitizeHTML', sb);
eq('保留合法格式', S('<p>你好</p><code>ls</code>'), '<p>你好</p><code>ls</code>');
eq('保留note/tip', S('<div class="tip"><b>提示</b></div>'), '<div class="tip"><b>提示</b></div>');
eq('保留站内链接', S('<a href="errors.html">报错</a>'), '<a href="errors.html">报错</a>');
eq('干掉script', S('<script>alert(1)</script>'), 'alert(1)');
eq('干掉img+onerror', S('<img src=x onerror=alert(1)>'), '');
eq('干掉javascript:链接', S('<a href="javascript:alert(1)">点我</a>'), '<a>点我</a>');
eq('干掉事件属性', S('<p onclick="alert(1)">x</p>'), '<p>x</p>');
eq('干掉非法class', S('<div class="evil">x</div>'), '<div>x</div>');
eq('干掉iframe', S('<iframe src="http://x"></iframe>'), '');
eq('大小写混淆', S('<ScRiPt>alert(1)</ScRiPt>'), 'alert(1)');
eq('data:协议', S('<a href="data:text/html,<script>alert(1)</script>">x</a>'), '<a>x</a>');
// ---- 进度 ----
vm.runInContext(`progSet('t1', 0, true)`, sb);
eq('progSet成功返回true', vm.runInContext(`progSet('t1', 1, true)`, sb), true);
eq('计数', vm.runInContext(`progCount('t1', 7)`, sb), 2);
sb.localStorage.setItem = () => { throw new Error('denied'); };
eq('存储失败返回false', vm.runInContext(`progSet('t1', 2, true)`, sb), false);
// ---- 复制降级：完整代码 ----
let shownCode = null;
const sb2 = { console, setTimeout, navigator: {}, window: {},
  document: { addEventListener() {}, createElement: () => { const e = mkEl(); e.querySelector = () => mkEl(); return e; }, body: mkEl(), execCommand: () => false } };
sb2.window = sb2; vm.createContext(sb2);
vm.runInContext(fs.readFileSync(site + '/assets/app.js', 'utf8'), sb2);
const longCode = 'x'.repeat(5000);
const btn = { textContent: '复制', closest: () => ({ querySelector: () => ({ innerText: longCode }) }) };
let captured = null;
vm.runInContext(`(function(){ var orig = window.manualCopyFallback; window.manualCopyFallback = function(c){ globalThis.__cap = c; }; })()`, sb2);
sb2.__btn = btn;
vm.runInContext(`copyCode(__btn).then(()=>{ globalThis.__done = __btn.textContent; })`, sb2);
setTimeout(() => {
  eq('降级拿到完整5000字', typeof sb2.__cap === 'string' && sb2.__cap.length === 5000, true);
  console.log('\n==== 共 ' + p + ' 通过, ' + f + ' 失败 ====');
  process.exit(f ? 1 : 0);
}, 300);
