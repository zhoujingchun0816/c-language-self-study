## 1.42

- 新增 10 道**翁恺风格经典题**（参考浙大翁恺《程序设计入门——C 语言》课后练习）：华氏温度转摄氏、逆序输出三位数、数一数有几位、数奇数和偶数个数、判断闰年、正序分解整数、求序列前五项和、念出每位数字、约分最简分式、求 10 以内素数和——参考答案都在 8~15 行，只用 printf 与整数运算 / if / for / while / switch（最多一个自制小函数），不碰文件、动态内存、递归
- 练习题总数 121 道、有练习的词条 143 个；难度 **入门 74 / 进阶 47 / 无「挑战」档**
- 「运行后应该看到」的输出块改版：左边改成直的强调竖线并去掉左侧圆角（原来是圆头、字号偏小），字号与行高各放大一档，长输出更好读
- 把几道偏难的题改写成"只出现最基本函数"的短题：scanf 题改成「看 scanf 的返回值」（只出现 scanf 与 printf）、sprintf 题改成翁恺的时间换算（3725 秒 → 01:02:05）、goto 题去掉文件操作、exit 题去掉 atexit
- 撤掉 2 道对初学者太超前的题（perror 写日志、可变参数求和），这两个词条改由详情页的「让 AI 出题」入口覆盖
- AI 出题改为**翁恺那套风格**：题目短、只考一个点、输入输出格式写清楚，只允许 printf 与基础控制结构，并明确禁止 scanf / freopen / 文件 / 动态内存 / 可变参数 / 递归 / 位运算
- 练习题从 60 道增加到 121 道：scanf / getchar / putchar / puts / sprintf / snprintf / fopen / fgetc / fputc / remove / rename / strncpy / strncat / strncmp / strtod / memcpy / memmove / memcmp / memset / atoi / atol / labs / fabs / floor / ceil / round / fmod / sin / cos / tan / log / exp / rand / srand / clock / difftime / mktime / localtime / strftime / atexit / getenv / system 等常用函数都有题了
- 有练习的词条从 78 个增加到 143 个；没题的基础知识词条不必配题
- 每个词条（无论有没有内置练习）详情里都有一键「让 AI 出几道关于「X」的题」的入口，提问会自动带上该词条的语法与注意事项
- 修正挂错词条的题目：scanf 词条改用真正调用 scanf 的练习，原先那道 sscanf 题只再关联 sscanf
- AI 生成的题目现在也有「让 DeepSeek 检查我的代码」输入框与按钮，检查时会带上刚生成的那道题

### 下载

| 文件 | 用途 |
| --- | --- |
| `C-SelfStudy-v1.42-portable.exe` | Windows 免安装版：双击即用，网页已内置 |
| `C-SelfStudy-v1.42-android.apk` | 安卓手机：下载后侧载安装（允许“未知来源”） |
| `c-syntax-lookup-v1.42.html` | 单文件网页：电脑/手机浏览器直接打开，离线可用 |
