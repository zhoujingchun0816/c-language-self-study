(function () {
  "use strict";

  var program = window.C_SYNTAX_PROGRAM;
  function make(id, name, category, summary, headers, usage, syntax, body, notes, related, aliases, beforeMain) {
    return { id: id, name: name, aliases: aliases || [], category: category, summary: summary,
      headers: headers, usage: usage, syntax: syntax, example: program(headers, body, beforeMain || ""),
      notes: notes, related: related || [] };
  }

  var entries = [
  {
    "id": "malloc-function",
    "name": "malloc",
    "aliases": [
      "动态分配",
      "heap",
      "堆内存"
    ],
    "category": "内存管理",
    "summary": "malloc 分配指定字节数的未初始化存储，失败时返回空指针。",
    "syntax": "void *malloc(size_t size);",
    "headers": [
      "stdio.h",
      "stdlib.h"
    ],
    "usage": "“malloc”适合在内存管理相关场景中使用；先确认前置条件，再按所示语法与完整示例组合到程序中。",
    "example": "#include <stdio.h>\n#include <stdlib.h>\n\nint main(void) {\n    int *value = malloc(sizeof *value);\n    if (value == NULL) return 1;\n    *value = 42;\n    printf(\"%d\\n\", *value);\n    free(value);\n    return 0;\n}\n",
    "notes": [
      "C 中不需要强制转换 malloc 的返回值；使用后必须释放。",
      "使用前应核对操作对象的类型、有效范围与当前生命周期。",
      "组合到较大程序时应检查编译器告警，并覆盖失败或边界路径。"
    ],
    "related": [
      "free-function",
      "sizeof-allocation"
    ]
  },
  {
    "id": "calloc-function",
    "name": "calloc",
    "aliases": [
      "零初始化分配",
      "动态数组"
    ],
    "category": "内存管理",
    "summary": "calloc 为若干元素分配存储，并把所有字节初始化为零。",
    "syntax": "void *calloc(size_t count, size_t element_size);",
    "headers": [
      "stdio.h",
      "stdlib.h"
    ],
    "usage": "“calloc”适合在内存管理相关场景中使用；先确认前置条件，再按所示语法与完整示例组合到程序中。",
    "example": "#include <stdio.h>\n#include <stdlib.h>\n\nint main(void) {\n    int *values = calloc(3U, sizeof *values);\n    if (values == NULL) return 1;\n    printf(\"%d\\n\", values[1]);\n    free(values);\n    return 0;\n}\n",
    "notes": [
      "两个尺寸参数相乘溢出时分配失败；仍需检查返回值。",
      "使用前应核对操作对象的类型、有效范围与当前生命周期。",
      "组合到较大程序时应检查编译器告警，并覆盖失败或边界路径。"
    ],
    "related": [
      "malloc-function",
      "free-function"
    ]
  },
  {
    "id": "realloc-function",
    "name": "realloc",
    "aliases": [
      "调整内存",
      "扩容",
      "缩容"
    ],
    "category": "内存管理",
    "summary": "realloc 尝试改变已有动态存储块大小，可能返回新的地址。",
    "syntax": "void *realloc(void *pointer, size_t new_size);",
    "headers": [
      "stdio.h",
      "stdlib.h"
    ],
    "usage": "“realloc”适合在内存管理相关场景中使用；先确认前置条件，再按所示语法与完整示例组合到程序中。",
    "example": "#include <stdio.h>\n#include <stdlib.h>\n\nint main(void) {\n    int *values = malloc(sizeof *values);\n    if (values == NULL) return 1;\n    int *resized = realloc(values, 2U * sizeof *values);\n    if (resized == NULL) { free(values); return 1; }\n    values = resized;\n    values[1] = 8;\n    printf(\"%d\\n\", values[1]);\n    free(values);\n    return 0;\n}\n",
    "notes": [
      "先用临时指针接收结果，避免失败时丢失原始地址。",
      "使用前应核对操作对象的类型、有效范围与当前生命周期。",
      "组合到较大程序时应检查编译器告警，并覆盖失败或边界路径。"
    ],
    "related": [
      "malloc-function",
      "free-function"
    ]
  },
  {
    "id": "free-function",
    "name": "free",
    "aliases": [
      "释放内存",
      "deallocate"
    ],
    "category": "内存管理",
    "summary": "free 释放先前由动态内存函数获得的存储块。",
    "syntax": "void free(void *pointer);",
    "headers": [
      "stdlib.h"
    ],
    "usage": "“free”适合在内存管理相关场景中使用；先确认前置条件，再按所示语法与完整示例组合到程序中。",
    "example": "#include <stdlib.h>\n\nint main(void) {\n    int *value = malloc(sizeof *value);\n    if (value == NULL) return 1;\n    *value = 3;\n    free(value);\n    value = NULL;\n    return 0;\n}\n",
    "notes": [
      "同一块存储只能释放一次；free(NULL) 是安全的空操作。",
      "使用前应核对操作对象的类型、有效范围与当前生命周期。",
      "组合到较大程序时应检查编译器告警，并覆盖失败或边界路径。"
    ],
    "related": [
      "malloc-function",
      "dangling-pointer"
    ]
  },
  {
    "id": "sizeof-allocation",
    "name": "用 sizeof 分配",
    "aliases": [
      "sizeof",
      "分配大小",
      "类型安全"
    ],
    "category": "内存管理",
    "summary": "用所指对象表达式计算分配大小，可减少类型变化时的维护错误。",
    "syntax": "Type *p = malloc(count * sizeof *p);",
    "headers": [
      "stdio.h",
      "stdlib.h"
    ],
    "usage": "“用 sizeof 分配”适合在内存管理相关场景中使用；先确认前置条件，再按所示语法与完整示例组合到程序中。",
    "example": "#include <stdio.h>\n#include <stdlib.h>\n\nint main(void) {\n    size_t count = 4U;\n    double *values = malloc(count * sizeof *values);\n    if (values == NULL) return 1;\n    values[0] = 1.5;\n    printf(\"%.1f\\n\", values[0]);\n    free(values);\n    return 0;\n}\n",
    "notes": [
      "乘法前应考虑 count 与元素大小相乘是否溢出。",
      "使用前应核对操作对象的类型、有效范围与当前生命周期。",
      "组合到较大程序时应检查编译器告警，并覆盖失败或边界路径。"
    ],
    "related": [
      "malloc-function"
    ]
  },
  {
    "id": "dynamic-array",
    "name": "动态数组",
    "aliases": [
      "dynamic array",
      "运行时长度",
      "堆数组"
    ],
    "category": "内存管理",
    "summary": "动态数组在运行时决定元素数量，并通过指针和下标访问连续元素。",
    "syntax": "int *values = malloc(count * sizeof *values);",
    "headers": [
      "stdio.h",
      "stdlib.h"
    ],
    "usage": "“动态数组”适合在内存管理相关场景中使用；先确认前置条件，再按所示语法与完整示例组合到程序中。",
    "example": "#include <stdio.h>\n#include <stdlib.h>\n\nint main(void) {\n    size_t count = 3U;\n    int *values = malloc(count * sizeof *values);\n    if (values == NULL) return 1;\n    for (size_t i = 0; i < count; ++i) values[i] = (int)i;\n    printf(\"%d\\n\", values[2]);\n    free(values);\n    return 0;\n}\n",
    "notes": [
      "动态数组不自带长度，需要单独保存元素数量。",
      "使用前应核对操作对象的类型、有效范围与当前生命周期。",
      "组合到较大程序时应检查编译器告警，并覆盖失败或边界路径。"
    ],
    "related": [
      "pointer-arithmetic",
      "free-function"
    ]
  },
  {
    "id": "flexible-array-member",
    "name": "柔性数组成员",
    "aliases": [
      "flexible array",
      "不完整数组成员"
    ],
    "category": "内存管理",
    "summary": "结构体最后一个成员可声明为无长度数组，并随结构体一次分配额外空间。",
    "syntax": "struct Packet { size_t length; unsigned char data[]; };",
    "headers": [
      "stdio.h",
      "stdlib.h"
    ],
    "usage": "“柔性数组成员”适合在内存管理相关场景中使用；先确认前置条件，再按所示语法与完整示例组合到程序中。",
    "example": "#include <stdio.h>\n#include <stdlib.h>\n\nstruct Packet {\n    size_t length;\n    unsigned char data[];\n};\n\nint main(void) {\n    size_t count = 3U;\n    struct Packet *packet = malloc(sizeof *packet + count * sizeof packet->data[0]);\n    if (packet == NULL) return 1;\n    packet->length = count;\n    packet->data[0] = 9U;\n    printf(\"%lu %u\\n\", (unsigned long)packet->length, (unsigned)packet->data[0]);\n    free(packet);\n    return 0;\n}\n",
    "notes": [
      "柔性数组必须是含至少一个其他命名成员的结构体的最后成员。",
      "使用前应核对操作对象的类型、有效范围与当前生命周期。",
      "组合到较大程序时应检查编译器告警，并覆盖失败或边界路径。"
    ],
    "related": [
      "struct-type",
      "malloc-function"
    ]
  },
  {
    "id": "qsort-function",
    "name": "qsort",
    "aliases": [
      "排序",
      "快速排序接口",
      "比较函数"
    ],
    "category": "标准库函数",
    "summary": "qsort 使用调用者提供的比较函数对任意类型数组排序。",
    "syntax": "void qsort(void *base, size_t count, size_t size, int (*compare)(const void *, const void *));",
    "headers": [
      "stdio.h",
      "stdlib.h"
    ],
    "usage": "“qsort”适合在标准库函数相关场景中使用；先确认前置条件，再按所示语法与完整示例组合到程序中。",
    "example": "#include <stdio.h>\n#include <stdlib.h>\n\nstatic int compare_ints(const void *left, const void *right) {\n    int a = *(const int *)left;\n    int b = *(const int *)right;\n    return (a > b) - (a < b);\n}\n\nint main(void) {\n    int values[] = {3, 1, 2};\n    qsort(values, 3U, sizeof values[0], compare_ints);\n    printf(\"%d %d %d\\n\", values[0], values[1], values[2]);\n    return 0;\n}\n",
    "notes": [
      "比较函数应返回负数、零或正数，并满足一致的严格弱序。",
      "使用前应核对操作对象的类型、有效范围与当前生命周期。",
      "组合到较大程序时应检查编译器告警，并覆盖失败或边界路径。"
    ],
    "related": [
      "function-pointer",
      "bsearch-function"
    ]
  },
  {
    "id": "bsearch-function",
    "name": "bsearch",
    "aliases": [
      "二分查找",
      "有序数组",
      "binary search"
    ],
    "category": "标准库函数",
    "summary": "bsearch 在已按同一比较规则排序的数组中查找匹配元素。",
    "syntax": "void *bsearch(const void *key, const void *base, size_t count, size_t size, int (*compare)(const void *, const void *));",
    "headers": [
      "stdio.h",
      "stdlib.h"
    ],
    "usage": "“bsearch”适合在标准库函数相关场景中使用；先确认前置条件，再按所示语法与完整示例组合到程序中。",
    "example": "#include <stdio.h>\n#include <stdlib.h>\n\nstatic int compare_ints(const void *left, const void *right) {\n    int a = *(const int *)left;\n    int b = *(const int *)right;\n    return (a > b) - (a < b);\n}\n\nint main(void) {\n    int values[] = {1, 3, 5, 7};\n    int key = 5;\n    int *found = bsearch(&key, values, 4U, sizeof values[0], compare_ints);\n    if (found != NULL) printf(\"%d\\n\", *found);\n    return 0;\n}\n",
    "notes": [
      "输入数组必须已排序；多个相等元素中返回哪一个未指定。",
      "使用前应核对操作对象的类型、有效范围与当前生命周期。",
      "组合到较大程序时应检查编译器告警，并覆盖失败或边界路径。"
    ],
    "related": [
      "qsort-function",
      "function-pointer"
    ]
  },
  {
    "id": "strtol-function",
    "name": "strtol",
    "aliases": [
      "字符串转整数",
      "进制转换",
      "错误检测"
    ],
    "category": "标准库函数",
    "summary": "strtol 把字符串按指定进制转换为 long，并可报告停止解析的位置。",
    "syntax": "long strtol(const char *restrict text, char **restrict end, int base);",
    "headers": [
      "stdio.h",
      "stdlib.h"
    ],
    "usage": "“strtol”适合在标准库函数相关场景中使用；先确认前置条件，再按所示语法与完整示例组合到程序中。",
    "example": "#include <stdio.h>\n#include <stdlib.h>\n\nint main(void) {\n    char *end = NULL;\n    long value = strtol(\"42x\", &end, 10);\n    printf(\"%ld %c\\n\", value, *end);\n    return 0;\n}\n",
    "notes": [
      "严谨代码还应在调用前清 errno，并检查范围错误与未转换输入。",
      "使用前应核对操作对象的类型、有效范围与当前生命周期。",
      "组合到较大程序时应检查编译器告警，并覆盖失败或边界路径。"
    ],
    "related": [
      "scanf-function"
    ]
  }
  ];

  var extraEntries = [
    make("aligned-alloc-function", "aligned_alloc", "内存管理", "aligned_alloc 分配满足指定对齐的动态存储。", ["stdlib.h"], "需要 SIMD 或硬件接口要求的更严格对齐时使用 aligned_alloc；大小必须是对齐量的整数倍，结果仍用 free 释放。", "void *aligned_alloc(size_t alignment, size_t size);", ["void *memory = aligned_alloc(16U, 32U);", "if (memory == NULL) return 1;", "free(memory);"], ["alignment 必须是实现支持的有效对齐值。", "size 不是 alignment 整数倍时调用不满足标准约束。", "返回的存储未初始化，释放方式与 malloc 结果相同。"], ["malloc-function", "free-function"]),
    make("atoi-function", "atoi", "标准库函数", "atoi 把十进制字符串转换为 int，但不能可靠报告错误。", ["stdlib.h"], "只在输入已被其他逻辑保证为合法且范围合适时使用 atoi；面对外部输入应改用 strtol 检查 endptr 与范围。", "int atoi(const char *string);", ["int value = atoi(\"42\");", "return value == 42 ? 0 : 1;"], ["无法区分合法的零与转换失败返回的零。", "结果超出 int 可表示范围时行为没有定义。", "函数忽略前导空白并在首个无效字符处停止。"], ["strtol-function", "atol-function"]),
    make("atol-function", "atol", "标准库函数", "atol 把十进制字符串转换为 long。", ["stdlib.h"], "仅对已经验证的十进制文本可用 atol 做简洁转换；需要识别无数字、尾随字符或溢出时选择 strtol。", "long atol(const char *string);", ["long value = atol(\"123\");", "return value == 123L ? 0 : 1;"], ["atol 没有 endptr，调用者不知道转换停在哪里。", "溢出不能通过返回值或 errno 可靠检测。", "它等价于固定十进制且不提供错误信息的 strtol 用法。"], ["atoi-function", "strtol-function"]),
    make("atoll-function", "atoll", "标准库函数", "atoll 把十进制字符串转换为 long long。", ["stdlib.h"], "内部常量文本已保证正确时可用 atoll；任何需要验证范围和完整消费的输入都应使用 strtoll。", "long long atoll(const char *string);", ["long long value = atoll(\"9000\");", "return value == 9000LL ? 0 : 1;"], ["无数字输入与数值零无法从返回值区分。", "越过 long long 范围时不能依靠此接口诊断。", "前导正负号可以被识别，但进制固定为十进制。"], ["strtoll-function", "atol-function"]),
    make("atof-function", "atof", "标准库函数", "atof 把字符串转换为 double，却不提供错误位置。", ["stdlib.h"], "只有文本来源可信且无需诊断时才使用 atof；外部浮点输入应使用 strtod 并检查 endptr 与 ERANGE。", "double atof(const char *string);", ["double value = atof(\"2.5\");", "return value > 2.4 && value < 2.6 ? 0 : 1;"], ["返回零无法说明输入是零还是根本没有转换。", "接口不暴露停止解析的位置，尾随垃圾容易被忽略。", "范围错误的可靠处理需要改用 strtod。"], ["strtod-function", "atoi-function"]),
    make("strtoll-function", "strtoll", "标准库函数", "strtoll 按指定进制把字符串转换为 long long。", ["errno.h", "stdlib.h"], "解析可能超过 long 范围的有符号整数时使用 strtoll；先清 errno，再检查 endptr、ERANGE 和尾随字符。", "long long strtoll(const char *restrict string, char **restrict endptr, int base);", ["char *end = NULL;", "errno = 0;", "long long value = strtoll(\"922\", &end, 10);", "if (errno == ERANGE || end == NULL || *end != '\\0') return 1;", "return value == 922LL ? 0 : 1;"], ["base 为零时可识别十六进制和八进制前缀。", "endptr 等于输入起点表示没有任何数字被转换。", "LLONG_MIN 或 LLONG_MAX 只有结合 ERANGE 才表示溢出。"], ["strtol-function", "strtoull-function"]),
    make("strtoul-function", "strtoul", "标准库函数", "strtoul 按指定进制把字符串转换为 unsigned long。", ["errno.h", "stdlib.h"], "解析无符号 long 文本时使用 strtoul；清 errno 并验证 endptr，业务上不允许负号时还要在转换前显式拒绝。", "unsigned long strtoul(const char *restrict string, char **restrict endptr, int base);", ["char *end = NULL;", "errno = 0;", "unsigned long value = strtoul(\"ff\", &end, 16);", "if (errno == ERANGE || end == NULL || *end != '\\0') return 1;", "return value == 255UL ? 0 : 1;"], ["该函数接受可选负号，并按无符号规则产生结果。", "base 必须为零或二到三十六范围内的有效值。", "返回 ULONG_MAX 时必须结合 errno 判断是否范围错误。"], ["strtol-function", "strtoull-function"]),
    make("strtoull-function", "strtoull", "标准库函数", "strtoull 把字符串转换为 unsigned long long。", ["errno.h", "stdlib.h"], "读取可能很大的无符号整数时用 strtoull；严格验证未转换、溢出和尾随内容，并按需求拒绝负号。", "unsigned long long strtoull(const char *restrict string, char **restrict endptr, int base);", ["char *end = NULL;", "errno = 0;", "unsigned long long value = strtoull(\"1000\", &end, 10);", "if (errno == ERANGE || end == NULL || *end != '\\0') return 1;", "return value == 1000ULL ? 0 : 1;"], ["无数字时 endptr 会保持在原字符串起点。", "进制大于十时字母大小写均可表示数字。", "ULLONG_MAX 可能是合法值，不能单看返回值判断失败。"], ["strtoll-function", "strtoul-function"]),
    make("strtod-function", "strtod", "标准库函数", "strtod 把字符串转换为 double 并报告停止位置。", ["errno.h", "stdlib.h"], "解析外部浮点文本时优先用 strtod；调用前令 errno 为零，之后检查 endptr、ERANGE 和是否完整消费。", "double strtod(const char *restrict string, char **restrict endptr);", ["char *end = NULL;", "errno = 0;", "double value = strtod(\"1.25\", &end);", "if (errno == ERANGE || end == NULL || *end != '\\0') return 1;", "return value > 1.2 && value < 1.3 ? 0 : 1;"], ["实现可识别十进制、十六进制浮点形式及特殊值。", "下溢和上溢都可能通过 ERANGE 报告。", "endptr 能区分没有转换和只转换了有效前缀。"], ["atof-function", "strtof-function"]),
    make("strtof-function", "strtof", "标准库函数", "strtof 把字符串转换为 float 并返回解析终点。", ["errno.h", "stdlib.h"], "目标对象确实是 float 且需错误检测时使用 strtof；清 errno 后检查范围与 endptr，避免先转 double 再缩窄。", "float strtof(const char *restrict string, char **restrict endptr);", ["char *end = NULL;", "errno = 0;", "float value = strtof(\"0.5\", &end);", "if (errno == ERANGE || end == NULL || *end != '\\0') return 1;", "return value > 0.4F && value < 0.6F ? 0 : 1;"], ["返回精度和范围以 float 类型为准。", "字符串前导空白会被跳过，尾随空白仍由 endptr 指向。", "合法的巨大或极小文本可能触发范围错误。"], ["strtod-function", "strtold-function"]),
    make("strtold-function", "strtold", "标准库函数", "strtold 把字符串转换为 long double。", ["errno.h", "stdlib.h"], "需要 long double 的实现精度与范围时使用 strtold；仍要检查 endptr 和 ERANGE，不能假定它总比 double 更宽。", "long double strtold(const char *restrict string, char **restrict endptr);", ["char *end = NULL;", "errno = 0;", "long double value = strtold(\"3.0\", &end);", "if (errno == ERANGE || end == NULL || *end != '\\0') return 1;", "return value == 3.0L ? 0 : 1;"], ["某些实现的 long double 与 double 具有相同表示。", "特殊值和十六进制形式的接受规则由浮点转换语法规定。", "比较解析结果时应考虑浮点舍入而非依赖任意小数精确相等。"], ["strtod-function", "strtof-function"]),
    make("rand-function", "rand", "标准库函数", "rand 产生零到 RAND_MAX 范围内的伪随机整数。", ["stdlib.h"], "只为模拟、测试或非安全随机选择使用 rand；需要复现时配固定种子，密码学用途必须换安全随机源。", "int rand(void);", ["srand(1U);", "int value = rand();", "return value >= 0 && value <= RAND_MAX ? 0 : 1;"], ["序列质量和周期由实现决定，跨平台结果不一致。", "对 rand 直接取模会产生分布偏差，尤其范围不能整除时。", "该生成器不是密码学安全，不能生成口令或令牌。"], ["srand-function", "rand-max-constant"]),
    make("srand-function", "srand", "标准库函数", "srand 为后续 rand 调用设置伪随机序列种子。", ["stdlib.h"], "程序开始时调用一次 srand；固定种子用于可复现实验，变化种子也不会让 rand 达到密码学安全。", "void srand(unsigned int seed);", ["srand(123U);", "int first = rand();", "srand(123U);", "int repeated = rand();", "return first == repeated ? 0 : 1;"], ["相同实现中同一种子应产生相同的后续序列。", "每次取数前重新播种会降低随机性并造成重复。", "标准不保证不同 C 库对同一种子给出相同序列。"], ["rand-function", "rand-max-constant"]),
    make("rand-max-constant", "RAND_MAX", "数据类型", "RAND_MAX 是 rand 可能返回的最大值宏。", ["stdlib.h"], "需要归一化 rand 结果或检查范围时使用 RAND_MAX；它至少为 32767，但具体大小必须在当前实现读取。", "#define RAND_MAX /* implementation-defined positive integer */", ["int value = rand();", "if (value < 0 || value > RAND_MAX) return 1;"], ["宏值在不同实现之间可能不同。", "rand 的闭区间同时包含零和 RAND_MAX。", "用浮点除法归一化时要显式转换并理解端点。"], ["rand-function", "srand-function"]),
    make("abs-function", "abs", "标准库函数", "abs 返回 int 参数的绝对值。", ["stdlib.h"], "对 int 计算绝对值时使用 abs；如果输入可能是 INT_MIN，要先排除，因为其正值通常无法用 int 表示。", "int abs(int value);", ["int value = abs(-7);", "return value == 7 ? 0 : 1;"], ["abs(INT_MIN) 的结果不可表示，会产生未定义行为。", "实参是 int，浮点绝对值应使用 math.h 的 fabs。", "无符号值不需要 abs，混用还会发生转换问题。"], ["labs-function", "llabs-function"]),
    make("labs-function", "labs", "标准库函数", "labs 返回 long 参数的绝对值。", ["stdlib.h"], "值的类型是 long 时用 labs，保持接口与数据宽度一致；调用前排除 LONG_MIN 这一不可取正值的边界。", "long labs(long value);", ["long value = labs(-9L);", "return value == 9L ? 0 : 1;"], ["labs(LONG_MIN) 因正结果超范围而没有定义。", "不要用 abs 代替，否则参数可能在调用前被缩窄。", "返回类型仍是 long，不会自动扩大保存范围。"], ["abs-function", "llabs-function"]),
    make("llabs-function", "llabs", "标准库函数", "llabs 返回 long long 参数的绝对值。", ["stdlib.h"], "处理 long long 有符号量时使用 llabs；边界值 LLONG_MIN 需要以其他逻辑处理，不能直接求绝对值。", "long long llabs(long long value);", ["long long value = llabs(-11LL);", "return value == 11LL ? 0 : 1;"], ["最小 long long 的绝对值超出该类型正范围。", "后缀 LL 可让整数字面量保持目标参数类型。", "该函数只处理整数，长双精度应使用 fabsl。"], ["abs-function", "labs-function"]),
    make("div-function", "div", "标准库函数", "div 同时计算 int 除法的商与余数。", ["stdlib.h"], "同时需要 int 商和余数时使用 div，并读取 div_t 的 quot 与 rem；除数必须非零，还要避开最小值除负一。", "div_t div(int numerator, int denominator);", ["div_t result = div(17, 5);", "return result.quot == 3 && result.rem == 2 ? 0 : 1;"], ["余数符号与被除数一致，并满足重组等式。", "分母为零会导致未定义行为。", "INT_MIN 除以负一同样因商不可表示而无定义。"], ["ldiv-function", "lldiv-function"]),
    make("ldiv-function", "ldiv", "标准库函数", "ldiv 同时返回 long 除法的商与余数。", ["stdlib.h"], "long 类型的商和余数都需要时使用 ldiv；确保分母非零，并用 ldiv_t 接收两个结果成员。", "ldiv_t ldiv(long numerator, long denominator);", ["ldiv_t result = ldiv(20L, 6L);", "return result.quot == 3L && result.rem == 2L ? 0 : 1;"], ["quot 与 rem 的具体成员名由标准固定。", "结果遵循向零截断的整数除法规则。", "LONG_MIN 与负一的组合会产生不可表示的商。"], ["div-function", "lldiv-function"]),
    make("lldiv-function", "lldiv", "标准库函数", "lldiv 同时计算 long long 的商与余数。", ["stdlib.h"], "操作数为 long long 且同时需要商余数时用 lldiv；传入非零分母并用 lldiv_t 保存返回结构。", "lldiv_t lldiv(long long numerator, long long denominator);", ["lldiv_t result = lldiv(23LL, 7LL);", "return result.quot == 3LL && result.rem == 2LL ? 0 : 1;"], ["余数绝对值小于分母绝对值。", "分子可由 quot 乘分母再加 rem 重构。", "LLONG_MIN 除以负一仍是必须避免的溢出边界。"], ["div-function", "ldiv-function"]),
    make("exit-function", "exit", "标准库函数", "exit 执行正常程序终止并把状态返回宿主环境。", ["stdlib.h"], "遇到无法继续的全局失败且允许执行正常清理时调用 exit；传 EXIT_SUCCESS 或 EXIT_FAILURE，并理解自动对象不会逐层退栈。", "_Noreturn void exit(int status);", ["if (0) exit(EXIT_FAILURE);"], ["exit 会调用 atexit 注册函数并刷新关闭标准 I/O 流。", "当前函数的自动对象不会像普通 return 那样逐层离开作用域。", "main 返回状态与调用 exit 在正常终止语义上相近。"], ["atexit-function", "abort-function"]),
    make("atexit-function", "atexit", "标准库函数", "atexit 注册在正常终止期间调用的无参数函数。", ["stdlib.h"], "需要在 exit 或 main 返回时执行进程级清理可注册 atexit；检查非零失败值，并让回调只依赖仍有效的静态资源。", "int atexit(void (*function)(void));", ["if (atexit(cleanup) != 0) return 1;"], ["回调按与注册相反的顺序执行。", "abort 和 quick_exit 不会运行 atexit 回调。", "标准至少支持注册三十二个函数，但资源仍可能耗尽。"], ["exit-function", "at-quick-exit-function"], [], "static void cleanup(void) {\n}"),
    make("at-quick-exit-function", "at_quick_exit", "标准库函数", "at_quick_exit 注册 quick_exit 终止路径的回调。", ["stdlib.h"], "程序设计明确采用 quick_exit 时，用 at_quick_exit 注册专属最小清理；检查注册结果，不要与 atexit 回调语义混淆。", "int at_quick_exit(void (*function)(void));", ["if (at_quick_exit(quick_cleanup) != 0) return 1;"], ["这些回调只由 quick_exit 调用，普通 exit 不执行。", "执行顺序与注册顺序相反。", "快速终止不保证刷新普通 stdio 缓冲区。"], ["quick-exit-function", "atexit-function"], [], "static void quick_cleanup(void) {\n}"),
    make("quick-exit-function", "quick_exit", "标准库函数", "quick_exit 执行快速正常终止并运行专属回调。", ["stdlib.h"], "只有确实要跳过常规流刷新与 atexit 清理时才用 quick_exit；传标准状态宏，并提前注册必要的快速回调。", "_Noreturn void quick_exit(int status);", ["if (0) quick_exit(EXIT_SUCCESS);"], ["quick_exit 调用 at_quick_exit 注册的函数。", "它不执行 atexit 回调，也不保证刷新所有标准流。", "函数不会返回，后续语句在实际调用路径不可到达。"], ["at-quick-exit-function", "exit-function"]),
    make("abort-function", "abort", "标准库函数", "abort 导致程序异常终止并引发 SIGABRT。", ["stdlib.h"], "发现不可恢复的内部一致性破坏且不应继续运行时可用 abort；它不是普通错误返回，也不会执行正常终止清理。", "_Noreturn void abort(void);", ["if (0) abort();"], ["abort 会引发 SIGABRT，处理器返回后仍将异常终止。", "atexit 和 at_quick_exit 注册的回调都不会执行。", "标准 I/O 缓冲是否刷新不应依赖，重要诊断要提前提交。"], ["exit-function", "quick-exit-function"]),
    make("exit-status-constants", "EXIT_SUCCESS / EXIT_FAILURE", "数据类型", "两个宏提供可移植的成功与失败终止状态。", ["stdlib.h"], "从 main 返回或调用 exit、quick_exit 时用 EXIT_SUCCESS 和 EXIT_FAILURE 表达通用结果；特定协议状态码另按宿主约定。", "return EXIT_SUCCESS; /* or EXIT_FAILURE */", ["int status = EXIT_SUCCESS;", "if (status == EXIT_FAILURE) return EXIT_FAILURE;"], ["EXIT_SUCCESS 不保证宏值一定等于零，虽然零也表示成功。", "EXIT_FAILURE 的具体值由实现定义。", "宿主环境如何呈现状态仍取决于操作系统与调用方式。"], ["exit-function", "quick-exit-function"]),
    make("getenv-function", "getenv", "标准库函数", "getenv 查找宿主环境变量并返回内部字符串指针。", ["stdlib.h"], "读取可选配置时用 getenv；先判 NULL，及时复制需要长期保存的值，并把环境内容视为不可信输入。", "char *getenv(const char *name);", ["char *value = getenv(\"C_SYNTAX_LOOKUP_MISSING_VALUE\");", "if (value != NULL && value[0] == '\\0') return 1;"], ["未找到名称时返回 NULL，这不等同于空字符串值。", "返回存储可能被后续环境操作覆盖，不应由调用者 free。", "变量名、可用集合和线程安全细节都具有平台差异。"], ["system-function", "strtol-function"]),
    make("system-function", "system", "标准库函数", "system 把命令字符串交给宿主命令处理器。", ["stdlib.h"], "仅在确需调用宿主命令处理器且命令完全受程序控制时考虑 system；先用 NULL 查询支持，并按平台规则解释状态。", "int system(const char *command);", ["int available = system(NULL);", "if (available < 0) return 1;"], ["把用户输入拼入命令会造成命令注入。", "返回值编码和可执行的命令语法都依赖宿主环境。", "该调用可能阻塞、改变信号处理并产生外部副作用。"], ["getenv-function", "exit-status-constants"]),
    make("mb-cur-max-macro", "MB_CUR_MAX", "数据类型", "MB_CUR_MAX 给出当前 C 区域设置中多字节字符的最大字节数。", ["stdlib.h"], "按当前区域设置为一个多字节字符准备缓冲时查询 MB_CUR_MAX；区域改变后必须重新读取，不能当编译期常量使用。", "MB_CUR_MAX", ["size_t maximum = MB_CUR_MAX;", "return maximum >= 1U ? 0 : 1;"], ["它是随运行时 locale 变化的表达式，不一定可用于静态数组长度。", "初始 C 区域设置中该值至少为一。", "该宏描述最大编码长度，不是当前具体字符的长度。"], ["mblen-function", "mbtowc-function"]),
    make("mblen-function", "mblen", "标准库函数", "mblen 判断当前多字节序列表示的字符长度。", ["stdlib.h"], "处理受当前 locale 控制的短多字节序列时可用 mblen；传可用字节上限，并检查负值表示编码无效。", "int mblen(const char *string, size_t size);", ["int length = mblen(\"A\", MB_CUR_MAX);", "return length == 1 ? 0 : 1;"], ["传 NULL 可重置或查询内部转换状态。", "空字符返回零，普通有效字符返回使用的字节数。", "接口持有内部状态，复杂或并发转换宜选更明确的重启式函数。"], ["mb-cur-max-macro", "mbtowc-function"]),
    make("mbtowc-function", "mbtowc", "标准库函数", "mbtowc 把一个多字节字符转换为 wchar_t。", ["stdlib.h"], "按当前 locale 将单个编码序列变成宽字符时可用 mbtowc；提供字节上限并检查负值，状态化编码需谨慎。", "int mbtowc(wchar_t *restrict wide, const char *restrict string, size_t size);", ["wchar_t wide = 0;", "int length = mbtowc(&wide, \"A\", MB_CUR_MAX);", "return length == 1 && wide == (wchar_t)'A' ? 0 : 1;"], ["目标指针可为 NULL，此时仍处理转换状态但不存结果。", "无效或不完整序列返回负值。", "转换规则取决于当前 LC_CTYPE 区域设置。"], ["mblen-function", "wctomb-function"]),
    make("wctomb-function", "wctomb", "标准库函数", "wctomb 把一个 wchar_t 转换为当前多字节编码。", ["stdlib.h"], "需要把单个宽字符编码到当前 locale 的多字节序列时使用 wctomb；目标至少留 MB_CUR_MAX 字节并检查负值。", "int wctomb(char *string, wchar_t wide);", ["char buffer[MB_CUR_MAX];", "int length = wctomb(buffer, (wchar_t)'A');", "return length == 1 && buffer[0] == 'A' ? 0 : 1;"], ["传 NULL 用于重置或查询内部转换状态。", "目标宽字符在当前编码中不可表示时返回负值。", "该接口使用内部状态，线程和交错调用需要额外考虑。"], ["mbtowc-function", "wcstombs-function"]),
    make("mbstowcs-function", "mbstowcs", "标准库函数", "mbstowcs 把多字节字符串转换为宽字符数组。", ["stdlib.h"], "将完整窄字符串按当前 locale 转换为宽字符串时用 mbstowcs；传目标元素容量并检查 (size_t)-1 错误。", "size_t mbstowcs(wchar_t *restrict wide, const char *restrict string, size_t count);", ["wchar_t wide[8];", "size_t count = mbstowcs(wide, \"abc\", 8U);", "if (count == (size_t)-1) return 1;", "return count == 3U && wide[3] == (wchar_t)0 ? 0 : 1;"], ["返回转换出的宽字符数，不包括结尾宽空字符。", "目标容量不足时结果可能没有终止符。", "无效多字节序列以 (size_t)-1 报告。"], ["wcstombs-function", "mbtowc-function"]),
    make("wcstombs-function", "wcstombs", "标准库函数", "wcstombs 把宽字符串转换为多字节字符序列。", ["stdlib.h"], "将宽字符串按当前 locale 编码到窄缓冲区时用 wcstombs；容量按字节给出，并为最终空字符保留空间。", "size_t wcstombs(char *restrict string, const wchar_t *restrict wide, size_t count);", ["char text[8];", "const wchar_t wide[] = {(wchar_t)'o', (wchar_t)'k', (wchar_t)0};", "size_t count = wcstombs(text, wide, sizeof text);", "if (count == (size_t)-1) return 1;", "return count == 2U && text[2] == '\\0' ? 0 : 1;"], ["返回写入的字节数，不包含结尾空字符。", "某个宽字符不可表示时返回 (size_t)-1。", "字节容量不足会停止转换，结果不保证有空终止。"], ["mbstowcs-function", "wctomb-function"]),
    make("allocation-ownership-pitfall", "malloc 家族错误检查与所有权", "常见易错点", "动态内存必须同时管理分配失败、边界、所有权和释放时机。", ["stdlib.h"], "设计动态对象时明确唯一释放责任；每次分配判 NULL，扩容用临时指针，所有下标受容量约束，释放后不再访问。", "void *temporary = realloc(pointer, new_size);", ["int *values = malloc(2U * sizeof *values);", "if (values == NULL) return 1;", "int *resized = realloc(values, 4U * sizeof *values);", "if (resized == NULL) { free(values); return 1; }", "values = resized;", "free(values);", "values = NULL;"], ["遗漏 free 会泄漏，重复 free 或释放非分配地址是未定义行为。", "写出已分配边界会破坏相邻对象且后果可能延迟出现。", "直接覆盖原指针接收 realloc 会在失败时丢失仍有效的旧块。"], ["malloc-function", "realloc-function", "free-function"])
  ];

  function revise(id, headers, usage, notes, body, beforeMain) {
    var entry = entries.find(function (candidate) { return candidate.id === id; });
    entry.headers = headers;
    entry.usage = usage;
    entry.notes = notes;
    entry.example = program(headers, body, beforeMain || "");
  }

  revise("malloc-function", ["stdlib.h"], "运行期才知道对象数量或生命周期跨越当前作用域时使用 malloc；按对象大小计算字节数，立即判空并明确释放责任。",
    ["C 中不需要也不应强制转换 malloc 返回的 void 指针。", "分配内容未初始化，读取前必须先写入有效值。", "零字节分配可返回 NULL 或独特指针，不能据此判断失败。"],
    ["int *value = malloc(sizeof *value);", "if (value == NULL) return 1;", "*value = 42;", "int result = *value == 42 ? 0 : 1;", "free(value);", "return result;"]);
  revise("calloc-function", ["stdlib.h"], "需要连续数组并希望所有字节先清零时使用 calloc；分别传元素数和大小，仍要判空并在结束后 free。",
    ["全字节为零保证整数值零，但不保证所有类型都是语义零值。", "实现会检查 count 与 size 的乘积是否可表示，失败时返回 NULL。", "calloc 获得的块与 malloc 一样需要由调用者释放。"],
    ["int *values = calloc(3U, sizeof *values);", "if (values == NULL) return 1;", "int result = values[1] == 0 ? 0 : 1;", "free(values);", "return result;"]);
  revise("realloc-function", ["stdlib.h"], "调整已有动态块容量时使用 realloc；先用临时指针接结果，成功后再更新所有权，失败则保留并释放原块。",
    ["扩容后原有字节保留，新增加区域的内容未初始化。", "成功时旧指针即使数值相同也应视为被替代。", "new_size 为零的语义容易产生不可移植所有权判断，应显式 free。"],
    ["int *values = malloc(sizeof *values);", "if (values == NULL) return 1;", "int *resized = realloc(values, 2U * sizeof *values);", "if (resized == NULL) { free(values); return 1; }", "values = resized;", "values[1] = 8;", "free(values);"]);
  revise("free-function", ["stdlib.h"], "动态对象的最后一个所有者不再需要它时调用 free；只释放分配函数返回的当前地址，并把后续借用全部作废。",
    ["同一块存储只能释放一次，free(NULL) 则是安全空操作。", "释放栈对象、内部偏移指针或已经移动的旧地址都无定义。", "把一个局部指针设 NULL 不会自动修复其他悬空别名。"],
    ["int *value = malloc(sizeof *value);", "if (value == NULL) return 1;", "*value = 3;", "free(value);", "value = NULL;"]);
  revise("sizeof-allocation", ["stdlib.h"], "按数组元素数量分配时写 count 乘 sizeof 所指对象，类型改变后表达式会自动保持一致；乘法前还要检查溢出。",
    ["sizeof *pointer 不会解引用指针，即使指针尚未初始化。", "count 超过 SIZE_MAX 除以元素大小时，乘积会回绕。", "这种写法避免重复类型名并减少维护时尺寸不匹配。"],
    ["size_t count = 4U;", "double *values = malloc(count * sizeof *values);", "if (values == NULL) return 1;", "values[0] = 1.5;", "int result = values[0] > 1.0 ? 0 : 1;", "free(values);", "return result;"]);
  revise("dynamic-array", ["stdlib.h"], "元素数量在运行时确定时用动态数组保存连续对象；把容量与长度作为独立状态，并在每次下标访问前维护边界。",
    ["动态数组指针本身不携带元素数量，必须另外保存。", "扩容可能移动存储，所有指向旧元素的指针都会失效。", "容量乘元素大小要先防止 size_t 算术溢出。"],
    ["size_t count = 3U;", "int *values = malloc(count * sizeof *values);", "if (values == NULL) return 1;", "for (size_t i = 0; i < count; ++i) values[i] = (int)i;", "int result = values[2] == 2 ? 0 : 1;", "free(values);", "return result;"]);
  revise("flexible-array-member", ["stdlib.h"], "需要头部元数据和变长尾部数据一次分配时使用柔性数组成员；额外空间按尾元素大小计算，并保存实际长度。",
    ["柔性数组必须是含其他命名成员的结构体最后一个成员。", "sizeof 结构体不包含尾部数组所需的额外存储。", "复制结构体本身不会自动复制分配在尾部的所有元素。"],
    ["size_t count = 3U;", "struct Packet *packet = malloc(sizeof *packet + count * sizeof packet->data[0]);", "if (packet == NULL) return 1;", "packet->length = count;", "packet->data[0] = 9U;", "int result = packet->length == 3U && packet->data[0] == 9U ? 0 : 1;", "free(packet);", "return result;"],
    "struct Packet {\n    size_t length;\n    unsigned char data[];\n};");
  revise("qsort-function", ["stdlib.h"], "需要就地排序任意类型连续数组时使用 qsort；传准确元素数与大小，并提供一致、无溢出的三向比较函数。",
    ["比较函数必须建立一致顺序，否则结果未定义或不可预测。", "用两数相减作为比较结果可能发生有符号溢出。", "qsort 不保证稳定，相等元素的相对次序可能改变。"],
    ["int values[] = {3, 1, 2};", "qsort(values, 3U, sizeof values[0], compare_ints);", "return values[0] == 1 && values[2] == 3 ? 0 : 1;"],
    "static int compare_ints(const void *left, const void *right) {\n    int a = *(const int *)left;\n    int b = *(const int *)right;\n    return (a > b) - (a < b);\n}");
  revise("bsearch-function", ["stdlib.h"], "数组已经按同一比较器排序且需要一次二分查找时使用 bsearch；传键地址、元素布局和完全相同的顺序规则。",
    ["输入数组若未排序，返回结果没有可靠含义。", "存在多个相等元素时，返回其中哪一个没有规定。", "未找到返回 NULL，找到的指针仍指向原数组存储。"],
    ["int values[] = {1, 3, 5, 7};", "int key = 5;", "int *found = bsearch(&key, values, 4U, sizeof values[0], compare_ints);", "return found != NULL && *found == 5 ? 0 : 1;"],
    "static int compare_ints(const void *left, const void *right) {\n    int a = *(const int *)left;\n    int b = *(const int *)right;\n    return (a > b) - (a < b);\n}");
  revise("strtol-function", ["errno.h", "stdlib.h"], "解析外部有符号整数文本时使用 strtol；先清 errno，再同时检查 endptr、ERANGE、目标类型范围和尾随字符。",
    ["base 为零可按前缀选择八、十或十六进制。", "endptr 等于输入起点说明一个数字也没有转换。", "LONG_MIN 或 LONG_MAX 可能是合法值，必须结合 ERANGE 判断。"],
    ["char *end = NULL;", "errno = 0;", "long value = strtol(\"42\", &end, 10);", "if (errno == ERANGE || end == NULL || *end != '\\0') return 1;", "return value == 42L ? 0 : 1;"]);

  extraEntries.find(function (entry) { return entry.id === "aligned-alloc-function"; }).example = program(
    ["stdlib.h"], ["void *memory = aligned_alloc(16U, 32U);", "if (memory == NULL) return 1;", "free(memory);"],
    "void *aligned_alloc(size_t alignment, size_t size);");
  extraEntries.find(function (entry) { return entry.id === "at-quick-exit-function"; }).example = program(
    ["stdlib.h"], ["if (at_quick_exit(quick_cleanup) != 0) return 1;"],
    "int at_quick_exit(void (*function)(void));\n\nstatic void quick_cleanup(void) {\n}");
  extraEntries.find(function (entry) { return entry.id === "quick-exit-function"; }).example = program(
    ["stdlib.h"], ["if (0) quick_exit(EXIT_SUCCESS);"], "_Noreturn void quick_exit(int status);");

  var behaviors = {
    "malloc-function": "向运行时申请一块至少有 size 个字节的连续存储，返回的地址满足标准类型的对齐要求；对齐就是让地址落在处理器可正确访问该类型的位置。成功时返回指向新存储的指针，内容未经初始化，读取前必须先写入；失败时返回 NULL。size 为 0 时可返回 NULL 或一个不可解引用但可交给 free 的独特指针，不能据此判断普通分配是否成功。",
    "calloc-function": "为 count 个元素申请连续存储，每个元素占 element_size 字节，并把整块存储的每个字节先置零。成功时返回指向新块的指针，用完要 free；总大小无法表示或分配失败时返回 NULL。任一尺寸为 0 时可返回 NULL 或不可解引用的独特指针。全零字节能表示整数 0，但不保证对所有指针或浮点类型都等于语义上的零值。",
    "realloc-function": "调整 pointer 所指动态存储块的大小为 new_size，可能原地调整，也可能搬到新地址。new_size 大于 0 时，成功返回新块指针，原块随即失效，前后共有范围的数据保留，新增字节未初始化；失败返回 NULL，原块仍然有效。pointer 为 NULL 时等同 malloc；new_size 为 0 的所有权细节跨标准版本易变，应改为显式 free，避免依赖。",
    "free-function": "释放先前由 malloc、calloc、realloc 或 aligned_alloc 返回且尚未释放的动态存储，使那块空间可以被再次分配。函数没有返回值；pointer 为 NULL 时什么也不做。释放后该指针以及所有指向块内的别名都变成悬空指针，不能再读写。重复释放、释放栈变量、内部偏移地址或其他非分配起始地址都会产生未定义行为。",
    "sizeof-allocation": "按“元素个数乘每个元素大小”计算数组所需字节，并用 `sizeof *p` 让大小自动跟随 p 所指类型，避免类型改了却忘改分配式。malloc 成功返回新块地址，失败返回 NULL；但在调用前还必须确认 count 不大于 `SIZE_MAX / sizeof *p`，否则乘法会回绕成较小数，随后按原数量访问就会越界。sizeof 不会真的解引用 p。",
    "dynamic-array": "在运行时才知道元素数量时，申请一块连续动态存储并把它当数组使用；指针本身不记录长度，所以必须另存当前长度与容量，每次下标都要小于长度。分配函数成功返回首元素地址、失败返回 NULL；扩容 realloc 可能移动整块存储，使旧元素指针全部失效。容量乘元素大小还要先检查溢出，最后由唯一所有者 free。",
    "flexible-array-member": "让结构体最后一个成员写成不带长度的数组，从而把固定头部和变长尾部一次分配在同一块内存中。`sizeof(struct Packet)` 只含固定部分和必要填充，调用者要再加尾部元素数乘元素大小，并另外保存实际长度。分配成功返回整块地址、失败返回 NULL；尾部不能越过额外空间，按值复制结构体也不会自动复制全部尾部数据。",
    "qsort-function": "把 base 指向的 count 个定长元素在原数组内排序，每个元素占 size 字节；库反复调用 compare，比对两个元素并根据负数、0、正数决定先后。函数没有返回值，也不报告比较器错误；count 小于 2 时数组保持不变。比较规则若前后矛盾，或用可能溢出的相减结果，会让行为不可依赖；相等元素的原相对顺序也不保证保留。",
    "bsearch-function": "在已经按 compare 同一规则排好序的数组中做二分查找：每次比较 key 与中间元素，再排除一半范围。找到相等元素时返回指向原数组中该元素的指针；找不到或 count 为 0 时返回 NULL。若有多个相等元素，返回哪一个没有规定；数组未排序、size 错误或比较规则与排序时不同，结果没有可靠含义。",
    "strtol-function": "把 text 开头可识别的整数文字转换成 long：先跳过空白，读取可选正负号，再按 base 解析数字；base 为 0 时可由前缀选择进制。返回转换值，并让 `*end` 指向第一个未使用字符；没有数字时返回 0 且 end 指回起点。正溢出返回 LONG_MAX、负溢出返回 LONG_MIN，并把 errno 设为 ERANGE；合法边界值必须结合 errno 判断。",
    "aligned-alloc-function": "申请一块起始地址满足 alignment 对齐要求、大小为 size 字节的动态存储，适合需要特定边界的对象或硬件接口。alignment 必须是实现支持的有效对齐值，size 必须是 alignment 的整数倍；满足约束且成功时返回对齐指针，内容未初始化，失败时返回 NULL。返回的块最终用 free 释放；零大小和无效约束不应作为可移植用法依赖。",
    "atoi-function": "把 string 开头的十进制整数字符串转换成 int，会跳过前导空白并接受正负号，遇到第一个非数字字符停止。可表示且有数字时返回对应整数；没有可转换数字时返回 0。它没有 end 指针也不可靠报告错误，合法的文本 `\"0\"` 与失败无法区分；若数学结果超出 int 范围，行为未定义，因此外部输入应改用 strtol 并检查范围。",
    "atol-function": "把 string 开头的十进制文字转换成 long，处理前导空白、可选符号和连续数字，随后忽略尾部未转换字符。正常时返回得到的 long，没有数字时返回 0；但它不提供结束位置或 errno，无法区分失败与合法零。结果超出 long 可表示范围时行为未定义，不能拿返回的 LONG_MAX 当可靠溢出标志，需诊断时应使用 strtol。",
    "atoll-function": "把字符串开头的十进制整数转换成 long long：跳过空白、读取符号和数字，在首个不合规则字符处停止。可表示时返回转换值，没有数字时返回 0。函数没有错误通道，也不告诉调用者读到哪里，超出 long long 范围时行为未定义；因此处理用户、文件或网络文本时应使用 strtoll 并同时检查 endptr 与 ERANGE。",
    "atof-function": "把 string 开头的浮点文字转换成 double，可识别前导空白、符号、小数、指数以及实现支持的特殊形式。可表示时返回转换结果，没有可转换内容时返回 0.0。它不提供结束指针，也不能可靠区分合法零、格式错误、上溢或下溢；结果无法表示时行为未定义，所以需要验证的输入应使用 strtod 并检查 endptr 和 errno。",
    "strtoll-function": "把字符串开头按 base 转成 long long，并通过 endptr 告诉调用者解析停止位置；会跳过空白和符号，base 为 0 时可按前缀选进制。成功返回转换值，没有数字时返回 0 且 endptr 指回起点。正溢出返回 LLONG_MAX、负溢出返回 LLONG_MIN，并把 errno 设为 ERANGE；边界数本身可能合法，必须先清 errno 再联合判断。",
    "strtoul-function": "把字符串开头按 base 转成 unsigned long，跳过空白并接受可选正负号；负号会对得到的无符号数取负，因此 `\"-1\"` 可能得到 ULONG_MAX，不能当成自动拒绝负数。成功返回转换值并用 endptr 指向剩余文本；无数字返回 0 且 endptr 指回起点；超出范围返回 ULONG_MAX 并设置 errno 为 ERANGE。",
    "strtoull-function": "把字符串开头按指定进制转换成 unsigned long long，并把第一个未转换字符的位置写给 endptr。它接受前导空白、正负号和 base 为 0 的进制前缀；负号按无符号算术作用，不等于格式失败。成功返回数值，无数字返回 0 且 endptr 指向起点；范围溢出返回 ULLONG_MAX，并把 errno 设为 ERANGE。",
    "strtod-function": "把字符串开头的浮点表示转换成 double，并让 endptr 指向第一个未使用字符，可据此拒绝空输入或尾随垃圾。正常时返回转换值；没有任何可转换内容时返回 0.0 且 endptr 指回起点。上溢通常返回带正确符号的 HUGE_VAL，下溢返回极小值或 0，并把 errno 设为 ERANGE；合法的巨大或零值要结合预先清零的 errno 判断。",
    "strtof-function": "把字符串开头的浮点文字转换成 float，解析规则类似 strtod，但结果范围和精度是 float。成功返回转换值并通过 endptr 给出停止位置；没有数字时返回 0.0F 且 endptr 指回起点。上溢返回带符号的 HUGE_VALF，下溢返回极小值或 0，并以 errno 的 ERANGE 报告范围问题；尾随字符不会自动算失败。",
    "strtold-function": "把字符串开头的浮点文字转换成 long double，并用 endptr 标出未转换的余下部分，适合需要该类型更大范围或精度的解析。成功返回转换值；没有数字时返回 0.0L 且 endptr 指回起点。上溢返回带符号的 HUGE_VALL，下溢返回极小值或 0，并设置 errno 为 ERANGE；仍应检查尾随内容是否符合协议。",
    "rand-function": "从当前伪随机状态产生下一个整数；伪随机表示序列由算法确定，看似杂乱但可由相同种子重现。每次调用返回 0 到 RAND_MAX 之间的值，包含两端，没有失败返回值。它的质量、周期和低位分布由实现决定，`rand() % n` 还可能有取模偏差，因此不能用于密码、令牌或其他安全用途。",
    "srand-function": "用 seed 重置 rand 的伪随机序列起点；同一实现中给相同种子，后续 rand 会返回相同序列，未调用 srand 通常等同先用种子 1。函数没有返回值，也不会生成随机数。常量种子便于复现实验，用当前时间只会改变普通模拟序列，仍不具备安全随机性；并发共享状态还需要额外协调。",
    "rand-max-constant": "给出 rand 可能返回的最大整数，且至少为 32767；因此 rand 的完整返回范围是 0 到 RAND_MAX，包含上下界。具体值由实现决定，不能假定固定为 32767 或某个二进制掩码。用它可把结果缩放成比例，但整数取模可能使各结果概率不均匀，也不能把更大的 RAND_MAX 当作密码学安全保证。",
    "abs-function": "计算 int value 的绝对值：非负数原样返回，负数在可表示时返回相反数，所以返回结果通常不小于 0。特殊边界 INT_MIN 的正值无法用 int 表示，对它调用会产生未定义行为；函数没有独立失败码。它只处理 int，long 和 long long 分别要用 labs、llabs，浮点绝对值则属于 math.h。",
    "labs-function": "计算 long value 到零的非负距离；输入大于等于 0 时返回原值，普通负数返回其相反数。若输入是 LONG_MIN，因为对应正数超出 long 范围，行为未定义，而不是可靠返回 LONG_MAX 或错误码。函数没有失败返回值，调用前需要排除该边界；其他整数宽度应选择相匹配的 abs 或 llabs。",
    "llabs-function": "计算 long long 整数的绝对值，可表示时对非负输入返回原值，对负输入返回相反数。LLONG_MIN 没有可表示的正对应值，对它调用会产生未定义行为，函数也不会返回错误标志。若数据可能包含整个 long long 范围，应先单独处理该边界；不要用较窄的 abs 或 labs 代替。",
    "div-function": "一次计算两个 int 的整数商和余数，把结果放在 div_t 结构的 quot 与 rem 成员中返回。商向零截断，满足 `numerator == quotient * denominator + remainder`，余数绝对值小于分母且非零时符号与分子相同。denominator 为 0，或 INT_MIN 除以 -1 导致商不可表示时，行为未定义，没有错误返回值。",
    "ldiv-function": "用 long 精度同时计算分子除以分母的整数商与余数，并返回含 quot、rem 两个 long 成员的 ldiv_t。商向零截断，余数与分子同号或为零，且可由“商乘分母加余数”还原分子。分母为 0，或 LONG_MIN 除以 -1 使结果越界时行为未定义，调用者必须事先排除。",
    "lldiv-function": "对 long long 分子和分母同时求整数商与余数，返回的 lldiv_t 中 quot 是向零截断的商，rem 是余数；余数非零时与分子同号，绝对值小于分母。函数没有失败状态，denominator 为 0 会产生未定义行为，LLONG_MIN 除以 -1 因商不可表示也未定义，因此这两个特殊输入必须先检查。",
    "exit-function": "以正常终止流程结束整个程序，并把 status 交给宿主环境。它先按注册顺序的反向调用 atexit 回调，再刷新并关闭所有标准 I/O 流、删除 tmpfile 创建的临时文件；函数不会返回，调用点之后的语句不可达。回调若再次调用 exit 或未正常返回会带来未定义行为；状态通常用 EXIT_SUCCESS 或 EXIT_FAILURE 表达。",
    "atexit-function": "注册一个无参数、无返回值的函数，让它在程序以后通过 exit 或从 main 返回而正常终止时执行；多个回调按注册的反向顺序调用。注册成功返回 0，容量不足等失败返回非零，此时该函数不会被登记。标准保证至少可注册 32 个；abort、quick_exit 和进程被外部强制结束时不会走这组普通回调。",
    "at-quick-exit-function": "把回调登记到 quick_exit 专用列表，程序快速正常终止时按注册的反向顺序调用；它与 atexit 的列表彼此独立。注册成功返回 0，失败返回非零，失败的回调不会执行。回调必须无参数且返回 void，并应只做适合快速终止的有限清理；普通 exit、从 main 返回或 abort 都不会调用这组函数。",
    "quick-exit-function": "以快速正常终止方式结束程序，把 status 交给宿主环境，并按反向注册顺序运行 at_quick_exit 回调。函数不会返回，后续语句不可达；它不执行 atexit 回调，也不保证刷新或关闭所有标准 I/O 流，所以尚在缓冲区的数据可能丢失。状态可用 EXIT_SUCCESS 或 EXIT_FAILURE，回调中再次触发终止会使结果不可依赖。",
    "abort-function": "立即请求异常终止程序并引发 SIGABRT 信号，用于无法继续运行的严重内部错误。函数不会返回；即使已安装的信号处理器先被调用，若处理器正常返回，异常终止仍会继续。它不执行 atexit 或 at_quick_exit 回调，也不能依赖标准 I/O 缓冲被刷新，因此需要保留的诊断应在调用前尽力写出。",
    "exit-status-constants": "提供两个可移植的程序终止状态：EXIT_SUCCESS 表示成功，EXIT_FAILURE 表示一般失败，可从 main 返回，也可传给 exit 或 quick_exit。宏的具体整数值由实现决定，EXIT_SUCCESS 不要求宏值本身一定写成 0，EXIT_FAILURE 也不能猜成 1。宿主环境最终如何显示或截取状态仍由操作系统决定。",
    "getenv-function": "按 name 查找宿主环境中的变量。找到时返回指向实现内部字符串的指针，值可能是空字符串；没找到时返回 NULL，所以空值与不存在必须分开判断。返回内容不能由调用者修改或 free，后续 getenv 或其他环境操作可能使它变化或失效；name 的合法形式和线程安全细节由平台决定，环境内容也应视为不可信输入。",
    "system-function": "把 command 字符串交给宿主环境的命令处理器执行，具体语法、副作用和状态编码都依赖平台。command 为 NULL 时不执行命令：存在可用处理器返回非零，否则返回 0；command 非 NULL 时返回实现定义的执行状态，不能按纯 ISO C 假定某个固定成功码或失败码。外部输入若拼入命令会造成命令注入，应避免。",
    "mb-cur-max-macro": "给出当前 LC_CTYPE 区域设置下，一个多字节字符最多可能占用的字节数；多字节字符是用一个或多个 char 字节表示一个文字字符的编码单元。结果类型为 size_t，值至少是 1，并会随 setlocale 改变，所以每次需要时重新读取。它是最大上限，不是当前具体字符的实际长度，也未必能作编译期数组常量。",
    "mblen-function": "检查 string 开头在当前区域设置中是否构成一个完整多字节字符，最多查看 size 个字节。普通有效字符返回其占用字节数，遇到空字符返回 0，无效或在给定上限内不完整时返回负数。string 为 NULL 时重置内部转换状态，并返回编码是否依赖状态的非零或零结果；状态式编码会跨调用保存上下文。",
    "mbtowc-function": "按当前 LC_CTYPE 编码把 string 开头的一个多字节字符转换成 wchar_t，若 wide 非 NULL 就把宽字符写入那里，最多读取 size 个字节。普通字符返回消耗字节数，空字符返回 0，无效或不完整序列返回负数。string 为 NULL 时重置内部状态并返回编码是否有状态；wide 为 NULL 只是不保存结果，仍会执行转换。",
    "wctomb-function": "把一个 wchar_t 宽字符按当前区域设置编码成多字节序列，写到 string，调用者要预留至少 MB_CUR_MAX 字节。字符可表示时返回写入的字节数；在当前编码中不可表示时返回 -1。string 为 NULL 时不写数据，而是重置内部转换状态并返回编码是否依赖状态的非零或零值；该接口共享内部状态，交错或并发使用要谨慎。",
    "mbstowcs-function": "从 string 开始把完整多字节字符串按当前区域设置转换到 wide 数组，最多写 count 个 wchar_t。遇到源结尾且容量足够时会写宽空字符，并返回此前转换的宽字符数，不含结尾；若先达到 count，则返回已写数量且结果可能没有终止符；遇到无效多字节序列返回 `(size_t)-1`。源和目标重叠会产生未定义行为。",
    "wcstombs-function": "把 wide 指向的宽字符串按当前区域设置编码到 string，最多写 count 个字节，并且不会写下一字符的一部分。若在容量内遇到宽空字符，会写普通空字符并返回此前字节数，不含结尾；容量先用完时返回已写字节数且可能没有终止符；遇到当前编码无法表示的宽字符返回 `(size_t)-1`。源和目标不能重叠。",
    "allocation-ownership-pitfall": "说明动态内存不仅要检查分配结果，还要明确谁负责最终 free，这种责任称为所有权。malloc 家族成功返回可管理的块、失败返回 NULL；realloc 失败时旧块仍归原指针所有，所以必须先用临时指针接结果。遗漏释放会泄漏，重复释放、释放后访问或越界会产生未定义行为；容量、长度和所有者应始终分别记录。"
  };

  entries.concat(extraEntries).forEach(function (entry) {
    entry.behavior = behaviors[entry.id];
  });

  window.C_SYNTAX_ADD_ENTRIES(entries.concat(extraEntries));
}());
