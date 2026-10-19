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
,
{
"id": "python-clean-excel",
"title": "用 Python 自动清理 Excel 数据",
"category": "Python 入门",
"level": "零基础",
"minutes": 60,
"summary": "给一份脏兮兮的订单表做「体检+手术」：先看检查报告（三档模式），再一键修正格式、删除空白行，重复的行只标记不乱删，原始文件一个字节都不动。",
"goals": [
"用 openpyxl 精确读写 Excel 单元格（含真实日期格与文本的区别）",
"理解「先判定后清洗」：重复判定看原始值+类型，不许先规范化再判",
"掌握三档模式：--check 预览、默认执行、--deduplicate-exact 显式去重",
"独立核对清理结果：行数、修正数、警告数对不对，原始文件动没动"
],
"env": [
"电脑上装了 Python 3（第一篇教程的环境就行）",
"会打开终端（Mac/Linux）或 PowerShell（Windows）",
"支持的操作系统：macOS / Linux / Windows 10+（PowerShell）。Windows 用户：教程里凡是写 <code>python3</code> 的地方换成 <code>py</code>，<code>pip install</code> 换成 <code>py -m pip install</code>",
"只支持 .xlsx 格式（现在 Excel/WPS 默认存的就是这个）",
"不用安装 Office 或 WPS 也能跑"
],
"steps": [
{
"title": "确认依赖：openpyxl",
"body": "<p>本篇读写 Excel 只用 <code>openpyxl</code>（第二篇装过就不用重装）。为什么不用 pandas？因为 pandas 读 Excel 时会「自作主张」改类型（比如把文本数字转成数字），而重复判定必须看 Excel 里<strong>原始的单元格类型</strong>——数字 10 和文本 \"10\" 看着一样，类型不同就不能算重复。</p>",
"code": {
"lang": "bash",
"label": "终端（Mac/Linux）",
"text": "python3 -c \"import openpyxl; print('依赖就绪')\""
},
"expected": "看到 <code>依赖就绪</code> 就是成功。",
"code2": {
"lang": "powershell",
"label": "PowerShell（Windows）",
"text": "py -c \"import openpyxl; print('依赖就绪')\""
},
"expected2": "如果报错 ModuleNotFoundError，运行 <code>py -m pip install openpyxl</code> 再试。"
},
{
"title": "生成 12 行脏数据",
"body": "<p>先造一份「脏订单表」练手：12 行虚构数据，埋了 5 类常见脏数据。注意第 2 行和第 5 行——它们逐格<strong>同值同类型</strong>（日期都是真正的日期格），是真重复；第 3 行和第 12 行订单号相同但内容不同，是疑似重复，脚本永远不会自动删它们。</p><p>先建演示目录，再运行生成程序：</p><div class=\"tip\"><b>注意：</b>生成程序默认<strong>不覆盖</strong>已存在的 <code>脏订单.xlsx</code>（防止盖掉你的真实文件）。想重新生成示例，先确认再加 <code>--force</code>。</div>",
"code": {
"lang": "bash",
"label": "终端（Mac/Linux）",
"text": "mkdir -p ~/excel-clean-demo\npython3 make_dirty_samples.py ~/excel-clean-demo"
},
"expected": "终端显示「已生成 脏订单.xlsx（12 行数据，全部虚构）」，<code>~/excel-clean-demo/输入/</code> 下出现 <code>脏订单.xlsx</code>。",
"code2": {
"lang": "powershell",
"label": "PowerShell（Windows）",
"text": "New-Item -ItemType Directory -Force -Path \"$HOME\\excel-clean-demo\" | Out-Null\npy make_dirty_samples.py \"$HOME\\excel-clean-demo\""
},
"expected2": "同上。用资源管理器打开 <code>输入</code> 文件夹能看到 <code>脏订单.xlsx</code>。",
"code3": {
"lang": "python",
"label": "make_dirty_samples.py",
"text": __MAKE_DIRTY_PY__
}
},
{
"title": "写清理脚本 clean_excel.py",
"body": "<p>把下面的代码保存为 <code>clean_excel.py</code>。先看懂它的安全策略（这也是本篇的核心）：</p><p>① <strong>三档模式</strong>：<code>--check</code> 只看报告不写任何文件；默认模式只修正格子、删空白行，<strong>不删任何含数据的行</strong>；<code>--deduplicate-exact</code> 才显式删除整行完全相同的重复。<br>② <strong>重复判定看原始快照</strong>：用 openpyxl 直接读单元格的值+类型，判定发生在清洗之前，禁止先规范化再判。类型不同不算重复（数字 10 和文本 \"10\"）。<br>③ <strong>原始文件只读</strong>：输出写到 <code>输出/</code> 目录，默认拒绝覆盖（原子创建），输出不能等于输入，<code>--force</code> 也拦不住；<code>--output</code> 只支持 <code>.xlsx</code>。<br>④ <strong>符号链接一律拒绝</strong>：输出目标本身是链接、<code>输入/</code>/<code>输出/</code> 目录本身是链接，都直接拒绝。<br>⑤ <strong>支持范围先讲清楚</strong>：含<strong>公式</strong>的表直接拒绝（无法可靠地保留公式，绝不静默丢弃）；带<strong>时间部分</strong>（时分秒）的日期直接拒绝（绝不静默截断）；金额/数量只按严格格式转换，拿不准的一律保留原文+警告。</p>",
"code": {
"lang": "python",
"label": "clean_excel.py",
"text": __CLEAN_EXCEL_PY__
},
"expected": "文件保存成功，待会儿直接运行。"
},
{
"title": "先检查：--check 看体检报告",
"body": "<p>动手前先看「体检报告」。<code>--check</code> 是严格零写入的：不创建输出目录、不写临时文件，只在终端显示报告。你可以验证——跑完后 <code>输出/</code> 目录根本不存在：</p>",
"code": {
"lang": "bash",
"label": "终端（Mac/Linux）",
"text": "python3 clean_excel.py ~/excel-clean-demo --check"
},
"expected": "报告显示：原始数据行数 12，自动修正 4 格，删除 1 行（空白行），警告 4 条；重复组 G1（第 2、5 行）标记未删除；订单号 A002 疑似重复，保留两条。",
"code2": {
"lang": "powershell",
"label": "PowerShell（Windows）",
"text": "py clean_excel.py \"$HOME\\excel-clean-demo\" --check"
},
"expected2": "同上。"
},
{
"title": "执行清理并核对结果",
"body": "<p>不加参数就是默认执行。跑完后做三件事核对：①报告里的四个数字（12 / 4 / 1 / 4）；②打开 <code>输出/清理后.xlsx</code> 抽查：<code>¥450</code> 变成了 450，<code>3件</code> 变成了 3，订单号 <code>00012</code> 的前导零还在，<code>待定</code> 和 <code>10/07</code> 原样保留；③确认原始文件没被动过（对比修改时间，或重新跑一遍 <code>--check</code> 结果一致）。</p><div class=\"tip\"><b>提示：</b>报告文件叫 <code>清理后_报告.txt</code>，名字跟着输出文件名走——你用 <code>--output</code> 换名，报告也会跟着换名。</div>",
"code": {
"lang": "bash",
"label": "终端（Mac/Linux）",
"text": "python3 clean_excel.py ~/excel-clean-demo"
},
"expected": "<code>输出/</code> 下出现 <code>清理后.xlsx</code>（11 行数据）和 <code>清理后_报告.txt</code>。再跑一次会看到「输出文件已存在，拒绝覆盖」——这是保护，不是报错。",
"code2": {
"lang": "powershell",
"label": "PowerShell（Windows）",
"text": "py clean_excel.py \"$HOME\\excel-clean-demo\""
},
"expected2": "同上。"
},
{
"title": "理解去重：什么才算「完全相同」",
"body": "<p>默认模式下，第 2 行和第 5 行只是被<strong>标记</strong>，没有被删除——因为删数据行的决定权在你手里。只有当你看过报告、确认它们真是重复时，才显式加 <code>--deduplicate-exact</code>。注意这次输出文件名换了（<code>去重版.xlsx</code>），并且因为报告文件已存在，需要加 <code>--force</code> 才能覆盖：</p><p>记住两条铁律：① <strong>类型不同不算重复</strong>——数字 10 和文本 \"10\" 看着一样，但原始类型不同，两行都保留；② <strong>订单号相同但内容不同，永远保留并警告</strong>，脚本不会替你删。</p>",
"code": {
"lang": "bash",
"label": "终端（Mac/Linux）",
"text": "python3 clean_excel.py ~/excel-clean-demo --deduplicate-exact --output 去重版.xlsx --force"
},
"expected": "报告显示删除 2 行（空白行 + 第 5 行），<code>去重版.xlsx</code> 剩 10 行数据。对比 <code>清理后.xlsx</code>（11 行），少的那行正是第 5 行。",
"code2": {
"lang": "powershell",
"label": "PowerShell（Windows）",
"text": "py clean_excel.py \"$HOME\\excel-clean-demo\" --deduplicate-exact --output 去重版.xlsx --force"
},
"expected2": "同上。"
},
{
"title": "验收：说出每一步在保护什么",
"body": "<p>最后做一遍完整流程，确认你理解了每个保护动作：<code>--check</code>（零写入预览）→ 默认执行（核对 4 个数字）→ 检查输出文件 → 确认原始文件未动。能说出下面三个问题的答案，这篇就算真正掌握了：</p>",
"code": {
"lang": "bash",
"label": "终端（Mac/Linux）",
"text": "python3 clean_excel.py ~/excel-clean-demo --check | head -8"
},
"expected": "能用自己的话说出：① 为什么默认模式不删重复行；② 数字 10 和文本 \"10\" 为什么不算重复；③ 输出已存在时脚本为什么拒绝覆盖。",
"code2": {
"lang": "powershell",
"label": "PowerShell（Windows）",
"text": "py clean_excel.py \"$HOME\\excel-clean-demo\" --check"
},
"expected2": "同上。"
}
],
"errors": [
{
"t": "ModuleNotFoundError: No module named 'openpyxl'",
"s": "依赖没装上，或装到了另一个 Python 里。",
"f": "运行 <code>pip install openpyxl</code>（Windows 用 <code>py -m pip install openpyxl</code>），再跑 <code>python3 -c \"import openpyxl\"</code> 验证。"
},
{
"t": "输入文件不存在",
"s": "演示目录下没有 <code>输入/脏订单.xlsx</code>。",
"f": "先跑第 2 步的 <code>make_dirty_samples.py</code> 生成示例；如果是自己的表，用 <code>--input 你的文件名.xlsx</code> 指定（文件要放在演示目录的 <code>输入/</code> 下）。"
},
{
"t": "表格没有数据行",
"s": "Excel 里只有表头，没有数据。",
"f": "检查文件是不是选错了，或者表头行是不是空行开头。"
},
{
"t": "缺少必要列",
"s": "表的列名和脚本要的不一样。",
"f": "脚本要求 6 列：订单号、客户、商品、数量、金额、下单日期。把列名改成一致再跑。"
},
{
"t": "输出文件已存在，拒绝覆盖",
"s": "这不是报错，是脚本在保护你：防止新结果盖掉旧结果。",
"f": "确认旧输出不要了就加 <code>--force</code>；想保留旧的就用 <code>--output 新名字.xlsx</code> 换名。"
},
{
"t": "检测到公式单元格",
"s": "表里有公式。脚本无法可靠地保留公式，所以直接拒绝，不会静默把公式变成数值。",
"f": "在 Excel/WPS 里把公式计算结果「粘贴为数值」后，再跑脚本。"
},
{
"t": "检测到带时间部分的日期时间",
"s": "某格日期带时分秒。脚本不会静默截断时间，所以直接拒绝。",
"f": "确认时间部分不需要，改成纯日期后再跑；时间重要的话，这个版本处理不了。"
},
{
"t": "--output 只支持 .xlsx 文件",
"s": "输出文件名用了别的扩展名（如 .csv）。",
"f": "改成 <code>.xlsx</code> 后缀再跑。"
},
{
"t": "（生成器）目标文件已存在，不覆盖",
"s": "生成程序默认不覆盖已存在的 <code>脏订单.xlsx</code>，防止盖掉你的真实文件。",
"f": "确认要重新生成示例，就加 <code>--force</code>。"
}
],
"checklist": [
"【依赖】操作：<code>python3 -c \"import openpyxl\"</code>。预期：不报错，打印依赖就绪。",
"【生成示例】操作：运行 <code>make_dirty_samples.py ~/excel-clean-demo</code>。预期：<code>输入/脏订单.xlsx</code> 生成，12 行虚构数据。",
"【检查模式】操作：<code>python3 clean_excel.py ~/excel-clean-demo --check</code>。预期：报告显示 12 / 4 / 1 / 4；<code>输出/</code> 目录不存在（零写入）。",
"【默认执行】操作：<code>python3 clean_excel.py ~/excel-clean-demo</code>。预期：<code>输出/清理后.xlsx</code> 11 行数据，<code>清理后_报告.txt</code> 生成；再跑一次被拒绝覆盖。",
"【结果核对】操作：打开输出文件抽查。预期：<code>¥450</code>→450、<code>3件</code>→3、前导零 <code>00012</code> 保留、<code>待定</code>/<code>10/07</code> 原样保留并有警告。",
"【显式去重】操作：<code>--deduplicate-exact --output 去重版.xlsx --force</code>。预期：删除 2 行剩 10 行；A002 的两行始终保留。",
"【支持范围】操作：在表里加一个公式（如 <code>=B2*1</code>）再跑。预期：脚本拒绝并提示「检测到公式单元格」，原始文件未动、没有新输出。",
"【生成器保护】操作：不删除 <code>输入/脏订单.xlsx</code> 直接重跑 <code>make_dirty_samples.py</code>。预期：提示「目标文件已存在，不覆盖」，文件字节不变。",
"【说出原理】能用自己的话说出：为什么重复判定要看原始类型、默认模式为什么不删行、数字 10 和文本 \"10\" 为什么不算重复。"
],
"exercises": [
"把 <code>make_dirty_samples.py</code> 里第 8 行的客户改成你自己的名字重跑，观察 strip 逻辑对没有空格的名字做了什么（修正数应该不变）。",
"故意在 <code>输入/</code> 里放一个缺少「金额」列的表，运行看脚本报什么，再把列补上。",
"试试 <code>--output x.csv</code>（扩展名不对）和 <code>--output /tmp/x.xlsx</code>（目录外），观察两种拒绝提示有什么不同；再试 <code>--check</code>，确认零写入。"
]
}
];
