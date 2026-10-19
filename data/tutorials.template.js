/* CodeLab 教程数据模板。用 tools/build.py 生成 data/tutorials.js（不要手改生成文件）。
   教程 1 的代码由构建脚本从 tutorials/python-organize-files/organize.py 注入，保证逐字一致。 */
window.TUTORIALS = [
{
id: "python-organize-files",
title: "用 Python 自动整理文件",
category: "Python 入门",
level: "零基础",
minutes: 60,
summary: "写一个真正能用的文件整理脚本：默认只预览，确认后才移动；同名不覆盖、不删文件、重复运行也安全。",
goals: [
"用 Python 读写文件夹、判断文件类型",
"理解「预览 → 确认 → 执行」的安全习惯",
"独立运行一个带命令行参数的小脚本",
"读懂报错信息并自己排查"
],
env: [
"电脑上装了 Python 3（任意 3.8 以上版本都行）",
"会打开终端：Mac 叫「终端」，Linux 用系统终端，Windows 用 PowerShell",
"支持的操作系统：macOS / Linux / Windows 10+（PowerShell）。Windows 用户看每一步里的 PowerShell 说明",
"本篇只用 Python 自带功能，不用安装任何第三方库"
],
steps: [
{
title: "检查 Python 装好了没",
body: "<p>先确认电脑上有 Python。打开终端，输入下面这行命令后按回车：</p><div class=\"note\"><b>Windows 用户注意：</b>先试 <code>py --version</code>（Windows 专用的 Python 启动器）。如果 <code>py</code> 也不认识，再试 <code>python --version</code>。下面教程里凡是写 <code>python3</code> 的地方，Windows 请换成 <code>py</code>。</div>",
code: { lang: "bash", label: "终端（Mac/Linux）", text: "python3 --version" },
expected: "看到类似 <code>Python 3.11.4</code> 的版本号就是成功。如果提示 command not found，去 <a href=\"errors.html\">报错排查</a> 看第一条。"
},
{
title: "建一个演示文件夹（别拿真实文件夹练手）",
body: "<p>安全第一：<b>绝不在「下载」「桌面」等真实文件夹里做实验</b>。我们在主目录下建一个专门的演示文件夹，里面放几个假文件：</p>",
code: { lang: "bash", label: "终端（Mac/Linux）", text: "mkdir -p ~/file-demo\ncd ~/file-demo\ntouch 假期照片.jpg 工作报告.pdf 演示视频.mp4 备忘.txt 旧笔记.md 神秘文件.xyz\nls" },
expected: "终端列出 6 个文件名。下面是同样的操作，用 PowerShell 一行行执行：",
code2: { lang: "powershell", label: "PowerShell（Windows）", text: "mkdir ~/file-demo\ncd ~/file-demo\nni 假期照片.jpg\nni 工作报告.pdf\nni 演示视频.mp4\nni 备忘.txt\nni 旧笔记.md\nni 神秘文件.xyz\ndir" },
expected2: "<code>dir</code> 列出 6 个文件。注意 PowerShell 里 <code>ni</code> 是新建文件，<code>dir</code> 是看目录。"
},
{
title: "写整理脚本 organize.py",
body: "<p>在 <code>~/file-demo</code> 里新建文件 <code>organize.py</code>，把下面完整代码粘贴进去保存。先不用全看懂，重点看文件头注释里的安全策略（默认预览、符号链接跳过、同名不覆盖等）：</p><div class=\"tip\"><b>设计思路：</b>先算出「搬运计划」（哪个文件去哪个文件夹），打印出来给你看；你确认没问题，加 <code>--apply</code> 才真正搬。目标已有同名文件就跳过，永远不覆盖、不删除。</div>",
code: { lang: "python", label: "organize.py（完整代码，已实测）", text: __ORGANIZE_PY__ },
expected: "文件保存成功。Mac/Linux 执行 <code>ls ~/file-demo</code>、Windows 执行 <code>dir ~/file-demo</code>，能看到 <code>organize.py</code>。"
},
{
title: "先预览，不直接动手",
body: "<p>进到演示文件夹，只预览（不加 <code>--apply</code>）：</p>",
code: { lang: "bash", label: "终端（Mac/Linux）", text: "cd ~/file-demo\npython3 organize.py ." },
expected: "看到「【预览模式】没有移动任何文件」和搬运计划：5 个文件计划移动（图片/文档/视频），<code>神秘文件.xyz</code> 因未知类型被跳过。注意：这一步你的文件<b>一个都没动</b>，可以用 <code>ls</code>（Windows 用 <code>dir</code>）验证。Windows 命令是 <code>py organize.py .</code>。"
},
{
title: "确认无误，真正执行",
body: "<p>看过预览，计划没问题，再加 <code>--apply</code> 执行：</p>",
code: { lang: "bash", label: "终端", text: "python3 organize.py . --apply" },
expected: "看到「执行完毕：成功 5 个，失败 0 个」。再看目录：顶层只剩 <code>organize.py</code> 和 <code>神秘文件.xyz</code>，多了 <code>图片/</code><code>文档/</code><code>视频/</code> 三个文件夹。（Windows 把 <code>python3</code> 换成 <code>py</code>。）"
},
{
title: "验证结果 + 重复运行",
body: "<p>检查整理结果，然后故意再运行一次，看脚本是否足够「老实」：</p>",
code: { lang: "bash", label: "终端（Mac/Linux）", text: "find . -type f | sort\npython3 organize.py . --apply" },
expected: "第一次 <code>find</code> 显示文件都进了对应文件夹。第二次运行显示「计划移动 0 个文件」——已经整理好的状态下脚本什么都不做，重复运行是安全的。Windows 用 <code>Get-ChildItem -Recurse | Select-Object FullName</code> 代替 <code>find</code>。"
},
{
title: "安全验证：亲手制造三种边界情况",
body: "<p>教程不会只让你看热闹。下面三组操作请<b>亲自执行</b>，验证脚本的安全策略是真的：</p>",
code: { lang: "bash", label: "终端（Mac/Linux）", text: "cd ~/file-demo\n# 1) 隐藏文件 + 子目录：应该原地不动\ntouch .藏起来的文件\nmkdir -p 子目录 && touch 子目录/里面的.txt\n# 2) 同名冲突：目标已有同名文件，必须跳过不覆盖\ntouch 临时.txt\nmkdir -p 文档 && echo \"别覆盖我\" > 文档/临时.txt\n# 3) 符号链接：默认跳过不跟随\nln -s 临时.txt 替身链接\nln -s 根本不存在 坏掉的链接\npython3 organize.py ." },
expected: "预览输出里应该同时看到：<code>.藏起来的文件</code>（隐藏文件，保留原地）、<code>临时.txt</code>（目标已存在，跳过）、<code>替身链接</code>和<code>坏掉的链接</code>（符号链接，默认跳过）。子目录里的 <code>里面的.txt</code> 根本不会出现在计划里。Windows 用户：符号链接测试需要管理员权限的 PowerShell（<code>New-Item -ItemType SymbolicLink</code>），跳过第 3 组不影响。",
code2: { lang: "powershell", label: "PowerShell（Windows，第1-2组）", text: "cd ~/file-demo\nni .藏起来的文件\nmkdir 子目录; ni 子目录/里面的.txt\nni 临时.txt\nmkdir 文档 -Force; \"别覆盖我\" > 文档/临时.txt\npy organize.py ." },
expected2: "同样能看到隐藏文件和同名冲突的跳过提示。验证完可以删掉这些实验文件：<code>rm 临时.txt; rm 文档/临时.txt</code>（Mac/Linux）或 PowerShell 的 <code>del</code>。"
}
],
errors: [
{ t: "python3: command not found", s: "终端不认识 python3 命令。", f: "Mac/Linux 先试 <code>python --version</code>；Windows 用 <code>py --version</code>。如果都不行，去 python.org 下载安装（Windows 安装时勾选 Add to PATH）。" },
{ t: "目录不存在：xxx", s: "给的路径写错了，或文件夹不在那。", f: "先 <code>cd ~/file-demo</code> 再用 <code>pwd</code>（Windows 用 <code>cd</code>）确认你在哪个目录，复制完整路径再试。" },
{ t: "拒绝：只能整理用户主目录内的演示文件夹", s: "你把 ~ 或 / 当参数传进去了，或路径里有符号链接绕到了外面。", f: "这是脚本的安全锁，故意的。只整理你建的演示文件夹，用真实路径（不用链接）。" },
{ t: "PermissionError / 没有权限", s: "文件正被别的程序占用，或你对该目录没有写权限。", f: "关掉占用文件的程序；不要拿系统目录做实验。" },
{ t: "中文显示乱码（Windows）", s: "CMD 默认编码不是 UTF-8。", f: "终端先执行 <code>chcp 65001</code> 切换到 UTF-8，再运行脚本。建议直接用 PowerShell。" }
],
checklist: [
"【预览模式】操作：<code>python3 organize.py .</code>（不加 --apply）。预期：打印搬运计划，<code>ls</code> 确认一个文件都没动。",
"【执行模式】操作：加 <code>--apply</code> 再跑一次。预期：「执行完毕：成功 5 个，失败 0 个」，文件进了 图片/文档/视频。",
"【同名不覆盖】操作：第 7 步造一个 <code>文档/临时.txt</code> 冲突再预览。预期：<code>临时.txt</code> 显示跳过，<code>文档/临时.txt</code> 内容还是「别覆盖我」。",
"【重复运行安全】操作：整理完后再跑一次 <code>--apply</code>。预期：「计划移动 0 个文件」，什么都不发生。",
"【隐藏/未知/子目录不动】操作：第 7 步的 <code>.藏起来的文件</code>、<code>神秘文件.xyz</code>、<code>子目录/里面的.txt</code>。预期：都在原地，计划里不出现子目录内容。",
"【符号链接跳过】操作：第 7 步的 <code>替身链接</code> 和 <code>坏掉的链接</code>。预期：都显示「符号链接，默认跳过」，链接本身还在。",
"【说出 --apply 的作用】能用自己的话说出：不加只预览，加了才真正移动。"
],
exercises: [
"给 RULES 加一条：<code>\".epub\": \"电子书\"</code>，新建一个测试文件重跑，验证它进了「电子书」文件夹。",
"新建第二个演示文件夹，只放 3 个不同类型的文件，用脚本整理它。",
"故意在「文档」文件夹里预置一个同名文件，再跑一次，观察跳过提示。"
]
}
];
