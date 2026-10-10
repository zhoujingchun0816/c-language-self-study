(function () {
  "use strict";

  window.C_SYNTAX_ADD_ENTRIES([
    {
      id: "course-zju-wengkai",
      name: "浙大翁恺《C 语言程序设计》网课",
      aliases: ["翁恺 C 语言", "浙大 C 语言网课", "零基础 C 语言课程"],
      category: "工具与环境",
      summary: "这是最适合零基础跟学的免费网课：讲得慢，并配有作业与测验，可系统学习 C 语言。",
      behavior: "先点击“去 B 站看网课”打开课程，每次完整看一节并亲手敲一遍示例；随后回到本词典，按学习顺序复习当天涉及的词条，再完成词条下方练习。程序编译失败或结果不对时，把代码、输入和完整报错贴给 DeepSeek，请它指出原因并给出修改建议，而不是只复制答案。",
      usage: "适合零基础学习者按课程章节持续跟学，也可在词典中的概念说明过于简短时回看对应讲解。",
      syntax: "看一节网课 -> 按学习顺序复习当天词条 -> 完成词条练习 -> 带代码和报错请求批改",
      headers: ["stdio.h"],
      example: "#include <stdio.h>\n\nint main(void) {\n    int lesson = 1;\n    printf(\"Lesson %d practice passed.\\n\", lesson);\n    return 0;\n}\n",
      notes: [
        "不要只看视频而不敲代码，暂停后自行输入和编译才能发现真实问题。",
        "提交批改时应附上完整程序、测试输入、实际输出以及编译器诊断。",
        "课程中的作业和测验应先独立完成，再用词典定位不理解的语法点。"
      ],
      related: ["first-program", "how-to-compile", "debug-print"],
      keywords: ["网课", "翁恺", "浙大", "C语言课程", "零基础"],
      links: [
        { label: "去 B 站看网课", url: "https://www.bilibili.com/video/BV1Ls411w7rx/" }
      ]
    },
    {
      id: "install-idm",
      name: "安装 IDM 下载工具",
      aliases: ["安装 Internet Download Manager", "IDM 下载器", "断点续传工具"],
      category: "工具与环境",
      summary: "从 IDM 官网安装支持多线程与断点续传的下载工具，并启用浏览器接管。",
      behavior: "点击“IDM 官方下载页”，在官网按“Download Internet Download Manager”下载安装程序，运行后按安装向导继续。安装完成后打开 IDM 的“选项”，在“常规”页启用高级浏览器集成并勾选要接管的浏览器；之后可用它下载 MinGW 等较大的安装包或缓存允许下载的网课资源，普通小文件也可继续使用浏览器自带下载。",
      usage: "网络不稳定、需要断点续传或下载较大的编译器安装包时使用；不需要接管时可临时退出 IDM。",
      syntax: "官网下载 -> 运行安装程序 -> 按向导完成 -> 选项 -> 常规 -> 启用浏览器集成",
      headers: ["stdio.h"],
      example: "#include <stdio.h>\n\nint main(void) {\n    printf(\"IDM installation check: C compiler works.\\n\");\n    return 0;\n}\n",
      notes: [
        "只从 Internet Download Manager 官网获取安装包，软件下载站常夹带广告或捆绑程序。",
        "IDM 提供三十天试用，试用期结束后继续使用需要购买合法授权。",
        "浏览器没有出现下载接管时，先检查 IDM 的浏览器集成选项和对应扩展是否启用。",
        "缓存网课前应确认平台规则和内容授权，不要绕过网站的访问或版权限制。"
      ],
      related: ["how-to-compile", "install-vscode", "install-dev-cpp"],
      keywords: ["下载工具", "IDM", "断点续传", "浏览器接管", "安装包"],
      links: [
        { label: "IDM 官方下载页", url: "https://www.internetdownloadmanager.com/download.html" }
      ]
    },
    {
      id: "install-dev-cpp",
      name: "安装 Dev-C++",
      aliases: ["Dev-C++ 安装", "小白 C 语言 IDE", "Embarcadero Dev-C++"],
      category: "工具与环境",
      summary: "从可信来源安装自带 GCC 的轻量 IDE，快速编译运行第一个 C 程序。",
      behavior: "在 Embarcadero 免费工具页点击 Dev-C++ 的下载按钮，或从官方 GitHub 仓库的 Releases 获取安装包，按向导完成安装。启动后点“文件 → 新建 → 源代码”，输入完整程序，再点“文件 → 另存为”并保存为 `.c` 文件；最后按 F11，或点“运行 → 编译运行”，看到终端输出即可确认编译器和 IDE 已能配合工作。",
      usage: "想用最少配置快速运行第一个 C 程序时可选 Dev-C++，入门稳定后再迁移到维护更活跃的工具链。",
      syntax: "文件 -> 新建 -> 源代码 -> 另存为 .c -> F11 编译运行",
      headers: ["stdio.h"],
      example: "#include <stdio.h>\n\nint main(void) {\n    printf(\"Dev-C++ is ready for C.\\n\");\n    return 0;\n}\n",
      notes: [
        "不要从所谓绿色版或软件下载站获取 Dev-C++，这类安装包可能被修改并附带捆绑。",
        "Dev-C++ 已多年没有大更新，适合快速入门，但不建议作为长期项目的主要环境。",
        "新文件必须明确保存为点 c 扩展名，点 cpp 文件会按 C++ 规则进行编译。",
        "内置调试与大型项目支持较弱，遇到复杂工程时可改用 VS Code 或 Visual Studio。"
      ],
      related: ["first-program", "how-to-compile", "compile-error-reading", "install-vscode"],
      keywords: ["开发环境", "IDE", "Dev-C++", "新手", "编译运行"],
      links: [
        { label: "Embarcadero 工具页", url: "https://www.embarcadero.com/free-tools/dev-cpp" },
        { label: "GitHub 官方仓库", url: "https://github.com/Embarcadero/Dev-Cpp" }
      ]
    },
    {
      id: "install-vscode",
      name: "安装 VS Code 写 C",
      aliases: ["VS Code 配置 C", "安装 GCC 和 VS Code", "C/C++ 扩展"],
      category: "工具与环境",
      summary: "为 VS Code 配置独立的 GCC 工具链和微软 C/C++ 扩展，再建立编译任务。",
      behavior: "先安装 MinGW-w64 工具链，可按 MSYS2 的安装说明取得 GCC，并把 gcc 所在目录加入 PATH；VS Code 本身不包含编译器。打开 VS Code 后点左侧“扩展”按钮，搜索 `C/C++`，确认发布者为 Microsoft 后点“安装”。新建并保存 `.c` 文件，再点“终端 → 配置默认生成任务”，选择 gcc 编译当前文件的任务，之后用“终端 → 运行生成任务”完成编译。",
      usage: "希望获得代码补全、错误提示和可扩展编辑体验时使用；配置完成后先在集成终端运行 gcc --version 验证路径。",
      syntax: "安装 GCC -> 配置 PATH -> 扩展中安装 Microsoft C/C++ -> 保存 .c -> 配置并运行生成任务",
      headers: ["stdio.h"],
      example: "#include <stdio.h>\n\nint main(void) {\n    printf(\"VS Code and GCC are ready.\\n\");\n    return 0;\n}\n",
      notes: [
        "终端提示找不到 gcc 时，应检查工具链的 bin 目录是否加入 PATH，并重启 VS Code。",
        "中文输出乱码时可先执行 chcp 65001，并确认源文件与终端都使用 UTF-8 编码。",
        "路径包含空格时任务参数必须正确分隔或引用，初学阶段可把练习放在简单英文路径。",
        "只安装 C/C++ 扩展不会得到编译器，扩展负责编辑辅助，GCC 才负责生成程序。"
      ],
      related: ["how-to-compile", "compile-error-reading", "link-error-reading", "install-dev-cpp"],
      keywords: ["代码编辑器", "VS Code", "编译器", "MinGW", "扩展", "环境变量"],
      links: [
        { label: "VS Code 官网", url: "https://code.visualstudio.com/Download" },
        { label: "MSYS2 官网", url: "https://www.msys2.org/" },
        { label: "微软 C/C++ 扩展", url: "https://marketplace.visualstudio.com/items?itemName=ms-vscode.cpptools" }
      ]
    },
    {
      id: "install-visual-studio",
      name: "安装 Visual Studio 写 C",
      aliases: ["Visual Studio Community", "VS 配置 C", "MSVC C 语言"],
      category: "工具与环境",
      summary: "安装免费的 Visual Studio Community，并用桌面 C++ 工作负载建立 C 项目。",
      behavior: "从 Community 页面点击免费下载并运行 Visual Studio Installer，在“工作负载”页必须勾选“使用 C++ 的桌面开发”，再点“安装”。启动后点“创建新项目”，选择“空项目”；在解决方案资源管理器中右键“源文件”，点“添加 → 新建项”，把文件名明确写成 `.c` 而不是 `.cpp`。输入程序后按 Ctrl+F5，即可在不调试的情况下运行。",
      usage: "需要完整的 Windows 集成开发、项目管理和调试功能时选择它；安装前应预留充足磁盘空间和下载时间。",
      syntax: "Community 免费下载 -> 勾选使用 C++ 的桌面开发 -> 空项目 -> 添加 .c 文件 -> Ctrl+F5",
      headers: ["stdio.h"],
      example: "#include <stdio.h>\n\nint main(void) {\n    printf(\"Visual Studio C project is ready.\\n\");\n    return 0;\n}\n",
      notes: [
        "源文件若保存成点 cpp 会按 C++ 编译，学习 C 时应在新建项里明确使用点 c 后缀。",
        "scanf 出现 C4996 提示时可改用 scanf_s，或在项目中定义 _CRT_SECURE_NO_WARNINGS。",
        "桌面开发工作负载占用空间较大，安装器显示的磁盘需求应在点击安装前确认。",
        "首次启动和首次生成可能较慢，应等待状态栏任务结束后再判断程序是否卡住。"
      ],
      related: ["first-program", "compile-error-reading", "debug-print", "install-vscode"],
      keywords: ["开发环境", "Visual Studio", "Community", "桌面开发", "空项目", "调试"],
      links: [
        { label: "Community 免费下载", url: "https://visualstudio.microsoft.com/vs/community/" }
      ]
    },
    {
      id: "course-sdu-chenqian",
      name: "山大陈千 · C 语言网课",
      aliases: ["陈千", "山大网课", "B站主页"],
      category: "工具与环境",
      summary: "这是陈千老师的 B 站主页，汇集他的课程与视频；可从中选择 C 语言相关课程跟学。",
      behavior: "先从陈千老师的 B 站主页选择 C 语言相关课程并跟学一节，同时亲手敲写课程中的代码；随后按本词典的学习顺序过一遍当天知识点，再完成对应词条下方的练习。遇到卡住的地方，就把代码、输入、实际输出和报错贴进练习区，请 DeepSeek 协助批改。",
      usage: "需要跟随陈千老师的视频学习 C 语言时，从主页挑选相关课程，并配合本词典复习与练习。",
      syntax: "跟学一节 -> 按词典学习顺序复习当天知识点 -> 完成词条练习 -> 卡住时贴进练习区批改",
      headers: ["stdio.h"],
      example: "#include <stdio.h>\n\nint main(void) {\n    printf(\"Follow the lesson, then practice.\\n\");\n    return 0;\n}\n",
      notes: [
        "两门网课可以任选一门作为主线，也可以在难点处互相补充。",
        "暂时看不懂的章节可以先做标记跳过，掌握前置知识后再回来。",
        "跟课时应把示例代码亲手敲写并编译，不要只观看视频内容。"
      ],
      related: ["course-zju-wengkai", "first-program", "how-to-compile", "install-dev-cpp"],
      keywords: ["网课", "陈千", "山大", "B站", "视频课"],
      links: [
        { label: "去 B 站看陈千的课", url: "https://space.bilibili.com/535834809" }
      ]
    },
    {
      id: "site-leetcode",
      name: "LeetCode 力扣刷题",
      aliases: ["力扣", "LeetCode 中文站", "在线算法题库"],
      category: "工具与环境",
      summary: "在 LeetCode 中文站按难度和标签筛选题目，用 C 语言逐步练习数组、字符串与循环。",
      behavior: "打开 LeetCode 中文站后，先在题库选择“简单”难度，再按数组、字符串或循环等已学标签筛题。题目可能要求补全函数签名，也可能允许完整程序；零基础时先把逻辑放进完整 main 程序，在本机编译并跑通样例，再按题目给出的函数签名整理答案并提交。",
      usage: "学完基础语法并做完词典练习后，用简单题巩固数组、字符串、循环和函数的组合运用。",
      syntax: "题库 -> 简单 -> 选择已学标签 -> 本地完整 main 跑通 -> 提交时选择 C",
      headers: ["stdio.h"],
      example: "#include <stdio.h>\n\nint main(void) {\n    int left;\n    int right;\n    if (scanf(\"%d %d\", &left, &right) != 2) {\n        return 1;\n    }\n    printf(\"%d\\n\", left + right);\n    return 0;\n}\n",
      notes: [
        "提交代码时要把语言明确选择为 C，不要误选成 C++。",
        "函数签名题通常不需要自己写 main，应严格保留平台给出的参数与返回类型。",
        "先在本地完整程序中跑通题目样例，再整理成平台要求的提交形式。",
        "卡住时可把代码、输入和实际输出贴回词典练习区请求 DeepSeek 批改。"
      ],
      related: ["first-program", "one-dimensional-array", "install-vscode"],
      keywords: ["刷题", "力扣", "算法题库", "在线判题", "简单题"],
      links: [
        { label: "打开 LeetCode 中文站", url: "https://leetcode.cn/" }
      ]
    },
    {
      id: "site-luogu",
      name: "洛谷刷题",
      aliases: ["洛谷题库", "OI 刷题", "入门题单"],
      category: "工具与环境",
      summary: "从洛谷入门题单和 P1001 一类基础题开始，用完整 C 程序练习标准输入输出。",
      behavior: "进入洛谷后先找入门题单，从 P1001 这类只需标准输入输出的基础题开始。洛谷采用 OI 风格，通常要自行编写包含 main 的完整程序，从标准输入读取数据并把结果写到标准输出；先用本机 gcc 编译测试，再提交到 Linux 评测环境检查结果。",
      usage: "掌握 scanf、数组与循环后，用入门题单练习读题、处理标准输入以及输出指定格式的完整程序。",
      syntax: "入门题单 -> 阅读输入输出格式 -> 编写完整程序 -> gcc 跑通样例 -> 提交评测",
      headers: ["stdio.h"],
      example: "#include <stdio.h>\n\nint main(void) {\n    int first;\n    int second;\n    if (scanf(\"%d %d\", &first, &second) != 2) {\n        return 1;\n    }\n    printf(\"%d\\n\", first + second);\n    return 0;\n}\n",
      notes: [
        "不要在代码里使用 conio.h 或 system(\"pause\") 等 Windows 专属写法。",
        "评测环境是 Linux，输出换行应使用反斜杠 n，并严格避免多余提示文字。",
        "提交前先用本机 gcc 编译并跑通全部样例，确认读取数量和输出格式一致。",
        "刚开始优先完成入门题单，不要直接挑战依赖复杂算法的高难度题目。"
      ],
      related: ["first-program", "scanf-function", "one-dimensional-array", "install-dev-cpp"],
      keywords: ["洛谷", "题单", "在线判题", "标准输入", "入门题"],
      links: [
        { label: "打开洛谷", url: "https://www.luogu.com.cn/" }
      ]
    }
  ]);
}());
