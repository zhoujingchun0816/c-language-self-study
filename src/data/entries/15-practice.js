(function () {
  "use strict";

  window.C_SYNTAX_ADD_ENTRIES([
    {
      id: "small-program-structure",
      name: "小程序的组织方式",
      aliases: ["程序分层", "main 调度", "小程序结构"],
      category: "实战运用",
      summary: "把常量、计算函数和输入输出分开，让 main 只负责串起程序步骤。",
      behavior: "程序启动后由 main 按顺序调度各个步骤，真正的计算交给职责单一的函数完成，固定规则集中为具名常量。这样数据如何取得、业务如何计算、结果如何展示彼此分开，修改其中一层时不必同时重写整段程序。add_tax 返回含税后的金额，main 返回交给运行环境的退出状态。",
      usage: "写几十到几百行的小工具时，先列出输入、处理、输出三步，再为可独立描述的计算建立函数，让 main 保持短小。",
      syntax: "enum { TAX_PERCENT = 6 };\nstatic int add_tax(int cents);\nint main(void) { /* 取得数据 -> 调用函数 -> 输出结果 */ }",
      headers: ["stdio.h"],
      example: String.raw`#include <stdio.h>

enum { TAX_PERCENT = 6 };

static int add_tax(int cents) {
    return cents + cents * TAX_PERCENT / 100;
}

static void print_price(int cents) {
    printf("total: %d.%02d\n", cents / 100, cents % 100);
}

int main(void) {
    int subtotal = 2500;
    int total = add_tax(subtotal);
    print_price(total);
    return 0;
}
`,
      notes: [
        "main 只保留流程调度，阅读者能快速看出程序依次做了哪些事情。",
        "具名常量应表达业务含义，避免在多个函数里散落难懂的魔法数字。",
        "函数应尽量只承担一种职责，计算函数不要顺便读取输入或打印结果。"
      ],
      related: ["main-function", "function-definition", "naming-rules"],
      keywords: ["小程序", "函数分层", "主函数调度", "具名常量", "工程习惯"]
    },
    {
      id: "input-validation",
      name: "输入校验与容错",
      aliases: ["输入验证", "不信任输入", "解析校验"],
      category: "实战运用",
      summary: "先解析再检查范围，并把格式错误与业务范围错误统一挡在使用数据之前。",
      behavior: "外部文本不会因为看起来像数字就自动成为可靠数据；解析函数必须同时确认转换成功、没有多余字符，并检查结果是否落在允许范围内。只有全部条件成立的数据才会写入输出参数，失败时调用者得到明确状态而不是半成品。parse_age 成功时返回非零，失败时返回 0。",
      usage: "处理命令行、配置文本或一行用户输入时，把校验封装成函数，并在使用数值前检查函数返回值。",
      syntax: "int parse_age(const char *text, int *age);\nif (!parse_age(text, &age)) { /* 拒绝输入 */ }",
      headers: ["stdio.h"],
      example: String.raw`#include <stdio.h>

static int parse_age(const char *text, int *age) {
    int value;
    char extra;

    if (sscanf(text, " %d %c", &value, &extra) != 1) {
        return 0;
    }
    if (value < 0 || value > 130) {
        return 0;
    }
    *age = value;
    return 1;
}

int main(void) {
    const char *samples[] = {"28", "28 years", "-4"};
    size_t count = sizeof samples / sizeof samples[0];

    for (size_t i = 0; i < count; ++i) {
        int age = 0;
        printf("%s: %s\n", samples[i],
               parse_age(samples[i], &age) ? "valid" : "invalid");
    }
    return 0;
}
`,
      notes: [
        "不要只检查数值范围，转换是否成功以及末尾是否夹带无关文本同样重要。",
        "解析失败时不要改写输出参数，调用者就不会误用只更新了一半的数据。",
        "真实交互可先用 fgets 取得整行，再用 sscanf 或 strtol 分析，避免输入残留。"
      ],
      related: ["sscanf-function", "strtol-function", "formatted-output-return"],
      keywords: ["输入校验", "错误输入", "范围检查", "返回值", "容错"]
    },
    {
      id: "error-handling-style",
      name: "错误处理风格",
      aliases: ["返回码", "统一清理", "goto cleanup"],
      category: "实战运用",
      summary: "约定成功与失败返回码，在单一清理出口释放已经取得的资源。",
      behavior: "可能失败的操作应在调用后立刻检查结果，成功路径继续推进，失败路径保存原因并跳到统一清理区。清理区按资源取得的相反顺序释放对象，最后返回约定状态；errno 只在失败函数明确会设置它时才有解释价值。",
      usage: "一个函数连续打开文件、分配内存或取得多个资源时，用单一 cleanup 标签收拢退出路径，避免遗漏释放。",
      syntax: "int status = EXIT_FAILURE;\nresource = acquire();\nif (resource == NULL) goto cleanup;\nstatus = EXIT_SUCCESS;\ncleanup: release(resource);",
      headers: ["errno.h", "stdio.h", "stdlib.h", "string.h"],
      example: String.raw`#include <errno.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static int write_report(void) {
    int status = EXIT_FAILURE;
    FILE *file = tmpfile();

    if (file == NULL) {
        fprintf(stderr, "tmpfile: %s\n", strerror(errno));
        goto cleanup;
    }
    if (fputs("report ready\n", file) == EOF) {
        fprintf(stderr, "write failed\n");
        goto cleanup;
    }
    status = EXIT_SUCCESS;

cleanup:
    if (file != NULL && fclose(file) == EOF) {
        status = EXIT_FAILURE;
    }
    return status;
}

int main(void) {
    printf("status = %d\n", write_report());
    return 0;
}
`,
      notes: [
        "goto 在这里仅向后跳到本函数清理区，不应用来随意拼接普通业务流程。",
        "每个资源先初始化为可安全判断的空状态，清理时才知道它是否已经取得。",
        "读取 errno 前要确认刚失败的库函数规定会设置它，否则可能打印旧错误信息。"
      ],
      related: ["goto-cleanup", "errno-object", "exit-status-constants"],
      keywords: ["错误处理", "返回码", "统一清理", "资源释放", "错误号"]
    },
    {
      id: "multi-file-project",
      name: "多文件工程拆分",
      aliases: ["头文件与源文件", "模块拆分", "include 守卫"],
      category: "实战运用",
      summary: "头文件公开声明，源文件保存实现，调用方只依赖稳定的模块接口。",
      behavior: "编译器分别处理每个 .c 翻译单元，头文件负责让各单元看到一致的类型和函数声明，实现则只在所属 .c 中出现一次。头文件保护可阻止同一声明被重复展开，文件内 static 函数不会泄露成其他模块可链接的名字。counter_next 每次调用都会返回下一个计数值。",
      usage: "当一组函数能形成独立职责时，为它建立同名 .h 与 .c；调用者包含头文件，不要直接包含另一个 .c 文件。",
      syntax: "/* counter.h */\n#ifndef COUNTER_H\n#define COUNTER_H\nint counter_next(void);\n#endif\n\n/* counter.c */\n#include \"counter.h\"\nint counter_next(void) { /* ... */ }",
      headers: ["stdio.h"],
      example: String.raw`#include <stdio.h>

/* 实际工程中，这个声明放在 counter.h。 */
int counter_next(void);

/* 实际工程中，下面的实现放在 counter.c。 */
static int counter_value = 0;

int counter_next(void) {
    return ++counter_value;
}

int main(void) {
    int first = counter_next();
    int second = counter_next();
    printf("%d %d\n", first, second);
    return 0;
}
`,
      notes: [
        "头文件应以声明为主，并使用项目内唯一的保护宏防止重复包含。",
        "源文件应首先包含自己的头文件，让编译器尽早发现声明与实现不一致。",
        "只供本源文件使用的函数和对象可加 static，缩小名字的链接可见范围。"
      ],
      related: ["include-guard", "include-directive", "declaration-definition"],
      keywords: ["多文件", "头文件", "源文件", "模块接口", "包含保护"]
    },
    {
      id: "build-commands",
      name: "编译命令与选项",
      aliases: ["gcc 命令", "编译选项", "链接命令"],
      category: "实战运用",
      summary: "用标准版本、告警、优化和输出选项组成可重复执行的编译命令。",
      behavior: "gcc 先把源文件编译成目标代码，再把目标代码和所需库链接为程序；-std=c11 选择语言版本，-Wall 与 -Wextra 开启常用诊断，-O2 请求优化，-o 指定产物名称。多个源文件可以在一次命令中共同编译链接。",
      usage: "开发阶段至少开启 C11 与两组告警，调试时使用 -g，发布构建再加入合适优化，并保留完整命令便于复现。",
      syntax: "gcc -std=c11 -Wall -Wextra -g main.c util.c -o app\ngcc -std=c11 -Wall -Wextra -O2 calc.c -lm -o calc",
      headers: ["stdio.h"],
      example: String.raw`#include <stdio.h>

static int square(int value) {
    return value * value;
}

int main(void) {
    printf("square: %d\n", square(7));
    return 0;
}
`,
      notes: [
        "告警不是装饰信息，应逐项理解并修正，而不是用强制转换批量掩盖。",
        "使用数学库时部分 Unix 工具链需要在源文件之后写 -lm，Windows 工具链可能不需要。",
        "只做语法与告警检查可加 -fsyntax-only，此时不会生成可执行文件。"
      ],
      related: ["how-to-compile", "compile-error-reading", "math-library-linking"],
      keywords: ["编译命令", "编译告警", "优化选项", "链接", "工具链"]
    },
    {
      id: "debugging-with-gdb",
      name: "使用 gdb 调试",
      aliases: ["调试器", "断点", "调用栈"],
      category: "实战运用",
      summary: "带调试信息编译后，用断点、单步、变量检查和调用栈定位故障现场。",
      behavior: "使用 -g 编译会把源码位置和变量信息写入程序，gdb 因而能在指定函数暂停、逐行执行并查看当前数据。程序崩溃时 bt 显示函数调用链，frame 切换栈帧，print 检查变量，排查应从最先出现异常数据的位置开始。",
      usage: "遇到崩溃、越界或结果错误时，先用断点缩小范围，再观察循环边界、指针值和每层调用参数，不要只靠反复加打印。",
      syntax: "gcc -std=c11 -Wall -Wextra -g demo.c -o demo\ngdb ./demo\n(gdb) break sum_values\n(gdb) run\n(gdb) print i\n(gdb) bt",
      headers: ["stdio.h"],
      example: String.raw`#include <stdio.h>

static int sum_values(const int *values, size_t count) {
    int total = 0;
    for (size_t i = 0; i < count; ++i) {
        total += values[i];
    }
    return total;
}

int main(void) {
    int values[] = {3, 5, 8};
    size_t count = sizeof values / sizeof values[0];
    printf("sum: %d\n", sum_values(values, count));
    return 0;
}
`,
      notes: [
        "调试版本宜使用 -g 并暂时降低优化，否则变量可能被优化掉或执行顺序重排。",
        "段错误常由空指针、悬空指针或数组越界造成，应优先检查地址与长度。",
        "崩溃点可能只是错误最后暴露的位置，调用栈能帮助回到更早的错误来源。"
      ],
      related: ["debug-print", "array-bounds", "dangling-pointer"],
      keywords: ["调试器", "断点", "单步执行", "调用栈", "段错误"]
    },
    {
      id: "string-processing-recipes",
      name: "字符串处理套路",
      aliases: ["文本清洗", "去空白", "大小写转换"],
      category: "实战运用",
      summary: "把清理、转换和提取拆成小函数，并始终维护字符串结尾的空字符。",
      behavior: "C 字符串依靠末尾空字符标记结束，处理时既要跟踪缓冲区容量，也要保证移动或改写后仍有结尾。ctype 系列函数只接受 EOF 或可表示为 unsigned char 的值，所以传入普通 char 前应先转换，避免高位字节触发未定义行为。",
      usage: "清洗一行文本时按去首尾空白、规范大小写、提取需要内容的顺序处理，每一步都保持缓冲区仍是合法字符串。",
      syntax: "trim(text);\nto_lowercase(text);\nsize_t count = extract_digits(text, digits, capacity);",
      headers: ["ctype.h", "stdio.h", "string.h"],
      example: String.raw`#include <ctype.h>
#include <stdio.h>
#include <string.h>

static void trim(char *text) {
    char *start = text;
    while (isspace((unsigned char)*start)) {
        ++start;
    }

    char *end = start + strlen(start);
    while (end > start && isspace((unsigned char)end[-1])) {
        --end;
    }
    *end = '\0';
    memmove(text, start, (size_t)(end - start) + 1U);
}

static void to_lowercase(char *text) {
    for (; *text != '\0'; ++text) {
        *text = (char)tolower((unsigned char)*text);
    }
}

int main(void) {
    char text[] = "  Order A19  ";
    trim(text);
    to_lowercase(text);
    printf("[%s]\n", text);
    return 0;
}
`,
      notes: [
        "调用 strlen、strcmp 等函数前，必须确定字符数组中存在可到达的空字符。",
        "isspace 与 tolower 的参数要先转成 unsigned char，才能安全处理负的 char 值。",
        "分割函数若会原地写入分隔符位置，应提前说明输入缓冲区将被修改。"
      ],
      related: ["string-copy", "isspace-function", "tolower-function"],
      keywords: ["字符串处理", "去空白", "大小写转换", "文本清洗", "空字符"]
    },
    {
      id: "array-and-pointer-recipes",
      name: "数组与指针套路",
      aliases: ["数组传参", "长度参数", "二分查找"],
      category: "实战运用",
      summary: "数组传给函数时同时传入元素数量，并用半开区间控制访问边界。",
      behavior: "数组作为函数参数时会退化为首元素指针，函数无法从该指针恢复元素总数，因此调用者必须另传 size_t 长度。以 [left, right) 表示搜索区间能让空区间自然满足 left == right，并避免访问 right 指向的区间外元素。binary_search 找到目标时返回指向该元素的指针，找不到时返回 NULL。",
      usage: "编写遍历、查找或统计函数时，把只读数组声明为 const 指针，长度使用 size_t，并在解引用前验证索引范围。",
      syntax: "const int *binary_search(const int *values, size_t count, int target);",
      headers: ["stddef.h", "stdio.h"],
      example: String.raw`#include <stddef.h>
#include <stdio.h>

static const int *binary_search_int(const int *values, size_t count,
                                    int target) {
    size_t left = 0;
    size_t right = count;

    while (left < right) {
        size_t middle = left + (right - left) / 2U;
        if (values[middle] < target) {
            left = middle + 1U;
        } else {
            right = middle;
        }
    }
    if (left < count && values[left] == target) {
        return &values[left];
    }
    return NULL;
}

int main(void) {
    int values[] = {2, 5, 8, 12, 19};
    size_t count = sizeof values / sizeof values[0];
    const int *found = binary_search_int(values, count, 12);
    printf("index: %d\n",
           found == NULL ? -1 : (int)(found - values));
    return 0;
}
`,
      notes: [
        "二分查找的前提是数据已经按比较规则排序，否则返回结果没有意义。",
        "中点写成 left 加区间差的一半，可避免直接相加在超大索引上溢出。",
        "只有同一数组内的指针才能安全相减，结果类型是 ptrdiff_t 而不是 int。"
      ],
      related: ["array-parameter-decay", "size-t-type", "pointer-arithmetic"],
      keywords: ["数组传参", "指针", "元素数量", "半开区间", "二分查找"]
    },
    {
      id: "struct-as-record",
      name: "结构体作为记录",
      aliases: ["记录类型", "结构体数组", "简易数据表"],
      category: "实战运用",
      summary: "用结构体把同一对象的不同字段绑定在一起，再用数组保存多条记录。",
      behavior: "结构体的每个对象同时拥有所有成员，复制结构体会按值复制这些成员，因此一条学生或图书记录可以作为整体传递和存放。结构体数组让相同布局的多条记录连续排列，遍历时用成员字段筛选、统计或展示即可形成简易数据表。",
      usage: "业务数据由姓名、编号、分数等多个相关字段组成时，先定义记录结构，再建立查找和打印函数操作整个记录。",
      syntax: "struct Student { int id; char name[20]; int score; };\nstruct Student rows[] = { /* records */ };",
      headers: ["stdio.h", "string.h"],
      example: String.raw`#include <stdio.h>
#include <string.h>

struct Student {
    int id;
    char name[20];
    int score;
};

static const struct Student *find_student(const struct Student *students,
                                          size_t count,
                                          const char *name) {
    for (size_t i = 0; i < count; ++i) {
        if (strcmp(students[i].name, name) == 0) {
            return &students[i];
        }
    }
    return NULL;
}

int main(void) {
    struct Student students[] = {
        {1001, "Ada", 95},
        {1002, "Lin", 88}
    };
    size_t count = sizeof students / sizeof students[0];
    const struct Student *student = find_student(students, count, "Lin");
    if (student != NULL) {
        printf("%d %s %d\n", student->id, student->name, student->score);
    }
    return 0;
}
`,
      notes: [
        "字段名应表达记录含义，避免使用 a、b 这类离开上下文就无法理解的名字。",
        "结构体含指针成员时，普通赋值只复制地址，不会复制指针指向的动态数据。",
        "固定字符数组需要为末尾空字符预留空间，写入时仍要检查目标容量。"
      ],
      related: ["struct-type", "struct-initialization", "arrow-operator"],
      keywords: ["结构体", "记录", "结构体数组", "数据表", "字段"]
    },
    {
      id: "dynamic-data",
      name: "动态数据与扩容",
      aliases: ["动态数组", "realloc 扩容", "容量增长"],
      category: "实战运用",
      summary: "把元素数量与已分配容量分开，在空间不足时安全地成倍扩充缓冲区。",
      behavior: "动态数组用指针保存内存首地址，用 size 记录已有元素数，用 capacity 记录当前能容纳的元素数。插入前若空间不足，先计算不会溢出的新容量，再用临时指针接收 realloc；失败时旧地址仍有效，成功后才更新指针和容量。",
      usage: "读取数量事先未知的记录时，从小容量开始按倍数增长，所有操作结束后由明确的所有者统一 free。",
      syntax: "if (size == capacity) {\n    void *next = realloc(items, new_capacity * sizeof *items);\n    if (next == NULL) { /* 保留旧 items */ }\n}",
      headers: ["stdint.h", "stdio.h", "stdlib.h"],
      example: String.raw`#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>

static int push_int(int **items, size_t *size, size_t *capacity, int value) {
    if (*size == *capacity) {
        size_t next_capacity = *capacity == 0U ? 4U : *capacity * 2U;
        if (next_capacity < *capacity ||
            next_capacity > SIZE_MAX / sizeof **items) {
            return 0;
        }

        int *next = realloc(*items, next_capacity * sizeof **items);
        if (next == NULL) {
            return 0;
        }
        *items = next;
        *capacity = next_capacity;
    }

    (*items)[*size] = value;
    ++*size;
    return 1;
}

int main(void) {
    int *items = NULL;
    size_t size = 0;
    size_t capacity = 0;

    for (int value = 1; value <= 6; ++value) {
        if (!push_int(&items, &size, &capacity, value * 10)) {
            free(items);
            return EXIT_FAILURE;
        }
    }
    printf("size=%d last=%d\n", (int)size, items[size - 1U]);
    free(items);
    return EXIT_SUCCESS;
}
`,
      notes: [
        "不要直接把 realloc 结果覆盖原指针，否则失败返回空指针时会丢失旧内存。",
        "计算分配字节数前必须检查乘法溢出，容量翻倍本身也可能绕回较小数值。",
        "size 表示已经构造的元素数，capacity 表示可用槽位数，两者不能混为一谈。"
      ],
      related: ["realloc-function", "malloc-function", "allocation-ownership-pitfall"],
      keywords: ["动态数组", "内存扩容", "重新分配", "容量", "所有权"]
    },
    {
      id: "file-recipes",
      name: "文件读写套路",
      aliases: ["逐行读取", "临时文件", "文件计数"],
      category: "实战运用",
      summary: "检查每次文件操作，用 fgets 逐行处理，并在所有路径关闭流。",
      behavior: "文件流维护当前位置和错误状态，写入后若要从开头读取，必须先成功定位并清除相关状态。fgets 每次最多读取缓冲区容量减一的字符并补上空字符，返回空指针时还要用 ferror 区分读取错误与正常到达文件末尾。",
      usage: "做行数统计、日志追加或配置读取时，逐次检查打开、写入、定位、读取和关闭结果；示例或测试优先使用 tmpfile。",
      syntax: "FILE *file = tmpfile();\nwhile (fgets(buffer, sizeof buffer, file) != NULL) { /* 处理一行 */ }\nif (ferror(file)) { /* 读取失败 */ }",
      headers: ["stdio.h"],
      example: String.raw`#include <stdio.h>

int main(void) {
    FILE *file = tmpfile();
    if (file == NULL) {
        return 1;
    }

    if (fputs("alpha\n", file) == EOF ||
        fputs("beta\n", file) == EOF ||
        fseek(file, 0L, SEEK_SET) != 0) {
        fclose(file);
        return 1;
    }

    char line[32];
    size_t lines = 0;
    while (fgets(line, sizeof line, file) != NULL) {
        ++lines;
    }
    if (ferror(file)) {
        fclose(file);
        return 1;
    }

    int close_status = fclose(file);
    printf("lines: %d, close status: %d\n", (int)lines, close_status);
    return 0;
}
`,
      notes: [
        "fgets 读到的行可能没有换行符，因为行太长或最后一行本来就未换行。",
        "写后读或读后写的更新流需要按标准要求执行定位或刷新操作再切换方向。",
        "tmpfile 创建的临时文件会在关闭或程序正常结束时移除，适合无外部副作用测试。"
      ],
      related: ["fgets-function", "tmpfile-function", "ferror-function"],
      keywords: ["文件读写", "逐行读取", "临时文件", "错误检查", "行数统计"]
    },
    {
      id: "sorting-and-search",
      name: "排序与查找实战",
      aliases: ["qsort 排序", "bsearch 查找", "比较函数"],
      category: "实战运用",
      summary: "为记录定义一致的比较规则，再用标准库完成排序和二分查找。",
      behavior: "qsort 根据比较函数返回的负数、零或正数重排元素，bsearch 必须使用与当前排序完全一致的规则查找键值。比较函数要形成稳定自洽的顺序，不能简单用大整数相减，因为减法可能溢出并给出错误符号。",
      usage: "需要按分数、名称等字段整理记录时，先写清主排序键和同值时的次排序键，再复用同一比较逻辑查找。",
      syntax: "qsort(rows, count, sizeof rows[0], compare);\nconst void *found = bsearch(&key, rows, count, sizeof rows[0], compare);",
      headers: ["stdio.h", "stdlib.h", "string.h"],
      example: String.raw`#include <stdio.h>
#include <stdlib.h>
#include <string.h>

struct Item {
    int code;
    char name[16];
};

static int compare_item(const void *left, const void *right) {
    const struct Item *a = left;
    const struct Item *b = right;
    if (a->code < b->code) {
        return -1;
    }
    if (a->code > b->code) {
        return 1;
    }
    return strcmp(a->name, b->name);
}

int main(void) {
    struct Item items[] = {{30, "pen"}, {10, "book"}, {20, "cup"}};
    size_t count = sizeof items / sizeof items[0];
    struct Item key = {20, "cup"};

    qsort(items, count, sizeof items[0], compare_item);
    const struct Item *found = bsearch(&key, items, count,
                                       sizeof items[0], compare_item);
    if (found != NULL) {
        printf("found: %d %s\n", found->code, found->name);
    }
    return 0;
}
`,
      notes: [
        "比较函数返回值只表示小于、等于或大于零，不要求返回两个值的真实差。",
        "调用 bsearch 以前数组必须按同一个比较函数排序，键对象也要符合相同布局。",
        "qsort 不保证相等元素保持原先顺序，需要稳定排序时应选择其他实现方案。"
      ],
      related: ["qsort-function", "bsearch-function", "callback-function"],
      keywords: ["排序", "查找", "比较函数", "结构体排序", "二分查找"]
    },
    {
      id: "random-and-time",
      name: "随机数与时间",
      aliases: ["随机种子", "运行计时", "rand 与 clock"],
      category: "实战运用",
      summary: "固定种子用于复现实验，时间种子用于变化序列，clock 用于粗略测量处理器时间。",
      behavior: "srand 为 rand 设置伪随机序列起点，同一实现中相同种子会产生相同序列，适合复现测试；用 time(NULL) 播种通常让不同启动时刻得到不同序列，但不提供安全随机性。clock 返回程序使用的处理器时间刻度，可除以 CLOCKS_PER_SEC 得到秒数。",
      usage: "测试含随机行为的算法时记录并固定种子；只在演示变化时使用当前时间播种，性能测量则重复足够多次再比较。",
      syntax: "srand(1234U);\nint value = rand();\nclock_t start = clock();\n/* work */\ndouble seconds = (double)(clock() - start) / CLOCKS_PER_SEC;",
      headers: ["stdio.h", "stdlib.h", "time.h"],
      example: String.raw`#include <stdio.h>
#include <stdlib.h>
#include <time.h>

int main(void) {
    srand(1234U);
    clock_t start = clock();
    unsigned long total = 0;

    for (int i = 0; i < 1000; ++i) {
        total += (unsigned long)(rand() % 10);
    }

    clock_t finish = clock();
    double seconds = (double)(finish - start) / (double)CLOCKS_PER_SEC;
    printf("total=%lu elapsed_nonnegative=%d\n", total, seconds >= 0.0);
    return 0;
}
`,
      notes: [
        "rand 的具体序列因 C 库实现而异，相同种子只保证在同一实现中便于复现。",
        "rand 不能生成密码、令牌等安全数据，这些场景必须使用系统安全随机源。",
        "短代码段的单次计时误差很大，应增加重复次数并避免把输入输出时间混入核心测量。"
      ],
      related: ["rand-function", "srand-function", "clock-function"],
      keywords: ["随机数", "随机种子", "时间", "可复现", "性能计时"]
    },
    {
      id: "testing-own-code",
      name: "给自己的代码做测试",
      aliases: ["单元测试", "断言", "边界用例"],
      category: "实战运用",
      summary: "用正常、边界和异常用例验证小函数，让失败尽早暴露在改动附近。",
      behavior: "测试代码用已知输入调用目标函数，再把真实结果与明确预期比较；assert 条件为假时会报告位置并终止程序，为真则继续。测试集合既要覆盖常见路径，也要包含空数据、最小最大边界和错误输入，才能发现只在角落出现的问题。",
      usage: "每完成一个可独立调用的小函数，就写几个固定用例；修复缺陷时先加入能复现缺陷的用例，再修改实现。",
      syntax: "assert(actual == expected);\nassert(function(boundary_input) == boundary_result);",
      headers: ["assert.h", "stdio.h"],
      example: String.raw`#include <assert.h>
#include <stdio.h>

static int clamp(int value, int low, int high) {
    if (value < low) {
        return low;
    }
    if (value > high) {
        return high;
    }
    return value;
}

static void test_clamp(void) {
    assert(clamp(5, 0, 10) == 5);
    assert(clamp(-1, 0, 10) == 0);
    assert(clamp(12, 0, 10) == 10);
    assert(clamp(0, 0, 10) == 0);
    assert(clamp(10, 0, 10) == 10);
}

int main(void) {
    test_clamp();
    puts("all tests passed");
    return 0;
}
`,
      notes: [
        "断言适合检查程序员认为必须成立的条件，不应替代面向用户的输入错误处理。",
        "定义 NDEBUG 后标准 assert 会被移除，测试构建不要无意关闭这些检查。",
        "测试失败时应显示具体用例和差异，规模变大后可封装统一的比较辅助函数。"
      ],
      related: ["assert-macro", "assert-side-effects", "how-to-practice"],
      keywords: ["代码测试", "断言", "预期结果", "边界用例", "缺陷复现"]
    },
    {
      id: "portability-and-toolchain",
      name: "可移植性与工具链",
      aliases: ["跨平台", "标准版本", "条件编译"],
      category: "实战运用",
      summary: "优先依赖 C 标准接口，把平台差异隔离在少量条件编译边界中。",
      behavior: "符合 C11 不代表所有操作系统接口都相同；路径格式、终端行为和编译器选项可能变化，而标准库的文本流会按平台规则处理换行。__STDC_VERSION__ 能说明编译时选择的语言版本，平台宏只应隔离确有差异的薄层代码。",
      usage: "跨 Windows 与类 Unix 系统发布小程序时，先保持核心逻辑只用标准 C，再为必要的平台接口提供窄小适配函数。",
      syntax: "#if defined(_WIN32)\n/* Windows adapter */\n#else\n/* POSIX-like adapter */\n#endif\nprintf(\"C: %ld\\n\", (long)__STDC_VERSION__);",
      headers: ["stdio.h"],
      example: String.raw`#include <stdio.h>

static const char *platform_name(void) {
#if defined(_WIN32)
    return "Windows";
#elif defined(__linux__)
    return "Linux";
#elif defined(__APPLE__)
    return "macOS";
#else
    return "other";
#endif
}

int main(void) {
    const char text_line[] = "portable newline\n";
    printf("C version: %ld\n", (long)__STDC_VERSION__);
    printf("platform: %s\n", platform_name());
    fputs(text_line, stdout);
    return 0;
}
`,
      notes: [
        "文本模式可在 Windows 把换行转换为本地表示，二进制协议不要依赖这种转换。",
        "编译器扩展会降低可移植性，启用明确的标准模式和告警能及早发现依赖。",
        "平台条件应集中在适配层，避免在核心算法里散布大量互相嵌套的宏分支。"
      ],
      related: ["predefined-macros", "conditional-compilation", "text-binary-streams"],
      keywords: ["可移植性", "跨平台", "工具链", "条件编译", "文本模式"]
    }
  ]);
}());
