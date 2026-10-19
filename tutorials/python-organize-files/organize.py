#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
文件整理小助手 v1.0
把演示文件夹里的文件按类型分到子文件夹。
安全策略（保守默认）：
  1. 默认只预览，不加 --apply 不动任何文件；
  2. 只整理【指定演示文件夹】的顶层文件，不递归进子目录；
  3. 不删除任何文件；目标已有同名文件时跳过（不覆盖），并给出提示；
  4. 拒绝整理系统根目录和用户主目录本身。
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


def check_dir(demo_dir):
    """安全检查：目录必须存在，且不能是系统根目录或用户主目录本身。"""
    demo_dir = os.path.abspath(demo_dir)
    if not os.path.isdir(demo_dir):
        return None, "目录不存在：%s" % demo_dir
    home = os.path.expanduser("~")
    if demo_dir in ("/", home) or not demo_dir.startswith(home + os.sep):
        return None, "拒绝：只能整理用户主目录下的演示文件夹（当前：%s）" % demo_dir
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
        dst = os.path.join(dst_dir, name)
        if os.path.exists(dst):
            skipped.append((name, "目标文件夹已有同名文件，跳过（不覆盖）"))
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


def do_apply(demo_dir, moves):
    ok, fail = 0, []
    for src, dst, folder in moves:
        try:
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            if os.path.exists(dst):
                # 二次确认：预览和执行之间若出现同名文件，依然不覆盖
                fail.append((src, "目标已存在同名文件，跳过"))
                continue
            shutil.move(src, dst)
            ok += 1
        except PermissionError:
            fail.append((src, "没有权限"))
        except OSError as e:
            fail.append((src, "移动失败：%s" % e))
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
