#!/bin/bash
# organize.py 边界测试（12 项）。全部在专用临时目录执行，不碰真实个人文件夹。
# 用法：bash tools/test_organize.sh
set -u
PY="$(cd "$(dirname "$0")/../tutorials/python-organize-files" && pwd)/organize.py"
BASE=~/workspace/codelab-site/test-fixtures
rm -rf "$BASE" && mkdir -p "$BASE"
PASS=0; FAIL=0
ok()   { PASS=$((PASS+1)); echo "PASS $1"; }
bad()  { FAIL=$((FAIL+1)); echo "FAIL $1 -- $2"; }

# 1. 正常预览：不动文件
D="$BASE/t1"; mkdir -p "$D"; touch "$D/a.jpg" "$D/b.pdf"
OUT=$(python3 "$PY" "$D" 2>&1); [ $? -eq 0 ] && [ ! -d "$D/图片" ] && ok "1.正常预览不动文件" || bad "1.正常预览" "$OUT"

# 2. 正常执行：文件进对应目录
D="$BASE/t2"; mkdir -p "$D"; touch "$D/a.jpg" "$D/b.pdf" "$D/c.mp4"
python3 "$PY" "$D" --apply >/dev/null 2>&1
[ -f "$D/图片/a.jpg" ] && [ -f "$D/文档/b.pdf" ] && [ -f "$D/视频/c.mp4" ] && [ ! -f "$D/a.jpg" ] \
  && ok "2.正常执行移动正确" || bad "2.正常执行" "$(find "$D" | sort | tr '\n' ' ')"

# 3. 重复运行：0 移动
OUT=$(python3 "$PY" "$D" --apply 2>&1)
echo "$OUT" | grep -q "计划移动 0 个文件" && ok "3.重复运行幂等" || bad "3.重复运行" "$OUT"

# 4. 已有同名文件：跳过不覆盖
D="$BASE/t4"; mkdir -p "$D/文档"; echo "原内容" > "$D/文档/dup.pdf"; touch "$D/dup.pdf"
OUT=$(python3 "$PY" "$D" --apply 2>&1)
[ "$(cat "$D/文档/dup.pdf")" = "原内容" ] && [ -f "$D/dup.pdf" ] && echo "$OUT" | grep -q "跳过" \
  && ok "4.同名跳过不覆盖" || bad "4.同名跳过" "$OUT"

# 5. 隐藏文件：跳过
D="$BASE/t5"; mkdir -p "$D"; touch "$D/.hidden" "$D/e.txt"
OUT=$(python3 "$PY" "$D" --apply 2>&1)
[ -f "$D/.hidden" ] && echo "$OUT" | grep -q "隐藏文件" && ok "5.隐藏文件跳过" || bad "5.隐藏文件" "$OUT"

# 6. 未知扩展名：跳过
D="$BASE/t6"; mkdir -p "$D"; touch "$D/m.xyz"
OUT=$(python3 "$PY" "$D" --apply 2>&1)
[ -f "$D/m.xyz" ] && echo "$OUT" | grep -q "未知类型" && ok "6.未知扩展名跳过" || bad "6.未知扩展名" "$OUT"

# 7. 子目录：不动，不递归
D="$BASE/t7"; mkdir -p "$D/sub"; touch "$D/sub/in.txt" "$D/f.jpg"
python3 "$PY" "$D" --apply >/dev/null 2>&1
[ -f "$D/sub/in.txt" ] && [ -f "$D/图片/f.jpg" ] && ok "7.子目录不动" || bad "7.子目录" "$(find "$D" | sort | tr '\n' ' ')"

# 8. 入口符号链接：拒绝
D="$BASE/t8"; mkdir -p "$D/real"; ln -s "$D/real" "$D/link"
OUT=$(python3 "$PY" "$D/link" 2>&1); RC=$?
[ $RC -eq 2 ] && echo "$OUT" | grep -q "符号链接" && ok "8.入口符号链接拒绝" || bad "8.入口符号链接" "rc=$RC out=$OUT"

# 9. 分类目标目录符号链接指向范围外：跳过并提示
D="$BASE/t9"; mkdir -p "$D"; touch "$D/g.jpg"; mkdir -p "$BASE/outside" && ln -s "$BASE/outside" "$D/图片"
OUT=$(python3 "$PY" "$D" --apply 2>&1)
[ -f "$D/g.jpg" ] && echo "$OUT" | grep -q "允许范围外" && ok "9.分类目录外链跳过" || bad "9.分类目录外链" "$OUT"

# 10a. 来源失效符号链接：跳过不跟随
D="$BASE/t10"; mkdir -p "$D"; ln -s "$D/根本不存在" "$D/broken_link"; touch "$D/h.txt"
OUT=$(python3 "$PY" "$D" --apply 2>&1)
[ -L "$D/broken_link" ] && echo "$OUT" | grep -q "符号链接，默认跳过" && ok "10a.来源失效链接跳过" || bad "10a.来源失效链接" "$OUT"

# 10b. 目标位置是失效符号链接：lexists 视为存在，跳过不覆盖
D="$BASE/t10b"; mkdir -p "$D/文档"; ln -s "$D/不存在的目标" "$D/文档/k.txt"; touch "$D/k.txt"
OUT=$(python3 "$PY" "$D" --apply 2>&1)
[ -f "$D/k.txt" ] && [ -L "$D/文档/k.txt" ] && echo "$OUT" | grep -q "含失效链接" \
  && ok "10b.目标失效链接不覆盖" || bad "10b.目标失效链接" "$OUT"

# 11a. 无效路径：不存在的目录
OUT=$(python3 "$PY" "$BASE/no-such-dir" 2>&1); RC=$?
[ $RC -eq 2 ] && echo "$OUT" | grep -q "目录不存在" && ok "11a.不存在目录干净报错" || bad "11a.不存在目录" "rc=$RC"

# 11b. 主目录本身：拒绝
OUT=$(python3 "$PY" ~ 2>&1); RC=$?
[ $RC -eq 2 ] && echo "$OUT" | grep -q "拒绝" && ok "11b.主目录拒绝" || bad "11b.主目录" "rc=$RC"

# 11c. 系统根目录：拒绝
OUT=$(python3 "$PY" / 2>&1); RC=$?
[ $RC -eq 2 ] && echo "$OUT" | grep -q "拒绝" && ok "11c.根目录拒绝" || bad "11c.根目录" "rc=$RC"

# 11d. 主目录外的路径（/tmp）：拒绝
OUT=$(python3 "$PY" /tmp 2>&1); RC=$?
[ $RC -eq 2 ] && echo "$OUT" | grep -q "拒绝" && ok "11d.主目录外拒绝" || bad "11d.主目录外" "rc=$RC"

# 12. 空目录：无操作不报错
D="$BASE/t12"; mkdir -p "$D"
OUT=$(python3 "$PY" "$D" 2>&1); RC=$?
[ $RC -eq 0 ] && echo "$OUT" | grep -q "无需操作" && ok "12.空目录" || bad "12.空目录" "rc=$RC"

echo ""
echo "==== 共 $PASS 通过, $FAIL 失败 ===="
[ $FAIL -eq 0 ]
