#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
网站发布前检查 v1.0
在推送到 GitHub 之前，先在本地检查网站文件齐不齐、写得对不对，
避免"传上去才发现首页 404"的尴尬。

检查项：
  1. index.html 必须存在（网站入口）；
  2. 必须有 <title>（浏览器标签页显示它）；
  3. 必须有 <h1>（页面主标题）；
  4. 引用的 style.css / script.js 等本地文件必须真实存在；
  5. 不得出现本机绝对路径（C:\\...、file://），否则传上去别人打不开；
  6. 建议：有 <meta name="viewport">（手机能正常看）。

用法：python3 check_site.py 网站目录
退出码：0 全部通过；1 有错误；2 用法错误。
"""
import os
import re
import sys

HREF_SRC_RE = re.compile(r'''(?:href|src)\s*=\s*["']([^"'#]+)["']''', re.IGNORECASE)
TITLE_RE = re.compile(r"<title[^>]*>(.*?)</title>", re.IGNORECASE | re.DOTALL)
H1_RE = re.compile(r"<h1[^>]*>", re.IGNORECASE)
VIEWPORT_RE = re.compile(r'<meta[^>]*name\s*=\s*["\']viewport["\']', re.IGNORECASE)
LOCAL_ABS_RE = re.compile(r"(file://|[A-Za-z]:[\\/]|\\\\)")


def main():
    if len(sys.argv) != 2:
        print("用法：python3 check_site.py 网站目录")
        return 2
    site = os.path.realpath(sys.argv[1])
    if not os.path.isdir(site):
        print("目录不存在：%s" % sys.argv[1])
        return 2

    errors, warns = [], []
    index = os.path.join(site, "index.html")
    if not os.path.isfile(index):
        errors.append("缺少 index.html——这是网站的入口文件，没有它访问会 404。")
        print("❌ " + errors[0])
        print("\n检查结果：%d 个错误，%d 个警告" % (len(errors), len(warns)))
        return 1

    html = open(index, encoding="utf-8", errors="replace").read()

    m = TITLE_RE.search(html)
    if not m or not m.group(1).strip():
        errors.append("index.html 没有 <title>，浏览器标签页会显示空白。")
    if not H1_RE.search(html):
        errors.append("index.html 没有 <h1> 主标题，页面会显得没有重点。")

    # 引用的本地文件必须存在
    for ref in sorted(set(HREF_SRC_RE.findall(html))):
        if ref.startswith(("http://", "https://", "//", "data:", "mailto:", "tel:")):
            continue
        target = os.path.realpath(os.path.join(site, ref.split("?")[0]))
        if target != site and not target.startswith(site + os.sep):
            errors.append("引用了站外文件：%s（发布后可能失效）" % ref)
        elif not os.path.isfile(target):
            errors.append("引用了不存在的文件：%s" % ref)

    # 本机绝对路径
    bad = sorted(set(LOCAL_ABS_RE.findall(html)))
    if bad or "file://" in html.lower():
        errors.append("出现了本机绝对路径（如 C:\\ 或 file://），传到网上后别人打不开。")

    if not VIEWPORT_RE.search(html):
        warns.append("建议加 <meta name=\"viewport\">，否则手机上看会挤成一团。")

    for e in errors:
        print("❌ " + e)
    for w in warns:
        print("⚠️ " + w)
    print("\n检查结果：%d 个错误，%d 个警告" % (len(errors), len(warns)))
    if not errors and not warns:
        print("✅ 全部通过，可以发布了！")
    elif not errors:
        print("✅ 没有错误，可以发布（警告不强制）。")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
