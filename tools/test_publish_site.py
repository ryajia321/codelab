#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""check_site.py 自动化测试。
- 用临时目录构造各种合格/不合格的站点，不碰真实文件。
- 自带示例站（tutorials/web-publish-site/site）必须通过自检。
- 用法：python3 tools/test_publish_site.py（在 codelab-site 目录下执行）"""
import os
import shutil
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRIPT = os.path.join(ROOT, "tutorials", "web-publish-site", "check_site.py")
SAMPLE = os.path.join(ROOT, "tutorials", "web-publish-site", "site")
HOME = os.path.expanduser("~")
PASS, FAIL = 0, 0

def ok(n): globals()["PASS"] += 1; print("PASS", n)
def bad(n, w): globals()["FAIL"] += 1; print("FAIL", n, "--", w)

def run(site):
    p = subprocess.run([sys.executable, SCRIPT, site], capture_output=True, text=True)
    return p.returncode, p.stdout + p.stderr

GOOD = """<!DOCTYPE html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width">
<title>好站点</title><link rel="stylesheet" href="style.css"></head>
<body><h1>标题</h1></body></html>"""

def main():
    global PASS, FAIL
    with tempfile.TemporaryDirectory(prefix="codelab-pub-test-", dir=HOME) as BASE:
        def site(name, files):
            d = os.path.join(BASE, name)
            os.makedirs(d)
            for rel, content in files.items():
                p = os.path.join(d, rel)
                os.makedirs(os.path.dirname(p), exist_ok=True)
                open(p, "w", encoding="utf-8").write(content)
            return d

        # 1. 自带示例站通过自检
        rc, out = run(SAMPLE)
        if rc == 0 and "全部通过" in out: ok("1.自带示例站通过自检")
        else: bad("1.示例站", "rc=%d out=%s" % (rc, out[:120]))

        # 2. 合格站点
        d = site("t2", {"index.html": GOOD, "style.css": "body{}"})
        rc, out = run(d)
        if rc == 0 and "0 个错误" in out: ok("2.合格站点通过")
        else: bad("2.合格", "rc=%d" % rc)

        # 3. 缺 index.html
        d = site("t3", {"style.css": "body{}"})
        rc, out = run(d)
        if rc == 1 and "index.html" in out: ok("3.缺index.html报错")
        else: bad("3.缺入口", "rc=%d" % rc)

        # 4. 缺 title
        d = site("t4", {"index.html": GOOD.replace("<title>好站点</title>", "")})
        rc, out = run(d)
        if rc == 1 and "title" in out: ok("4.缺title报错")
        else: bad("4.缺title", "rc=%d" % rc)

        # 5. 缺 h1
        d = site("t5", {"index.html": GOOD.replace("<h1>标题</h1>", "<h2>标题</h2>")})
        rc, out = run(d)
        if rc == 1 and "h1" in out: ok("5.缺h1报错")
        else: bad("5.缺h1", "rc=%d" % rc)

        # 6. 引用了不存在的文件
        d = site("t6", {"index.html": GOOD.replace("style.css", "nope.css")})
        rc, out = run(d)
        if rc == 1 and "nope.css" in out: ok("6.引用缺失文件报错")
        else: bad("6.缺引用", "rc=%d" % rc)

        # 7. 本机绝对路径
        d = site("t7", {"index.html": GOOD.replace("</body>", '<img src="file:///C:/a.png"></body>')})
        rc, out = run(d)
        if rc == 1 and "绝对路径" in out: ok("7.本机绝对路径报错")
        else: bad("7.绝对路径", "rc=%d" % rc)

        # 8. 缺 viewport → 警告但通过
        d = site("t8", {"index.html": GOOD.replace('<meta name="viewport" content="width=device-width">\n', ""),
                         "style.css": "body{}"})
        rc, out = run(d)
        if rc == 0 and "viewport" in out and "1 个警告" in out: ok("8.缺viewport警告但通过")
        else: bad("8.viewport", "rc=%d" % rc)

        # 9. 目录不存在
        rc, out = run(os.path.join(BASE, "nope"))
        if rc == 2 and "不存在" in out: ok("9.目录不存在exit2")
        else: bad("9.目录", "rc=%d" % rc)

        # 10. 无参数
        p = subprocess.run([sys.executable, SCRIPT], capture_output=True, text=True)
        if p.returncode == 2 and "用法" in p.stdout: ok("10.无参数提示用法")
        else: bad("10.用法", "rc=%d" % p.returncode)

    print("\n==== 共 %d 通过, %d 失败 ====" % (PASS, FAIL))
    return 1 if FAIL else 0

if __name__ == "__main__":
    sys.exit(main())
