#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""从 data/tutorials.template.js + 教程脚本生成 data/tutorials.js。
用法：python3 tools/build.py   （在 codelab-site 目录下执行）
保证教程页展示的代码与实测过的脚本文件逐字一致。"""
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

PLACEHOLDERS = {
    '__ORGANIZE_PY__': os.path.join('tutorials', 'python-organize-files', 'organize.py'),
    '__MAKE_SAMPLES_PY__': os.path.join('tutorials', 'python-merge-excel', 'make_samples.py'),
    '__MERGE_EXCEL_PY__': os.path.join('tutorials', 'python-merge-excel', 'merge_excel.py'),
    '__MAKE_DIRTY_PY__': os.path.join('tutorials', 'python-clean-excel', 'make_dirty_samples.py'),
    '__CLEAN_EXCEL_PY__': os.path.join('tutorials', 'python-clean-excel', 'clean_excel.py'),
    '__FETCH_PAGE_PY__': os.path.join('tutorials', 'python-fetch-web', 'fetch_page.py'),
    '__QUERY_HTML__': os.path.join('tutorials', 'web-github-query', 'query.html'),
    '__CHECK_SITE_PY__': os.path.join('tutorials', 'web-publish-site', 'check_site.py'),
    '__SITE_INDEX_HTML__': os.path.join('tutorials', 'web-publish-site', 'site', 'index.html'),
    '__SITE_STYLE_CSS__': os.path.join('tutorials', 'web-publish-site', 'site', 'style.css'),
}

with open(os.path.join(ROOT, 'data', 'tutorials.template.js'), encoding='utf-8') as f:
    tpl = f.read()
for token, rel in PLACEHOLDERS.items():
    with open(os.path.join(ROOT, rel), encoding='utf-8') as f:
        code = f.read()
    assert token in tpl, '模板缺少占位符 ' + token
    tpl = tpl.replace(token, json.dumps(code, ensure_ascii=False))
with open(os.path.join(ROOT, 'data', 'tutorials.js'), 'w', encoding='utf-8') as f:
    f.write(tpl)
print('已生成 data/tutorials.js')
