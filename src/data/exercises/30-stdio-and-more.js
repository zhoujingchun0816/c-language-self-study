(function () {
  "use strict";

  function program(headers, declarations, body) {
    var includes = headers.map(function (header) {
      return "#include <" + header + ">";
    }).join("\n");
    var prefix = declarations ? "\n\n" + declarations.trim() : "";
    return includes + prefix + "\n\nint main(void) {\n" +
      body.map(function (line) { return "    " + line; }).join("\n") +
      "\n    return 0;\n}\n";
  }

  function make(id, title, entryIds, difficulty, prompt, requirements, hints,
                headers, declarations, body, expectedOutput, explanation) {
    return {
      id: id,
      title: title,
      entryIds: entryIds,
      difficulty: difficulty,
      prompt: prompt,
      requirements: requirements,
      hints: hints,
      starter: program(headers, "", ["/* " + prompt + " */"]),
      solution: program(headers, declarations, body),
      expectedOutput: expectedOutput,
      explanation: explanation
    };
  }

  window.C_SYNTAX_ADD_EXERCISES([
    make(
      "ex-stdio-scanf-parse", "用格式串解析文本",
      ["sscanf-function"], 1,
      "不用键盘输入，改用 sscanf 从固定字符串中解析整数和小数，并输出成功转换的项数。",
      ["必须使用 sscanf 完成解析", "格式串同时包含 %d 与 %lf", "输出转换项数和两个解析结果"],
      ["sscanf 与 scanf 使用相同的转换说明符", "成功转换的赋值项数就是函数返回值"],
      ["stdio.h"], "",
      ["int whole = 0;", "double decimal = 0.0;", "int count = sscanf(\"42 3.5\", \"%d %lf\", &whole, &decimal);",
       "printf(\"count=%d value=%d %.1f\\n\", count, whole, decimal);"],
      "count=2 value=42 3.5\n",
      "sscanf 从内存中的字符串读取数据，因此无需交互输入。返回值记录真正完成赋值的转换项数，可用来判断输入是否完整。"
    ),
    make(
      "ex-stdio-getchar-eof", "观察空输入的 EOF",
      ["getchar-function"], 1,
      "在没有标准输入数据的环境调用 getchar，输出它的返回值以及它是否等于 EOF。",
      ["必须把 getchar 返回值保存在 int 中", "必须与 EOF 进行比较", "按指定格式输出返回值和判断结果"],
      ["getchar 必须用 int 接收，才能同时表示字符和 EOF", "验证器不会向程序提供标准输入数据"],
      ["stdio.h"], "",
      ["int value = getchar();", "printf(\"value=%d eof=%d\\n\", value, value == EOF);"],
      "value=-1 eof=1\n",
      "标准输入立即结束时，getchar 返回 EOF。使用 int 保存返回值后才能可靠地区分所有 unsigned char 值与文件结束标记。"
    ),
    make(
      "ex-stdio-putchar-word", "逐字符输出短词",
      ["putchar-function"], 1,
      "使用 putchar 逐个输出字符数组中的 C11，最后再单独输出一个换行符。",
      ["正文字符必须由 putchar 输出", "使用循环遍历字符数组", "最后输出换行符"],
      ["字符串结尾的空字符不能当作正文输出", "换行字符写作 '\\n'"],
      ["stdio.h"], "",
      ["const char text[] = \"C11\";", "for (size_t i = 0; text[i] != '\\0'; ++i) {", "    putchar(text[i]);", "}", "putchar('\\n');"],
      "C11\n",
      "putchar 每次接收一个字符值。循环在空字符前停止，再补一个换行，就能得到确定且没有额外字节的输出。"
    ),
    make(
      "ex-stdio-puts-lines", "用 puts 输出两行",
      ["puts-function"], 1,
      "连续调用两次 puts 输出两个固定短句，观察函数自动在每个字符串后添加换行。",
      ["必须调用两次 puts", "传入的字符串中不要写换行符", "两段文字各占一行"],
      ["puts 会自动追加一个换行符", "它要求参数指向以空字符结尾的字符串"],
      ["stdio.h"], "",
      ["puts(\"hello\");", "puts(\"C language\");"],
      "hello\nC language\n",
      "puts 输出完整字符串后会自动换行，所以字符串本身不需要包含换行符。连续调用自然形成两行结果。"
    ),
    make(
      "ex-stdio-sprintf-label", "秒数换算成 01:02:05",
      ["sprintf-function"], 1,
      "把总秒数 3725 拆成时、分、秒，再用 sprintf 拼成 01:02:05 这样的文本并打印出来。",
      ["必须用 / 和 % 拆出时、分、秒", "必须用 sprintf 拼成 %02d:%02d:%02d 的文本", "最后用 printf 打印这个文本"],
      ["一小时 3600 秒、一分钟 60 秒", "sprintf 的第一个参数是目标字符数组，后面和 printf 一样"],
      ["stdio.h"], "",
      ["int total = 3725;", "int hour = total / 3600;", "int minute = total % 3600 / 60;", "int second = total % 60;",
       "char text[16];", "sprintf(text, \"%02d:%02d:%02d\", hour, minute, second);", "printf(\"%s\\n\", text);"],
      "01:02:05\n",
      "3725 秒 = 1 小时 2 分 5 秒，%02d 表示至少两位、不足补 0。sprintf 与 printf 的唯一区别是它把结果写进字符数组，所以后续还能继续加工。"
    ),
    make(
      "ex-file-fopen-missing", "判断 fopen 打开失败",
      ["fopen-function"], 1,
      "先删除一个固定测试文件，再尝试以只读模式打开它，并用 NULL 判断文件是否不存在。",
      ["必须先调用 remove 清理同名文件", "必须使用只读模式调用 fopen", "打开失败时输出 missing=yes"],
      ["不存在的文件不能用 r 模式创建", "fopen 失败时返回 NULL"],
      ["stdio.h"], "",
      ["const char *path = \"csyntax_missing_fopen_exercise.txt\";", "remove(path);", "FILE *file = fopen(path, \"r\");",
       "printf(\"missing=%s\\n\", file == NULL ? \"yes\" : \"no\");", "if (file != NULL) {", "    fclose(file);", "}", "remove(path);"],
      "missing=yes\n",
      "只读模式不会创建文件，因此清理同名文件后 fopen 应返回 NULL。先判断返回值再决定是否 fclose，避免操作空指针。"
    ),
    make(
      "ex-file-fgetc-read", "用 fgetc 读完整文件",
      ["fgetc-function"], 2,
      "把固定文本写入测试文件，再用 fgetc 逐字符读到 EOF，输出内容并删除测试文件。",
      ["文件名必须固定且结束时调用 remove", "读取结果必须保存在 int 中", "循环必须在 fgetc 返回 EOF 时结束"],
      ["先用写模式建立测试文件，再关闭并重新只读打开", "fgetc 返回的普通字符可交给 putchar 输出"],
      ["stdio.h"], "",
      ["const char *path = \"csyntax_fgetc_exercise.txt\";", "FILE *file = fopen(path, \"w\");", "if (file == NULL) { return 1; }",
       "fputs(\"read me\\n\", file);", "fclose(file);", "file = fopen(path, \"r\");", "if (file == NULL) { remove(path); return 1; }",
       "int character;", "while ((character = fgetc(file)) != EOF) {", "    putchar(character);", "}", "fclose(file);", "remove(path);"],
      "read me\n",
      "fgetc 用 int 同时表示字节值和 EOF。程序先构造确定内容，再逐字符复制到标准输出，最后关闭并删除固定测试文件。"
    ),
    make(
      "ex-file-fputc-write", "用 fputc 写字符",
      ["fputc-function"], 2,
      "使用 fputc 向固定测试文件依次写入三个字符，再读回整行并清理文件。",
      ["三个字符都必须通过 fputc 写入", "写完后必须关闭再重新打开", "程序结束前调用 remove 删除文件"],
      ["写模式会新建或截断文件", "可用 fgets 一次读回带换行的短文本"],
      ["stdio.h"], "",
      ["const char *path = \"csyntax_fputc_exercise.txt\";", "FILE *file = fopen(path, \"w\");", "if (file == NULL) { return 1; }",
       "fputc('C', file);", "fputc('!', file);", "fputc('\\n', file);", "fclose(file);", "file = fopen(path, \"r\");",
       "if (file == NULL) { remove(path); return 1; }", "char line[8];", "if (fgets(line, sizeof line, file) != NULL) {", "    printf(\"%s\", line);", "}",
       "fclose(file);", "remove(path);"],
      "C!\n",
      "fputc 每次把一个字符写入流。关闭写入流可完成刷新，重新打开后读回相同三个字符，并在结尾删除测试文件。"
    ),
    make(
      "ex-string-strncpy-truncate", "安全截断字符串",
      ["strncpy-function", "strncpy-missing-terminator"], 2,
      "把 syntax 截断复制进五字节数组，只复制四个字符并手动补上字符串终止符。",
      ["必须使用 strncpy", "复制数量必须为数组容量减一", "最后一个元素必须手动写入空字符"],
      ["strncpy 截断源字符串时不会自动补空字符", "sizeof destination 可得到整个数组容量"],
      ["stdio.h", "string.h"],
      "static void copy_prefix(char *destination, size_t capacity, const char *source) {\n    strncpy(destination, source, capacity - 1U);\n    destination[capacity - 1U] = '\\0';\n}",
      ["char destination[5];", "copy_prefix(destination, sizeof destination, \"syntax\");", "printf(\"%s\\n\", destination);"],
      "synt\n",
      "目标数组只有五字节，因此最多保留四个可见字符。截断复制后显式写入空字符，才能把结果安全地当作字符串输出。"
    ),
    make(
      "ex-memory-memcpy-array", "复制整数数组",
      ["memcpy-function"], 1,
      "使用 memcpy 把三个整数从源数组复制到目标数组，并按顺序输出复制后的内容。",
      ["必须使用 memcpy", "复制字节数通过 sizeof 源数组获得", "输出三个目标元素"],
      ["两个数组都是真正的 int 数组", "memcpy 的长度参数以字节为单位"],
      ["stdio.h", "string.h"], "",
      ["const int source[] = {3, 5, 8};", "int target[3] = {0};", "memcpy(target, source, sizeof source);",
       "printf(\"%d %d %d\\n\", target[0], target[1], target[2]);"],
      "3 5 8\n",
      "源数组与目标数组大小一致且不重叠，适合直接用 memcpy 复制。sizeof source 给出包含三个整数的完整字节数。"
    ),
    make(
      "ex-memory-memset-text", "批量填充字符数组",
      ["memset-function"], 1,
      "使用 memset 把字符数组的前五个字节都填成 A，再补空字符并输出字符串。",
      ["必须使用 memset 填充", "只填充前五个字节", "最后一个字节写入空字符"],
      ["memset 的第二个参数会转换成 unsigned char", "有效 C 字符串必须以空字符结束"],
      ["stdio.h", "string.h"], "",
      ["char text[6];", "memset(text, 'A', 5U);", "text[5] = '\\0';", "printf(\"%s\\n\", text);"],
      "AAAAA\n",
      "memset 适合按字节重复填充值，但不会建立字符串结尾。额外写入空字符后，五个 A 才构成合法字符串。"
    ),
    make(
      "ex-type-union-members", "切换联合成员",
      ["union-type"], 2,
      "定义同时拥有 int 与 double 成员的联合，分别写入并立即读取当前有效成员。",
      ["必须定义并使用 union", "每次只读取最后写入的成员", "整数和小数各输出一行"],
      ["联合的成员共享同一段存储", "写入另一个成员后不要继续读取旧成员"],
      ["stdio.h"],
      "union Number {\n    int integer;\n    double decimal;\n};",
      ["union Number value;", "value.integer = 12;", "printf(\"integer=%d\\n\", value.integer);", "value.decimal = 2.5;", "printf(\"decimal=%.1f\\n\", value.decimal);"],
      "integer=12\ndecimal=2.5\n",
      "联合的所有成员复用同一块内存。每次赋值后立刻读取刚写入的成员，既体现共享存储，也避免读取非活动成员带来的歧义。"
    ),
    make(
      "ex-control-goto-cleanup", "用 goto 跳到标签",
      ["goto-cleanup"], 1,
      "先让程序直接跳到 cleanup 标签，再打印 step 的值，看看中间那行赋值有没有被执行。",
      ["必须有一个名为 cleanup 的标签", "必须用 goto cleanup 跳过去", "打印 step 的值"],
      ["goto 会立刻跳到标签那一行，中间的语句被跳过", "标签后面要跟一个冒号，写法是 cleanup:"],
      ["stdio.h"], "",
      ["int step = 0;", "goto cleanup;", "step = 1;", "cleanup:", "printf(\"step=%d\\n\", step);"],
      "step=0\n",
      "goto 把执行位置直接搬到标签处，所以 step = 1 那一行根本没跑，输出还是 0。它常用来把出错分支汇合到同一个收尾标签（这就是「统一清理」的由来）。"
    ),
    make(
      "ex-convert-atoi-sum", "用 atoi 转换整数",
      ["atoi-function"], 1,
      "使用 atoi 转换两个固定的十进制字符串，并输出两个转换结果相加后的总和。",
      ["必须调用两次 atoi", "输入字符串必须都是合法整数", "输出格式为 sum=113"],
      ["atoi 返回 int", "本题只使用完全合法的字符串，不讨论错误检测"],
      ["stdio.h", "stdlib.h"], "",
      ["int first = atoi(\"120\");", "int second = atoi(\"-7\");", "printf(\"sum=%d\\n\", first + second);"],
      "sum=113\n",
      "atoi 可把合法十进制文本转换为 int。它不提供可靠的错误报告，因此这里只对两个已知有效的字符串做基础练习。"
    ),
    make(
      "ex-convert-atof-total", "用 atof 转换小数",
      ["atof-function"], 1,
      "使用 atof 转换 12.5 和 0.25 两个固定字符串，把结果相加并保留两位小数输出。",
      ["必须调用两次 atof", "使用 double 保存结果", "输出时保留两位小数"],
      ["atof 返回 double", "printf 输出 double 可使用 %.2f"],
      ["stdio.h", "stdlib.h"], "",
      ["double total = atof(\"12.5\") + atof(\"0.25\");", "printf(\"total=%.2f\\n\", total);"],
      "total=12.75\n",
      "atof 把合法小数字符串转换为 double。两个值都能精确得到本题结果，再用格式精度把输出固定为两位小数。"
    ),
    make(
      "ex-random-repeat-seed", "固定种子复现随机数",
      ["rand-function", "srand-function"], 2,
      "用同一个固定种子初始化两次，每次取第一个 rand 结果，并输出两次结果是否相同。",
      ["两次都必须调用 srand(7)", "每次播种后只调用一次 rand", "只输出相等判断，不输出平台相关随机值"],
      ["同一实现里相同种子会重启相同序列", "比较结果可避免依赖不同平台的具体随机数"],
      ["stdio.h", "stdlib.h"], "",
      ["srand(7U);", "int first = rand();", "srand(7U);", "int second = rand();", "printf(\"repeat=%d\\n\", first == second);"],
      "repeat=1\n",
      "srand 用固定种子重置伪随机序列，因此同一实现的第一个 rand 结果会重复。只输出比较结果还能避免绑定某个运行库的数值序列。"
    ),
    make(
      "ex-time-availability", "检查系统时间可用性",
      ["time-function"], 1,
      "调用 time(NULL) 获取当前日历时间，不输出变化的时间值，只输出调用是否成功。",
      ["必须调用 time(NULL)", "结果保存为 time_t", "通过与 (time_t)-1 比较判断成功"],
      ["time 的具体结果会变化，不适合直接写进预期输出", "失败时标准规定返回 (time_t)-1"],
      ["stdio.h", "time.h"], "",
      ["time_t now = time(NULL);", "printf(\"available=%d\\n\", now != (time_t)-1);"],
      "available=1\n",
      "time(NULL) 返回当前日历时间，但数值每次运行都不同。本题只检查它不是失败标记，从而保持可验证的确定输出。"
    ),
    make(
      "ex-null-fallback", "NULL 指针使用默认值",
      ["null-macro-stddef"], 1,
      "编写一个函数：指针为 NULL 时返回默认整数，否则返回指针所指的整数。",
      ["必须在解引用前比较 NULL", "分别测试有效指针和 NULL", "输出两个返回结果"],
      ["NULL 表示没有可解引用的对象", "条件运算符适合表达二选一结果"],
      ["stddef.h", "stdio.h"],
      "static int value_or(const int *pointer, int fallback) {\n    return pointer == NULL ? fallback : *pointer;\n}",
      ["int value = 9;", "printf(\"%d %d\\n\", value_or(&value, 0), value_or(NULL, 0));"],
      "9 0\n",
      "函数先检查指针是否为 NULL，只有有效地址才解引用。这样既能读取真实值，也能为缺失值提供调用者指定的默认结果。"
    ),
    make(
      "ex-preprocess-include-ctype", "包含正确的头文件",
      ["include-directive", "isdigit-function"], 1,
      "为 isdigit 选择并包含正确的标准头文件，判断字符 7 是否是十进制数字。",
      ["必须包含 ctype.h", "传给 isdigit 的值转换为 unsigned char", "把判断结果规范化为 0 或 1"],
      ["isdigit 的声明位于 ctype.h", "用 != 0 把任意非零真值变成 1"],
      ["ctype.h", "stdio.h"], "",
      ["int digit = isdigit((unsigned char)'7') != 0;", "printf(\"digit=%d\\n\", digit);"],
      "digit=1\n",
      "#include 把标准库函数的正确声明带入当前翻译单元。ctype 函数应接收 EOF 或可表示为 unsigned char 的值。"
    ),
    make(
      "ex-debug-assert-true", "用 assert 检查条件",
      ["assert-macro"], 1,
      "用 assert 检查数组元素个数确实为四，断言通过后输出确认信息。",
      ["必须包含 assert.h", "断言表达式必须为真", "断言后输出 count=4"],
      ["sizeof 数组除以单个元素大小可得到元素个数", "失败断言会终止程序，因此本题条件必须成立"],
      ["assert.h", "stdio.h"], "",
      ["int values[] = {2, 4, 6, 8};", "size_t count = sizeof values / sizeof values[0];", "assert(count == 4U);", "printf(\"count=%lu\\n\", (unsigned long)count);"],
      "count=4\n",
      "assert 适合在调试阶段验证程序内部前提。数组长度确实是四，所以断言不产生输出，程序继续打印确认结果。"
    ),
    make(
      "ex-process-exit-handler", "exit 会立刻结束程序",
      ["exit-function"], 1,
      "先打印 before，然后调用 exit(0) 结束程序，看看它后面的那行还会不会执行。",
      ["必须调用一次 exit(0)", "调用之前要打印 before", "exit 后面还要写一行打印 after 的语句作为对照"],
      ["exit 会立刻终止程序，后面的语句不会执行", "它和 return 不同：在函数里调用 exit 也会直接结束整个程序"],
      ["stdio.h", "stdlib.h"],
      "",
      ["puts(\"before\");", "exit(0);", "puts(\"after\");"],
      "before\n",
      "exit(0) 表示「立刻以状态 0 结束整个程序」，所以后面的 puts(\"after\") 永远不会执行——输出里只有 before。它比 return 更强势：在任何函数里调用都会直接退出。"
    ),
    make(
      "ex-storage-static-counter", "静态局部变量计数",
      ["storage-class-specifiers", "static-meanings", "scope-lifetime"], 2,
      "用 static 局部变量保存函数调用次数，连续调用三次并输出逐次递增的结果。",
      ["计数变量必须定义为 static 局部变量", "每次调用先递增再返回", "连续输出三次调用结果"],
      ["static 局部变量只初始化一次", "它的作用域在函数内，但生存期贯穿整个程序"],
      ["stdio.h"],
      "static int next_count(void) {\n    static int count = 0;\n    count += 1;\n    return count;\n}",
      ["int first = next_count();", "int second = next_count();", "int third = next_count();", "printf(\"%d %d %d\\n\", first, second, third);"],
      "1 2 3\n",
      "static 局部变量会跨调用保留值。把三次调用分别放进独立语句，既得到依次递增的结果，也避免依赖函数实参的求值顺序。"
    ),
    make(
      "ex-memory-sizeof-allocation", "按对象大小动态分配",
      ["sizeof-allocation", "malloc-function"], 2,
      "用 malloc 为三个 int 分配空间，大小写成数量乘以 sizeof *pointer，填值后求和并释放。",
      ["分配表达式必须使用 sizeof *values", "必须检查 malloc 返回值", "使用结束后调用 free"],
      ["sizeof *pointer 会随指针目标类型自动调整", "成功分配后才能写入数组元素"],
      ["stdio.h", "stdlib.h"], "",
      ["size_t count = 3U;", "int *values = malloc(count * sizeof *values);", "if (values == NULL) { return 1; }",
       "for (size_t i = 0; i < count; ++i) {", "    values[i] = (int)(i + 1U);", "}", "printf(\"sum=%d\\n\", values[0] + values[1] + values[2]);", "free(values);"],
      "sum=6\n",
      "把元素数量乘以 sizeof *values 可避免重复书写类型。检查成功后写入三个整数，使用完毕立即 free，所有权边界清晰。"
    ),
    make(
      "ex-type-volatile-flag", "读取 volatile 标志",
      ["volatile-qualifier"], 2,
      "声明一个 volatile 整数标志，进行一次写入和一次读取，并输出最终确定值。",
      ["变量必须带 volatile 限定", "先写入新值再读取", "输出格式为 flag=5"],
      ["volatile 要求每次访问都实际发生", "它不提供线程同步或原子性"],
      ["stdio.h"], "",
      ["volatile int flag = 3;", "flag = 5;", "int snapshot = flag;", "printf(\"flag=%d\\n\", snapshot);"],
      "flag=5\n",
      "volatile 表达对象可能被当前代码之外的因素改变，因此读写不能被随意省略。本题只展示访问语义，不把它误当成线程同步工具。"
    ),
    make(
      "ex-syntax-declare-define", "区分声明与定义",
      ["declaration-definition"], 2,
      "先用 extern 声明文件作用域变量，再提供一次定义和初始化，最后在 main 中输出它。",
      ["必须同时出现 extern 声明与变量定义", "变量只能定义一次", "输出初始化后的数值"],
      ["extern 声明告诉编译器名字和类型", "不带 extern 的文件作用域初始化语句提供存储定义"],
      ["stdio.h"],
      "extern int total;\nint total = 9;",
      ["printf(\"total=%d\\n\", total);"],
      "total=9\n",
      "声明让后续代码知道变量的类型与名字，定义则真正提供存储。两者可以在同一翻译单元出现，但定义只能有一次。"
    ),
    make(
      "ex-preprocess-include-guard", "模拟头文件保护",
      ["include-guard"], 2,
      "使用 ifndef、define 和 endif 组成保护结构，在其中定义常量并从 main 输出该常量。",
      ["保护宏名必须唯一且醒目", "常量定义必须位于保护范围内", "main 中输出常量值"],
      ["第一次处理时宏尚未定义，因此进入保护体", "再次包含同样内容时保护宏会阻止重复定义"],
      ["stdio.h"],
      "#ifndef CSYNTAX_SAMPLE_H\n#define CSYNTAX_SAMPLE_H\n#define CSYNTAX_LIMIT 8\n#endif",
      ["printf(\"limit=%d\\n\", CSYNTAX_LIMIT);"],
      "limit=8\n",
      "头文件保护用唯一宏包住声明或定义，使同一头文件被重复包含时只展开一次。本题用常量展示保护范围确实生效。"
    ),
    make(
      "ex-syntax-block-statements", "在代码块中组合语句",
      ["statement", "compound-statement", "identifier"], 1,
      "在一个内部复合语句中声明局部标识符并更新外层变量，离开代码块后输出结果。",
      ["必须包含一个额外的花括号代码块", "内部变量使用合法标识符", "块外只访问外层变量"],
      ["花括号包围的多条语句构成复合语句", "内部声明的名字离开代码块后不可见"],
      ["stdio.h"], "",
      ["int total = 2;", "{", "    int added_value = 5;", "    total += added_value;", "}", "printf(\"total=%d\\n\", total);"],
      "total=7\n",
      "复合语句建立新的块作用域，内部标识符只在花括号之间可见。对外层 total 的修改会保留到代码块结束之后。"
    ),
    make(
      "ex-pointer-double-update", "通过二级指针修改值",
      ["pointer-to-pointer"], 2,
      "建立 int、一级指针和二级指针，通过两次解引用把原整数从 8 改为 10。",
      ["必须声明 int ** 类型变量", "必须通过 **pointer 修改原值", "输出修改后的整数"],
      ["一级指针保存整数地址", "二级指针保存一级指针自身的地址"],
      ["stdio.h"], "",
      ["int value = 8;", "int *pointer = &value;", "int **pointer_to_pointer = &pointer;", "**pointer_to_pointer += 2;", "printf(\"value=%d\\n\", value);"],
      "value=10\n",
      "二级指针先找到一级指针，再通过一级指针找到原整数。两次解引用写入的仍是 value 本身，因此结果变为十。"
    ),
    make(
      "ex-struct-designated-init", "指定结构体成员初始化",
      ["designated-initializer"], 1,
      "定义含 x 与 y 的结构体，使用指定初始化器打乱书写顺序赋值，再按 x、y 顺序输出。",
      ["必须使用 .member = value 语法", "初始化列表中先写 y 再写 x", "输出时按 x 再 y 的顺序"],
      ["指定初始化器不依赖成员声明顺序书写", "读取结构体时仍通过点运算符选择成员"],
      ["stdio.h"],
      "struct Point {\n    int x;\n    int y;\n};",
      ["struct Point point = {.y = 4, .x = 3};", "printf(\"x=%d y=%d\\n\", point.x, point.y);"],
      "x=3 y=4\n",
      "指定初始化器明确标出目标成员，即使赋值顺序与声明顺序不同也不会混淆。最终访问仍按成员名得到对应数值。"
    )
  ]);
}());
