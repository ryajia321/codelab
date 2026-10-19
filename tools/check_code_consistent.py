#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""检查 data/tutorials.js 是否与模板 + 各脚本一致（即是否忘记重新构建）。
用法：python3 tools/check_code_consistent.py；不一致则退出码 1。"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

PLACEHOLDERS = {
    '__ORGANIZE_PY__': os.path.join('tutorials', 'python-organize-files', 'organize.py'),
    '__MAKE_SAMPLES_PY__': os.path.join('tutorials', 'python-merge-excel', 'make_samples.py'),
    '__MERGE_EXCEL_PY__': os.path.join('tutorials', 'python-merge-excel', 'merge_excel.py'),
}

with open(os.path.join(ROOT, 'data', 'tutorials.template.js'), encoding='utf-8') as f:
    tpl = f.read()
for token, rel in PLACEHOLDERS.items():
    with open(os.path.join(ROOT, rel), encoding='utf-8') as f:
        code = f.read()
    tpl = tpl.replace(token, json.dumps(code, ensure_ascii=False))
with open(os.path.join(ROOT, 'data', 'tutorials.js'), encoding='utf-8') as f:
    actual = f.read()
if tpl == actual:
    print('一致：data/tutorials.js 与模板 + 各脚本一致')
    sys.exit(0)
print('不一致：请运行 python3 tools/build.py 重新生成 data/tutorials.js')
sys.exit(1)
