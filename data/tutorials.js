/* CodeLab 教程数据。教程 1 的代码与 tutorials/python-organize-files/organize.py（已实测）一致 */
window.TUTORIALS = [
{
id: "python-organize-files",
title: "用 Python 自动整理文件",
category: "Python 入门",
level: "零基础",
minutes: 45,
summary: "写一个真正能用的文件整理脚本：默认只预览，确认后才移动；同名不覆盖、不删文件、重复运行也安全。",
goals: [
"用 Python 读写文件夹、判断文件类型",
"理解「预览 → 确认 → 执行」的安全习惯",
"独立运行一个带命令行参数的小脚本",
"读懂报错信息并自己排查"
],
env: [
"电脑上装了 Python 3（任意 3.8 以上版本都行）",
"会打开终端（Mac 叫「终端」，Windows 叫 PowerShell 或 CMD）",
"本篇只用 Python 自带功能，不用安装任何第三方库"
],
steps: [
{
title: "检查 Python 装好了没",
body: "<p>先确认电脑上有 Python。打开终端，输入下面这行命令后按回车：</p>",
code: { lang: "bash", label: "终端", text: "python3 --version" },
expected: "看到类似 <code>Python 3.11.4</code> 的版本号就是成功。如果提示 command not found，说明没装或命令叫 <code>python</code>（不带 3），去 <a href=\"errors.html\">报错排查</a> 看第一条。"
},
{
title: "建一个演示文件夹（别拿真实文件夹练手）",
body: "<p>安全第一：<b>绝不在「下载」「桌面」等真实文件夹里做实验</b>。我们在主目录下建一个专门的演示文件夹，里面放几个假文件：</p>",
code: { lang: "bash", label: "终端", text: "mkdir -p ~/file-demo\ncd ~/file-demo\ntouch 假期照片.jpg 工作报告.pdf 演示视频.mp4 备忘.txt 旧笔记.md 神秘文件.xyz\nls" },
expected: "终端列出 6 个文件名。Windows 用户用 PowerShell 时，把 <code>touch</code> 换成 <code>ni</code>（例如 <code>ni 假期照片.jpg</code>），<code>ls</code> 换成 <code>dir</code>。"
},
{
title: "写整理脚本 organize.py",
body: "<p>在 <code>~/file-demo</code> 里新建文件 <code>organize.py</code>，把下面完整代码粘贴进去保存。先不用全看懂，重点看注释里的 4 条安全策略：</p><div class=\"tip\"><b>设计思路：</b>先算出「搬运计划」（哪个文件去哪个文件夹），打印出来给你看；你确认没问题，加 <code>--apply</code> 才真正搬。目标文件夹已有同名文件就跳过，永远不覆盖、不删除。</div>",
code: { lang: "python", label: "organize.py（完整代码）", text: "#!/usr/bin/env python3\n# -*- coding: utf-8 -*-\n\"\"\"\n文件整理小助手 v1.0\n把演示文件夹里的文件按类型分到子文件夹。\n安全策略（保守默认）：\n  1. 默认只预览，不加 --apply 不动任何文件；\n  2. 只整理【指定演示文件夹】的顶层文件，不递归进子目录；\n  3. 不删除任何文件；目标已有同名文件时跳过（不覆盖），并给出提示；\n  4. 拒绝整理系统根目录和用户主目录本身。\n用法：\n  python3 organize.py 演示文件夹的路径        # 只预览\n  python3 organize.py 演示文件夹的路径 --apply  # 真正执行移动\n\"\"\"\nimport argparse\nimport os\nimport shutil\nimport sys\n\n# 扩展名 -> 文件夹名（可按自己需求增删）\nRULES = {\n    \".jpg\": \"图片\", \".jpeg\": \"图片\", \".png\": \"图片\", \".gif\": \"图片\", \".webp\": \"图片\",\n    \".pdf\": \"文档\", \".docx\": \"文档\", \".doc\": \"文档\", \".txt\": \"文档\", \".md\": \"文档\",\n    \".xlsx\": \"文档\", \".csv\": \"文档\", \".pptx\": \"文档\",\n    \".mp4\": \"视频\", \".mov\": \"视频\", \".avi\": \"视频\",\n    \".mp3\": \"音频\", \".wav\": \"音频\",\n    \".zip\": \"压缩包\", \".rar\": \"压缩包\", \".7z\": \"压缩包\",\n    \".py\": \"代码\", \".js\": \"代码\", \".html\": \"代码\", \".css\": \"代码\",\n}\n\n\ndef check_dir(demo_dir):\n    \"\"\"安全检查：目录必须存在，且不能是系统根目录或用户主目录本身。\"\"\"\n    demo_dir = os.path.abspath(demo_dir)\n    if not os.path.isdir(demo_dir):\n        return None, \"目录不存在：%s\" % demo_dir\n    home = os.path.expanduser(\"~\")\n    if demo_dir in (\"/\", home) or not demo_dir.startswith(home + os.sep):\n        return None, \"拒绝：只能整理用户主目录下的演示文件夹（当前：%s）\" % demo_dir\n    return demo_dir, None\n\n\ndef make_plan(demo_dir):\n    \"\"\"生成整理计划：返回 (moves, skipped, error)。\n    moves: [(源路径, 目标路径, 文件夹名), ...]\n    skipped: [(文件名, 原因), ...]\n    \"\"\"\n    try:\n        entries = sorted(os.listdir(demo_dir))\n    except PermissionError:\n        return [], [], \"没有权限读取目录：%s\" % demo_dir\n    except OSError as e:\n        return [], [], \"读取目录失败：%s\" % e\n\n    self_name = os.path.basename(__file__)\n    moves, skipped = [], []\n    for name in entries:\n        src = os.path.join(demo_dir, name)\n        if os.path.isdir(src):\n            continue  # 不递归、不动子目录\n        if name == self_name:\n            continue  # 跳过脚本自己\n        if name.startswith(\".\"):\n            skipped.append((name, \"隐藏文件，保留原地\"))\n            continue\n        ext = os.path.splitext(name)[1].lower()\n        folder = RULES.get(ext)\n        if not folder:\n            skipped.append((name, \"未知类型，保留原地\"))\n            continue\n        dst_dir = os.path.join(demo_dir, folder)\n        dst = os.path.join(dst_dir, name)\n        if os.path.exists(dst):\n            skipped.append((name, \"目标文件夹已有同名文件，跳过（不覆盖）\"))\n            continue\n        moves.append((src, dst, folder))\n    return moves, skipped, None\n\n\ndef show_plan(moves, skipped):\n    print(\"===== 预览：计划移动 %d 个文件 =====\" % len(moves))\n    for src, dst, folder in moves:\n        print(\"  [%s] %s  ->  %s/\" % (folder, os.path.basename(src), folder))\n    if skipped:\n        print(\"===== 跳过 %d 个（不动） =====\" % len(skipped))\n        for name, reason in skipped:\n            print(\"  %s ：%s\" % (name, reason))\n    if not moves and not skipped:\n        print(\"文件夹已经是整理好的状态，无需操作。\")\n\n\ndef do_apply(demo_dir, moves):\n    ok, fail = 0, []\n    for src, dst, folder in moves:\n        try:\n            os.makedirs(os.path.dirname(dst), exist_ok=True)\n            if os.path.exists(dst):\n                # 二次确认：预览和执行之间若出现同名文件，依然不覆盖\n                fail.append((src, \"目标已存在同名文件，跳过\"))\n                continue\n            shutil.move(src, dst)\n            ok += 1\n        except PermissionError:\n            fail.append((src, \"没有权限\"))\n        except OSError as e:\n            fail.append((src, \"移动失败：%s\" % e))\n    print(\"===== 执行完毕：成功 %d 个，失败 %d 个 =====\" % (ok, len(fail)))\n    for src, reason in fail:\n        print(\"  %s ：%s\" % (os.path.basename(src), reason))\n    return 0 if not fail else 1\n\n\ndef main():\n    ap = argparse.ArgumentParser(description=\"整理演示文件夹（默认只预览）\")\n    ap.add_argument(\"demo_dir\", help=\"要整理的演示文件夹路径\")\n    ap.add_argument(\"--apply\", action=\"store_true\", help=\"真正执行移动；不加则只预览\")\n    a = ap.parse_args()\n\n    demo_dir, err = check_dir(a.demo_dir)\n    if err:\n        print(err)\n        return 2\n\n    moves, skipped, err = make_plan(demo_dir)\n    if err:\n        print(err)\n        return 1\n\n    if not a.apply:\n        print(\"【预览模式】没有移动任何文件。确认无误后加 --apply 真正执行。\\n\")\n        show_plan(moves, skipped)\n        return 0\n\n    print(\"【执行模式】开始移动文件…\\n\")\n    show_plan(moves, skipped)\n    print()\n    return do_apply(demo_dir, moves)\n\n\nif __name__ == \"__main__\":\n    sys.exit(main())\n" },
expected: "文件保存成功，终端执行 <code>ls ~/file-demo</code> 能看到 <code>organize.py</code>。"
},
{
title: "先预览，不直接动手",
body: "<p>进到演示文件夹，只预览（不加 <code>--apply</code>）：</p>",
code: { lang: "bash", label: "终端", text: "cd ~/file-demo\npython3 organize.py ." },
expected: "看到「【预览模式】没有移动任何文件」和搬运计划：5 个文件计划移动（图片/文档/视频），<code>神秘文件.xyz</code> 因未知类型被跳过。注意：这一步你的文件<b>一个都没动</b>，可以用 <code>ls</code> 验证。"
},
{
title: "确认无误，真正执行",
body: "<p>看过预览，计划没问题，再加 <code>--apply</code> 执行：</p>",
code: { lang: "bash", label: "终端", text: "python3 organize.py . --apply" },
expected: "看到「执行完毕：成功 5 个，失败 0 个」。再 <code>ls</code>：顶层只剩 <code>organize.py</code> 和 <code>神秘文件.xyz</code>，多了 <code>图片/</code><code>文档/</code><code>视频/</code> 三个文件夹。"
},
{
title: "验证结果 + 重复运行",
body: "<p>检查整理结果，然后故意再运行一次，看脚本是否足够「老实」：</p>",
code: { lang: "bash", label: "终端", text: "find . -type f | sort\npython3 organize.py . --apply" },
expected: "<code>find</code> 显示文件都进了对应文件夹。第二次运行显示「计划移动 0 个文件」——已经整理好的状态下脚本什么都不做，重复运行是安全的。"
}
],
errors: [
{ t: "python3: command not found", s: "终端不认识 python3 命令。", f: "先试 <code>python --version</code>。如果 python 也不行，去 python.org 下载安装（安装时勾选 Add to PATH）。" },
{ t: "目录不存在：xxx", s: "给的路径写错了，或文件夹不在那。", f: "先 <code>cd ~/file-demo</code> 再用 <code>pwd</code> 确认你在哪个目录，复制完整路径再试。" },
{ t: "拒绝：只能整理用户主目录下的演示文件夹", s: "你把 ~ 或 / 当参数传进去了。", f: "这是脚本的安全锁，故意的。只整理你建的演示文件夹。" },
{ t: "PermissionError / 没有权限", s: "文件正被别的程序占用，或你对该目录没有写权限。", f: "关掉占用文件的程序；不要拿系统目录做实验。" },
{ t: "中文显示乱码（Windows）", s: "CMD 默认编码不是 UTF-8。", f: "终端先执行 <code>chcp 65001</code> 切换到 UTF-8，再运行脚本。" }
],
checklist: [
"预览和执行两种模式都亲自跑过",
"看到同名文件被跳过、原文件没被覆盖",
"重复运行第二次显示 0 个移动",
"隐藏文件、未知类型文件、子目录里的文件都没被动",
"能说出 --apply 是干什么的"
],
exercises: [
"给 RULES 加一条：<code>\".epub\": \"电子书\"</code>，新建一个测试文件重跑，验证它进了「电子书」文件夹。",
"新建第二个演示文件夹，只放 3 个不同类型的文件，用脚本整理它。",
"故意在「文档」文件夹里预置一个同名文件，再跑一次，观察跳过提示。"
]
}
];
