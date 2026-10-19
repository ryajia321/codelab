#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
文件整理小助手 v1.1
把演示文件夹里的文件按类型分到子文件夹。

安全策略（保守默认）：
  1. 默认只预览，不加 --apply 不动任何文件；
  2. 只整理【指定演示文件夹】的顶层文件，不递归进子目录；
  3. 不删除任何文件；目标已存在（含失效符号链接）时跳过，绝不覆盖；
  4. 入口目录不能是符号链接；分类目标目录若是符号链接且指向允许范围外则跳过；
  5. 来源符号链接默认跳过（不跟随）；
  6. 拒绝整理系统根目录和用户主目录本身；目标必须位于用户主目录内
     （经 realpath 真实解析后再判断，不只看字符串前缀）；
  7. 执行时优先用硬链接的原子性避免覆盖（同文件系统），跨文件系统回退为
     “复查 + 移动”，此时存在理论上的竞态窗口（见下）。

已知限制（无法彻底消除，如实记录，不承诺绝对安全）：
  - 预览与执行之间，若有其他程序恰好在目标位置创建同名文件，执行阶段会
    重新检查并跳过，但检查与移动之间仍有极小的时间窗口；
  - 跨文件系统移动时 shutil.move 实际是“复制 + 删除源”，中途断电可能留下
    两份拷贝；本脚本不承诺跨文件系统的原子性；
  - 硬链接方式要求源与目标在同一文件系统（演示目录内建子目录时天然满足）。

用法：
  python3 organize.py 演示文件夹的路径        # 只预览
  python3 organize.py 演示文件夹的路径 --apply  # 真正执行移动
