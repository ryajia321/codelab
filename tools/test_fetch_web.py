#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""fetch_page.py 自动化测试。
- 本地 HTTP 服务（127.0.0.1 随机端口）提供 fixture 页面，不依赖外网。
- 目录：tempfile.TemporaryDirectory() 独立临时目录（主目录内）。
- 用法：python3 tools/test_fetch_web.py（在 codelab-site 目录下执行）"""
import hashlib
import os
import subprocess
import sys
import tempfile
import threading
import time
from http.server import BaseHTTPRequestHandler, HTTPServer

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRIPT = os.path.join(ROOT, "tutorials", "python-fetch-web", "fetch_page.py")
HOME = os.path.expanduser("~")
PASS, FAIL = 0, 0

FIXTURE = """<!DOCTYPE html><html><head><meta charset="utf-8">
<title>测试页面标题</title>
<meta name="description" content="这是一段测试简介。">
</head><body>
<script>var x = 1;</script>
<h1>正文第一段文字内容。</h1>
<p>正文第二段，更多文字。</p>
<a href="/page2">站内链接</a>
<a href="/page2">站内链接重复</a>
<a href="https://other.example/x">站外链接</a>
<a href="javascript:void(0)">坏链接</a>
<a href="mailto:a@b.c">邮件链接</a>
<a href="#frag">锚点</a>
</body></html>"""

BIG_BODY = b"x" * 100


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def do_GET(self):
        if self.path == "/ok":
            body = FIXTURE.encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        elif self.path == "/slow":
            time.sleep(5)
            try:
                self.send_response(200)
                self.send_header("Content-Type", "text/html")
                self.end_headers()
                self.wfile.write(b"<title>slow</title>")
            except (BrokenPipeError, ConnectionResetError):
                pass
        elif self.path == "/binary":
            self.send_response(200)
            self.send_header("Content-Type", "application/octet-stream")
            self.send_header("Content-Length", str(len(BIG_BODY)))
            self.end_headers()
            self.wfile.write(BIG_BODY)
        elif self.path == "/huge":
            self.send_response(200)
            self.send_header("Content-Type", "text/html")
            self.send_header("Content-Length", str(10 * 1024 * 1024))
            self.end_headers()
            self.wfile.write(b"<title>huge</title>")
        elif self.path == "/forbidden":
            self.send_response(403)
            self.end_headers()
        else:
            self.send_response(404)
            self.end_headers()


def ok(n): globals()["PASS"] += 1; print("PASS", n)
def bad(n, w): globals()["FAIL"] += 1; print("FAIL", n, "--", w)

def run(demo, *args):
    p = subprocess.run([sys.executable, SCRIPT, demo, *args], capture_output=True, text=True)
    return p.returncode, p.stdout + p.stderr

def tree(demo):
    files = {}
    for root, _, fs in os.walk(demo):
        for f in fs:
            rel = os.path.relpath(os.path.join(root, f), demo)
            files[rel] = hashlib.md5(open(os.path.join(root, f), "rb").read()).hexdigest()
    return files

def main():
    global PASS, FAIL
    srv = HTTPServer(("127.0.0.1", 0), Handler)
    port = srv.server_address[1]
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    base = "http://127.0.0.1:%d" % port
    try:
        with tempfile.TemporaryDirectory(prefix="codelab-fetch-test-", dir=HOME) as BASE:
            def fresh(name):
                d = os.path.join(BASE, name)
                os.makedirs(d)
                return d

            # 1. 抓取成功：标题/简介/正文/链接
            d = fresh("t1")
            rc, out = run(d, base + "/ok")
            rp = os.path.join(d, "输出", "网页信息.md")
            ok1 = rc == 0 and os.path.isfile(rp)
            txt = open(rp, encoding="utf-8").read() if ok1 else ""
            cond = (ok1 and "测试页面标题" in txt and "这是一段测试简介" in txt
                    and "正文第一段文字内容" in txt and "var x = 1" not in txt
                    and "http://127.0.0.1:%d/page2" % port in txt
                    and txt.count("page2") == 1  # 去重
                    and "javascript:" not in txt and "mailto:" not in txt)
            if cond: ok("1.抓取成功：标题/简介/正文/链接去重过滤")
            else: bad("1.抓取", "rc=%d" % rc)

            # 2. --check 零写入
            d = fresh("t2")
            before = tree(d)
            rc, out = run(d, base + "/ok", "--check")
            after = tree(d)
            if rc == 0 and before == after and "测试页面标题" in out and "链接数" in out:
                ok("2.--check零写入：文件树一致，终端有摘要")
            else: bad("2.--check", "rc=%d" % rc)

            # 3/4. 非 http(s) 拒绝
            d = fresh("t3")
            r1, o1 = run(d, "file:///etc/passwd")
            r2, o2 = run(d, "ftp://example.com/x")
            if r1 == 2 and r2 == 2 and "http" in o1:
                ok("3/4.file/ftp拒绝：exit2")
            else: bad("3/4.协议拒绝", "%d/%d" % (r1, r2))

            # 5. 404
            d = fresh("t5")
            rc, out = run(d, base + "/nope")
            if rc == 1 and "404" in out: ok("5.404中文提示")
            else: bad("5.404", "rc=%d" % rc)

            # 6. 超时
            d = fresh("t6")
            rc, out = run(d, base + "/slow", "--timeout", "1")
            if rc == 1 and "超时" in out: ok("6.超时中文提示")
            else: bad("6.超时", "rc=%d out=%s" % (rc, out[:80]))

            # 7. 非 HTML 拒绝
            d = fresh("t7")
            rc, out = run(d, base + "/binary")
            if rc == 1 and "Content-Type" in out: ok("7.非HTML拒绝")
            else: bad("7.非HTML", "rc=%d" % rc)

            # 8. 超大页面拒绝（Content-Length 预检）
            d = fresh("t8")
            rc, out = run(d, base + "/huge")
            if rc == 1 and "太大" in out: ok("8.超大页面拒绝")
            else: bad("8.超大", "rc=%d" % rc)

            # 9. 输出保护：拒绝覆盖 / --force
            d = fresh("t9")
            r1, _ = run(d, base + "/ok")
            r2, o2 = run(d, base + "/ok")
            r3, _ = run(d, base + "/ok", "--force")
            if r1 == 0 and r2 == 1 and "拒绝覆盖" in o2 and r3 == 0:
                ok("9.输出保护：拒绝/--force")
            else: bad("9.输出保护", "%s" % [r1, r2, r3])

            # 10. 403 提示不绕过
            d = fresh("t10")
            rc, out = run(d, base + "/forbidden")
            if rc == 1 and "403" in out and "绕过" in out:
                ok("10.403提示不绕过")
            else: bad("10.403", "rc=%d" % rc)

            # 11. 演示目录链接入口拒绝
            d = os.path.join(BASE, "t11link")
            os.symlink(BASE, d)
            rc, out = run(d, base + "/ok")
            if rc == 2 and "符号链接" in out: ok("11.演示目录链接入口拒绝")
            else: bad("11.入口链接", "rc=%d" % rc)

            # 12. 无临时残留
            d = fresh("t12")
            run(d, base + "/ok")
            left = [f for f in os.listdir(os.path.join(d, "输出")) if f.startswith(".fetch-")]
            if not left: ok("12.无临时残留")
            else: bad("12.残留", str(left))

            # 13. --output 换名
            d = fresh("t13")
            rc, out = run(d, base + "/ok", "--output", "我的报告.md")
            if rc == 0 and os.path.isfile(os.path.join(d, "输出", "我的报告.md")):
                ok("13.--output换名")
            else: bad("13.换名", "rc=%d" % rc)
    finally:
        srv.shutdown()
    print("\n==== 共 %d 通过, %d 失败 ====" % (PASS, FAIL))
    return 1 if FAIL else 0


if __name__ == "__main__":
    sys.exit(main())
