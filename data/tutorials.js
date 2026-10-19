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
}
];
