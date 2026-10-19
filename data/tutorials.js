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
"text": "#!/usr/bin/env python3\n# -*- coding: utf-8 -*-\n\"\"\"\n生成 12 行脏数据示例（订单表），供《用 Python 清理 Excel 数据》教程演示用。\n全部虚构数据，不含任何真实信息。\n\n关键：用 openpyxl 直接写单元格，精确控制每个单元格的存储类型——\n  第 2 行下单日期写成【真实日期单元格】，第 3 行写成【文本】\"2026/10/02\"，\n  第 5 行与第 2 行逐格同值同类型（真重复），订单号 \"00012\" 写成文本（保前导零）。\n\n安全：默认不覆盖已存在的目标文件（防止盖掉用户的真实文件）；\n  目标本身是符号链接一律拒绝。只有加 --force 才允许覆盖。\n\n用法：python3 make_dirty_samples.py 演示目录 [--force]\n将在「演示目录/输入/」下生成 脏订单.xlsx（12 行数据 + 1 行表头）。\n\"\"\"\nimport argparse\nimport os\nimport sys\nfrom datetime import datetime\n\nfrom openpyxl import Workbook\nfrom openpyxl.styles import numbers\n\nHEADER = [\"订单号\", \"客户\", \"商品\", \"数量\", \"金额\", \"下单日期\"]\n\n# 每行：(订单号, 客户, 商品, 数量, 金额, 下单日期, 日期是否写成真实日期单元格)\n# 数量/金额中带引号的字符串表示【文本】类型，不带引号的数字表示【数字】类型\nROWS = [\n    (\"A001\", \"张三\", \"苹果\", 10, 300, datetime(2026, 10, 1), True),    # 行2：干净，真实日期格\n    (\"A002\", \"李四\", \"香蕉\", 20, 400, \"2026/10/02\", False),            # 行3：日期文本\n    (\"A003\", \"王五\", \"橙子\", 15, \"¥450\", \"2026-10-03\", False),          # 行4：金额文本\n    (\"A001\", \"张三\", \"苹果\", 10, 300, datetime(2026, 10, 1), True),    # 行5：真重复（逐格同值同类型）\n    (\"A004\", \"赵六\", \"梨\", \"3件\", 180, \"2026-10-04\", False),            # 行6：数量文本\n    (None, None, None, None, None, None, False),                       # 行7：完全空白行\n    (\"A005\", \"钱七 \", \"苹果\", 10, 300, \"2026-10-05\", False),            # 行8：客户首尾空格\n    (\"A006\", \"孙八\", \"香蕉\", 5, \"待定\", \"2026-10-06\", False),           # 行9：金额无法转换\n    (\"A007\", \"周九\", \"橙子\", 8, 240, \"10/07\", False),                  # 行10：日期缺少年份\n    (\"A008\", \"吴十\", \"梨\", 12, 360, \"2026-10-08\", False),              # 行11：干净\n    (\"A002\", \"李四\", \"香蕉\", 25, 500, \"2026-10-02\", False),            # 行12：疑似重复（同订单号，内容不同）\n    (\"00012\", \"郑十一\", \"葡萄\", 6, 210, \"2026-10-09\", False),          # 行13：订单号前导零（文本）\n]\n\n\ndef main():\n    ap = argparse.ArgumentParser(description=\"生成 12 行脏数据示例（默认不覆盖已存在文件）\")\n    ap.add_argument(\"demo_dir\", nargs=\"?\", default=os.path.expanduser(\"~/excel-clean-demo\"),\n                    help=\"演示目录路径（默认 ~/excel-clean-demo）\")\n    ap.add_argument(\"--force\", action=\"store_true\", help=\"允许覆盖已存在的 脏订单.xlsx\")\n    a = ap.parse_args()\n\n    demo = os.path.realpath(a.demo_dir)\n    home = os.path.realpath(os.path.expanduser(\"~\"))\n    if demo == home or not demo.startswith(home + os.sep):\n        print(\"拒绝：请指定主目录下的演示目录。\")\n        return 2\n    in_dir = os.path.join(demo, \"输入\")\n    os.makedirs(in_dir, exist_ok=True)\n\n    path = os.path.join(in_dir, \"脏订单.xlsx\")\n    # 目标本身是符号链接：无论指向何处，一律拒绝（防止通过链接覆盖用户真实文件）\n    if os.path.islink(path):\n        print(\"拒绝：目标本身是符号链接，不覆盖：%s\" % path)\n        return 2\n    # 默认不覆盖已存在文件：样例生成器绝不能悄悄盖掉用户的真实文件\n    if os.path.lexists(path) and not a.force:\n        print(\"拒绝：目标文件已存在，不覆盖：%s\" % path)\n        print(\"如需重新生成示例，请确认后加 --force。\")\n        return 1\n\n    wb = Workbook()\n    ws = wb.active\n    ws.title = \"订单\"\n    ws.append(HEADER)\n    for oid, cust, prod, qty, amt, dt, real_date in ROWS:\n        row = [oid, cust, prod, qty, amt, dt]\n        ws.append(row)\n        if real_date:\n            # 把下单日期格设为真实日期类型（openpyxl 按 datetime 自动识别，此处显式确认）\n            cell = ws.cell(row=ws.max_row, column=6)\n            cell.number_format = numbers.FORMAT_DATE_YYYYMMDD2\n    # 订单号列强制文本格式（保前导零 \"00012\"）\n    for r in range(2, ws.max_row + 1):\n        ws.cell(row=r, column=1).number_format = \"@\"\n    wb.save(path)\n    print(\"已生成 脏订单.xlsx（12 行数据，全部虚构）→ %s\" % path)\n    return 0\n\n\nif __name__ == \"__main__\":\n    sys.exit(main())\n"
}
},
{
"title": "写清理脚本 clean_excel.py",
"body": "<p>把下面的代码保存为 <code>clean_excel.py</code>。先看懂它的安全策略（这也是本篇的核心）：</p><p>① <strong>三档模式</strong>：<code>--check</code> 只看报告不写任何文件；默认模式只修正格子、删空白行，<strong>不删任何含数据的行</strong>；<code>--deduplicate-exact</code> 才显式删除整行完全相同的重复。<br>② <strong>重复判定看原始快照</strong>：用 openpyxl 直接读单元格的值+类型，判定发生在清洗之前，禁止先规范化再判。类型不同不算重复（数字 10 和文本 \"10\"）。<br>③ <strong>原始文件只读</strong>：输出写到 <code>输出/</code> 目录，默认拒绝覆盖（原子创建），输出不能等于输入，<code>--force</code> 也拦不住；<code>--output</code> 只支持 <code>.xlsx</code>。<br>④ <strong>符号链接一律拒绝</strong>：输出目标本身是链接、<code>输入/</code>/<code>输出/</code> 目录本身是链接，都直接拒绝。<br>⑤ <strong>支持范围先讲清楚</strong>：含<strong>公式</strong>的表直接拒绝（无法可靠地保留公式，绝不静默丢弃）；带<strong>时间部分</strong>（时分秒）的日期直接拒绝（绝不静默截断）；金额/数量只按严格格式转换，拿不准的一律保留原文+警告。</p>",
"code": {
"lang": "python",
"label": "clean_excel.py",
"text": "#!/usr/bin/env python3\n# -*- coding: utf-8 -*-\n\"\"\"\nExcel 清理小助手 v1.0\n清理一份存在脏数据的 Excel：去重标记、删空白行、去首尾空格、统一日期/金额/数量格式。\n\n只用 openpyxl（不用 pandas 做类型推断——pandas 会改写原始单元格类型，\n例如把重复列名改成\"商品.1\"、把文本数字转成数字，见 v0.4 方案 §1）。\n\n三档模式：\n  --check               只在终端显示完整问题报告，不创建任何文件（严格零写入）\n  （默认）              修正单元格 + 删除完全空白行，不删除任何含数据的行\n  --deduplicate-exact   显式删除整行完全相同的重复（保留首条）\n\n支持范围（保守策略，先讲清楚再动手）：\n  1. 只支持 .xlsx（--output 其它扩展名直接拒绝）；\n  2. 不支持含公式的工作簿——检测到公式单元格直接拒绝，\n     因为输出阶段无法可靠保留公式及其依赖关系，绝不静默把公式变成数值；\n  3. 不支持带时间部分（时分秒非零）的日期时间——检测到直接拒绝，\n     绝不静默截断时间；\n  4. 金额/数量只按\"先验证完整格式、再转换\"的严格规则处理，\n     格式不明的一律保留原文 + 警告。\n\n安全策略：\n  1. 原始文件只读，运行前后 checksum 不变；\n  2. 重复判定基于 openpyxl 读取的【原始快照】（值+类型），发生在任何清洗之前，\n     禁止先规范化再判定；默认只标记不删除；\n  3. 演示目录/输入、演示目录/输出 本身是符号链接一律拒绝（无论指向何处）；\n     输出目标本身是符号链接一律拒绝；输出必须位于 演示目录/输出/ 内；\n     输出不得等于输入源文件（--force 也拒绝）；\n  4. 输出已存在默认拒绝覆盖（原子 os.link，无检查-创建竞态）；\n     --force 仅在路径安全检查通过后做原子 os.replace；\n  5. Excel 与报告分别原子发布，不谎称整体事务；报告失败 = 部分成功状态（如实报告）；\n  6. 失败时只删除自己创建的临时文件，绝不碰用户原有文件；\n  7. 演示目录必须位于用户主目录内（realpath 解析），拒绝根目录/主目录本身/符号链接入口。\n\n威胁边界（诚实说明，不夸大）：\n  realpath 解析 + islink 检查只能反映\"检查时刻\"的状态，不能消除检查与使用\n  之间的竞态（TOCTOU）——有演示目录写权限的攻击者理论上可在检查后替换\n  符号链接。本脚本面向用户自己的演示目录，上述检查用于防止误操作和常规\n  风险，不声称能防御有本地写权限的恶意攻击者。\n\n测试注入点（供自动化测试覆盖\"报告发布失败\"的部分成功路径，教程可忽略）：\n  环境变量 CLEAN_EXCEL_INJECT_REPORT_FAIL=1 时，在 Excel 发布成功后模拟报告发布失败。\n\n依赖：pip install openpyxl（只支持 .xlsx）\n用法：\n  python3 clean_excel.py 演示目录 --check\n  python3 clean_excel.py 演示目录\n  python3 clean_excel.py 演示目录 --deduplicate-exact\n  python3 clean_excel.py 演示目录 --output 干净订单.xlsx [--force]\n退出码：0 成功；1 运行失败（含部分成功）；2 用法或安全拒绝。\n\"\"\"\nimport argparse\nimport math\nimport os\nimport re\nimport sys\nimport tempfile\nfrom datetime import date, datetime, time\nfrom decimal import Decimal, InvalidOperation\n\nfrom openpyxl import Workbook, load_workbook\n\nREQUIRED_COLS = [\"订单号\", \"客户\", \"商品\", \"数量\", \"金额\", \"下单日期\"]\nINPUT_NAME = \"脏订单.xlsx\"\nOUTPUT_NAME = \"清理后.xlsx\"\nREPORT_NAME = \"清理报告.txt\"\n\nDATE_FMTS = (\"%Y-%m-%d\", \"%Y/%m/%d\", \"%Y.%m.%d\", \"%Y年%m月%d日\")\nQTY_UNITS = (\"件\", \"个\", \"只\", \"瓶\", \"箱\", \"台\", \"套\", \"包\")\nAMBIGUOUS_DOT = re.compile(r\"^\\d{1,3}\\.\\d{3}$\")  # 如 1.234：欧陆千分位歧义，不解释\nNONFINITE_RE = re.compile(r\"^[+-]?\\s*(nan|inf|infinity)\\s*$\", re.IGNORECASE)\n# 金额允许的完整格式（先整体验证，再转换）：\n#   可选 1 个货币符号开头（¥/￥/$），或 \"元\" 结尾；\n#   数字部分：纯数字（可选小数点）或规范千分位（每组恰 3 位）。\n# 不在其中的（如 1,2、美元450、-450）一律保留原文 + 警告。\nAMOUNT_RE = re.compile(r\"^(?:[¥￥$]\\s*)?(\\d+(?:\\.\\d+)?|\\d{1,3}(?:,\\d{3})+(?:\\.\\d+)?)(?:\\s*元)?$\")\n# 数量允许的完整格式：可选负号 + 整数 + 可选 1 个单位（单位必须在末尾）。\nQTY_RE = re.compile(r\"^(-?\\d+)\\s*(件|个|只|瓶|箱|台|套|包)?$\")\nQTY_DECIMAL_RE = re.compile(r\"^-?\\d+\\.\\d+$\")\n\n\ndef real_home():\n    return os.path.realpath(os.path.expanduser(\"~\"))\n\n\ndef check_demo(demo):\n    \"\"\"演示目录入口检查。返回 (realpath, None) 或 (None, 错误信息)。\n\n    威胁边界：realpath + islink 检查只反映检查时刻的状态，不能消除\n    检查与使用之间的竞态（TOCTOU）。面向用户自己的演示目录，\n    用于防止误操作和常规风险，不防御有本地写权限的恶意攻击者。\n    \"\"\"\n    if os.path.islink(demo):\n        return None, \"拒绝：入口不能是符号链接（当前：%s）\" % demo\n    demo = os.path.realpath(demo)\n    if not os.path.isdir(demo):\n        return None, \"目录不存在：%s\" % demo\n    home = real_home()\n    if demo == os.path.sep:\n        return None, \"拒绝：不能使用系统根目录\"\n    if demo == home:\n        return None, \"拒绝：不能直接使用用户主目录，请指定主目录下的演示目录\"\n    if not demo.startswith(home + os.sep):\n        return None, \"拒绝：只能使用用户主目录内的演示目录（当前：%s）\" % demo\n    # 演示目录/输入 与 演示目录/输出 本身不得是符号链接（无论指向何处）\n    for sub in (\"输入\", \"输出\"):\n        if os.path.islink(os.path.join(demo, sub)):\n            return None, \"拒绝：演示目录/%s 本身是符号链接（无论指向何处都不允许）\" % sub\n    return demo, None\n\n\n# ---------- 原始快照（openpyxl 两遍读取，不信任 pandas 类型推断） ----------\n\ndef scalar_key(val):\n    \"\"\"单个值的归一键。\n\n    诚实口径（只承诺实际做到的）：\n    - 用的是 openpyxl 返回的 Python 值（不是 Excel 底层存储字节）；\n    - datetime 保留完整时分秒（不同时间 ≠ 相同）；\n    - 数字 int/float 按 Decimal(str(v)).normalize() 比较，\n      即整数 10 与浮点 10.0 视为相同；文本 \"10\" 与数字 10 类型不同，不视为相同；\n    - 非有限数值（NaN/Infinity）单独标记，不参与相等比较。\n    \"\"\"\n    if val is None:\n        return (\"empty\",)\n    if isinstance(val, bool):\n        return (\"bool\", str(val))\n    if isinstance(val, datetime):\n        return (\"date\", val.isoformat())  # 保留时分秒\n    if isinstance(val, date):\n        return (\"date\", val.isoformat())\n    if isinstance(val, (int, float)):\n        if isinstance(val, float) and not math.isfinite(val):\n            return (\"nonfinite\",)\n        return (\"num\", str(Decimal(str(val)).normalize()))\n    return (\"text\", str(val))\n\n\ndef cell_key(val, dtype, formula):\n    \"\"\"单个单元格的原始快照键。val 来自 data_only=True，dtype/formula 来自 data_only=False。\n\n    dtype 是 openpyxl 报告的单元格类型（f=公式，e=错误值，s=文本，n=数字，d=日期）。\n    \"\"\"\n    if dtype == \"f\":\n        if val is None:\n            return (\"formula-missing\",)\n        return (\"formula\", str(formula), scalar_key(val))\n    if dtype == \"e\":\n        return (\"error\",)  # Excel 错误值（#DIV/0! 等）：不参与相等比较\n    return scalar_key(val)\n\n\ndef read_rows(path):\n    \"\"\"返回 (header, rows)。rows 每项：{'excel_row': n, 'cells': [(val, dtype, formula), ...], 'keys': tuple}。\"\"\"\n    wb_v = load_workbook(path, read_only=True, data_only=True)\n    wb_r = load_workbook(path, read_only=True, data_only=False)\n    try:\n        wv, wr = wb_v.active, wb_r.active\n        header = [c.value for c in next(wv.iter_rows(min_row=1, max_row=1))]\n        rows = []\n        for rn, (rv, rr) in enumerate(zip(wv.iter_rows(min_row=2), wr.iter_rows(min_row=2)), start=2):\n            cells, keys = [], []\n            for cv, cr in zip(rv, rr):\n                formula = cr.value if cr.data_type == \"f\" else None\n                cells.append((cv.value, cr.data_type, formula))\n                keys.append(cell_key(cv.value, cr.data_type, formula))\n            rows.append({\"excel_row\": rn, \"cells\": cells, \"keys\": tuple(keys)})\n    finally:\n        wb_v.close()\n        wb_r.close()\n    return header, rows\n\n\ndef is_blank(cells):\n    \"\"\"空白行：所有格为空或纯空白文本（独立于重复判定）。\n\n    公式单元格（dtype == 'f'）即使缓存值为空也视为有内容——\n    含公式的工作簿会被上游直接拒绝，此处是纵深防御，绝不把公式行当空白行删掉。\n    \"\"\"\n    for val, dtype, _ in cells:\n        if dtype == \"f\":\n            return False\n        if val is None:\n            continue\n        if isinstance(val, str) and val.strip() == \"\":\n            continue\n        return False\n    return True\n\n\ndef find_exact_groups(rows):\n    \"\"\"返回 (groups, skipped)。\n\n    groups: {keys: [excel_row,...]}，只含 >= 2 行的组（可安全判定的完全重复）。\n    skipped: [(excel_row, 原因)]——含公式无缓存 / Excel 错误值 / 非有限数值 的行，\n    不参与重复判定（宁可漏判，不可误判），调用方应给出明确警告。\n    \"\"\"\n    bucket, skipped = {}, []\n    for r in rows:\n        reason = None\n        for k in r[\"keys\"]:\n            if k[0] == \"formula-missing\":\n                reason = \"公式无缓存值，视为缺失\"\n                break\n            if k[0] == \"error\":\n                reason = \"含 Excel 错误值（如 #DIV/0!）\"\n                break\n            if k[0] == \"nonfinite\":\n                reason = \"含非有限数值（NaN/Infinity）\"\n                break\n        if reason:\n            skipped.append((r[\"excel_row\"], reason))\n            continue\n        bucket.setdefault(r[\"keys\"], []).append(r[\"excel_row\"])\n    groups = {k: v for k, v in bucket.items() if len(v) > 1}\n    return groups, skipped\n\n\ndef find_suspects(rows, oid_idx):\n    \"\"\"订单号相同但快照不同 → 疑似重复，始终保留+警告。返回 [(oid, [excel_row,...])]。\"\"\"\n    bucket = {}\n    for r in rows:\n        val = r[\"cells\"][oid_idx][0]\n        if val is None:\n            continue\n        bucket.setdefault(str(val), []).append(r)\n    out = []\n    for oid, rs in bucket.items():\n        if len(rs) > 1 and len({r[\"keys\"] for r in rs}) > 1:\n            out.append((oid, [r[\"excel_row\"] for r in rs]))\n    return out\n\n\n# ---------- 清洗（只作用于保留行；返回 (新值, 是否实际改写, 警告)） ----------\n\ndef clean_text(val):\n    if not isinstance(val, str):\n        return val, False, None\n    s = val.strip()\n    return s, (s != val), None\n\n\ndef clean_date(val):\n    # 注意：带时间部分（时分秒非零）的 datetime 已在上游被拒绝，\n    # 到这里的 datetime 一定是 00:00:00，只统一写法，不计修正。\n    if isinstance(val, datetime):\n        return val.date().isoformat(), False, None\n    if isinstance(val, date):\n        return val.isoformat(), False, None\n    s = str(val).strip()\n    for f in DATE_FMTS:\n        try:\n            iso = datetime.strptime(s, f).date().isoformat()\n            return iso, (iso != s), None  # 与原文相同不计修正\n        except ValueError:\n            pass\n    return val, False, \"日期无法解析（%s），保留原文\" % val\n\n\ndef clean_amount(val):\n    \"\"\"金额：先验证完整格式，再转换。格式不明的一律保留原文 + 警告。\n\n    允许：可选 1 个货币符号（¥/￥/$）开头或\"元\"结尾 + 纯数字/规范千分位（可带小数）。\n    拒绝：1,2（千分位不规范）、1.234（歧义）、NaN/Infinity、美元450、-450 等。\n    \"\"\"\n    if isinstance(val, bool):\n        return val, False, \"金额是布尔值，保留原文\"\n    if isinstance(val, (int, float)):\n        if isinstance(val, float) and not math.isfinite(val):\n            return val, False, \"金额是非有限数值，保留原文\"\n        return val, False, None\n    s = str(val).strip()\n    if not s:\n        return val, False, \"金额为空，保留原文\"\n    if NONFINITE_RE.match(s):\n        return val, False, \"金额是非有限数值（%s），保留原文\" % val\n    if AMBIGUOUS_DOT.match(s) or s.count(\".\") > 1:\n        return val, False, \"金额格式歧义（%s），不擅自解释，保留原文\" % val\n    m = AMOUNT_RE.match(s)\n    if not m:\n        return val, False, \"金额格式无法确认（%s），保留原文\" % val\n    try:\n        d = Decimal(m.group(1).replace(\",\", \"\"))\n    except InvalidOperation:\n        return val, False, \"金额无法转换为数字（%s），保留原文\" % val\n    if not d.is_finite():\n        return val, False, \"金额是非有限数值，保留原文\"\n    v = int(d) if d == d.to_integral_value() else float(d)\n    return v, True, None\n\n\ndef clean_qty(val):\n    \"\"\"数量：先验证完整格式，再转换。格式不明的一律保留原文 + 警告。\n\n    允许：整数（可选负号）+ 可选 1 个单位（件/个/只/瓶/箱/台/套/包，须在末尾）。\n    拒绝：1件2（单位不在末尾）、3.5（不是整数）、NaN/Infinity 等。\n    \"\"\"\n    if isinstance(val, bool):\n        return val, False, \"数量是布尔值，保留原文\"\n    if isinstance(val, (int, float)):\n        if isinstance(val, float) and not math.isfinite(val):\n            return val, False, \"数量是非有限数值，保留原文\"\n        return val, False, None\n    s = str(val).strip()\n    if not s:\n        return val, False, \"数量为空，保留原文\"\n    if NONFINITE_RE.match(s):\n        return val, False, \"数量是非有限数值（%s），保留原文\" % val\n    if QTY_DECIMAL_RE.match(s):\n        return val, False, \"数量不是整数（%s），保留原文\" % val\n    m = QTY_RE.match(s)\n    if not m:\n        return val, False, \"数量格式无法确认（%s），保留原文\" % val\n    return int(m.group(1)), True, None\n\n\ndef clean_row(cells, col_idx):\n    \"\"\"清洗一行保留行。返回 (new_values, fixed_count, warnings[(列名, 信息)])。\"\"\"\n    out, fixed, warns = [], 0, []\n    for i, (val, _, _) in enumerate(cells):\n        col = col_idx[\"names\"][i]\n        if col in (\"客户\", \"商品\"):\n            nv, ch, w = clean_text(val)\n        elif col == \"下单日期\":\n            nv, ch, w = clean_date(val)\n        elif col == \"金额\":\n            nv, ch, w = clean_amount(val)\n        elif col == \"数量\":\n            nv, ch, w = clean_qty(val)\n        else:  # 订单号等：保持原样，不碰身份字段\n            nv, ch, w = val, False, None\n        out.append(nv)\n        if ch:\n            fixed += 1\n        if w:\n            warns.append((col, w))\n    return out, fixed, warns\n\n\n# ---------- 路径安全 ----------\n\ndef resolve_in_dir(demo, sub, arg, must_exist=False):\n    \"\"\"把 arg 解析到 演示目录/sub/ 内。返回 (real_path, None) 或 (None, (msg, is_safety))。\n\n    威胁边界：realpath 解析只能反映检查时刻的状态，不能消除检查与使用\n    之间的竞态（TOCTOU）。配合 check_demo 对输入/输出目录本身的 islink\n    检查，用于防止误操作和常规风险，不防御有本地写权限的恶意攻击者。\n    \"\"\"\n    base = os.path.join(demo, sub)\n    real_base = os.path.realpath(base)\n    if real_base != demo and not real_base.startswith(demo + os.sep):\n        return None, (\"拒绝：%s 目录解析后超出演示目录范围\" % sub, True)\n    # 输出目录不得解析进输入目录（避免输出落进输入，下次被当成输入）\n    if sub == \"输出\":\n        real_in = os.path.realpath(os.path.join(demo, \"输入\"))\n        if real_base == real_in or real_base.startswith(real_in + os.sep):\n            return None, (\"拒绝：输出目录不能指向输入目录内\", True)\n    raw = arg if os.path.isabs(arg) else os.path.join(base, arg)\n    if os.path.islink(raw):\n        return None, (\"拒绝：目标本身是符号链接（%s），无论指向何处都不允许\" % arg, True)\n    final = os.path.realpath(raw)\n    if final != real_base and not final.startswith(real_base + os.sep):\n        return None, (\"拒绝：目标必须在演示目录/%s/ 内（当前：%s）\" % (sub, arg), True)\n    if os.path.isdir(final):\n        return None, (\"拒绝：输出目标是目录，无法写入文件：%s\" % arg, True)\n    if must_exist and not os.path.isfile(final):\n        return None, (\"输入文件不存在：%s\" % final, True)\n    return final, None\n\n\n# ---------- 原子发布 ----------\n\ndef publish_file(tmp, final, force):\n    \"\"\"原子发布单个文件。返回 (True, None) 或 (False, 原因)。\"\"\"\n    try:\n        if force:\n            os.replace(tmp, final)\n        else:\n            os.link(tmp, final)  # 目标已存在则抛 FileExistsError：无检查-创建竞态\n    except FileExistsError:\n        return False, \"目标已存在，拒绝覆盖：%s\" % final\n    except OSError as e:\n        return False, \"发布失败（%s）：%s\" % (final, e)\n    return True, None\n\n\n# ---------- 报告 ----------\n\ndef row_text(cells):\n    parts = []\n    for v, _, _ in cells:\n        if v is None:\n            parts.append(\"\")\n        elif isinstance(v, datetime):\n            parts.append(v.date().isoformat())\n        elif isinstance(v, date):\n            parts.append(v.isoformat())\n        else:\n            parts.append(str(v))\n    return \" | \".join(parts)\n\n\ndef build_report(ctx):\n    L = []\n    L.append(\"===== Excel 清理报告 =====\")\n    L.append(\"输入文件：%s\" % ctx[\"input\"])\n    L.append(\"模式：%s\" % ctx[\"mode\"])\n    L.append(\"原始数据行数：%d\" % ctx[\"n_raw\"])\n    L.append(\"自动修正单元格数：%d\" % ctx[\"n_fixed\"])\n    L.append(\"删除行数：%d\" % ctx[\"n_deleted\"])\n    L.append(\"警告数：%d\" % ctx[\"n_warn\"])\n    if ctx[\"groups\"]:\n        L.append(\"\")\n        L.append(\"--- 重复组（整行原始值+类型完全相同） ---\")\n        for gi, (key, rows) in enumerate(ctx[\"groups\"].items(), start=1):\n            L.append(\"重复组 G%d（共 %d 行）：\" % (gi, len(rows)))\n            for j, rn in enumerate(rows):\n                tag = \"保留（首条）\" if j == 0 else (\"已删除\" if ctx[\"dedup\"] else \"标记未删除\")\n                L.append(\"  - Excel第%d行：%s → %s\" % (rn, ctx[\"row_text\"][rn], tag))\n    if ctx[\"suspects\"]:\n        L.append(\"\")\n        L.append(\"--- 疑似重复（订单号相同、内容不同，始终保留） ---\")\n        for oid, rns in ctx[\"suspects\"]:\n            L.append(\"  - 订单号 %s：Excel第%s行 → 保留全部，请人工确认\" % (oid, \"、第\".join(map(str, rns))))\n    if ctx[\"warnings\"]:\n        L.append(\"\")\n        L.append(\"--- 警告明细 ---\")\n        for rn, col, msg in ctx[\"warnings\"]:\n            L.append(\"  - Excel第%d行【%s】：%s\" % (rn, col, msg))\n    if ctx[\"deleted\"]:\n        L.append(\"\")\n        L.append(\"--- 删除明细 ---\")\n        for rn, reason in ctx[\"deleted\"]:\n            L.append(\"  - Excel第%d行：%s\" % (rn, reason))\n    if not ctx[\"groups\"] and not ctx[\"suspects\"] and not ctx[\"warnings\"] and not ctx[\"deleted\"]:\n        L.append(\"未发现问题，数据干净。\")\n    return \"\\n\".join(L) + \"\\n\"\n\n\n# ---------- 主流程 ----------\n\ndef main():\n    ap = argparse.ArgumentParser(description=\"清理 Excel 脏数据（默认不删除业务行）\")\n    ap.add_argument(\"demo_dir\", help=\"演示目录路径（其下应有 输入/ 文件夹）\")\n    ap.add_argument(\"--input\", default=INPUT_NAME, help=\"输入文件名（默认 %s，位于演示目录/输入/ 下）\" % INPUT_NAME)\n    ap.add_argument(\"--output\", default=OUTPUT_NAME, help=\"输出文件名（默认 %s，位于演示目录/输出/ 下，仅支持 .xlsx）\" % OUTPUT_NAME)\n    ap.add_argument(\"--check\", action=\"store_true\", help=\"只显示问题报告，不创建任何文件\")\n    ap.add_argument(\"--force\", action=\"store_true\", help=\"允许覆盖已存在的输出文件（仅路径安全时）\")\n    ap.add_argument(\"--deduplicate-exact\", action=\"store_true\", help=\"显式删除整行完全相同的重复（保留首条）\")\n    a = ap.parse_args()\n\n    # --output 只支持 .xlsx（其它扩展名直接拒绝，避免报告名派生出误导性文件名）\n    if not a.output.lower().endswith(\".xlsx\"):\n        print(\"拒绝：--output 只支持 .xlsx 文件（当前：%s）。\" % a.output)\n        print(\"本工具只读写 .xlsx 格式（Excel/WPS 默认格式），请改用 .xlsx 后缀。\")\n        return 2\n\n    demo, err = check_demo(a.demo_dir)\n    if err:\n        print(err)\n        return 2\n\n    in_path, err = resolve_in_dir(demo, \"输入\", a.input, must_exist=True)\n    if err:\n        print(err[0])\n        return 2 if err[1] else 1\n    # 注：resolve_in_dir 已拒绝符号链接输入；realpath 解析后仍在 输入/ 内才放行\n\n    try:\n        header, rows = read_rows(in_path)\n    except Exception as e:\n        print(\"读取输入文件失败：%s\" % e)\n        return 1\n\n    missing = [c for c in REQUIRED_COLS if c not in header]\n    if missing:\n        print(\"缺少必要列：%s\\n期望列：%s\" % (\"、\".join(missing), \"、\".join(REQUIRED_COLS)))\n        return 1\n    if not rows:\n        print(\"表格没有数据行，未执行任何操作。\")\n        return 1\n    col_idx = {\"names\": header, \"map\": {name: header.index(name) for name in header}}\n    oid_idx = col_idx[\"map\"][\"订单号\"]\n\n    # ---- 支持范围检查（保守策略）：在任何判定/写入之前拒绝 ----\n    # 含公式的工作簿：输出阶段无法可靠保留公式及其依赖关系，绝不静默丢弃公式。\n    formula_rows = sorted({r[\"excel_row\"] for r in rows\n                           if any(dtype == \"f\" for _, dtype, _ in r[\"cells\"])})\n    if formula_rows:\n        print(\"拒绝：检测到公式单元格（Excel第%s行）。\" % \"、第\".join(map(str, formula_rows)))\n        print(\"当前版本无法可靠地保留公式及其计算关系，为避免静默丢弃公式，已拒绝自动清理。\")\n        print(\"原始文件未改动，也没有创建任何输出文件。\")\n        print(\"如需处理含公式的表，请先在 Excel/WPS 中把公式计算结果「粘贴为数值」后再试。\")\n        return 2\n    # 带时间部分的日期时间：绝不静默截断时分秒。\n    timed = []\n    for r in rows:\n        for i, (val, _, _) in enumerate(r[\"cells\"]):\n            if isinstance(val, time) or (\n                    isinstance(val, datetime)\n                    and (val.hour, val.minute, val.second, val.microsecond) != (0, 0, 0, 0)):\n                timed.append((r[\"excel_row\"], header[i]))\n    if timed:\n        shown = \"、\".join(\"Excel第%d行【%s】\" % t for t in timed[:5])\n        if len(timed) > 5:\n            shown += \"（等共 %d 处）\" % len(timed)\n        print(\"拒绝：检测到带时间部分的日期时间（%s）。\" % shown)\n        print(\"当前版本不会静默截断时间，已拒绝自动清理。原始文件未改动，也没有创建任何输出文件。\")\n        return 2\n\n    # 判定（清洗之前，基于原始快照）\n    groups, skipped = find_exact_groups(rows)\n    suspects = find_suspects(rows, oid_idx)\n\n    # 删除集合\n    to_delete = {}  # excel_row -> 原因\n    for r in rows:\n        if is_blank(r[\"cells\"]):\n            to_delete[r[\"excel_row\"]] = \"完全空白行，已删除\"\n    if a.deduplicate_exact:\n        for key, rns in groups.items():\n            for rn in rns[1:]:\n                to_delete[rn] = \"整行完全相同（显式去重），已删除\"\n\n    # 清洗保留行\n    out_rows, n_fixed, warnings, row_texts = [], 0, {}, {}\n    for r in rows:\n        rn = r[\"excel_row\"]\n        row_texts[rn] = row_text(r[\"cells\"])\n        if rn in to_delete:\n            continue\n        new_vals, fixed, warns = clean_row(r[\"cells\"], col_idx)\n        out_rows.append(new_vals)\n        n_fixed += fixed\n        for col, msg in warns:\n            warnings.setdefault(rn, []).append((col, msg))\n    for rn, reason in skipped:\n        warnings.setdefault(rn, []).append((\"整行\", \"%s，不参与重复判定\" % reason))\n\n    # 警告计数：重复组标记 + 疑似组 + 单元格警告（去重模式下已删除的组不计警告）\n    n_warn = 0\n    if not a.deduplicate_exact:\n        n_warn += len(groups)\n    n_warn += len(suspects)\n    for rn, lst in warnings.items():\n        n_warn += len(lst)\n\n    flat_warnings = []\n    for gi, (key, rns) in enumerate(groups.items(), start=1):\n        if not a.deduplicate_exact:\n            flat_warnings.append((rns[0], \"重复组\", \"G%d 共 %d 行完全相同，已标记未删除\" % (gi, len(rns))))\n    for oid, rns in suspects:\n        flat_warnings.append((rns[0], \"订单号\", \"疑似重复（订单号 %s），已保留全部\" % oid))\n    for rn, lst in warnings.items():\n        for col, msg in lst:\n            flat_warnings.append((rn, col, msg))\n    flat_warnings.sort()\n\n    deleted_list = sorted((rn, to_delete[rn]) for rn in to_delete)\n    ctx = {\n        \"input\": in_path,\n        \"mode\": \"--check 预览\" if a.check else (\"显式去重\" if a.deduplicate_exact else \"默认执行\"),\n        \"n_raw\": len(rows),\n        \"n_fixed\": n_fixed,\n        \"n_deleted\": len(to_delete),\n        \"n_warn\": n_warn,\n        \"groups\": groups,\n        \"suspects\": suspects,\n        \"warnings\": flat_warnings,\n        \"deleted\": deleted_list,\n        \"dedup\": a.deduplicate_exact,\n        \"row_text\": row_texts,\n    }\n    report = build_report(ctx)\n\n    if a.check:\n        # 严格零写入：到此为止未创建任何文件系统对象，直接打印\n        print(report)\n        return 0\n\n    # 写前预验证（两个目标，全部通过才发布任一；报告名随输出名派生）\n    xlsx_final, err = resolve_in_dir(demo, \"输出\", a.output)\n    if err:\n        print(err[0])\n        return 2 if err[1] else 1\n    report_name = os.path.splitext(os.path.basename(a.output))[0] + \"_报告.txt\"\n    report_final, err = resolve_in_dir(demo, \"输出\", report_name)\n    if err:\n        print(err[0])\n        return 2 if err[1] else 1\n    if not a.force:\n        if os.path.lexists(xlsx_final):\n            print(\"输出文件已存在，拒绝覆盖：%s\\n请用 --output 换名，或确认要覆盖时加 --force。\" % xlsx_final)\n            return 1\n        if os.path.lexists(report_final):\n            print(\"报告文件已存在，拒绝覆盖：%s\\n请确认要覆盖时加 --force。\" % report_final)\n            return 1\n\n    real_out_dir = os.path.realpath(os.path.join(demo, \"输出\"))\n    os.makedirs(real_out_dir, exist_ok=True)\n\n    temps = []\n    try:\n        # 准备临时文件（mkstemp：O_CREAT|O_EXCL + 随机名；xlsx 临时文件保留 .xlsx 后缀以便校验）\n        fd, xlsx_tmp = tempfile.mkstemp(dir=real_out_dir, prefix=\".clean-xlsx-\", suffix=\".xlsx\")\n        temps.append(xlsx_tmp)\n        fd2, report_tmp = tempfile.mkstemp(dir=real_out_dir, prefix=\".clean-report-\", suffix=\".txt\")\n        temps.append(report_tmp)\n\n        wb = Workbook()\n        ws = wb.active\n        ws.title = \"清理后\"\n        ws.append(header)\n        for vals in out_rows:\n            ws.append(vals)\n        wb.save(xlsx_tmp)\n        os.close(fd)\n        with os.fdopen(fd2, \"w\", encoding=\"utf-8\") as f:\n            f.write(report)\n\n        # 校验临时文件\n        try:\n            wv = load_workbook(xlsx_tmp, read_only=True)\n            wv.close()\n        except Exception as e:\n            print(\"生成的 Excel 校验失败，中止：%s\" % e)\n            return 1\n        if os.path.getsize(report_tmp) == 0:\n            print(\"生成的报告为空，中止。\")\n            return 1\n\n        # 发布 Excel\n        ok, msg = publish_file(xlsx_tmp, xlsx_final, a.force)\n        if not ok:\n            print(msg)\n            return 1\n        temps.remove(xlsx_tmp)\n        try:\n            os.unlink(xlsx_tmp)  # os.link 后需手动删；os.replace 改名后已不存在\n        except FileNotFoundError:\n            pass\n\n        # 测试注入点：模拟报告发布失败（覆盖部分成功路径）\n        if os.environ.get(\"CLEAN_EXCEL_INJECT_REPORT_FAIL\") == \"1\":\n            ok, msg = False, \"注入的报告发布失败（测试用 CLEAN_EXCEL_INJECT_REPORT_FAIL=1）\"\n        else:\n            ok, msg = publish_file(report_tmp, report_final, a.force)\n        if not ok:\n            print(\"===== 部分成功 =====\")\n            print(\"Excel 已生成（本次新输出）：%s\" % xlsx_final)\n            print(\"报告写入失败：%s\" % msg)\n            print(\"报告缺失不影响 Excel 数据；可用 --force 重跑一次补齐报告。\")\n            print(\"注意：这不是整体成功，已发布的 Excel 为本次有效输出，予以保留（不回滚）。\")\n            return 1\n        temps.remove(report_tmp)\n        try:\n            os.unlink(report_tmp)\n        except FileNotFoundError:\n            pass\n\n        print(report)\n        print(\"输出文件：%s\" % xlsx_final)\n        print(\"报告文件：%s\" % report_final)\n        return 0\n    finally:\n        for t in temps:  # 只删除本次创建的临时文件\n            try:\n                os.unlink(t)\n            except OSError:\n                pass\n\n\nif __name__ == \"__main__\":\n    sys.exit(main())\n"
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
