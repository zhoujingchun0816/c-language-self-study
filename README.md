# C 语言自学本地网站

这是一个**单文件、可离线使用**的 C 语言自学网页：查语法、做练习，也可以问 AI。

## 怎么用

源码镜像中的单文件网页位于 `dist/c语言自学本地网站v1.41.html`，双击即可打开；电脑和手机都能使用，无需安装、无需联网。只有“问 DeepSeek”需要联网并由你填写 API Key，Key 只保存在浏览器本地。

正式版本见仓库 [Releases](https://github.com/zhoujingchun0816/c-language-self-study/releases) 页：Windows 免安装版 `C-SelfStudy-v1.41-portable.exe`、Android 安装包 `C-SelfStudy-v1.41-android.apk`、单文件网页 `c-syntax-lookup-v1.41.html`。

## 功能一览

- 405 条 C 语言词条，覆盖 16 个分类。
- 支持中文关键词搜索，例如搜索“内存”可找到 malloc 等词条。
- 可点击跳转的学习路线图，共 14 个学习阶段。
- 60 道可编译运行的练习题，含提示、参考答案、预期输出和讲解。
- 每道题可让 AI 再出同类题，也可让 DeepSeek 检查代码；它只给建议、不改代码，需要自备 Key。
- 三门网课入口（浙大翁恺、山大陈千）以及 LeetCode、洛谷跳转。
- Dev-C++、VS Code、Visual Studio、IDM 四个工具安装教程。
- 浅色、蓝色、深色三档主题滑块，默认蓝色。

## 目录结构

- `dist/`：当前版本的单文件网页，下载后可直接使用。
- `src/`：源站完整源码和本地自检工具。

## 自己修改和重新构建

直接打开 `src/index.html` 可运行源站。进入 `src/` 后可运行：

```text
node tools/verify.mjs
node tools/verify-exercises.mjs
```

练习验证需要本机安装 GCC。发布工作区在 `c-syntax-lookup-standalone` 目录运行 `node build-standalone.mjs`，即可重新生成单文件版。

## 说明

内容以 C11 为准；示例均按 `gcc -std=c11 -Wall -Wextra` 做零告警检查。AI 功能需要用户自备 DeepSeek API Key，Key 只存本地、不会上传。本项目仅供学习使用。

当前版本：v1.41。
