# CodeLab 码上实践

面向零基础中文用户的编程实战教程网站。纯静态（HTML + CSS + JS），无框架、无后端。

## 项目结构

```
codelab/
├── index.html              首页（定位、开始学习入口、推荐项目）
├── tutorials.html           教程列表（搜索 + 分类筛选）
├── tutorial.html            教程详情（?id=xxx，按步骤渲染，进度保存）
├── errors.html              通用报错排查
├── 404.html                 404 页面（用 /codelab/ 前缀的绝对路径，见下）
├── assets/
│   ├── style.css            全站样式（深色开发者风，移动端优先）
│   └── app.js               通用脚本：代码复制（含 iOS 降级）、学习进度 localStorage
├── data/
│   └── tutorials.js         教程数据（window.TUTORIALS）。教程 1 的代码与
│                            tutorials/python-organize-files/organize.py 逐字一致
└── tutorials/
    └── python-organize-files/
        └── organize.py      第一篇教程的完整脚本（已在本机实测）
```

## 本地运行

```bash
cd codelab
python3 -m http.server 8000
# 浏览器打开 http://localhost:8000/
```

说明：教程数据用 `<script src>` 引入（不是 fetch），所以直接双击打开 HTML 文件也能用；但推荐用上面的本地服务器方式，和线上行为一致。

## GitHub Pages 部署

1. 把本目录全部文件推到仓库 `main` 分支根目录。
2. 仓库 Settings → Pages → Build and deployment → Source 选 **Deploy from a branch**，Branch 选 **main** / **(root)**，保存。
3. 等 1 分钟左右，访问 `https://ryajia321.github.io/codelab/`。

## 子路径注意事项

- 网站部署在 `/codelab/` 子路径下。普通页面全部用**相对路径**（`assets/...`、`tutorial.html?id=...`），在任何子路径下都能工作。
- 只有 `404.html` 例外：GitHub Pages 会在站内任意深度的错误路径下 serve 它，相对路径会失效，所以它用 `/codelab/` 前缀的绝对路径。这是全站唯一硬编码子路径的地方。
- `tutorial.html?id=xxx` 用 query 参数区分教程，ID 不存在时显示站内 404 提示（不是整站 404）。

## 学习进度存储

`localStorage`，key 为 `codelab_prog_<教程id>`，值为 `{步骤序号: true}`。只存本机，不上传。

## 工具脚本（tools/）

```bash
python3 tools/build.py                  # 从模板 + organize.py 生成 data/tutorials.js
python3 tools/check_code_consistent.py  # 检查生成文件是否过期（CI/提交前跑）
node tools/test_frontend.js            # 前端测试：数据/消毒器/进度/复制降级
bash tools/test_organize.sh            # organize.py 边界测试（16 项，专用临时目录）
```

注意：`data/tutorials.js` 是生成文件，不要手改；改教程文字编辑
`data/tutorials.template.js`，改脚本编辑 `tutorials/python-organize-files/organize.py`，
然后跑 `python3 tools/build.py` 重新生成。
