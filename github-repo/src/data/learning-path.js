(function () {
  "use strict";

  window.C_SYNTAX_LEARNING_PATH = {
    // 学习顺序：按数组顺序从易到难；每条 stage 用 match 指定它包含哪些词条。
    stages: [
      {
        id: "stage-setup",
        title: "第 0 步 · 装工具 & 找课程 & 刷题网站",
        detail: "装好编译器和下载工具，跟一门网课，找到刷题的地方",
        match: ["learning-roadmap", "course-zju-wengkai", "course-sdu-chenqian", "install-dev-cpp", "install-vscode", "install-visual-studio", "install-idm", "site-leetcode", "site-luogu"]
      },
      {
        id: "stage-start",
        title: "第 1 步 · 把程序跑起来",
        detail: "认识 C、写第一个程序、学会编译",
        match: ["what-is-c", "program-lifecycle", "first-program", "how-to-compile"]
      },
      {
        id: "stage-error",
        title: "第 2 步 · 看懂报错",
        detail: "编译错误、链接错误、调试打印",
        match: ["compile-error-reading", "link-error-reading", "debug-print", "common-first-week-errors"]
      },
      {
        id: "stage-basic",
        title: "第 3 步 · 变量与类型",
        detail: "int/double/char、命名、语句与代码块",
        match: [
          "variables-and-types-intro", "naming-rules", "statements-and-blocks", "comments-and-style",
          "main-function", "statement", "compound-statement", "comment", "identifier", "scope",
          "escape-sequence", "char-type", "int-type", "float-type", "double-type", "void-type",
          "bool-type", "typedef-alias", "const-qualifier", "volatile-qualifier", "integer-promotions",
          "explicit-cast", "storage-class-specifiers", "declaration-definition", "static-meanings",
          "scope-lifetime", "character-literal-details", "integer-literal-forms", "floating-literal-forms"
        ]
      },
      {
        id: "stage-io",
        title: "第 4 步 · 输入输出",
        detail: "printf/scanf、格式化、转义",
        match: [
          "printf-format-basics", "printf-function", "scanf-function", "puts-function", "getchar-function",
          "putchar-function", "sprintf-function", "snprintf-function", "sscanf-function", "perror-function",
          "printf-specifiers", "printf-width-precision", "size-t-format", "formatted-output-return",
          "scanf-specifiers", "scanf-scanset", "vprintf-function", "vsprintf-function", "vsnprintf-function",
          "format-mismatch", "scanf-field-width", "scanf-width", "gets-removed", "gets-danger",
          "printf-string-n-risk"
        ]
      },
      {
        id: "stage-operator",
        title: "第 5 步 · 运算符与表达式",
        detail: "算术、关系、逻辑、优先级",
        match: [
          "arithmetic-operators", "relational-operators", "logical-operators", "assignment-operators",
          "increment-decrement", "conditional-operator", "bitwise-operators", "comma-operator",
          "operator-precedence", "integer-division", "signed-unsigned-comparison", "assignment-vs-equality",
          "signed-overflow", "uninitialized-variable", "evaluation-order"
        ]
      },
      {
        id: "stage-flow",
        title: "第 6 步 · 分支与循环",
        detail: "if/switch、for/while、break/continue",
        match: [
          "if-statement", "switch-statement", "for-loop", "while-loop", "do-while-loop",
          "break-statement", "continue-statement", "goto-cleanup", "switch-versus-table",
          "off-by-one", "switch-fallthrough", "integer-overflow-loop"
        ]
      },
      {
        id: "stage-function",
        title: "第 7 步 · 函数",
        detail: "定义、原型、参数、返回值、递归",
        match: [
          "function-definition", "function-prototype", "function-parameters", "return-statement", "recursion",
          "variadic-function", "function-pointer", "inline-function", "array-parameter-decay",
          "struct-pass-return", "function-pointer-array", "callback-function", "va-list-type",
          "va-start-macro", "va-arg-macro", "va-end-macro", "va-copy-macro", "return-local-address"
        ]
      },
      {
        id: "stage-array",
        title: "第 8 步 · 数组与字符串",
        detail: "一维/多维数组、字符数组、常用字符串函数",
        match: [
          "one-dimensional-array", "multidimensional-array", "array-initialization", "char-array",
          "string-literal", "sizeof-array-decay", "variable-length-array", "string-array-difference",
          "strlen-function", "string-copy", "strncpy-function", "strcat-function", "strncat-function",
          "strcmp-function", "strncmp-function", "strchr-function", "strrchr-function", "strstr-function",
          "strtok-function", "strspn-function", "strcspn-function", "strpbrk-function", "strerror-function",
          "strcoll-function", "strxfrm-function", "memcpy-function", "memmove-function", "memset-function",
          "memcmp-function", "memchr-function", "isalpha-function", "isdigit-function", "isalnum-function",
          "isspace-function", "isupper-function", "islower-function", "toupper-function", "tolower-function",
          "ispunct-function", "isxdigit-function", "isprint-function", "iscntrl-function", "isgraph-function",
          "isblank-function", "array-bounds", "string-buffer-overflow", "strncpy-missing-terminator",
          "strtok-shared-state", "string-literal-write", "char-pointer-versus-array", "modify-string-literal",
          "sizeof-pointer-vs-array"
        ]
      },
      {
        id: "stage-pointer",
        title: "第 9 步 · 指针",
        detail: "地址、解引用、指针与数组、空指针",
        match: [
          "pointer-declaration", "address-operator", "dereference-operator", "null-pointer",
          "pointer-arithmetic", "pointer-to-pointer", "const-pointer", "array-pointer",
          "restrict-qualifier", "pointer-array-difference", "dangling-pointer", "uninitialized-pointer"
        ]
      },
      {
        id: "stage-struct",
        title: "第 10 步 · 结构体与自定义类型",
        detail: "struct/union/enum、成员访问、内存布局",
        match: [
          "struct-type", "struct-initialization", "member-access", "arrow-operator", "union-type",
          "enum-type", "struct-padding", "bit-field", "compound-literal", "enum-bit-flags",
          "union-type-punning"
        ]
      },
      {
        id: "stage-memory",
        title: "第 11 步 · 内存管理",
        detail: "malloc/calloc/realloc/free、动态数组",
        match: [
          "malloc-function", "calloc-function", "realloc-function", "free-function", "dynamic-array",
          "sizeof-allocation", "flexible-array-member", "aligned-alloc-function", "memory-leak",
          "double-free", "allocation-ownership-pitfall"
        ]
      },
      {
        id: "stage-file",
        title: "第 12 步 · 文件与预处理",
        detail: "文件读写、宏、头文件",
        match: [
          "fopen-function", "fclose-function", "fprintf-function", "fscanf-function", "fgets-function",
          "fputs-function", "fseek-function", "vfprintf-function", "putc-function", "fputc-function",
          "fwrite-function", "getc-function", "fgetc-function", "ungetc-function", "fread-function",
          "freopen-function", "fflush-function", "ftell-function", "rewind-function", "fgetpos-function",
          "fsetpos-function", "feof-function", "ferror-function", "clearerr-function", "remove-function",
          "rename-function", "tmpfile-function", "tmpnam-function", "setvbuf-function", "setbuf-function",
          "stderr-streams", "text-binary-streams", "include-directive", "object-macro", "function-macro",
          "include-guard", "conditional-compilation", "predefined-macros", "macro-stringify-paste",
          "macro-versus-inline", "macro-parentheses", "header-double-inclusion", "file-type", "eof-constant",
          "bufsiz-constant", "seek-constants", "null-stdio-constant"
        ]
      },
      {
        id: "stage-practice",
        title: "第 13 步 · 动手写小项目",
        detail: "工程习惯、调试、测试、可移植性",
        match: [
          "how-to-practice", "reading-docs", "small-program-structure", "multi-file-project",
          "build-commands", "debugging-with-gdb", "error-handling-style", "input-validation",
          "string-processing-recipes", "array-and-pointer-recipes", "struct-as-record", "dynamic-data",
          "file-recipes", "sorting-and-search", "random-and-time", "testing-own-code",
          "portability-and-toolchain", "assert-macro", "assert-side-effects", "static-assert-macro"
        ]
      },
      {
        id: "stage-rest",
        title: "第 14 步 · 其余标准库与细节",
        detail: "标准库函数、数学、时间、字符分类、易错点",
        match: ["*"]
      }
    ],

    // 流程图：节点文字 + 指向的词条 id；UI 会画成可点击的流程图。
    roadmap: {
      title: "C 语言学习路线图",
      subtitle: "从装好编译器到能写出自己的小项目；每个方框都可以点开对应词条",
      nodes: [
        { id: "n1", label: "① 写好第一个程序", hint: "认识 include、main、printf", entryId: "first-program" },
        { id: "d1", label: "程序能编译运行吗？", hint: "先确认构建和运行结果", entryId: "how-to-compile", kind: "decision" },
        { id: "n-error", label: "看懂第一条报错", hint: "区分编译错误与链接错误", entryId: "compile-error-reading" },
        { id: "n2", label: "② 变量与基本类型", hint: "从 int、double、char 开始", entryId: "variables-and-types-intro" },
        { id: "n3", label: "③ 输入与输出", hint: "用 printf 和 scanf 与程序交互", entryId: "printf-format-basics" },
        { id: "n4", label: "④ 运算符与表达式", hint: "让数据参与计算和比较", entryId: "arithmetic-operators" },
        { id: "n5", label: "⑤ 分支与循环", hint: "用条件和循环控制执行顺序", entryId: "if-statement" },
        { id: "n6", label: "⑥ 函数", hint: "把重复步骤拆成可复用函数", entryId: "function-definition" },
        { id: "n7", label: "⑦ 数组与字符串", hint: "处理一组数据和文本", entryId: "one-dimensional-array" },
        { id: "n8", label: "⑧ 指针", hint: "理解地址、解引用和数组关系", entryId: "pointer-declaration" },
        { id: "n9", label: "⑨ 结构体与内存", hint: "组织数据并学习动态分配", entryId: "struct-type" },
        { id: "n10", label: "⑩ 文件与预处理", hint: "保存数据并拆分项目", entryId: "fopen-function" },
        { id: "n11", label: "⑪ 完成一个小项目", hint: "综合练习、调试和测试", entryId: "small-program-structure" }
      ],
      edges: [
        { from: "n1", to: "d1", label: "" },
        { from: "d1", to: "n-error", label: "否" },
        { from: "n-error", to: "d1", label: "修正后" },
        { from: "d1", to: "n2", label: "是" },
        { from: "n2", to: "n3", label: "" },
        { from: "n3", to: "n4", label: "" },
        { from: "n4", to: "n5", label: "" },
        { from: "n5", to: "n6", label: "" },
        { from: "n6", to: "n7", label: "" },
        { from: "n7", to: "n8", label: "" },
        { from: "n8", to: "n9", label: "" },
        { from: "n9", to: "n10", label: "" },
        { from: "n10", to: "n11", label: "" }
      ]
    }
  };
}());
