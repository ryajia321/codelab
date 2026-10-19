#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""从 data/tutorials.template.js + 教程脚本生成 data/tutorials.js。
用法：python3 tools/build.py   （在 codelab-site 目录下执行）
保证教程页展示的代码与实测过的脚本文件逐字一致。"""
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

with open(os.path.join(ROOT, 'data', 'tutorials.template.js'), encoding='utf-8') as f:
    tpl = f.read()
with open(os.path.join(ROOT, 'tutorials', 'python-organize-files', 'organize.py'), encoding='utf-8') as f:
    code = f.read()

assert '__ORGANIZE_PY__' in tpl, '模板缺少 __ORGANIZE_PY__ 占位符'
out = tpl.replace('__ORGANIZE_PY__', json.dumps(code, ensure_ascii=False))
with open(os.path.join(ROOT, 'data', 'tutorials.js'), 'w', encoding='utf-8') as f:
    f.write(out)
print('已生成 data/tutorials.js')
