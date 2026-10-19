#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
网页信息小助手 v1.0
输入一个公开网页的网址，抓取后输出 Markdown 报告：标题、简介、正文摘要、链接列表。

只做"公开信息"的搬运工，不做"撬锁"的事：
  1. 只允许 http:// 和 https://（file://、ftp:// 等一律拒绝）；
  2. 只抓公开页面——遇到需要登录、验证码、403 拒绝访问时直接停手，
     绝不伪造身份、换 UA 伪装、绕验证；
  3. 请求带超时（默认 10 秒）、大小上限（默认 2MB），不把目标网站当压力测试；
  4. 输出写到 演示目录/输出/，默认不覆盖，原子写入。

依赖：pip install requests
用法：
  python3 fetch_page.py 演示目录 https://www.python.org --check
  python3 fetch_page.py 演示目录 https://www.python.org
  python3 fetch_page.py 演示目录 https://www.python.org --output 报告.md [--force]
退出码：0 成功；1 抓取/解析失败；2 用法或安全拒绝。
"""
import argparse
import os
import sys
import tempfile
from datetime import datetime
from html.parser import HTMLParser
from urllib.parse import urljoin, urlparse

import requests

MAX_BYTES = 2 * 1024 * 1024      # 单次抓取上限 2MB
MAX_LINKS = 50                    # 报告中最多收录链接数
TEXT_PREVIEW = 500                # 正文摘要字数
TIMEOUT_DEFAULT = 10
UA = "CodeLab-Tutorial-Bot/1.0 (learning project; contact: example@example.com)"


def real_home():
    return os.path.realpath(os.path.expanduser("~"))


def check_demo(demo):
    if os.path.islink(demo):
        return None, "拒绝：入口不能是符号链接（当前：%s）" % demo
    demo = os.path.realpath(demo)
    if not os.path.isdir(demo):
        return None, "目录不存在：%s" % demo
    home = real_home()
    if demo == os.path.sep:
        return None, "拒绝：不能使用系统根目录"
    if demo == home:
        return None, "拒绝：不能直接使用用户主目录，请指定主目录下的演示目录"
    if not demo.startswith(home + os.sep):
        return None, "拒绝：只能使用用户主目录内的演示目录（当前：%s）" % demo
    return demo, None


def check_url(url):
    """只允许 http/https。返回 (None, 错误信息) 或 (规范化url, None)。"""
    u = url.strip()
    p = urlparse(u)
    if p.scheme not in ("http", "https"):
        return None, "拒绝：只支持 http:// 和 https:// 开头的公开网址（当前：%s）" % url
    if not p.netloc:
        return None, "拒绝：网址格式不正确（%s）" % url
    return u, None


class PageParser(HTMLParser):
    """提取标题、meta description、正文文本、链接。"""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.title_parts = []
        self.description = ""
        self.text_parts = []
        self.links = []  # [(文本, href原文)]
        self._in_title = False
        self._in_a = -1
        self._in_body_text = True
        self._skip_depth = 0  # script/style/noscript 内跳过

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag in ("script", "style", "noscript"):
            self._skip_depth += 1
            return
        if tag == "title":
            self._in_title = True
        if tag == "meta" and attrs.get("name", "").lower() == "description":
            self.description = attrs.get("content", "").strip()
        if tag == "a":
            href = attrs.get("href", "").strip()
            if href:
                self.links.append([href, ""])  # 文本稍后填
                self._in_a = len(self.links) - 1
            else:
                self._in_a = -1

    def handle_endtag(self, tag):
        if tag in ("script", "style", "noscript") and self._skip_depth:
            self._skip_depth -= 1
        if tag == "title":
            self._in_title = False
        if tag == "a":
            self._in_a = -1

    def handle_data(self, data):
        if self._skip_depth:
            return
        s = data.strip()
        if not s:
            return
        if self._in_title:
            self.title_parts.append(s)
        else:
            self.text_parts.append(s)
            if getattr(self, "_in_a", -1) >= 0:
                self.links[self._in_a][1] += s

    @property
    def title(self):
        return "".join(self.title_parts).strip()

    @property
    def text(self):
        # 合并空白，避免超长空白串
        return " ".join(" ".join(self.text_parts).split())


def clean_links(raw_links, base_url):
    """绝对化、去重（保序）、只留 http/https，最多 MAX_LINKS 个。"""
    seen, out = set(), []
    for href, text in raw_links:
        if not href or href.startswith(("#", "javascript:", "mailto:", "tel:")):
            continue
        abs_url = urljoin(base_url, href)
        p = urlparse(abs_url)
        if p.scheme not in ("http", "https"):
            continue
        if abs_url in seen:
            continue
        seen.add(abs_url)
        out.append((text.strip() or abs_url, abs_url))
        if len(out) >= MAX_LINKS:
            break
    return out


def fetch(url, timeout):
    """抓取页面。返回 (html_text, info) 或抛出带中文信息的异常。"""
    try:
        r = requests.get(url, headers={"User-Agent": UA}, timeout=timeout, stream=True)
    except requests.exceptions.Timeout:
        raise RuntimeError("请求超时（%d 秒无响应），目标网站可能很慢或不可达" % timeout)
    except requests.exceptions.ConnectionError as e:
        raise RuntimeError("连接失败：%s（检查网址是否正确、网络是否通畅）" % e)
    except requests.exceptions.RequestException as e:
        raise RuntimeError("请求失败：%s" % e)
    try:
        if r.status_code == 403:
            raise RuntimeError("目标网站拒绝访问（403）。这是网站的自我保护，"
                               "不要尝试伪装身份或绕过，换公开页面再试。")
        if r.status_code == 404:
            raise RuntimeError("页面不存在（404），检查网址是否正确。")
        if r.status_code >= 400:
            raise RuntimeError("目标网站返回错误状态码 %d" % r.status_code)
        ctype = r.headers.get("Content-Type", "")
        if "text/html" not in ctype and "text/" not in ctype and "xml" not in ctype:
            raise RuntimeError("不是网页文本（Content-Type: %s），本工具只处理网页" % (ctype or "未知"))
        length = r.headers.get("Content-Length")
        if length and length.isdigit() and int(length) > MAX_BYTES:
            raise RuntimeError("页面太大（声明 %s 字节，超过 %dMB 上限），拒绝下载" % (length, MAX_BYTES // 1024 // 1024))
        buf = []
        total = 0
        for chunk in r.iter_content(chunk_size=65536, decode_unicode=True):
            if chunk:
                total += len(chunk.encode("utf-8", "ignore"))
                if total > MAX_BYTES:
                    raise RuntimeError("页面太大（超过 %dMB 上限），已停止下载" % (MAX_BYTES // 1024 // 1024))
                buf.append(chunk)
        html = "".join(buf)
        # 修正编码：requests 按 header 猜，错了就用 apparent_encoding 再试
        if r.encoding and "�" in html[:2000]:
            html = r.content.decode(r.apparent_encoding or "utf-8", errors="replace")
        return html, {"status": r.status_code, "url": r.url}
    finally:
        r.close()


def build_report(url, info, title, description, text, links):
    L = []
    L.append("# 网页信息报告")
    L.append("")
    L.append("- 网址：%s" % url)
    L.append("- 实际地址：%s" % info["url"])
    L.append("- 获取时间：%s" % datetime.now().strftime("%Y-%m-%d %H:%M"))
    L.append("- 状态码：%s" % info["status"])
    L.append("- 标题：%s" % (title or "（无标题）"))
    L.append("- 简介：%s" % (description or "（无简介）"))
    L.append("")
    L.append("## 正文摘要（前 %d 字）" % TEXT_PREVIEW)
    L.append("")
    L.append(text[:TEXT_PREVIEW] or "（无正文）")
    L.append("")
    L.append("## 链接（共 %d 个）" % len(links))
    L.append("")
    for text_, href in links:
        short = text_ if len(text_) <= 40 else text_[:40] + "…"
        L.append("- [%s](%s)" % (short.replace("[", "［").replace("]", "］"), href))
    L.append("")
    return "\n".join(L)


def main():
    ap = argparse.ArgumentParser(description="抓取公开网页信息并生成 Markdown 报告")
    ap.add_argument("demo_dir", help="演示目录路径")
    ap.add_argument("url", help="要抓取的公开网页网址（http/https）")
    ap.add_argument("--output", default="网页信息.md", help="输出文件名（位于演示目录/输出/ 下）")
    ap.add_argument("--check", action="store_true", help="只在终端显示摘要，不创建任何文件")
    ap.add_argument("--timeout", type=int, default=TIMEOUT_DEFAULT, help="请求超时秒数（默认 10）")
    ap.add_argument("--force", action="store_true", help="允许覆盖已存在的输出文件")
    a = ap.parse_args()

    demo, err = check_demo(a.demo_dir)
    if err:
        print(err)
        return 2
    url, err = check_url(a.url)
    if err:
        print(err)
        return 2
    if a.timeout <= 0 or a.timeout > 120:
        print("拒绝：超时秒数应在 1–120 之间。")
        return 2

    try:
        html, info = fetch(url, a.timeout)
    except RuntimeError as e:
        print("抓取失败：%s" % e)
        return 1
    except Exception as e:
        print("抓取失败（未预期错误）：%s" % e)
        return 1

    parser = PageParser()
    try:
        parser.feed(html)
    except Exception as e:
        print("解析失败：%s" % e)
        return 1
    links = clean_links(parser.links, info["url"])
    report = build_report(url, info, parser.title, parser.description, parser.text, links)

    if a.check:
        # 严格零写入：打印摘要
        print("标题：%s" % (parser.title or "（无）"))
        print("简介：%s" % (parser.description[:80] or "（无）"))
        print("正文前100字：%s" % parser.text[:100])
        print("链接数：%d" % len(links))
        for text_, href in links[:5]:
            print("  - %s" % href)
        return 0

    out_dir = os.path.realpath(os.path.join(demo, "输出"))
    os.makedirs(out_dir, exist_ok=True)
    final = os.path.realpath(os.path.join(out_dir, os.path.basename(a.output)))
    if final != out_dir and not final.startswith(out_dir + os.sep):
        print("拒绝：输出文件名不能包含路径（%s）" % a.output)
        return 2
    if os.path.islink(final):
        print("拒绝：输出目标本身是符号链接：%s" % a.output)
        return 2
    if os.path.lexists(final) and not a.force:
        print("输出文件已存在，拒绝覆盖：%s\n请用 --output 换名，或确认要覆盖时加 --force。" % final)
        return 1

    fd, tmp = tempfile.mkstemp(dir=out_dir, prefix=".fetch-", suffix=".md")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            f.write(report)
        if a.force and os.path.lexists(final):
            os.replace(tmp, final)
        else:
            try:
                os.link(tmp, final)
            except FileExistsError:
                print("输出文件已存在，拒绝覆盖：%s" % final)
                return 1
        print("报告已生成：%s" % final)
        print("标题：%s" % (parser.title or "（无）"))
        print("链接数：%d" % len(links))
        return 0
    finally:
        try:
            os.unlink(tmp)
        except OSError:
            pass


if __name__ == "__main__":
    sys.exit(main())
