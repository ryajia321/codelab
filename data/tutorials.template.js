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
},
{
"id": "python-merge-excel",
"title": "用 Python 汇总多个 Excel 表格",
"category": "Python 入门",
"level": "零基础",
"minutes": 60,
"summary": "把多个结构相同的 Excel 一键合并成一张总表：自动数行数、列名不对会报警、空文件坏文件自动跳过，原始文件一个都不动。",
"goals": [
"用 pip 安装第三方库（pandas / openpyxl）",
"用 Python 读取、合并、写出 Excel 文件",
"理解「先校验再合并」：列名不对、文件损坏时明确报告而不是静默错位",
"独立核对汇总结果：行数对不对、数据从哪来"
],
"env": [
"电脑上装了 Python 3（第一篇教程的环境就行）",
"会打开终端（Mac/Linux）或 PowerShell（Windows）",
"支持的操作系统：macOS / Linux / Windows 10+（PowerShell）。Windows 用户：教程里凡是写 <code>python3</code> 的地方换成 <code>py</code>，<code>pip install</code> 换成 <code>py -m pip install</code>",
"只支持 .xlsx 格式（现在 Excel/WPS 默认存的就是这个）。很老的 .xls 格式不支持，脚本会明确告诉你另存为 .xlsx",
"不用安装 Office 或 WPS 也能跑，读写 Excel 全靠 pandas"
],
"steps": [
{
"title": "安装依赖：pandas 和 openpyxl",
"body": "<p>Python 自带的功能读写不了 Excel，需要装两个第三方库：<code>pandas</code>（处理表格数据）和 <code>openpyxl</code>（读写 .xlsx 文件）。装一次，以后一直能用：</p>",
"code": {
"lang": "bash",
"label": "终端（Mac/Linux）",
"text": "pip install pandas openpyxl\npython3 -c \"import pandas, openpyxl; print('依赖就绪')\""
},
"expected": "看到 <code>依赖就绪</code> 就是成功。",
"code2": {
"lang": "powershell",
"label": "PowerShell（Windows）",
"text": "py -m pip install pandas openpyxl\npy -c \"import pandas, openpyxl; print('依赖就绪')\""
},
"expected2": "如果安装很慢或报错，看文末报错排查第 2 条（换国内镜像源）。"
},
{
"title": "建演示目录，一键生成示例文件",
"body": "<p>老规矩：<b>绝不拿真实表格练手</b>。建演示目录 <code>~/excel-demo</code>，然后新建 <code>make_samples.py</code>，粘贴下面代码——它会生成 3 个虚构的销售表示例（1月/2月/3月，各 2 行，全是假数据）：</p>",
"code": {
"lang": "python",
"label": "make_samples.py（生成示例数据，已实测）",
"text": __MAKE_SAMPLES_PY__
},
"expected": "文件保存成功。然后运行它生成示例：",
"code2": {
"lang": "bash",
"label": "终端（Mac/Linux）",
"text": "mkdir -p ~/excel-demo\ncd ~/excel-demo\npython3 make_samples.py ~/excel-demo\nls 输入/"
},
"expected2": "看到 <code>1月.xlsx 2月.xlsx 3月.xlsx</code> 和「共 6 行示例数据」。Windows 用 <code>py make_samples.py ~/excel-demo</code>，<code>ls</code> 换成 <code>dir 输入</code>。"
},
{
"title": "写汇总脚本 merge_excel.py",
"body": "<p>在 <code>~/excel-demo</code> 里新建 <code>merge_excel.py</code>，粘贴完整代码。先看文件头注释里的安全策略，再看懂核心逻辑：<b>逐个文件校验（列名/空文件/损坏/重复表头）→ 只合并通过的 → 写出总表并附带「来源文件」列</b>：</p><div class=\"tip\"><b>设计思路：</b>第一个成功读取的文件定下「标准列名」，后面每个文件都对照：列名不一样就跳过并告诉你期望列和实际列，绝不把错位的数据硬拼在一起。</div>",
"code": {
"lang": "python",
"label": "merge_excel.py（完整代码，已实测）",
"text": __MERGE_EXCEL_PY__
},
"expected": "文件保存成功。<code>ls ~/excel-demo</code>（Windows 用 <code>dir</code>）能看到两个 .py 文件和 <code>输入/</code> 文件夹。"
},
{
"title": "运行汇总",
"body": "<p>进到演示目录，运行脚本（参数就是演示目录本身，脚本自己会找里面的 <code>输入/</code> 文件夹）：</p>",
"code": {
"lang": "bash",
"label": "终端",
"text": "cd ~/excel-demo\npython3 merge_excel.py ~/excel-demo"
},
"expected": "看到「已读取：1月.xlsx（2 行）」「已读取：2月.xlsx（2 行）」「已读取：3月.xlsx（2 行）」，最后「合并文件数：3，数据总行数：6」和输出路径 <code>~/excel-demo/输出/汇总结果.xlsx</code>。（Windows 把 <code>python3</code> 换成 <code>py</code>。）"
},
{
"title": "核对结果：行数和内容",
"body": "<p>汇总完不能只看「成功」两个字就完事，亲手核对：</p>",
"code": {
"lang": "bash",
"label": "终端（Mac/Linux）",
"text": "python3 -c \"\nimport pandas as pd\ndf = pd.read_excel('输出/汇总结果.xlsx')\nprint('总行数：', len(df))\nprint('列名：', list(df.columns))\nprint(df[['商品','来源文件']].to_string(index=False))\n\""
},
"expected": "总行数 6，列是 <code>商品/数量/金额/来源文件</code>。「来源文件」列告诉你每一行来自哪个原始文件——这是核对数据内容的关键。也可以直接用 Excel/WPS 打开 <code>输出/汇总结果.xlsx</code> 肉眼检查。",
"code2": {
"lang": "powershell",
"label": "PowerShell（Windows）",
"text": "py -c \"import pandas as pd; df = pd.read_excel('输出/汇总结果.xlsx'); print('总行数：', len(df)); print('列名：', list(df.columns))\""
},
"expected2": "Windows 上引号嵌套容易出错，直接用 Excel/WPS 打开输出文件检查更省心。"
},
{
"title": "安全验证：亲手制造四种边界情况",
"body": "<p>下面 4 组操作请<b>亲自执行</b>，验证脚本的保护是真的（每条 <code>python3 -c</code> 里都是单引号，Windows 照抄只换 <code>py</code>）：</p>",
"code": {
"lang": "bash",
"label": "终端",
"text": "cd ~/excel-demo\n# 1) 列名不一致：把\"数量\"改成\"单价\"\npython3 -c \"import pandas as pd; pd.DataFrame([('苹果',9.9)], columns=['商品','单价']).to_excel('输入/列名不对.xlsx', index=False)\"\n# 2) 空文件：只有表头没有数据行\npython3 -c \"import pandas as pd; pd.DataFrame(columns=['商品','数量','金额']).to_excel('输入/空文件.xlsx', index=False)\"\n# 3) 损坏文件：假冒的 xlsx\n echo \"我是假的excel\" > 输入/坏文件.xlsx\n# 4) 重复表头：两个\"商品\"列\npython3 -c \"import pandas as pd; df=pd.DataFrame([[1,2,3]]); df.columns=['商品','商品','金额']; df.to_excel('输入/重复表头.xlsx', index=False)\"\n# 输出已存在，换个名字再跑\npython3 merge_excel.py ~/excel-demo --output 边界测试.xlsx"
},
"expected": "输出里 4 个文件各有一条明确的跳过原因：列名不对（还列出期望列和实际列）、空文件、损坏文件、重复表头。3 个正常文件照常合并。注意第 4 步已经生成过 <code>汇总结果.xlsx</code>，所以这里用 <code>--output 边界测试.xlsx</code> 换名——直接重跑会看到「输出文件已存在，拒绝覆盖」的保护提示，可以亲自试一次。"
},
{
"title": "验收：对照清单逐项打勾",
"body": "<p>全部完成后，对着下面的清单在教程页面上逐项勾选：</p>"
}
],
"errors": [
{
"t": "ModuleNotFoundError: No module named 'pandas'",
"s": "依赖没装上，或装到了另一个 Python 里。",
"f": "重跑安装命令。Windows 必须用 <code>py -m pip install pandas openpyxl</code>（<code>py -m pip</code> 保证装到 <code>py</code> 对应的 Python 里）；Mac/Linux 如果 <code>pip</code> 不认识，试 <code>python3 -m pip install pandas openpyxl</code>。"
},
{
"t": "pip install 很慢或报错",
"s": "默认从国外源下载，网络不好会超时。",
"f": "换国内镜像：<code>pip install pandas openpyxl -i https://pypi.tuna.tsinghua.edu.cn/simple</code>（Windows 前面加 <code>py -m</code>）。"
},
{
"t": "输入文件夹不存在",
"s": "演示目录下没有 输入/ 文件夹，或路径写错了。",
"f": "先 <code>cd ~/excel-demo</code> 确认位置，再 <code>mkdir 输入</code>（Windows PowerShell 同样可用 <code>mkdir</code>）。"
},
{
"t": "输出文件已存在，拒绝覆盖",
"s": "这不是报错，是保护机制在工作。",
"f": "换个名字：<code>python3 merge_excel.py ~/excel-demo --output 总表2.xlsx</code>；确认要覆盖旧结果才加 <code>--force</code>。"
},
{
"t": "旧格式 .xls 不支持",
"s": "文件是十几年前的老格式。",
"f": "用 Excel/WPS 打开该文件，另存为 .xlsx 格式后再汇总。"
},
{
"t": "某文件因列名不一致被跳过",
"s": "这不是报错，是脚本在保护你：硬拼会错位。",
"f": "打开被跳过的文件，把列名改成和其他文件完全一致（顺序也要一致），再跑一次。"
}
],
"checklist": [
"【依赖安装】操作：<code>pip install pandas openpyxl</code> 后运行 <code>python3 -c \"import pandas, openpyxl\"</code>。预期：不报错，打印依赖就绪。",
"【示例生成】操作：运行 <code>make_samples.py</code>。预期：<code>输入/</code> 下有 3 个 xlsx，共 6 行虚构数据。",
"【正常汇总】操作：<code>python3 merge_excel.py ~/excel-demo</code>。预期：「合并文件数：3，数据总行数：6」，<code>输出/汇总结果.xlsx</code> 生成。",
"【结果核对】操作：读出输出文件的行数、列名和「来源文件」列。预期：6 行，列为 商品/数量/金额/来源文件，每行能追溯来源。",
"【输出保护】操作：不加参数再跑一次。预期：看到「输出文件已存在，拒绝覆盖」，旧文件内容没变；<code>--output</code> 换名或 <code>--force</code> 后才能写出。",
"【边界保护】操作：第 6 步造 4 种问题文件再跑。预期：4 个各有明确跳过原因，正常文件照常合并，原始文件一个没被修改。",
"【说出原理】能用自己的话说出：为什么列名不一致不能硬拼，脚本是怎么保护你的。"
],
"exercises": [
"把示例改成你自己的场景：改 <code>make_samples.py</code> 里的列名和数据（比如换成「姓名/部门/工资」），重新生成并汇总。",
"故意把某个文件的列顺序打乱（比如把「金额」挪到第一列），运行看脚本报什么，再把它修正。",
"试试 <code>--output</code> 指定一个绝对路径（仍在演示目录内），观察脚本是否接受；再试一个演示目录外的路径，看拒绝提示。"
]
}
];
