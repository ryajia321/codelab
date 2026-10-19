#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""query.html 自动化测试。
- 结构断言：关键元素与 API 调用、错误处理分支必须存在。
- 正则逻辑：从 HTML 中提取 validRepo 的正则原文，用同样规则验证。
- 线上冒烟：真实请求 api.github.com（网络不通则如实标记 SKIP，不记为通过）。
- 用法：python3 tools/test_github_query.py（在 codelab-site 目录下执行）"""
import json
import os
import re
import sys
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGE = os.path.join(ROOT, "tutorials", "web-github-query", "query.html")
PASS, FAIL, SKIP = 0, 0, 0

def ok(n): globals()["PASS"] += 1; print("PASS", n)
def bad(n, w): globals()["FAIL"] += 1; print("FAIL", n, "--", w)
def skip(n, w): globals()["SKIP"] += 1; print("SKIP", n, "--", w)

def main():
    global PASS, FAIL, SKIP
    if not os.path.isfile(PAGE):
        bad("文件存在", "query.html 缺失"); print("共 %d 通过" % PASS); return 1
    html = open(PAGE, encoding="utf-8").read()

    # 1. 关键结构
    need = ['id="repo"', 'id="btn"', 'id="msg"', 'id="card"',
            'https://api.github.com/repos/', '.then(', '.catch(',
            'stargazers_count', 'forks_count']
    missing = [k for k in need if k not in html]
    if not missing: ok("1.关键结构：输入框/按钮/结果卡/fetch调用/字段齐全")
    else: bad("1.结构", "缺: %s" % missing)

    # 2. 错误处理分支
    branches = ["404", "403", "validRepo", "addEventListener"]
    missing = [k for k in branches if k not in html]
    if not missing: ok("2.错误处理：404/403/输入校验/事件绑定")
    else: bad("2.分支", "缺: %s" % missing)

    # 3. validRepo 正则：从 HTML 提取原文并实测
    m = re.search(r"return /(\^.+?\$)/\.test", html)
    if not m:
        bad("3.正则提取", "未找到 validRepo 正则")
    else:
        pat = re.compile(m.group(1))
        cases = [
            ("ryajia321/codelab", True), ("a/b", True), ("my-name/my_repo.js", True),
            ("", False), ("abc", False), ("a/b/c", False), ("/b", False),
            ("a b/c", False), ("a/", False), ("../x", False),
        ]
        failed = [c for c, exp in cases if bool(pat.match(c)) != exp]
        if not failed: ok("3.validRepo正则：10组用例全对")
        else: bad("3.正则", "失败: %s" % failed)

    # 4. 无需密钥声明
    if "无需" in html and "60" in html: ok("4.频率限制如实说明")
    else: bad("4.说明", "缺频率限制提示")

    # 5. 线上冒烟（真实 API；网络不通则 SKIP，不记通过）
    try:
        req = urllib.request.Request(
            "https://api.github.com/repos/ryajia321/codelab",
            headers={"User-Agent": "CodeLab-Tutorial-Test/1.0", "Accept": "application/vnd.github+json"})
        with urllib.request.urlopen(req, timeout=15) as r:
            d = json.loads(r.read().decode("utf-8"))
        if r.status == 200 and isinstance(d.get("stargazers_count"), int) \
                and d.get("full_name", "").lower() == "ryajia321/codelab":
            ok("5.线上冒烟：api.github.com 真实返回仓库数据")
        else:
            bad("5.冒烟", "返回结构异常")
    except Exception as e:
        skip("5.线上冒烟", "网络不可达，未执行（%s）" % type(e).__name__)

    print("\n==== 共 %d 通过, %d 失败, %d 跳过 ====" % (PASS, FAIL, SKIP))
    return 1 if FAIL else 0

if __name__ == "__main__":
    sys.exit(main())
