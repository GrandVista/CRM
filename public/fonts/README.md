# PDF 用字体（pdfkit / 服务端）

pdfkit 仅从本目录通过 **Node 可读绝对路径**（`path.join(process.cwd(), "public", "fonts", …)`）加载字体。  
所有合同 / CI / PL / 树脂送货单 PDF 均 **显式加载** 下列文件之一：

| 用途 | 文件名（任选其一匹配即可） |
|------|---------------------------|
| 正文 / 中文 | `NotoSansSC-Regular.otf`（推荐）或 `NotoSansSC-Regular.ttf` |
| 粗体标题（可选） | `NotoSansSC-Bold.otf` 或 `NotoSansSC-Bold.ttf` |

文件需 **大于约 50KB**（避免未下完的损坏文件）。

## 一键下载（推荐）

在项目根目录执行：

```bash
npm run fonts:pdf
```

或：

```bash
node scripts/download-pdf-font.mjs
```

将从 [noto-cjk](https://github.com/googlefonts/noto-cjk) 拉取 **Noto Sans CJK SC** 的 Regular / Bold（简体完整字库，体积较大）。

## 手动放置

也可从 [noto-cjk Releases](https://github.com/googlefonts/noto-cjk/releases) 下载 `NotoSansCJKsc-Regular.otf` / `Bold`，放入本目录并**重命名**为 `NotoSansSC-Regular.otf`、`NotoSansSC-Bold.otf`（或按上表使用 `NotoSansCJKsc-*.otf` 原名，代码同样识别）。
