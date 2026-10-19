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
code: { lang: "python", label: "organize.py（完整代码，已实测）", text: "#!/usr/bin/env python3\n# -*- coding: utf-8 -*-\n\"\"\"\n文件整理小助手 v1.1\n把演示文件夹里的文件按类型分到子文件夹。\n\n安全策略（保守默认）：\n  1. 默认只预览，不加 --apply 不动任何文件；\n  2. 只整理【指定演示文件夹】的顶层文件，不递归进子目录；\n  3. 不删除任何文件；目标已存在（含失效符号链接）时跳过，绝不覆盖；\n  4. 入口目录不能是符号链接；分类目标目录若是符号链接且指向允许范围外则跳过；\n  5. 来源符号链接默认跳过（不跟随）；\n  6. 拒绝整理系统根目录和用户主目录本身；目标必须位于用户主目录内\n     （经 realpath 真实解析后再判断，不只看字符串前缀）；\n  7. 执行时优先用硬链接的原子性避免覆盖（同文件系统），跨文件系统回退为\n     “复查 + 移动”，此时存在理论上的竞态窗口（见下）。\n\n已知限制（无法彻底消除，如实记录，不承诺绝对安全）：\n  - 预览与执行之间，若有其他程序恰好在目标位置创建同名文件，执行阶段会\n    重新检查并跳过，但检查与移动之间仍有极小的时间窗口；\n  - 跨文件系统移动时 shutil.move 实际是“复制 + 删除源”，中途断电可能留下\n    两份拷贝；本脚本不承诺跨文件系统的原子性；\n  - 硬链接方式要求源与目标在同一文件系统（演示目录内建子目录时天然满足）。\n\n用法：\n  python3 organize.py 演示文件夹的路径        # 只预览\n  python3 organize.py 演示文件夹的路径 --apply  # 真正执行移动\n\"\"\"\nimport argparse\nimport os\nimport shutil\nimport sys\n\n# 扩展名 -> 文件夹名（可按自己需求增删）\nRULES = {\n    \".jpg\": \"图片\", \".jpeg\": \"图片\", \".png\": \"图片\", \".gif\": \"图片\", \".webp\": \"图片\",\n    \".pdf\": \"文档\", \".docx\": \"文档\", \".doc\": \"文档\", \".txt\": \"文档\", \".md\": \"文档\",\n    \".xlsx\": \"文档\", \".csv\": \"文档\", \".pptx\": \"文档\",\n    \".mp4\": \"视频\", \".mov\": \"视频\", \".avi\": \"视频\",\n    \".mp3\": \"音频\", \".wav\": \"音频\",\n    \".zip\": \"压缩包\", \".rar\": \"压缩包\", \".7z\": \"压缩包\",\n    \".py\": \"代码\", \".js\": \"代码\", \".html\": \"代码\", \".css\": \"代码\",\n}\n\n\ndef real_home():\n    return os.path.realpath(os.path.expanduser(\"~\"))\n\n\ndef inside_home(path):\n    \"\"\"realpath 解析后的 path 是否位于用户主目录内（不含主目录本身）。\"\"\"\n    home = real_home()\n    return path != home and path.startswith(home + os.sep)\n\n\ndef check_dir(demo_dir):\n    \"\"\"返回 (真实路径, None) 或 (None, 错误信息)。\"\"\"\n    # 明确拒绝符号链接入口：realpath 会把它解析掉，所以必须先检查\n    if os.path.islink(demo_dir):\n        return None, \"拒绝：入口不能是符号链接（当前：%s）\" % demo_dir\n    demo_dir = os.path.realpath(demo_dir)\n    if not os.path.isdir(demo_dir):\n        return None, \"目录不存在：%s\" % demo_dir\n    if demo_dir == os.path.sep:\n        return None, \"拒绝：不能整理系统根目录\"\n    if demo_dir == real_home():\n        return None, \"拒绝：不能直接整理用户主目录，请指定主目录下的演示文件夹\"\n    if not inside_home(demo_dir):\n        return None, \"拒绝：只能整理用户主目录内的演示文件夹（当前：%s）\" % demo_dir\n    return demo_dir, None\n\n\ndef make_plan(demo_dir):\n    \"\"\"生成整理计划：返回 (moves, skipped, error)。\n    moves: [(源路径, 目标路径, 文件夹名), ...]\n    skipped: [(文件名, 原因), ...]\n    \"\"\"\n    try:\n        entries = sorted(os.listdir(demo_dir))\n    except PermissionError:\n        return [], [], \"没有权限读取目录：%s\" % demo_dir\n    except OSError as e:\n        return [], [], \"读取目录失败：%s\" % e\n\n    self_name = os.path.basename(__file__)\n    moves, skipped = [], []\n    for name in entries:\n        src = os.path.join(demo_dir, name)\n        # 来源符号链接：明确策略是跳过，不跟随（即使是失效链接也一样）\n        if os.path.islink(src):\n            skipped.append((name, \"符号链接，默认跳过（不跟随）\"))\n            continue\n        if os.path.isdir(src):\n            continue  # 不递归、不动子目录\n        if name == self_name:\n            continue  # 跳过脚本自己\n        if name.startswith(\".\"):\n            skipped.append((name, \"隐藏文件，保留原地\"))\n            continue\n        ext = os.path.splitext(name)[1].lower()\n        folder = RULES.get(ext)\n        if not folder:\n            skipped.append((name, \"未知类型，保留原地\"))\n            continue\n        dst_dir = os.path.join(demo_dir, folder)\n        # 分类目标目录若是符号链接：解析后必须仍在演示目录内，否则跳过\n        if os.path.islink(dst_dir):\n            real_dst = os.path.realpath(dst_dir)\n            if real_dst != demo_dir and not real_dst.startswith(demo_dir + os.sep):\n                skipped.append((name, \"分类目录是符号链接且指向允许范围外，跳过\"))\n                continue\n        dst = os.path.join(dst_dir, name)\n        # lexists 含失效符号链接：目标占位即跳过，绝不覆盖\n        if os.path.lexists(dst):\n            skipped.append((name, \"目标已存在（含失效链接），跳过（不覆盖）\"))\n            continue\n        moves.append((src, dst, folder))\n    return moves, skipped, None\n\n\ndef show_plan(moves, skipped):\n    print(\"===== 预览：计划移动 %d 个文件 =====\" % len(moves))\n    for src, dst, folder in moves:\n        print(\"  [%s] %s  ->  %s/\" % (folder, os.path.basename(src), folder))\n    if skipped:\n        print(\"===== 跳过 %d 个（不动） =====\" % len(skipped))\n        for name, reason in skipped:\n            print(\"  %s ：%s\" % (name, reason))\n    if not moves and not skipped:\n        print(\"文件夹已经是整理好的状态，无需操作。\")\n\n\ndef move_one(src, dst):\n    \"\"\"移动单个文件，返回 None 表示成功，否则返回失败原因。绝不覆盖目标。\"\"\"\n    try:\n        os.makedirs(os.path.dirname(dst), exist_ok=True)\n    except OSError as e:\n        return \"创建目标文件夹失败：%s\" % e\n    # 执行前复查：预览与执行之间目标可能发生变化\n    if os.path.lexists(dst):\n        return \"目标已存在，跳过（不覆盖）\"\n    try:\n        # 同文件系统下硬链接是原子操作：目标已存在则直接抛错，杜绝覆盖\n        os.link(src, dst)\n    except FileExistsError:\n        return \"目标已存在，跳过（不覆盖）\"\n    except OSError:\n        # 跨文件系统等极少情况回退为“复查 + 移动”（存在理论竞态窗口，见模块文档）\n        try:\n            if os.path.lexists(dst):\n                return \"目标已存在，跳过（不覆盖）\"\n            shutil.move(src, dst)\n            return None\n        except (OSError, shutil.Error) as e:\n            return \"移动失败：%s\" % e\n    try:\n        os.unlink(src)\n    except OSError as e:\n        # 硬链接已建好、源删不掉：数据不丢，只是多了份拷贝，提示手动处理\n        return \"目标已建好但源文件删除失败，请手动删除源文件：%s\" % e\n    return None\n\n\ndef do_apply(demo_dir, moves):\n    ok, fail = 0, []\n    for src, dst, folder in moves:\n        err = move_one(src, dst)\n        if err is None:\n            ok += 1\n        else:\n            fail.append((src, err))\n    print(\"===== 执行完毕：成功 %d 个，失败 %d 个 =====\" % (ok, len(fail)))\n    for src, reason in fail:\n        print(\"  %s ：%s\" % (os.path.basename(src), reason))\n    return 0 if not fail else 1\n\n\ndef main():\n    ap = argparse.ArgumentParser(description=\"整理演示文件夹（默认只预览）\")\n    ap.add_argument(\"demo_dir\", help=\"要整理的演示文件夹路径\")\n    ap.add_argument(\"--apply\", action=\"store_true\", help=\"真正执行移动；不加则只预览\")\n    a = ap.parse_args()\n\n    demo_dir, err = check_dir(a.demo_dir)\n    if err:\n        print(err)\n        return 2\n\n    moves, skipped, err = make_plan(demo_dir)\n    if err:\n        print(err)\n        return 1\n\n    if not a.apply:\n        print(\"【预览模式】没有移动任何文件。确认无误后加 --apply 真正执行。\\n\")\n        show_plan(moves, skipped)\n        return 0\n\n    print(\"【执行模式】开始移动文件…\\n\")\n    show_plan(moves, skipped)\n    print()\n    return do_apply(demo_dir, moves)\n\n\nif __name__ == \"__main__\":\n    sys.exit(main())\n" },
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
"text": "#!/usr/bin/env python3\n# -*- coding: utf-8 -*-\n\"\"\"\n生成 3 个示例 Excel（1月/2月/3月销售表），供《用 Python 汇总多个 Excel 表格》教程演示用。\n数据为虚构示例，不含任何真实信息。\n\n用法：python3 make_samples.py 演示目录\n将在「演示目录/输入/」下生成 1月.xlsx、2月.xlsx、3月.xlsx（各 2 行，共 6 行）。\n\"\"\"\nimport os\nimport sys\n\nimport pandas as pd\n\n\ndef main():\n    demo = os.path.realpath(sys.argv[1]) if len(sys.argv) > 1 else os.path.expanduser(\"~/excel-demo\")\n    home = os.path.realpath(os.path.expanduser(\"~\"))\n    if demo == home or not demo.startswith(home + os.sep):\n        print(\"拒绝：请指定主目录下的演示目录。\")\n        return 2\n    in_dir = os.path.join(demo, \"输入\")\n    os.makedirs(in_dir, exist_ok=True)\n\n    samples = {\n        \"1月.xlsx\": [(\"苹果\", 120, 360), (\"香蕉\", 200, 400)],\n        \"2月.xlsx\": [(\"苹果\", 150, 450), (\"橙子\", 180, 540)],\n        \"3月.xlsx\": [(\"香蕉\", 220, 440), (\"橙子\", 160, 480)],\n    }\n    for fname, rows in samples.items():\n        df = pd.DataFrame(rows, columns=[\"商品\", \"数量\", \"金额\"])\n        df.to_excel(os.path.join(in_dir, fname), index=False, engine=\"openpyxl\")\n        print(\"已生成 %s（%d 行）\" % (fname, len(df)))\n    print(\"共 6 行示例数据，放在：%s\" % in_dir)\n    return 0\n\n\nif __name__ == \"__main__\":\n    sys.exit(main())\n"
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
"text": "#!/usr/bin/env python3\n# -*- coding: utf-8 -*-\n\"\"\"\nExcel 汇总小助手 v1.0\n把「演示目录/输入/」下的多个 .xlsx 文件合并成一张总表，\n写到「演示目录/输出/汇总结果.xlsx」（附带\"来源文件\"列方便核对）。\n\n安全策略：\n  1. 只读「演示目录/输入/」顶层文件，不递归，不扫描电脑其他位置；\n  2. 绝不修改、删除原始文件（只读方式打开）；\n  3. 输出文件已存在时默认拒绝覆盖，提示用 --output 换名或加 --force 明确覆盖；\n  4. 输出位置必须在演示目录内，且不能在输入目录里（避免下次运行重复汇总）；\n  5. 列名不一致、空文件、损坏文件、重复表头：逐个文件明确报告并跳过，不静默错位；\n  6. 来源符号链接、隐藏文件默认跳过；旧格式 .xls 明确提示不支持；\n  7. 演示目录必须位于用户主目录内（realpath 解析后判断），拒绝根目录/主目录本身/符号链接入口。\n\n依赖：pip install pandas openpyxl（只支持 .xlsx 格式）\n\n用法：\n  python3 merge_excel.py 演示目录                  # 输入=演示目录/输入，输出=演示目录/输出/汇总结果.xlsx\n  python3 merge_excel.py 演示目录 --output 总表2.xlsx\n  python3 merge_excel.py 演示目录 --force           # 允许覆盖已存在的输出文件\n\n退出码：0 成功；1 运行失败（无文件可合并/输出已存在等）；2 用法或安全拒绝。\n\"\"\"\nimport argparse\nimport os\nimport sys\n\nimport pandas as pd\nfrom openpyxl import load_workbook\n\n\ndef real_home():\n    return os.path.realpath(os.path.expanduser(\"~\"))\n\n\ndef check_demo(demo):\n    \"\"\"返回 (真实路径, None) 或 (None, 错误信息)。\"\"\"\n    if os.path.islink(demo):\n        return None, \"拒绝：入口不能是符号链接（当前：%s）\" % demo\n    demo = os.path.realpath(demo)\n    if not os.path.isdir(demo):\n        return None, \"目录不存在：%s\" % demo\n    home = real_home()\n    if demo == os.path.sep:\n        return None, \"拒绝：不能使用系统根目录\"\n    if demo == home:\n        return None, \"拒绝：不能直接使用用户主目录，请指定主目录下的演示目录\"\n    if not demo.startswith(home + os.sep):\n        return None, \"拒绝：只能使用用户主目录内的演示目录（当前：%s）\" % demo\n    return demo, None\n\n\ndef raw_headers(path):\n    \"\"\"用 openpyxl 直接读第一行表头（pandas 读进来会把重复列名静默改成\"商品.1\"，看不出重复）。\"\"\"\n    wb = load_workbook(path, read_only=True, data_only=True)\n    try:\n        ws = wb.active\n        row = next(ws.iter_rows(min_row=1, max_row=1, values_only=True), None)\n    finally:\n        wb.close()\n    return [str(v) if v is not None else \"\" for v in (row or [])]\n\n\ndef read_one(path):\n    \"\"\"读取单个 Excel。返回 (df, None) 或 (None, 跳过原因)。只读，不修改文件。\"\"\"\n    try:\n        headers = raw_headers(path)\n    except Exception as e:  # 损坏文件、密码保护等都在这里兜住\n        return None, \"文件损坏或无法读取（%s），已跳过\" % e\n    if len(headers) != len(set(headers)):\n        return None, \"表头有重复的列名，已跳过（请先修正表头再汇总）\"\n    try:\n        df = pd.read_excel(path, engine=\"openpyxl\")\n    except Exception as e:\n        return None, \"文件损坏或无法读取（%s），已跳过\" % e\n    if len(df) == 0:\n        return None, \"空文件（只有表头、没有数据行），已跳过\"\n    return df, None\n\n\ndef main():\n    ap = argparse.ArgumentParser(description=\"汇总演示目录/输入/下的 Excel（默认不覆盖输出）\")\n    ap.add_argument(\"demo_dir\", help=\"演示目录路径（其下应有 输入/ 文件夹）\")\n    ap.add_argument(\"--output\", default=\"汇总结果.xlsx\", help=\"输出文件名（默认 汇总结果.xlsx，放在演示目录/输出/下）\")\n    ap.add_argument(\"--force\", action=\"store_true\", help=\"允许覆盖已存在的输出文件\")\n    a = ap.parse_args()\n\n    demo, err = check_demo(a.demo_dir)\n    if err:\n        print(err)\n        return 2\n\n    in_dir = os.path.join(demo, \"输入\")\n    if not os.path.isdir(in_dir):\n        print(\"输入文件夹不存在：%s\\n请先在演示目录下建好 输入/ 文件夹并放入 Excel 文件。\" % in_dir)\n        return 2\n\n    out_dir = os.path.join(demo, \"输出\")\n    # --output 允许相对名（放进 输出/）或绝对路径（必须仍在演示目录内）\n    out_path = a.output if os.path.isabs(a.output) else os.path.join(out_dir, a.output)\n    out_path = os.path.realpath(out_path)\n    if out_path != demo and not out_path.startswith(demo + os.sep):\n        print(\"拒绝：输出文件必须在演示目录内（当前：%s）\" % out_path)\n        return 2\n    if out_path == in_dir or out_path.startswith(in_dir + os.sep):\n        print(\"拒绝：输出文件不能放在输入目录里，否则下次运行会把它当成输入重复汇总。\")\n        return 2\n    if os.path.lexists(out_path) and not a.force:\n        print(\"输出文件已存在，拒绝覆盖：%s\" % out_path)\n        print(\"请用 --output 新文件名 指定别的名字，或确认要覆盖时加 --force。\")\n        return 1\n\n    try:\n        names = sorted(os.listdir(in_dir))\n    except OSError as e:\n        print(\"读取输入文件夹失败：%s\" % e)\n        return 1\n\n    frames, skipped, expected_cols = [], [], None\n    total_rows = 0\n    for name in names:\n        src = os.path.join(in_dir, name)\n        if os.path.islink(src):\n            skipped.append((name, \"符号链接，默认跳过（不跟随）\"))\n            continue\n        if os.path.isdir(src):\n            continue  # 不递归\n        if name.startswith(\".\"):\n            skipped.append((name, \"隐藏文件，跳过\"))\n            continue\n        ext = os.path.splitext(name)[1].lower()\n        if ext == \".xls\":\n            skipped.append((name, \"旧格式 .xls 不支持，请用 Excel 另存为 .xlsx 后再汇总\"))\n            continue\n        if ext != \".xlsx\":\n            skipped.append((name, \"不是 .xlsx 文件，跳过\"))\n            continue\n        df, reason = read_one(src)\n        if reason:\n            skipped.append((name, reason))\n            continue\n        cols = [str(c) for c in df.columns]\n        if expected_cols is None:\n            expected_cols = cols\n        elif cols != expected_cols:\n            skipped.append((name, \"列名与第一个文件不一致，已跳过\\n      期望列：%s\\n      实际列：%s\" % (expected_cols, cols)))\n            continue\n        df = df.copy()\n        df[\"来源文件\"] = name\n        frames.append(df)\n        total_rows += len(df)\n        print(\"已读取：%s（%d 行）\" % (name, len(df)))\n\n    if skipped:\n        print(\"\\n===== 跳过 %d 个文件 =====\" % len(skipped))\n        for name, reason in skipped:\n            print(\"  %s ：%s\" % (name, reason))\n\n    if not frames:\n        print(\"\\n没有可合并的文件，未生成汇总。\")\n        return 1\n\n    merged = pd.concat(frames, ignore_index=True)\n    try:\n        os.makedirs(out_dir, exist_ok=True)\n        merged.to_excel(out_path, index=False, engine=\"openpyxl\")\n    except OSError as e:\n        print(\"写入输出文件失败：%s\" % e)\n        return 1\n\n    print(\"\\n===== 汇总完成 =====\")\n    print(\"合并文件数：%d，数据总行数：%d\" % (len(frames), total_rows))\n    print(\"输出文件：%s\" % out_path)\n    print(\"提示：用 Excel 打开输出文件，核对总行数，并可用「来源文件」列追溯每一行来自哪个文件。\")\n    return 0\n\n\nif __name__ == \"__main__\":\n    sys.exit(main())\n"
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
