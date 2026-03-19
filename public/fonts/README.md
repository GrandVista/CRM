# PDF 中文字体

合同汇总导出 PDF 需要中文字体才能正确显示中文，请将以下任一字体文件放入本目录并命名为 `NotoSansSC-Regular.otf` 或 `NotoSansSC-Regular.ttf`：

- **Noto Sans CJK SC (推荐)**  
  下载：https://github.com/googlefonts/noto-cjk/releases  
  选择 `NotoSansCJKsc-Regular.otf`，下载后重命名为 `NotoSansSC-Regular.otf` 放入本目录。

- **或运行下载脚本（若已配置）**  
  在项目根目录执行：`node scripts/download-pdf-font.mjs`

放置完成后，合同汇总页的「导出 PDF」将使用该字体渲染中文。
