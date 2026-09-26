#!/usr/bin/env python3
"""src/ を組み立てて、GAS 用とモック用の1枚ずつを書き出す。

    python3 build.py          生成する
    python3 build.py --check  生成物が src と一致するか調べる（ずれたら終了コード1）

書き出すもの
    gas/Index.html   Apps Script に貼る画面。Code.gs がそのまま配る
    dist/demo.html   ブラウザで開くだけで動くモック。サーバ不要、中身は本番と同じ

**直すのは src/ のほう。** 生成物を直しても次のビルドで消える。

書き方
    /* @include css/app.css */   ファイルを差し込む（src/ からの相対）
"""
import sys, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent
SRC = ROOT / "src"
OUT_GAS = ROOT / "gas" / "Index.html"
OUT_DEMO = ROOT / "dist" / "demo.html"

INCLUDE = re.compile(r'^([ \t]*)/\* @include ([\w./\-]+) \*/[ \t]*$', re.M)
BANNER = ("<!-- このファイルは src/ から build.py が作る。\n"
          "     直すのは src/ のほう。ここを直しても次のビルドで消える。 -->\n")


def expand(text, base, depth=0):
    if depth > 5:
        raise SystemExit("@include が深すぎる")

    def sub(m):
        path = (base / m.group(2)).resolve()
        if not path.exists():
            raise SystemExit("見つからない: " + m.group(2))
        body = path.read_text(encoding="utf-8").rstrip("\n")
        return expand(body, path.parent, depth + 1)
    return INCLUDE.sub(sub, text)


def build():
    html = expand((SRC / "index.html").read_text(encoding="utf-8"), SRC)
    if "@include" in html:
        raise SystemExit("置き換え残りがある")
    head, rest = html.split("\n", 1)
    return head + "\n" + BANNER + rest


def main():
    check = "--check" in sys.argv
    outs = {OUT_GAS: build(), OUT_DEMO: build()}
    bad = []
    for path, text in outs.items():
        if check:
            if not path.exists() or path.read_text(encoding="utf-8") != text:
                bad.append(str(path.relative_to(ROOT)))
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(text, encoding="utf-8")
            print("書き出した:", path.relative_to(ROOT))
    if bad:
        print("生成物が src と合っていない:", ", ".join(bad), "→ python3 build.py を回す")
        sys.exit(1)
    if check:
        print("生成物は src と一致している")


if __name__ == "__main__":
    main()
