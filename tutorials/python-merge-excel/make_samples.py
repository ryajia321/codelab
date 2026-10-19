#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
生成 3 个示例 Excel（1月/2月/3月销售表），供《用 Python 汇总多个 Excel 表格》教程演示用。
数据为虚构示例，不含任何真实信息。

用法：python3 make_samples.py 演示目录
将在「演示目录/输入/」下生成 1月.xlsx、2月.xlsx、3月.xlsx（各 2 行，共 6 行）。
"""
import os
import sys

import pandas as pd


def main():
    demo = os.path.realpath(sys.argv[1]) if len(sys.argv) > 1 else os.path.expanduser("~/excel-demo")
    home = os.path.realpath(os.path.expanduser("~"))
    if demo == home or not demo.startswith(home + os.sep):
        print("拒绝：请指定主目录下的演示目录。")
        return 2
    in_dir = os.path.join(demo, "输入")
    os.makedirs(in_dir, exist_ok=True)

    samples = {
        "1月.xlsx": [("苹果", 120, 360), ("香蕉", 200, 400)],
        "2月.xlsx": [("苹果", 150, 450), ("橙子", 180, 540)],
        "3月.xlsx": [("香蕉", 220, 440), ("橙子", 160, 480)],
    }
    for fname, rows in samples.items():
        df = pd.DataFrame(rows, columns=["商品", "数量", "金额"])
        df.to_excel(os.path.join(in_dir, fname), index=False, engine="openpyxl")
        print("已生成 %s（%d 行）" % (fname, len(df)))
    print("共 6 行示例数据，放在：%s" % in_dir)
    return 0


if __name__ == "__main__":
    sys.exit(main())