"""
import argparse
import os
import shutil
import sys

# 扩展名 -> 文件夹名（可按自己需求增删）
RULES = {
    ".jpg": "图片", ".jpeg": "图片", ".png": "图片", ".gif": "图片", ".webp": "图片",
    ".pdf": "文档", ".docx": "文档", ".doc": "文档", ".txt": "文档", ".md": "文档",
    ".xlsx": "文档", ".csv": "文档", ".pptx": "文档",
    ".mp4": "视频", ".mov": "视频", ".avi": "视频",
    ".mp3": "音频", ".wav": "音频",
    ".zip": "压缩包", ".rar": "压缩包", ".7z": "压缩包",
    ".py": "代码", ".js": "代码", ".html": "代码", ".css": "代码",
}


def real_home():
    return os.path.realpath(os.path.expanduser("~"))


def inside_home(path):
    """realpath 解析后的 path 是否位于用户主目录内（不含主目录本身）。"""
    home = real_home()
    return path != home and path.startswith(home + os.sep)


def check_dir(demo_dir):
    """返回 (真实路径, None) 或 (None, 错误信息)。"""
    # 明确拒绝符号链接入口：realpath 会把它解析掉，所以必须先检查
    if os.path.islink(demo_dir):
        return None, "拒绝：入口不能是符号链接（当前：%s）" % demo_dir
    demo_dir = os.path.realpath(demo_dir)
    if not os.path.isdir(demo_dir):
        return None, "目录不存在：%s" % demo_dir
    if demo_dir == os.path.sep:
        return None, "拒绝：不能整理系统根目录"
    if demo_dir == real_home():
        return None, "拒绝：不能直接整理用户主目录，请指定主目录下的演示文件夹"
    if not inside_home(demo_dir):
        return None, "拒绝：只能整理用户主目录内的演示文件夹（当前：%s）" % demo_dir
    return demo_dir, None


def make_plan(demo_dir):
    """生成整理计划：返回 (moves, skipped, error)。
    moves: [(源路径, 目标路径, 文件夹名), ...]
    skipped: [(文件名, 原因), ...]
    """
    try:
        entries = sorted(os.listdir(demo_dir))
    except PermissionError:
        return [], [], "没有权限读取目录：%s" % demo_dir
    except OSError as e:
        return [], [], "读取目录失败：%s" % e

    self_name = os.path.basename(__file__)
    moves, skipped = [], []
    for name in entries:
        src = os.path.join(demo_dir, name)
        # 来源符号链接：明确策略是跳过，不跟随（即使是失效链接也一样）
        if os.path.islink(src):
            skipped.append((name, "符号链接，默认跳过（不跟随）"))
            continue
        if os.path.isdir(src):
            continue  # 不递归、不动子目录
        if name == self_name:
            continue  # 跳过脚本自己
        if name.startswith("."):
            skipped.append((name, "隐藏文件，保留原地"))
            continue
        ext = os.path.splitext(name)[1].lower()
        folder = RULES.get(ext)
        if not folder:
            skipped.append((name, "未知类型，保留原地"))
            continue
        dst_dir = os.path.join(demo_dir, folder)
        # 分类目标目录若是符号链接：解析后必须仍在演示目录内，否则跳过
        if os.path.islink(dst_dir):
            real_dst = os.path.realpath(dst_dir)
            if real_dst != demo_dir and not real_dst.startswith(demo_dir + os.sep):
                skipped.append((name, "分类目录是符号链接且指向允许范围外，跳过"))
                continue
        dst = os.path.join(dst_dir, name)
        # lexists 含失效符号链接：目标占位即跳过，绝不覆盖
        if os.path.lexists(dst):
            skipped.append((name, "目标已存在（含失效链接），跳过（不覆盖）"))
            continue
        moves.append((src, dst, folder))
    return moves, skipped, None


def show_plan(moves, skipped):
    print("===== 预览：计划移动 %d 个文件 =====" % len(moves))
    for src, dst, folder in moves:
        print("  [%s] %s  ->  %s/" % (folder, os.path.basename(src), folder))
    if skipped:
        print("===== 跳过 %d 个（不动） =====" % len(skipped))
        for name, reason in skipped:
            print("  %s ：%s" % (name, reason))
    if not moves and not skipped:
        print("文件夹已经是整理好的状态，无需操作。")


def move_one(src, dst):
    """移动单个文件，返回 None 表示成功，否则返回失败原因。绝不覆盖目标。"""
    try:
        os.makedirs(os.path.dirname(dst), exist_ok=True)
    except OSError as e:
        return "创建目标文件夹失败：%s" % e
    # 执行前复查：预览与执行之间目标可能发生变化
    if os.path.lexists(dst):
        return "目标已存在，跳过（不覆盖）"
    try:
        # 同文件系统下硬链接是原子操作：目标已存在则直接抛错，杜绝覆盖
        os.link(src, dst)
    except FileExistsError:
        return "目标已存在，跳过（不覆盖）"
    except OSError:
        # 跨文件系统等极少情况回退为“复查 + 移动”（存在理论竞态窗口，见模块文档）
        try:
            if os.path.lexists(dst):
                return "目标已存在，跳过（不覆盖）"
            shutil.move(src, dst)
            return None
        except (OSError, shutil.Error) as e:
            return "移动失败：%s" % e
    try:
        os.unlink(src)
    except OSError as e:
        # 硬链接已建好、源删不掉：数据不丢，只是多了份拷贝，提示手动处理
        return "目标已建好但源文件删除失败，请手动删除源文件：%s" % e
    return None


def do_apply(demo_dir, moves):
    ok, fail = 0, []
    for src, dst, folder in moves:
        err = move_one(src, dst)
        if err is None:
            ok += 1
        else:
            fail.append((src, err))
    print("===== 执行完毕：成功 %d 个，失败 %d 个 =====" % (ok, len(fail)))
    for src, reason in fail:
        print("  %s ：%s" % (os.path.basename(src), reason))
    return 0 if not fail else 1


def main():
    ap = argparse.ArgumentParser(description="整理演示文件夹（默认只预览）")
    ap.add_argument("demo_dir", help="要整理的演示文件夹路径")
    ap.add_argument("--apply", action="store_true", help="真正执行移动；不加则只预览")
    a = ap.parse_args()

    demo_dir, err = check_dir(a.demo_dir)
    if err:
        print(err)
        return 2

    moves, skipped, err = make_plan(demo_dir)
    if err:
        print(err)
        return 1

    if not a.apply:
        print("【预览模式】没有移动任何文件。确认无误后加 --apply 真正执行。\n")
        show_plan(moves, skipped)
        return 0

    print("【执行模式】开始移动文件…\n")
    show_plan(moves, skipped)
    print()
    return do_apply(demo_dir, moves)


if __name__ == "__main__":
    sys.exit(main())
