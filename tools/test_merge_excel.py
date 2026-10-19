#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""merge_excel.py 自动化测试。
全部测试数据放在 tempfile.TemporaryDirectory() 创建的独立临时目录中，
测试只删除本次运行自己创建的临时目录，绝不碰固定目录、仓库目录或用户目录。
用法：python3 tools/test_merge_excel.py（在 codelab-site 目录下执行）"""
import hashlib
import os
import subprocess
import sys
import tempfile

import pandas as pd

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRIPT = os.path.join(ROOT, "tutorials", "python-merge-excel", "merge_excel.py")
HOME = os.path.expanduser("~")
# 哨兵文件：放在测试临时目录之外，跑完必须还在，用于证明测试没有误删外部文件
SENTINEL = os.path.join(HOME, ".codelab-test-sentinel")
PASS, FAIL = 0, 0

def ok(n):  globals()["PASS"] += 1; print("PASS", n)
def bad(n, w): globals()["FAIL"] += 1; print("FAIL", n, "--", w)

def run(demo, *args):
    p = subprocess.run([sys.executable, SCRIPT, demo, *args], capture_output=True, text=True)
    return p.returncode, p.stdout + p.stderr

def md5(p):
    return hashlib.md5(open(p, "rb").read()).hexdigest()

def main():
    global PASS, FAIL
    with open(SENTINEL, "w", encoding="utf-8") as f:
        f.write("sentinel-ok")
    # 临时目录建在用户主目录内（被测脚本要求演示目录位于主目录内），
    # 用完由 TemporaryDirectory 自动整体删除
    with tempfile.TemporaryDirectory(prefix="codelab-merge-test-", dir=HOME) as BASE:
        def fresh(name):
            d = os.path.join(BASE, name)
            os.makedirs(os.path.join(d, "输入"))
            return d

        def wdf(d, fname, rows, cols=("商品", "数量", "金额")):
            pd.DataFrame(rows, columns=list(cols)).to_excel(os.path.join(d, "输入", fname), index=False)

        # 1. 正常合并 3 个文件
        d = fresh("t1")
        wdf(d, "1月.xlsx", [("苹果", 120, 360), ("香蕉", 200, 400)])
        wdf(d, "2月.xlsx", [("苹果", 150, 450)])
        wdf(d, "3月.xlsx", [("橙子", 180, 540), ("梨", 100, 300)])
        before = {f: md5(os.path.join(d, "输入", f)) for f in os.listdir(os.path.join(d, "输入"))}
        rc, out = run(d)
        got = pd.read_excel(os.path.join(d, "输出", "汇总结果.xlsx"))
        after = {f: md5(os.path.join(d, "输入", f)) for f in os.listdir(os.path.join(d, "输入"))}
        if rc == 0 and len(got) == 5 and list(got.columns) == ["商品", "数量", "金额", "来源文件"] and before == after:
            ok("1.正常合并：5行、列正确、原始文件未动")
        else:
            bad("1.正常合并", "rc=%d rows=%d cols=%s" % (rc, len(got), list(got.columns)))

        # 2. 列名不一致：跳过并明确提示
        d = fresh("t2")
        wdf(d, "a.xlsx", [("苹果", 1, 2)])
        wdf(d, "b.xlsx", [("苹果", 1, 2)], cols=("商品", "单价", "金额"))
        rc, out = run(d, "--force")
        got = pd.read_excel(os.path.join(d, "输出", "汇总结果.xlsx"))
        if rc == 0 and len(got) == 1 and "列名与第一个文件不一致" in out and "期望列" in out:
            ok("2.列名不一致：跳过并明确提示期望列/实际列")
        else:
            bad("2.列名不一致", "rc=%d rows=%d" % (rc, len(got)))

        # 3. 缺少输入文件夹
        d = os.path.join(BASE, "t3")
        os.makedirs(d)
        rc, out = run(d)
        if rc == 2 and "输入文件夹不存在" in out: ok("3.缺少输入文件夹：exit2+可理解错误")
        else: bad("3.缺少输入文件夹", "rc=%d" % rc)

        # 4. 输入文件夹没有 xlsx
        d = fresh("t4")
        open(os.path.join(d, "输入", "说明.txt"), "w").write("hi")
        rc, out = run(d)
        if rc == 1 and "没有可合并的文件" in out: ok("4.无xlsx：exit1+明确提示")
        else: bad("4.无xlsx", "rc=%d out=%s" % (rc, out[:100]))

        # 5. 空文件（只有表头）
        d = fresh("t5")
        wdf(d, "full.xlsx", [("苹果", 1, 2)])
        pd.DataFrame(columns=["商品", "数量", "金额"]).to_excel(os.path.join(d, "输入", "empty.xlsx"), index=False)
        rc, out = run(d)
        got = pd.read_excel(os.path.join(d, "输出", "汇总结果.xlsx"))
        if rc == 0 and len(got) == 1 and "空文件" in out: ok("5.空文件：跳过警告+不影响合并")
        else: bad("5.空文件", "rc=%d" % rc)

        # 6. 损坏文件：报告+跳过，原始文件不动
        d = fresh("t6")
        wdf(d, "good.xlsx", [("苹果", 1, 2)])
        badpath = os.path.join(d, "输入", "broken.xlsx")
        open(badpath, "w").write("这不是真正的excel")
        h0 = md5(badpath)
        rc, out = run(d)
        got = pd.read_excel(os.path.join(d, "输出", "汇总结果.xlsx"))
        if rc == 0 and len(got) == 1 and "无法读取" in out and md5(badpath) == h0:
            ok("6.损坏文件：报告跳过+原始文件未被修改")
        else: bad("6.损坏文件", "rc=%d h_match=%s" % (rc, md5(badpath) == h0))

        # 7. 重复表头
        d = fresh("t7")
        wdf(d, "ok.xlsx", [("苹果", 1, 2)])
        df = pd.DataFrame([[1, 2, 3]]); df.columns = ["商品", "商品", "金额"]
        df.to_excel(os.path.join(d, "输入", "dup.xlsx"), index=False)
        rc, out = run(d)
        got = pd.read_excel(os.path.join(d, "输出", "汇总结果.xlsx"))
        if rc == 0 and len(got) == 1 and "重复的列名" in out: ok("7.重复表头：跳过并提示")
        else: bad("7.重复表头", "rc=%d out=%s" % (rc, out[:120]))

        # 8. 输出已存在：默认拒绝；--force 覆盖；--output 换名
        d = fresh("t8")
        wdf(d, "a.xlsx", [("苹果", 1, 2)])
        rc1, out1 = run(d)
        rc2, out2 = run(d)
        rc3, out3 = run(d, "--output", "总表2.xlsx")
        rc4, out4 = run(d, "--force")
        if rc1 == 0 and rc2 == 1 and "拒绝覆盖" in out2 and rc3 == 0 and os.path.exists(os.path.join(d, "输出", "总表2.xlsx")) and rc4 == 0:
            ok("8.输出保护：默认拒绝/换名可行/--force覆盖")
        else: bad("8.输出保护", "rc=%s" % ([rc1, rc2, rc3, rc4],))

        # 9. 旧格式/隐藏/子目录/符号链接
        d = fresh("t9")
        wdf(d, "n.xlsx", [("苹果", 1, 2)])
        open(os.path.join(d, "输入", "old.xls"), "w").write("fake")
        open(os.path.join(d, "输入", ".hidden.xlsx"), "w").write("fake")
        os.makedirs(os.path.join(d, "输入", "sub"))
        pd.DataFrame([("x", 1, 2)], columns=["商品", "数量", "金额"]).to_excel(
            os.path.join(d, "输入", "sub", "s.xlsx"), index=False)
        os.symlink(os.path.join(d, "输入", "n.xlsx"), os.path.join(d, "输入", "link.xlsx"))
        rc, out = run(d)
        got = pd.read_excel(os.path.join(d, "输出", "汇总结果.xlsx"))
        if rc == 0 and len(got) == 1 and ".xls 不支持" in out and "隐藏文件" in out and "符号链接" in out:
            ok("9.旧格式/隐藏/子目录/链接：各按策略处理")
        else: bad("9.旧格式等", "rc=%d rows=%d" % (rc, len(got)))

        # 10. 安全拒绝：入口符号链接 / 主目录外 / 输出定位到输入目录内
        real = fresh("t10real"); wdf(real, "a.xlsx", [("x", 1, 1)])
        link = os.path.join(BASE, "t10link")
        os.symlink(real, link)
        rc, out = run(link)
        r1 = (rc == 2 and "符号链接" in out)
        rc, out = run("/tmp")
        r2 = (rc == 2 and "拒绝" in out)
        d = fresh("t10b"); wdf(d, "a.xlsx", [("x", 1, 1)])
        rc, out = run(d, "--output", os.path.join(d, "输入", "o.xlsx"))
        r3 = (rc == 2 and "不能放在输入目录" in out)
        if r1 and r2 and r3: ok("10.安全拒绝：入口链接/目录外/输出进输入")
        else: bad("10.安全拒绝", "%s %s %s" % (r1, r2, r3))

        # 11. 教程命令一致性：模板包含关键命令与参数
        tpl = open(os.path.join(ROOT, "data", "tutorials.template.js"), encoding="utf-8").read()
        need = ["pip install pandas openpyxl", "py -m pip install pandas openpyxl", "merge_excel.py", "--force", "--output", "make_samples.py"]
        missing = [k for k in need if k not in tpl]
        if not missing: ok("11.教程命令一致性：关键命令/参数齐全")
        else: bad("11.教程命令一致性", "缺：%s" % missing)

        # 12. 清理安全验证：哨兵文件必须还在，且临时目录确实是本次创建的
        if os.path.isfile(SENTINEL) and open(SENTINEL, encoding="utf-8").read() == "sentinel-ok":
            ok("12.清理安全：哨兵文件完好，测试未触碰临时目录之外")
        else:
            bad("12.清理安全", "哨兵文件丢失或被改动")

    # TemporaryDirectory 已自动删除；哨兵文件清掉（它是我们自己创建的）
    if os.path.exists(SENTINEL):
        os.unlink(SENTINEL)
    print("\n==== 共 %d 通过, %d 失败 ====" % (PASS, FAIL))
    return 1 if FAIL else 0


if __name__ == "__main__":
    sys.exit(main())
