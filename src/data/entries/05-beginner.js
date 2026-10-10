(function () {
  "use strict";

  window.C_SYNTAX_ADD_ENTRIES([
    {
      id: "what-is-c",
      name: "C 语言是什么",
      aliases: ["认识 C", "C language", "为什么学 C"],
      category: "入门基础",
      summary: "C 是一种把人的步骤描述翻译成机器可执行程序的通用编程语言。",
      behavior: "C 语言让人用文本写下数据、计算和执行顺序，再由编译器转换成计算机能够运行的机器指令。它常用于操作系统、嵌入式设备、工具软件和高性能程序；理解它能帮助初学者看清变量、内存与程序执行之间的关系。",
      usage: "当你想理解计算机如何按步骤工作，或要编写体积小、速度快、能直接使用系统能力的程序时，可以从 C 开始。",
      syntax: "编辑 .c 源文件 -> 用编译器生成可执行文件 -> 运行并观察结果",
      headers: ["stdio.h"],
      example: "#include <stdio.h>\n\nint main(void) {\n    printf(\"C turns instructions into a running program.\\n\");\n    return 0;\n}\n",
      notes: [
        "C 是编译型语言，源代码通常不能直接当作可执行文件运行。",
        "学习 C 不只为了记语法，更重要的是练习把问题拆成明确步骤。",
        "C 给程序员较多控制权，同时也要求主动避免越界和无效指针。"
      ],
      related: ["main-function", "statement", "int-type"],
      keywords: ["入门", "C语言", "编程", "源代码", "编译器"]
    },
    {
      id: "program-lifecycle",
      name: "程序从源码到运行",
      aliases: ["编译四步", "构建过程", "程序生命周期"],
      category: "入门基础",
      summary: "一个 C 源文件通常经过预处理、编译、汇编和链接，才成为可运行程序。",
      behavior: "预处理先展开头文件和宏，编译阶段检查 C 语法并形成汇编表示，汇编阶段生成目标文件，链接阶段再把目标文件和所需库合成可执行文件。分清四步，就能根据错误出现的位置判断该查源代码、声明还是链接参数。",
      usage: "遇到构建失败时先判断它属于预处理、编译还是链接阶段，再阅读该阶段最前面的诊断信息并处理根因。",
      syntax: "source.c -> 预处理 -> 编译 -> 汇编 -> 链接 -> 可执行文件",
      headers: [],
      example: "int main(void) {\n    int source_value = 2;\n    int result = source_value * 3;\n    if (result != 6) {\n        return 1;\n    }\n    return 0;\n}\n",
      notes: [
        "预处理错误常与找不到头文件、条件编译或宏展开结果有关。",
        "编译通过只说明单个翻译单元有效，并不保证最后能够链接成功。",
        "目标文件已经包含机器代码，但通常还缺少其他函数的实际地址。"
      ],
      related: ["include-directive", "function-prototype", "function-definition"],
      keywords: ["编译流程", "预处理", "汇编", "链接", "目标文件"]
    },
    {
      id: "first-program",
      name: "第一个 C 程序",
      aliases: ["Hello World", "第一个程序", "最小程序"],
      category: "入门基础",
      summary: "从头文件、main 函数、printf 调用和返回值认识一份完整程序。",
      behavior: "一份最小实用程序先用 `#include <stdio.h>` 取得输出函数声明，再从 `main` 函数开始执行；`printf` 把双引号中的内容写到屏幕，`return 0` 返回零并告诉运行环境程序正常结束。逐行理解这些角色，比机械背下模板更可靠。",
      usage: "新建学习文件时可先复制这个完整骨架，确认能够编译运行，再一次加入一小段自己的计算或输出。",
      syntax: "#include <stdio.h>\nint main(void) { printf(\"Hello, C!\\n\"); return 0; }",
      headers: ["stdio.h"],
      example: "#include <stdio.h>\n\nint main(void) {\n    printf(\"Hello, C!\\n\");\n    return 0;\n}\n",
      notes: [
        "井号开头的 include 是预处理指令，末尾不需要添加分号。",
        "main 是程序入口，标准的无参数写法是 int main(void)。",
        "字符串里的反斜杠 n 表示换行，让下一次输出从新行开始。"
      ],
      related: ["include-directive", "main-function", "printf-function"],
      keywords: ["第一个程序", "Hello World", "main函数", "printf", "返回值"]
    },
    {
      id: "how-to-compile",
      name: "怎样编译和运行",
      aliases: ["gcc 入门", "运行 C 程序", "构建命令"],
      category: "入门基础",
      summary: "保存源文件后用 gcc 生成可执行文件，再从终端启动它。",
      behavior: "编译器读取 `.c` 文件并生成当前系统能运行的程序。使用 GCC 时，`gcc -std=c11 -Wall -Wextra hello.c -o hello` 会选择 C11 并开启常用警告；命令成功后再运行生成的文件。编辑器只是写代码的工具，本机仍需安装并正确配置编译器。",
      usage: "每次只做一小处修改就保存、重新编译并运行；Windows 可使用 MinGW-w64，Dev-C++ 或 VS Code 也必须指向真实编译器。",
      syntax: "gcc -std=c11 -Wall -Wextra hello.c -o hello\nWindows: .\\hello.exe    Linux/macOS: ./hello",
      headers: ["stdio.h"],
      example: "#include <stdio.h>\n\nint main(void) {\n    int build_number = 1;\n    printf(\"build %d runs\\n\", build_number);\n    return 0;\n}\n",
      notes: [
        "提示 gcc 不是内部命令时，通常是尚未安装或 PATH 没有配置好。",
        "源文件扩展名应为小写点 c，不要误存成 hello.c.txt。",
        "警告虽不一定阻止生成程序，也应在继续学习前逐条处理干净。"
      ],
      related: ["main-function", "printf-function", "predefined-macros"],
      keywords: ["gcc", "编译命令", "MinGW", "VS Code", "运行程序"]
    },
    {
      id: "compile-error-reading",
      name: "读懂编译错误",
      aliases: ["编译报错", "error 诊断", "语法错误"],
      category: "入门基础",
      summary: "从第一条 error 的文件名、行号和消息开始定位源代码问题。",
      behavior: "编译错误表示编译器无法把当前源代码理解成合法 C 程序。诊断通常给出文件名、行号、列号和 `error:` 消息；应先处理最前面的真实错误，因为漏分号或拼错名字可能连带产生许多后续消息。修改后重新编译，才能确认问题是否消失。",
      usage: "看到 `expected ';'` 就检查该行及上一行的分号，看到未声明标识符就核对拼写、声明位置和大小写。",
      syntax: "file.c:行:列: error: 原因提示\n先修第一条错误 -> 保存 -> 重新编译",
      headers: ["stdio.h"],
      example: "#include <stdio.h>\n\nint main(void) {\n    int count = 3;\n    printf(\"count=%d\\n\", count);\n    return 0;\n}\n",
      notes: [
        "诊断箭头指向的是编译器发现异常的位置，根因有时在上一行。",
        "英文错误消息可拆成关键词搜索，不必一次读懂整段专业描述。",
        "不要为消除消息而随意强制转换，应先理解类型或语法为何不匹配。"
      ],
      related: ["statement", "identifier", "function-prototype"],
      keywords: ["编译错误", "error", "行号", "漏分号", "未声明变量"]
    },
    {
      id: "link-error-reading",
      name: "读懂链接错误",
      aliases: ["链接报错", "undefined reference", "未定义引用"],
      category: "入门基础",
      summary: "链接错误说明声明和调用已经通过编译，但最终找不到所需定义。",
      behavior: "链接器负责把各个目标文件和库中的函数、数据接到一起。`undefined reference to ...` 往往表示函数只有声明没有函数体、实现文件没有参加命令，或需要的库没有链接；它不同于 C 语法错误，反复改调用处的分号通常解决不了问题。",
      usage: "遇到未定义引用时核对函数名与参数声明、确认实现文件在 gcc 命令中；数学库在部分系统还需把 `-lm` 放到源文件之后。",
      syntax: "gcc main.c helper.c -o app\n部分系统的数学库：gcc main.c -o app -lm",
      headers: ["stdio.h"],
      example: "#include <stdio.h>\n\nstatic int add(int left, int right) {\n    return left + right;\n}\n\nint main(void) {\n    printf(\"sum=%d\\n\", add(2, 3));\n    return 0;\n}\n",
      notes: [
        "函数声明只描述接口，真正被调用时还必须存在匹配的函数定义。",
        "多个源文件项目要把需要的点 c 文件或目标文件都交给链接器。",
        "重复定义属于另一类链接错误，通常表示同一外部符号实现了两次。"
      ],
      related: ["function-prototype", "function-definition", "storage-class-specifiers"],
      keywords: ["链接错误", "未定义引用", "函数定义", "目标文件", "数学库"]
    },
    {
      id: "variables-and-types-intro",
      name: "变量与类型入门",
      aliases: ["变量入门", "基本类型", "int double char"],
      category: "入门基础",
      summary: "变量是带名字的存储位置，类型规定值的含义、范围和可用操作。",
      behavior: "变量让程序把一个值保存起来并在后面使用，声明时的类型告诉编译器该怎样解释这块数据。`int` 适合普通整数计数，`double` 适合带小数的近似计算，`char` 适合一个基本字符或字节；选择正确类型还能让编译器发现不合理操作。",
      usage: "先根据数据是否有小数、是否表示字符和可能的范围选择类型，再用有意义的名字声明并立即给出初值。",
      syntax: "int count = 3;\ndouble price = 2.5;\nchar grade = 'A';",
      headers: ["stdio.h"],
      example: "#include <stdio.h>\n\nint main(void) {\n    int count = 3;\n    double price = 2.5;\n    char grade = 'A';\n    printf(\"%d %.1f %c\\n\", count, price, grade);\n    return 0;\n}\n",
      notes: [
        "局部变量在读取前必须已有确定值，声明时初始化最容易做到。",
        "double 保存的是二进制近似小数，不适合假定所有十进制值都精确。",
        "单引号表示一个字符，双引号表示以空字符结尾的字符序列。"
      ],
      related: ["int-type", "double-type", "char-type"],
      keywords: ["变量", "数据类型", "int", "double", "char", "初始化"]
    },
    {
      id: "naming-rules",
      name: "标识符命名规则",
      aliases: ["变量命名", "命名规范", "identifier naming"],
      category: "入门基础",
      summary: "合法名字由字母、数字和下划线组成，且应清楚表达数据或动作。",
      behavior: "C 用标识符命名变量、函数和类型。名字区分大小写，不能以数字开头，也不能使用 `int`、`return` 等关键字；实现保留的名字同样应避开。合法只是最低要求，像 `student_count` 这样能说明含义的名字会显著降低阅读和修改难度。",
      usage: "变量多用能说明内容的名词，函数多用表达动作的词组；同一项目选择一种下划线或大小写风格并保持一致。",
      syntax: "合法：score, student_count, value2\n不合法：2value, total-price, return",
      headers: ["stdio.h"],
      example: "#include <stdio.h>\n\nint main(void) {\n    int student_count = 4;\n    int points_per_student = 5;\n    int total_points = student_count * points_per_student;\n    printf(\"total=%d\\n\", total_points);\n    return 0;\n}\n",
      notes: [
        "count 与 Count 是两个不同名字，混用大小写会产生新的标识符。",
        "不要自创双下划线开头的名称，这类形式通常保留给实现使用。",
        "单字母名字只适合范围很小且含义明显的循环计数等场景。"
      ],
      related: ["identifier", "scope", "predefined-macros"],
      keywords: ["命名规则", "标识符", "大小写", "下划线", "关键字"]
    },
    {
      id: "statements-and-blocks",
      name: "语句与代码块",
      aliases: ["分号与花括号", "代码块", "缩进"],
      category: "入门基础",
      summary: "语句描述一步操作，花括号把多步组合成一个有边界的代码块。",
      behavior: "多数简单语句以分号结束，分号像一句操作的句点；花括号 `{}` 把声明和语句组织为一个整体，并建立局部名字的可见范围。缩进不改变 C 的语义，却能把嵌套结构直接显示出来，帮助人发现漏括号和分支归属错误。",
      usage: "写函数、条件或循环时成对输入花括号并立刻缩进内部代码，即使当前分支只有一条语句也保留括号。",
      syntax: "{\n    int value = 1;\n    value = value + 1;\n}",
      headers: ["stdio.h"],
      example: "#include <stdio.h>\n\nint main(void) {\n    int total = 1;\n    {\n        int addend = 2;\n        total = total + addend;\n    }\n    printf(\"total=%d\\n\", total);\n    return 0;\n}\n",
      notes: [
        "函数调用和赋值语句末尾需要分号，代码块右花括号后通常不加。",
        "内层代码块声明的普通局部变量，离开右花括号后就不能再使用。",
        "统一使用四个空格或项目规定的缩进，避免制表符宽度造成错觉。"
      ],
      related: ["statement", "compound-statement", "scope"],
      keywords: ["语句", "分号", "花括号", "代码块", "缩进", "作用域"]
    },
    {
      id: "printf-format-basics",
      name: "printf 格式符入门",
      aliases: ["格式化输出", "百分号格式", "printf specifier"],
      category: "入门基础",
      summary: "printf 用格式符说明后续值的类型和显示位置。",
      behavior: "`printf` 会扫描格式字符串，普通字符原样输出，遇到 `%d`、`%f`、`%c`、`%s` 时从后续参数取得相应值。格式符必须与实际参数类型匹配：`%d` 接收 `int`，`%f` 接收 `double`，`%c` 显示字符，`%s` 读取字符串；写错会导致未定义行为。",
      usage: "需要把变量和值旁边的说明文字一起显示时使用格式化输出，并从左到右逐个核对格式符和参数的数量及类型。",
      syntax: "printf(\"%d %f %c %s\\n\", integer, real, character, text);",
      headers: ["stdio.h"],
      example: "#include <stdio.h>\n\nint main(void) {\n    int age = 18;\n    double height = 1.72;\n    char level = 'A';\n    const char *name = \"Lin\";\n    printf(\"%d %.2f %c %s\\n\", age, height, level, name);\n    return 0;\n}\n",
      notes: [
        "printf 中百分号 f 对应 double，点二 f 表示显示两位小数。",
        "输出一个普通百分号要写成双百分号，不能让它单独留在格式串中。",
        "格式串不会自动知道参数类型，编译警告是发现不匹配的重要保护。"
      ],
      related: ["printf-function", "printf-specifiers", "string-literal"],
      keywords: ["printf", "格式符", "%d", "%f", "%c", "%s", "格式化输出"]
    },
    {
      id: "comments-and-style",
      name: "注释与代码风格",
      aliases: ["代码注释", "编程风格", "可读性"],
      category: "入门基础",
      summary: "注释解释代码背后的原因，一致的排版让程序结构更容易被看懂。",
      behavior: "`//` 注释到本行末尾，`/* ... */` 可以跨越多行；编译器会忽略它们，因此注释不会替程序执行任何操作。好注释说明为什么采用某个规则、单位或边界，而不是重复代码表面含义；稳定的命名、留白和缩进则让这些意图更容易检查。",
      usage: "为不明显的决定、输入单位和特殊边界写简短注释；修改实现时同步更新注释，并让同一文件保持一致排版。",
      syntax: "// 单行说明\n/* 可以跨越多行的说明 */",
      headers: ["stdio.h"],
      example: "#include <stdio.h>\n\nint main(void) {\n    const int minutes_per_hour = 60;\n    int hours = 2;\n\n    /* 输入按小时计，结果统一换算成分钟。 */\n    int minutes = hours * minutes_per_hour;\n    printf(\"minutes=%d\\n\", minutes);\n    return 0;\n}\n",
      notes: [
        "注释应该解释意图和限制，而不是把下一行代码换成中文再说一遍。",
        "块注释不能安全嵌套，临时屏蔽大段代码可优先使用条件编译。",
        "自动格式化工具能统一排版，但不能替你选择清楚的名字和结构。"
      ],
      related: ["comment", "identifier", "conditional-compilation"],
      keywords: ["注释", "代码风格", "可读性", "单行注释", "块注释"]
    },
    {
      id: "debug-print",
      name: "打印中间值调试",
      aliases: ["打印调试法", "定位错误", "debug print"],
      category: "入门基础",
      summary: "在关键步骤打印实际值和执行标记，可以缩小错误所在范围。",
      behavior: "程序能运行但结果不对时，可在数据变化前后打印变量，让实际执行过程变得可见。先确认错误发生在哪一半流程，再继续把范围减半，比到处随意加输出更快；同时必须先处理编译器警告，因为类型不匹配等问题可能让调试输出本身也不可信。",
      usage: "为调试输出加清楚的变量名和阶段标签，从输入到结果逐段核对；定位完成后删除临时打印或改成受控日志。",
      syntax: "printf(\"after step: value=%d\\n\", value);",
      headers: ["stdio.h"],
      example: "#include <stdio.h>\n\nint main(void) {\n    int value = 4;\n    printf(\"start value=%d\\n\", value);\n    value = value * 2;\n    printf(\"after multiply value=%d\\n\", value);\n    return 0;\n}\n",
      notes: [
        "打印时同时写变量名，避免一串裸数字无法判断来自哪个步骤。",
        "调试输出可能改变时序或终端内容，确认问题后要清理并重新测试。",
        "若某个标记没有出现，错误通常位于上一个标记和该位置之间。"
      ],
      related: ["printf-function", "predefined-macros", "relational-operators"],
      keywords: ["调试", "打印中间值", "定位错误", "警告", "二分定位"]
    },
    {
      id: "common-first-week-errors",
      name: "新手第一周常见错误",
      aliases: ["新手易错点", "常见错误", "排错清单"],
      category: "入门基础",
      summary: "用固定清单检查标点、运算符、地址、边界、初始化、格式和控制结构。",
      behavior: "初学阶段的大量问题来自八类细节：漏分号、误用中文标点、把 `=` 当 `==`、输入时忘记取地址、数组越界、变量未初始化、格式符不匹配，以及 `if` 或循环后误加分号。把它们做成固定检查顺序，能比盲目重写更快找到原因。",
      usage: "编译前后沿清单逐项核对，并保持 `-Wall -Wextra`；一次只修一个最早出现的问题，重新构建后再看剩余诊断。",
      syntax: "检查：; 与英文标点 / = 和 == / &地址 / 0..长度-1 / 初值 / 格式符 / 多余分号",
      headers: ["stdio.h"],
      example: "#include <stdio.h>\n\nint main(void) {\n    int values[3] = {2, 4, 6};\n    int target = 4;\n\n    if (values[1] == target) {\n        printf(\"found=%d\\n\", target);\n    }\n    return 0;\n}\n",
      notes: [
        "C 源码里的逗号、分号、括号和引号应使用英文半角字符。",
        "长度为三的数组合法下标只有零、一、二，不能访问下标三。",
        "scanf 写入普通变量时通常需要地址，但数组和不同转换另有规则。",
        "条件中的双等号用于比较，单等号会执行赋值并产生一个值。"
      ],
      related: ["assignment-operators", "relational-operators", "array-bounds"],
      keywords: ["新手错误", "越界", "未初始化", "中文标点", "等号", "取地址"]
    },
    {
      id: "how-to-practice",
      name: "怎样练习 C",
      aliases: ["学习方法", "编程练习", "刻意练习"],
      category: "入门基础",
      summary: "用短小、可验证的改动反复经历预测、编译、运行和解释结果。",
      behavior: "有效练习不是连续抄很多代码，而是先预测一段小程序的结果，亲手改一个地方，再立即编译运行并解释差异。每天完成一道规模可控的小题，保留错误与修复原因，还要隔几天不看答案重写，知识才会从“看懂”变成“能用”。",
      usage: "为每个知识点设计一个十几行的小程序，先写预期结果，再运行验证；失败时记录第一条错误和最后采用的修复。",
      syntax: "预测 -> 修改一处 -> 编译 -> 运行 -> 对比结果 -> 解释原因 -> 隔日重写",
      headers: ["stdio.h"],
      example: "#include <stdio.h>\n\nint main(void) {\n    int total = 0;\n    for (int number = 1; number <= 3; ++number) {\n        total = total + number;\n    }\n    printf(\"total=%d\\n\", total);\n    return 0;\n}\n",
      notes: [
        "一次改动太多会失去因果线索，尽量让每轮只验证一个想法。",
        "先写自己能检查的预期输出，运行成功才具有明确的学习证据。",
        "查看答案后应关掉答案重新写一遍，避免把眼熟误认为已经掌握。"
      ],
      related: ["for-loop", "printf-function", "arithmetic-operators"],
      keywords: ["练习方法", "刻意练习", "预期输出", "小步修改", "复盘"]
    },
    {
      id: "reading-docs",
      name: "怎样查文档",
      aliases: ["查手册", "cppreference", "遇到不会怎么办"],
      category: "入门基础",
      summary: "围绕函数名、头文件、参数、返回值和错误条件阅读可靠资料。",
      behavior: "查文档不是只找一段可复制代码，而是确认函数属于哪个头文件、每个参数需要什么、返回值如何表示成功失败，以及哪些输入会造成未定义行为。类 Unix 系统可用 `man` 查看手册，cppreference 可查标准接口，本词典适合先建立中文概念；编译器警告则提供当前代码的直接线索。",
      usage: "遇到陌生函数时先查精确名称，按“头文件—函数原型—参数—返回值—注意事项—最小示例”的顺序做笔记和验证。",
      syntax: "man 3 printf\n搜索：C printf header parameters return value\n本词典：按函数名或概念关键词查询",
      headers: ["stdio.h"],
      example: "#include <stdio.h>\n\nint main(void) {\n    int written = printf(\"read the return value\\n\");\n    if (written < 0) {\n        return 1;\n    }\n    return 0;\n}\n",
      notes: [
        "优先阅读标准文档和编译器文档，博客示例可能省略关键前提。",
        "复制示例前先核对所用语言版本、平台差异和函数返回值处理。",
        "搜索错误时保留核心消息和函数名，但去掉自己机器上的隐私路径。"
      ],
      related: ["printf-function", "formatted-output-return", "include-directive"],
      keywords: ["查文档", "man手册", "cppreference", "函数原型", "返回值", "编译警告"]
    }
  ]);
}());
