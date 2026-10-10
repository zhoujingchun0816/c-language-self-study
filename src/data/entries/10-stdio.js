(function () {
  "use strict";

  var program = window.C_SYNTAX_PROGRAM;
  function make(id, name, category, summary, headers, usage, syntax, body, notes, related, aliases, beforeMain) {
    return { id: id, name: name, aliases: aliases || [], category: category, summary: summary,
      headers: headers, usage: usage, syntax: syntax, example: program(headers, body, beforeMain || ""),
      notes: notes, related: related || [] };
  }

  var extraEntries = [
  make("sprintf-function", "sprintf", "标准库函数", "sprintf 把格式化结果写入字符数组并追加空字符。", ["stdio.h"],
    "仅在能严格证明数组足够大时才使用 sprintf；通常应选择带容量参数的 snprintf，并检查返回的字符数量。",
    "int sprintf(char *restrict buffer, const char *restrict format, ...);",
    ["char text[32];", "int length = sprintf(text, \"id=%d\", 12);", "if (length != 5) return 1;", "return text[0] == 'i' ? 0 : 1;"],
    ["sprintf 不接收目标容量，空间不足会发生越界写入。", "成功返回生成字符数，不包含末尾的空字符。", "源参数与目标数组重叠时，程序行为没有定义。"], ["snprintf-function", "formatted-output-return"]),
  make("snprintf-function", "snprintf", "标准库函数", "snprintf 在给定容量内生成格式化字符串。", ["stdio.h"],
    "向固定缓冲区格式化文本时优先使用 snprintf；容量包含结尾空字符，返回值可用于识别截断和计算重试空间。",
    "int snprintf(char *restrict buffer, size_t size, const char *restrict format, ...);",
    ["char text[8];", "int needed = snprintf(text, sizeof text, \"%s\", \"abcdef\");", "if (needed < 0) return 1;", "if ((size_t)needed >= sizeof text) return 1;"],
    ["容量大于零时结果会以空字符结尾，即使发生截断。", "返回值是不截断时所需字符数，可用于二次分配。", "传零容量可查询长度，但目标指针仍须满足标准约束。"], ["sprintf-function", "formatted-output-return"]),
  make("vprintf-function", "vprintf", "标准库函数", "vprintf 使用 va_list 把格式化文本写到标准输出。", ["stdarg.h", "stdio.h"],
    "编写接收省略号参数的输出包装器时用 vprintf 转发 va_list；调用前执行 va_start，所有返回路径都要 va_end。",
    "int vprintf(const char *restrict format, va_list arguments);", ["if (show(\"%s %d\\n\", \"count\", 3) < 0) return 1;"],
    ["同一个 va_list 若要再次遍历，必须先用 va_copy 复制。", "格式参数与列表内实际类型不一致会导致未定义行为。", "负返回值表示输出或编码错误，不能当作字符数量。"], ["printf-function", "vfprintf-function"], [],
    "static int show(const char *format, ...) {\n    va_list arguments;\n    va_start(arguments, format);\n    int result = vprintf(format, arguments);\n    va_end(arguments);\n    return result;\n}"),
  make("vfprintf-function", "vfprintf", "文件 IO", "vfprintf 使用 va_list 向指定流进行格式化输出。", ["stdarg.h", "stdio.h"],
    "日志包装器需要把可变参数写入 FILE 流时使用 vfprintf；建立参数列表后转发，并把负返回值报告给调用方。",
    "int vfprintf(FILE *restrict stream, const char *restrict format, va_list arguments);", ["FILE *stream = tmpfile();", "if (stream == NULL) return 1;", "if (write_values(stream, \"%d\", 9) < 0) { fclose(stream); return 1; }", "if (fclose(stream) == EOF) return 1;"],
    ["目标流必须可写并在整个调用期间保持有效。", "va_end 应由创建该参数列表的函数负责执行。", "同一流的并发格式化输出需要调用者安排同步。"], ["fprintf-function", "vprintf-function"], [],
    "static int write_values(FILE *stream, const char *format, ...) {\n    va_list arguments;\n    va_start(arguments, format);\n    int result = vfprintf(stream, format, arguments);\n    va_end(arguments);\n    return result;\n}"),
  make("vsprintf-function", "vsprintf", "标准库函数", "vsprintf 从 va_list 生成字符串但不接收目标容量。", ["stdarg.h", "stdio.h"],
    "只有目标空间上界由协议严格保证时才考虑 vsprintf；普通包装器应使用 vsnprintf 并传入真实数组容量。",
    "int vsprintf(char *restrict buffer, const char *restrict format, va_list arguments);", ["char text[16];", "if (build_unchecked(text, \"%s\", \"ok\") != 2) return 1;"],
    ["接口没有容量参数，格式展开后可能覆盖数组边界。", "写入结果会追加空字符，所需空间要额外计算一字节。", "va_list 在调用后的状态不可移植，不应直接重复使用。"], ["vsnprintf-function", "sprintf-function"], [],
    "static int build_unchecked(char *buffer, const char *format, ...) {\n    va_list arguments;\n    va_start(arguments, format);\n    int result = vsprintf(buffer, format, arguments);\n    va_end(arguments);\n    return result;\n}"),
  make("vsnprintf-function", "vsnprintf", "标准库函数", "vsnprintf 从 va_list 向限长字符数组写入格式化结果。", ["stdarg.h", "stdio.h"],
    "实现安全的格式化包装器时使用 vsnprintf，并把目标容量一并传入；根据返回值区分成功、编码失败或截断。",
    "int vsnprintf(char *restrict buffer, size_t size, const char *restrict format, va_list arguments);", ["char text[16];", "int needed = build_checked(text, sizeof text, \"%d\", 25);", "if (needed < 0 || (size_t)needed >= sizeof text) return 1;"],
    ["非负返回值大于等于容量表示输出已经截断。", "查询长度后重试时必须重新建立或复制 va_list。", "容量为一时只能存放结尾空字符，仍会报告完整需求。"], ["snprintf-function", "vsprintf-function"], [],
    "static int build_checked(char *buffer, size_t size, const char *format, ...) {\n    va_list arguments;\n    va_start(arguments, format);\n    int result = vsnprintf(buffer, size, format, arguments);\n    va_end(arguments);\n    return result;\n}"),
  make("putchar-function", "putchar", "标准库函数", "putchar 把一个字符写到 stdout，并返回写入字符或 EOF。", ["stdio.h"],
    "向标准输出逐个写字符时使用 putchar；传可表示为 unsigned char 的值，换行要另传字符，并检查是否返回 EOF。",
    "int putchar(int c);", ["if (putchar('A') == EOF) return 1;", "if (putchar('\\n') == EOF) return 1;"],
    ["参数是 int，便于传递全部 unsigned char 值，而不是接收字符串。", "成功返回写入字符提升后的值，失败返回 EOF。", "putchar 固定写 stdout；putc 和 fputc 可以选择目标流。", "常见错误是传字符串字面量、忘写换行或忽略返回值。"], ["putc-function", "fputc-function", "getchar-function"], ["输出字符", "打印单个字符"]),
  make("putc-function", "putc", "文件 IO", "putc 把一个字符写入指定流，允许实现为宏。", ["stdio.h"],
    "已有目标 FILE 指针并需逐字符写入时可用 putc；流表达式应简单无副作用，失败时按 EOF 分支处理。",
    "int putc(int c, FILE *stream);", ["FILE *stream = tmpfile();", "if (stream == NULL) return 1;", "if (putc('X', stream) == EOF) { fclose(stream); return 1; }", "if (fclose(stream) == EOF) return 1;"],
    ["字符会先转换为 unsigned char 再写入目标流。", "需要明确函数接口时可选择行为等价的 fputc。", "高频单字节输出不如 fwrite 适合大块数据。"], ["putchar-function", "fputc-function"]),
  make("fputc-function", "fputc", "文件 IO", "fputc 将单个字符写入指定输出流。", ["stdio.h"],
    "需要函数形式的逐字节输出时使用 fputc；传入目标流，把 EOF 视为写入错误，并在结束时检查关闭结果。",
    "int fputc(int c, FILE *stream);", ["FILE *stream = tmpfile();", "if (stream == NULL) return 1;", "if (fputc(0x41, stream) == EOF) { fclose(stream); return 1; }", "if (fclose(stream) == EOF) return 1;"],
    ["二进制流可逐字节写入零到 UCHAR_MAX 范围内的值。", "返回的是写入字节提升为 int 的结果，而不是计数。", "连续大量数据应改用 fwrite 减少调用开销。"], ["putc-function", "fwrite-function"]),
  make("fwrite-function", "fwrite", "文件 IO", "fwrite 从内存向流写入若干固定大小对象。", ["stdio.h"],
    "写二进制块或数组时使用 fwrite；元素大小与数量分开传入，并比较返回的完整元素数以发现短写。",
    "size_t fwrite(const void *restrict pointer, size_t size, size_t count, FILE *restrict stream);", ["FILE *stream = tmpfile();", "if (stream == NULL) return 1;", "unsigned char bytes[] = {1U, 2U, 3U};", "if (fwrite(bytes, sizeof bytes[0], 3U, stream) != 3U) { fclose(stream); return 1; }", "if (fclose(stream) == EOF) return 1;"],
    ["返回值按完整元素计数，不直接表示写入字节数量。", "结构体原始表示含填充和端序，不适合作为可移植格式。", "发生短写后可用 ferror 查询流错误并决定清理策略。"], ["fread-function", "ferror-function"]),
  make("sscanf-function", "sscanf", "标准库函数", "sscanf 从内存字符串按格式匹配并转换字段。", ["stdio.h"], "字符串已经完整取得且格式简单时用 sscanf 提取字段；限制字符串宽度，并按返回值确认全部必需字段成功。", "int sscanf(const char *restrict string, const char *restrict format, ...);", ["int number = 0;", "char word[8];", "if (sscanf(\"12 apple\", \"%d %7s\", &number, word) != 2) return 1;", "return number == 12 && word[0] == 'a' ? 0 : 1;"], ["源字符串必须以空字符结尾并在解析期间有效。", "字段宽度不含自动追加的空字符，要为它预留空间。", "若需拒绝尾随垃圾，可用百分号 n 记录消费位置再检查。"], ["scanf-function", "scanf-field-width"]),
  make("gets-removed", "gets（C11 已移除）", "常见易错点", "gets 无法获知数组容量，已从 C11 标准删除。", ["stdio.h"], "维护旧代码遇到 gets 时必须替换为带容量的 fgets；读取后按需移除保留的换行，绝不能继续调用 gets。", "/* char *gets(char *buffer); -- C11 已移除 */", ["char buffer[16];", "if (fgets(buffer, (int)sizeof buffer, stdin) == NULL) return 1;", "return buffer[0] == '\\0' ? 1 : 0;"], ["gets 没有容量参数，任何过长输入都会造成缓冲区越界。", "C11 不再声明此函数，现代实现可能直接无法链接。", "fgets 会保留换行，替换旧调用时要处理语义差异。"], ["fgets-function", "scanf-field-width"]),
  make("getc-function", "getc", "文件 IO", "getc 从指定输入流读取一个字符，允许实现为宏。", ["stdio.h"], "从已有 FILE 流逐字符读取时可用 getc；循环变量必须用 int，遇到 EOF 后再检查 feof 或 ferror。", "int getc(FILE *stream);", ["FILE *stream = tmpfile();", "if (stream == NULL) return 1;", "if (fputc('Q', stream) == EOF) { fclose(stream); return 1; }", "rewind(stream);", "int character = getc(stream);", "if (fclose(stream) == EOF) return 1;", "return character == 'Q' ? 0 : 1;"], ["getc 可能是宏，流参数应避免带副作用的复杂表达式。", "读到 EOF 后结束或错误指示器会保持到清除或重定位。", "成功结果对应 unsigned char 转换为 int 后的非负值。"], ["fgetc-function", "eof-constant"]),
  make("fgetc-function", "fgetc", "文件 IO", "fgetc 从指定输入流读取下一个字符。", ["stdio.h"], "需要函数形式的逐字节输入时使用 fgetc；把结果保存在 int 中判断 EOF，通过后再处理字节。", "int fgetc(FILE *stream);", ["FILE *stream = tmpfile();", "if (stream == NULL) return 1;", "if (fputc('Z', stream) == EOF) { fclose(stream); return 1; }", "rewind(stream);", "int character = fgetc(stream);", "if (fclose(stream) == EOF) return 1;", "return character == 'Z' ? 0 : 1;"], ["先转换为 char 再比较 EOF 可能把有效字节误判。", "文本流读取时实现可能执行行结束序列转换。", "大量连续数据适合用 fread 减少逐次调用开销。"], ["getc-function", "fread-function"]),
  make("ungetc-function", "ungetc", "文件 IO", "ungetc 把一个非 EOF 字符退回输入流供下次读取。", ["stdio.h"], "解析器多读一个分隔符后可用 ungetc 放回；只依赖至少一次推回能力，并检查函数是否返回 EOF。", "int ungetc(int c, FILE *stream);", ["FILE *stream = tmpfile();", "if (stream == NULL) return 1;", "if (ungetc('A', stream) == EOF) { fclose(stream); return 1; }", "int character = fgetc(stream);", "if (fclose(stream) == EOF) return 1;", "return character == 'A' ? 0 : 1;"], ["不能推回 EOF，传入它必然失败。", "标准只保证至少一个字符的连续推回深度。", "成功推回会清除该流的文件结束指示器。"], ["fgetc-function", "clearerr-function"]),
  make("fread-function", "fread", "文件 IO", "fread 从流读取若干固定大小对象到内存。", ["stdio.h"], "读取二进制数组或固定大小块时用 fread；按实际返回元素数访问数据，短读后查询 feof 与 ferror。", "size_t fread(void *restrict pointer, size_t size, size_t count, FILE *restrict stream);", ["FILE *stream = tmpfile();", "if (stream == NULL) return 1;", "unsigned char source[] = {4U, 5U};", "if (fwrite(source, 1U, 2U, stream) != 2U) { fclose(stream); return 1; }", "rewind(stream);", "unsigned char target[2] = {0U, 0U};", "size_t count = fread(target, 1U, 2U, stream);", "if (fclose(stream) == EOF) return 1;", "return count == 2U && target[1] == 5U ? 0 : 1;"], ["短读既可能是文件结束，也可能是流错误。", "只可使用实际读到的完整元素，剩余数组内容不是新输入。", "直接读取结构体会受到填充、对齐和端序差异影响。"], ["fwrite-function", "feof-function", "ferror-function"]),
  make("freopen-function", "freopen", "文件 IO", "freopen 关闭既有流并用新文件或模式重新关联它。", ["stdio.h"], "需要重定向标准流或改变流模式时使用 freopen；保存返回的新指针，失败后不要继续使用原来的流对象。", "FILE *freopen(const char *restrict filename, const char *restrict mode, FILE *restrict stream);", ["FILE *stream = tmpfile();", "if (stream == NULL) return 1;", "FILE *same = freopen(NULL, \"wb+\", stream);", "if (same == NULL) return 0;", "if (fclose(same) == EOF) return 1;"], ["filename 为 NULL 的模式修改是否成功受实现支持限制。", "调用失败时原流已经关闭，不能假定它仍然可用。", "重定向 stdout 前应考虑先刷新尚未提交的输出。"], ["fopen-function", "fflush-function"]),
  make("fflush-function", "fflush", "文件 IO", "fflush 将输出流缓冲的数据提交给宿主环境。", ["stdio.h"], "需要在流保持打开时提交输出或切换更新流方向时调用 fflush；检查 EOF，切勿把它当成清空输入的接口。", "int fflush(FILE *stream);", ["FILE *stream = tmpfile();", "if (stream == NULL) return 1;", "if (fputs(\"ready\", stream) == EOF) { fclose(stream); return 1; }", "if (fflush(stream) == EOF) { fclose(stream); return 1; }", "if (fclose(stream) == EOF) return 1;"], ["对纯输入流调用 fflush 在 ISO C 中没有清空输入的含义。", "传 NULL 会刷新所有已打开的输出流。", "刷新库缓冲并不等于数据已经持久写入物理磁盘。"], ["fclose-function", "setvbuf-function"]),
  make("ftell-function", "ftell", "文件 IO", "ftell 返回当前流位置的 long 表示。", ["stdio.h"], "需要稍后恢复文本流位置或取得二进制偏移时使用 ftell；先检查结果是否为负，再保存或传给 fseek。", "long ftell(FILE *stream);", ["FILE *stream = tmpfile();", "if (stream == NULL) return 1;", "if (fputs(\"abc\", stream) == EOF) { fclose(stream); return 1; }", "long position = ftell(stream);", "if (fclose(stream) == EOF) return 1;", "return position < 0L ? 1 : 0;"], ["失败时返回 -1L，并可能设置 errno。", "文本流位置未必是字节数，但可原样传回 fseek。", "超大文件可能超出 long 范围，平台扩展另有接口。"], ["fseek-function", "fgetpos-function"]),
  make("rewind-function", "rewind", "文件 IO", "rewind 将流位置移到开头并清除错误指示器。", ["stdio.h"], "无需获知定位失败且只想回到流起点时可用 rewind；如果必须检查结果，应改用能返回状态的 fseek。", "void rewind(FILE *stream);", ["FILE *stream = tmpfile();", "if (stream == NULL) return 1;", "if (fputs(\"A\", stream) == EOF) { fclose(stream); return 1; }", "rewind(stream);", "int character = fgetc(stream);", "if (fclose(stream) == EOF) return 1;", "return character == 'A' ? 0 : 1;"], ["rewind 在定位到起点时还会清除流错误状态。", "函数没有返回值，无法直接知道定位是否失败。", "不可定位的流调用后不能假定已经回到开头。"], ["fseek-function", "clearerr-function"]),
  make("fgetpos-function", "fgetpos", "文件 IO", "fgetpos 把当前流位置保存到 fpos_t 对象。", ["stdio.h"], "需要可移植地保存文本流完整位置状态时使用 fgetpos；检查返回值，让 fpos_t 对象保持有效直到恢复。", "int fgetpos(FILE *restrict stream, fpos_t *restrict position);", ["FILE *stream = tmpfile();", "if (stream == NULL) return 1;", "fpos_t position;", "if (fgetpos(stream, &position) != 0) { fclose(stream); return 1; }", "if (fclose(stream) == EOF) return 1;"], ["fpos_t 可能包含多字节转换状态，不应按整数解释。", "目标必须是可写且生命周期有效的 fpos_t 对象。", "保存的位置只应与同一个仍然打开的流配合。"], ["fsetpos-function", "ftell-function"]),
  make("fsetpos-function", "fsetpos", "文件 IO", "fsetpos 使用先前保存的 fpos_t 恢复流位置。", ["stdio.h"], "与 fgetpos 配对恢复文本流或宽字符状态时使用 fsetpos；只传同一流取得的位置，并检查非零失败值。", "int fsetpos(FILE *stream, const fpos_t *position);", ["FILE *stream = tmpfile();", "if (stream == NULL) return 1;", "fpos_t position;", "if (fgetpos(stream, &position) != 0) { fclose(stream); return 1; }", "if (fputc('A', stream) == EOF) { fclose(stream); return 1; }", "if (fsetpos(stream, &position) != 0) { fclose(stream); return 1; }", "if (fclose(stream) == EOF) return 1;"], ["成功恢复位置会清除流的文件结束指示器。", "从其他流取得的 fpos_t 不能用于当前流。", "文件内容改变后旧位置是否仍有意义取决于操作。"], ["fgetpos-function", "rewind-function"]),
  make("feof-function", "feof", "文件 IO", "feof 查询流的文件结束指示器是否已设置。", ["stdio.h"], "读取函数已经失败或短读后，用 feof 判断是否因为到达末尾；不要把它用作读取循环的先决条件。", "int feof(FILE *stream);", ["FILE *stream = tmpfile();", "if (stream == NULL) return 1;", "int character = fgetc(stream);", "int ended = character == EOF && feof(stream);", "if (fclose(stream) == EOF) return 1;", "return ended ? 0 : 1;"], ["结束指示器只在读取尝试越过末尾后才会设置。", "while (!feof(stream)) 会多处理一次旧数据，是典型错误。", "成功定位或调用 clearerr 可以清除此状态。"], ["ferror-function", "clearerr-function"]),
  make("ferror-function", "ferror", "文件 IO", "ferror 查询流的错误指示器是否已设置。", ["stdio.h"], "字符读取返回 EOF 或块操作短传输后调用 ferror 区分 I/O 错误；处理原因后才决定是否清除状态重试。", "int ferror(FILE *stream);", ["FILE *stream = tmpfile();", "if (stream == NULL) return 1;", "int has_error = ferror(stream);", "if (fclose(stream) == EOF) return 1;", "return has_error ? 1 : 0;"], ["非零结果只表示错误状态存在，不直接给出具体错误码。", "状态会保持，后续成功操作不一定自动清除。", "结合 errno 诊断时应在其他调用改写它之前保存数值。"], ["feof-function", "clearerr-function"]),
  make("clearerr-function", "clearerr", "文件 IO", "clearerr 清除流的文件结束与错误指示器。", ["stdio.h"], "已处理完流错误并准备重试，或要复用到达末尾的流时调用 clearerr；它只修改状态而不修复底层原因。", "void clearerr(FILE *stream);", ["FILE *stream = tmpfile();", "if (stream == NULL) return 1;", "(void)fgetc(stream);", "clearerr(stream);", "int state = feof(stream) || ferror(stream);", "if (fclose(stream) == EOF) return 1;", "return state ? 1 : 0;"], ["该函数会同时清除 EOF 与错误两个指示器。", "磁盘已满等根因仍在时，再次操作还会失败。", "clearerr 没有返回值，恢复情况要通过后续操作判断。"], ["feof-function", "ferror-function"]),
  make("perror-function", "perror", "标准库函数", "perror 根据当前 errno 向 stderr 输出诊断文本。", ["stdio.h"], "标准库调用失败且 errno 有意义时立即用 perror 输出上下文；前缀写操作名称，不能代替返回值检查。", "void perror(const char *string);", ["FILE *stream = fopen(\"path-that-should-not-exist.tmp\", \"rb\");", "if (stream == NULL) {", "    perror(\"fopen\");", "    return 0;", "}", "if (fclose(stream) == EOF) return 1;"], ["输出包含前缀、实现提供的错误文本和换行。", "errno 只有在相关函数报告失败时才应解释。", "perror 不返回状态，诊断后仍须清理或传播错误。"], ["fopen-function", "stderr-streams"]),
  make("remove-function", "remove", "文件 IO", "remove 按路径删除文件或实现允许的空目录。", ["stdio.h"], "清理程序自己创建且路径可信的临时文件时使用 remove；检查非零结果，避免把未经验证的输入当删除目标。", "int remove(const char *filename);", ["int result = remove(\"path-that-should-not-exist.tmp\");", "if (result == 0) return 0;"], ["删除打开中文件的行为在 Windows 与 POSIX 间差异明显。", "失败返回非零，常见原因包括权限不足或目标不存在。", "这是破坏性操作，调用前必须确认路径归属与范围。"], ["rename-function", "tmpfile-function"]),
  make("rename-function", "rename", "文件 IO", "rename 修改文件或目录的路径名。", ["stdio.h"], "在同一实现支持的文件系统范围内移动或替换路径时用 rename；检查结果，并预先明确目标存在时的策略。", "int rename(const char *old_name, const char *new_name);", ["int result = rename(\"missing-old.tmp\", \"missing-new.tmp\");", "if (result == 0) return 0;"], ["目标已存在时替换还是失败取决于平台与对象类型。", "跨文件系统移动通常不能由标准 rename 完成。", "失败后原路径通常仍在，但仍应按平台文档处理异常。"], ["remove-function", "fopen-function"]),
  make("tmpfile-function", "tmpfile", "文件 IO", "tmpfile 创建一个自动删除的临时二进制更新流。", ["stdio.h"], "需要短期读写临时数据且不关心文件名时优先用 tmpfile；判空后使用，并检查最终 fclose 的结果。", "FILE *tmpfile(void);", ["FILE *stream = tmpfile();", "if (stream == NULL) return 1;", "if (fputs(\"temporary\", stream) == EOF) { fclose(stream); return 1; }", "if (fclose(stream) == EOF) return 1;"], ["临时文件通常在关闭或程序正常结束时自动删除。", "创建位置和权限由实现选择，受限环境中可能失败。", "返回的是可读写的二进制更新流。"], ["tmpnam-function", "fclose-function"]),
  make("tmpnam-function", "tmpnam", "标准库函数", "tmpnam 生成一个调用时尚不存在的临时路径字符串。", ["stdio.h"], "只在理解竞争风险且无法用 tmpfile 时考虑 tmpnam；立即使用返回名也无法消除检查与创建之间的竞态。", "char *tmpnam(char *string);", ["char name[L_tmpnam];", "char *result = tmpnam(name);", "if (result == NULL) return 1;", "return name[0] == '\\0' ? 1 : 0;"], ["名称生成与创建分离，其他进程可能抢先占用。", "传 NULL 使用内部静态数组，后续调用会覆盖内容。", "安全临时数据应优先使用 tmpfile 或原子创建接口。"], ["tmpfile-function", "fopen-function"]),
  make("setvbuf-function", "setvbuf", "文件 IO", "setvbuf 在首次 I/O 前配置流的缓冲模式和大小。", ["stdio.h"], "打开流后、任何读写前需要控制全缓冲、行缓冲或无缓冲时调用 setvbuf；检查其非零失败值。", "int setvbuf(FILE *restrict stream, char *restrict buffer, int mode, size_t size);", ["FILE *stream = tmpfile();", "if (stream == NULL) return 1;", "char buffer[BUFSIZ];", "if (setvbuf(stream, buffer, _IOFBF, sizeof buffer) != 0) { fclose(stream); return 1; }", "if (fputs(\"x\", stream) == EOF) { fclose(stream); return 1; }", "if (fclose(stream) == EOF) return 1;"], ["自备缓冲区必须一直存在到流关闭，栈对象寿命尤其要注意。", "标准要求在该流发生其他操作之前设置缓冲策略。", "size 是请求容量，实现的内部细节仍可能不同。"], ["setbuf-function", "bufsiz-constant"]),
  make("setbuf-function", "setbuf", "文件 IO", "setbuf 为流选择全缓冲或无缓冲模式。", ["stdio.h"], "只需默认 BUFSIZ 全缓冲或完全无缓冲时可用 setbuf；若需要错误反馈、模式和容量控制就用 setvbuf。", "void setbuf(FILE *restrict stream, char *restrict buffer);", ["FILE *stream = tmpfile();", "if (stream == NULL) return 1;", "setbuf(stream, NULL);", "if (fputc('x', stream) == EOF) { fclose(stream); return 1; }", "if (fclose(stream) == EOF) return 1;"], ["传 NULL 选择无缓冲，传数组则至少需要 BUFSIZ 字节。", "函数不返回状态，需诊断配置失败时选择 setvbuf。", "自备数组的寿命必须覆盖后续流使用与关闭过程。"], ["setvbuf-function", "fflush-function"]),
  make("file-type", "FILE", "数据类型", "FILE 是 stdio.h 定义的流控制对象类型。", ["stdio.h"], "标准 I/O 接口通过 FILE 指针表示打开的流；只把它交给 stdio 函数，不复制对象内容或访问其内部成员。", "FILE *stream;", ["FILE *stream = tmpfile();", "if (stream == NULL) return 1;", "if (fclose(stream) == EOF) return 1;"], ["FILE 的结构是不透明实现细节，用户代码不应按值复制。", "每个成功打开的流都应在合适时机关闭。", "FILE 指针关闭后立即失效，不能继续传给 I/O 函数。"], ["fopen-function", "stderr-streams"]),
  make("stderr-streams", "stdin / stdout / stderr", "文件 IO", "stdin、stdout 与 stderr 是程序启动时预定义的标准流。", ["stdio.h"], "从默认输入读取用 stdin，普通结果写 stdout，诊断写 stderr；需要及时显示提示时显式刷新相应输出流。", "stdin; stdout; stderr;", ["if (fputs(\"output\\n\", stdout) == EOF) return 1;", "if (fputs(\"diagnostic\\n\", stderr) == EOF) return 1;", "if (fflush(stdout) == EOF) return 1;"], ["stdout 连终端时通常行缓冲，重定向到文件时常全缓冲。", "各标准流独立缓冲，跨流输出顺序不能只凭源码推断。", "标准流可被 freopen 重定向，不一定连接控制台。"], ["fflush-function", "freopen-function"]),
  make("eof-constant", "EOF", "数据类型", "EOF 是表示输入结束或某些 I/O 失败的负 int 常量。", ["stdio.h"], "检查字符输入、字符输出及部分字符串输出结果时与 EOF 比较；对输入还需用 feof 和 ferror 区分原因。", "#define EOF /* negative int constant expression */", ["int character = fgetc(stdin);", "if (character == EOF) {", "    return ferror(stdin) ? 1 : 0;", "}"], ["EOF 不是存入 char 后仍能可靠比较的普通字符。", "它只保证是负 int 常量，具体数值不能写死。", "块读写函数返回元素数量而不是 EOF。"], ["feof-function", "ferror-function", "getchar-function"]),
  make("bufsiz-constant", "BUFSIZ", "数据类型", "BUFSIZ 是适合标准 I/O 缓冲区的实现定义正整数。", ["stdio.h"], "为 setbuf 提供自备缓冲或选择通用 I/O 块大小时可参考 BUFSIZ；不要假定跨平台固定为某个数。", "#define BUFSIZ /* implementation-defined positive integer */", ["char buffer[BUFSIZ];", "FILE *stream = tmpfile();", "if (stream == NULL) return 1;", "if (setvbuf(stream, buffer, _IOFBF, sizeof buffer) != 0) { fclose(stream); return 1; }", "if (fclose(stream) == EOF) return 1;"], ["BUFSIZ 的值由实现决定，不代表文件系统块大小。", "在栈上放多个这类数组时仍需评估栈容量。", "它不是 fread 或 fwrite 的强制传输单位。"], ["setvbuf-function", "setbuf-function"]),
  make("seek-constants", "SEEK_SET / SEEK_CUR / SEEK_END", "数据类型", "三个 SEEK 宏指定 fseek 的偏移起点。", ["stdio.h"], "调用 fseek 时分别用标准宏表示文件开头、当前位置或文件末尾；不要用猜测的整数代替宏名。", "fseek(stream, offset, SEEK_SET /* or SEEK_CUR / SEEK_END */);", ["FILE *stream = tmpfile();", "if (stream == NULL) return 1;", "if (fseek(stream, 0L, SEEK_SET) != 0) { fclose(stream); return 1; }", "if (fseek(stream, 0L, SEEK_CUR) != 0) { fclose(stream); return 1; }", "if (fseek(stream, 0L, SEEK_END) != 0) { fclose(stream); return 1; }", "if (fclose(stream) == EOF) return 1;"], ["三个宏的实际整数值由实现决定，只应使用宏名。", "文本流配合 SEEK_END 和非零偏移的支持可能受限。", "二进制流的 SEEK_CUR 偏移以字节为单位。"], ["fseek-function", "ftell-function"]),
  make("null-stdio-constant", "NULL（stdio.h）", "数据类型", "NULL 是可由 stdio.h 或 stddef.h 提供的空指针常量宏。", ["stddef.h", "stdio.h"], "检查 fopen、tmpfile、fgets 等指针返回值时使用 NULL；包含任一保证定义它的标准头即可，不依赖具体展开形式。", "#define NULL /* implementation-defined null pointer constant */", ["FILE *stream = tmpfile();", "if (stream == NULL) return 0;", "if (fclose(stream) == EOF) return 1;"], ["stdio.h 与 stddef.h 都保证提供 NULL，重复包含不会冲突。", "NULL 的展开可以是零或其他空指针常量形式。", "可变参数中 NULL 未必具期望指针类型，必要时显式转换。"], ["file-type", "fopen-function"]),
  make("printf-specifiers", "printf 转换说明符总览", "标准库函数", "printf 格式串用转换说明和长度修饰符描述实参类型。", ["inttypes.h", "stddef.h", "stdio.h"], "编写格式串时按提升后的实参类型选说明符；整数宽度特殊时组合 hh、h、l、ll、z、j、t，长双精度用 L。", "%[flags][width][.precision][length]conversion", ["size_t size = 3U;", "intmax_t wide = INTMAX_C(9);", "if (printf(\"%d %i %u %f %e %g %x %o %c %s %p %% %zu %jd\\n\",", "    -1, 2, 3U, 1.0, 1.0, 1.0, 15U, 8U, 'A', \"text\", (void *)0, size, wide) < 0) return 1;"], ["printf 的百分号 f 接收 double，long double 要用百分号 Lf。", "hh 与 h 接收提升后的 int，再按较窄整数解释结果。", "指针用百分号 p；字面百分号必须写成双百分号。"], ["printf-width-precision", "size-t-format"]),
  make("printf-width-precision", "printf 字段宽度与精度", "标准库函数", "printf 的标志、宽度和精度控制对齐、填充与显示位数。", ["stdio.h"], "制作对齐表格或限制显示精度时设置宽度与点后精度；宽度是最小值不会截断，字符串截断要给精度。", "printf(\"%08.3f | %-10s\", value, text);", ["double value = 3.25;", "if (printf(\"%08.3f | %-10s | %.5s\\n\", value, \"name\", \"abcdef\") < 0) return 1;"], ["百分号 08.3f 表示最小宽度八、零填充和三位小数。", "负号标志使字段左对齐，并让零填充标志失效。", "字符串精度限制字节数，可能切断多字节字符序列。"], ["printf-specifiers", "printf-string-n-risk"]),
  make("printf-string-n-risk", "printf 的 %s 与 %n 风险", "常见易错点", "百分号 s 需要有效终止字符串，百分号 n 会经指针写入计数。", ["stdio.h"], "输出外部文本时固定使用百分号 s 并把文本作为参数；不要让外部内容控制格式串，也避免不必要的百分号 n。", "printf(\"%s\", untrusted_text);", ["const char *text = \"100% complete\";", "if (printf(\"%s\\n\", text) < 0) return 1;"], ["百分号 s 会读到空字符，未终止数组会导致越界读取。", "百分号 n 不输出字符，而把当前计数写入整数指针。", "攻击者控制格式串可能读取数据或借百分号 n 写内存。"], ["printf-function", "printf-width-precision"]),
  make("size-t-format", "size_t 使用 %zu", "标准库函数", "printf 输出 size_t 应使用 z 长度修饰符和无符号转换。", ["stdio.h"], "打印 sizeof 结果、数组长度或 I/O 计数等 size_t 值时使用百分号 zu；不要假定它等同 unsigned long。", "printf(\"%zu\", size_value);", ["size_t count = sizeof(double);", "if (printf(\"%zu\\n\", count) < 0) return 1;"], ["size_t 是无符号整数类型，具体底层类型随数据模型变化。", "百分号 lu 在部分平台碰巧可用，在其他平台会类型不匹配。", "scanf 读取 size_t 也用百分号 zu 并传 size_t 指针。"], ["printf-specifiers", "scanf-specifiers"]),
  make("formatted-output-return", "格式化输出返回值", "标准库函数", "printf 家族用返回值报告字符数量或编码输出失败。", ["stdio.h"], "格式化输出后先判断返回值是否为负；对 snprintf 再与容量比较，区分完整写入和截断结果。", "int count = snprintf(buffer, capacity, format, ...);", ["char buffer[5];", "int count = snprintf(buffer, sizeof buffer, \"%s\", \"abcdef\");", "if (count < 0) return 1;", "if ((size_t)count < sizeof buffer) return 1;"], ["printf 与 fprintf 返回实际写出的字符数，负值表示错误。", "snprintf 返回未截断时所需字符数，不含末尾空字符。", "返回类型是 int，极端巨大输出也要考虑表示范围。"], ["snprintf-function", "printf-function"]),
  make("scanf-specifiers", "scanf 转换说明符总览", "标准库函数", "scanf 格式说明符决定输入匹配规则和目标指针类型。", ["stdio.h"], "使用 scanf 系列时根据目标对象选 d、i、u、x、o、f、lf、c、s 或扫描集，并传完全对应的指针类型。", "%[*][width][length]conversion", ["int decimal = 0;", "unsigned hexadecimal = 0U;", "double real = 0.0;", "char word[8];", "if (sscanf(\"10 ff 2.5 ok\", \"%d %x %lf %7s\", &decimal, &hexadecimal, &real, word) != 4) return 1;", "return decimal == 10 && hexadecimal == 255U && real > 2.0 && word[0] == 'o' ? 0 : 1;"], ["scanf 的百分号 f 目标是 float，百分号 lf 目标才是 double。", "百分号 c 默认不跳空白，格式中前置空格可先消费空白。", "星号抑制赋值的字段无需目标指针，也不计入返回数。"], ["scanf-function", "scanf-field-width"]),
  make("scanf-field-width", "scanf 字段宽度", "常见易错点", "scanf 字段宽度限制单次转换最多消费的字符数。", ["stdio.h"], "用百分号 s 或扫描集写字符数组时把字段宽度设为容量减一；百分号 c 不补空字符，要按实际宽度留空间。", "char word[16]; sscanf(text, \"%15s\", word);", ["char word[16];", "if (sscanf(\"abcdefghijklmnop\", \"%15s\", word) != 1) return 1;", "return word[14] == 'o' && word[15] == '\\0' ? 0 : 1;"], ["字符串转换会另写空字符，所以宽度必须小于容量。", "字段宽度限制消费字符数，不验证输入是否还有尾随内容。", "宽度不能修复让用户输入直接控制格式串的漏洞。"], ["scanf-specifiers", "scanf-scanset"]),
  make("scanf-scanset", "scanf 扫描集 %[ ]", "标准库函数", "扫描集转换读取属于或不属于指定集合的连续输入。", ["stdio.h"], "解析简单分隔字段时用百分号方括号选择允许字符；始终给容量宽度，并单独处理分隔符和空字段。", "sscanf(text, \"%15[^,]\", field);", ["char field[16];", "if (sscanf(\"alpha,beta\", \"%15[^,]\", field) != 1) return 1;", "return field[0] == 'a' && field[5] == '\\0' ? 0 : 1;"], ["脱字符紧跟左方括号时表示读取不在集合中的字符。", "右方括号若作为成员，必须放在格式规则允许的位置。", "扫描集至少匹配一个字符才算转换成功。"], ["sscanf-function", "scanf-field-width"]),
  make("text-binary-streams", "文本流与二进制流", "文件 IO", "C 标准区分可发生字符转换的文本流和保持字节的二进制流。", ["stdio.h"], "跨平台文本使用文本模式和换行字符；保存图片或协议字节时在 fopen 模式加入 b 并使用块 I/O。", "fopen(path, \"r\"); /* text */  fopen(path, \"rb\"); /* binary */", ["FILE *stream = tmpfile();", "if (stream == NULL) return 1;", "unsigned char byte = 0x0AU;", "if (fwrite(&byte, 1U, 1U, stream) != 1U) { fclose(stream); return 1; }", "if (fclose(stream) == EOF) return 1;"], ["Windows 文本模式常在外部 CRLF 与换行字符间转换。", "二进制流保证字节不因文本行结束规则改变。", "文本流的 ftell 结果可能只是可传回 fseek 的标记。"], ["fopen-function", "fread-function", "fwrite-function"])
  ];

  var entries = [
  {
    "id": "printf-function",
    "name": "printf",
    "aliases": [
      "格式化输出",
      "打印",
      "PRINTF"
    ],
    "category": "标准库函数",
    "summary": "printf 按格式字符串把文本和转换后的参数写到标准输出。",
    "syntax": "int printf(const char *restrict format, ...);",
    "headers": [
      "stdio.h"
    ],
    "usage": "“printf”适合在标准库函数相关场景中使用；先确认前置条件，再按所示语法与完整示例组合到程序中。",
    "example": "#include <stdio.h>\n\nint main(void) {\n    int value = 42;\n    printf(\"value = %d\\n\", value);\n    return 0;\n}\n",
    "notes": [
      "转换说明必须与对应实参类型匹配，并检查不可信字符串不要直接作为格式。",
      "使用前应核对操作对象的类型、有效范围与当前生命周期。",
      "组合到较大程序时应检查编译器告警，并覆盖失败或边界路径。"
    ],
    "related": [
      "scanf-function",
      "puts-function"
    ]
  },
  {
    "id": "scanf-function",
    "name": "scanf",
    "aliases": [
      "格式化输入",
      "读取标准输入"
    ],
    "category": "标准库函数",
    "summary": "scanf 按格式从标准输入读取并转换数据，返回成功赋值的项目数。",
    "syntax": "int scanf(const char *restrict format, ...);",
    "headers": [
      "stdio.h"
    ],
    "usage": "“scanf”适合在标准库函数相关场景中使用；先确认前置条件，再按所示语法与完整示例组合到程序中。",
    "example": "#include <stdio.h>\n\nint main(void) {\n    int value = 0;\n    if (scanf(\"%d\", &value) == 1) {\n        printf(\"%d\\n\", value);\n    }\n    return 0;\n}\n",
    "notes": [
      "除数组外通常要传入对象地址，并检查返回值。",
      "使用前应核对操作对象的类型、有效范围与当前生命周期。",
      "组合到较大程序时应检查编译器告警，并覆盖失败或边界路径。"
    ],
    "related": [
      "printf-function",
      "address-operator"
    ]
  },
  {
    "id": "puts-function",
    "name": "puts",
    "aliases": [
      "输出字符串",
      "打印一行"
    ],
    "category": "标准库函数",
    "summary": "puts 把空字符结尾字符串写到标准输出，并追加换行。",
    "syntax": "int puts(const char *string);",
    "headers": [
      "stdio.h"
    ],
    "usage": "“puts”适合在标准库函数相关场景中使用；先确认前置条件，再按所示语法与完整示例组合到程序中。",
    "example": "#include <stdio.h>\n\nint main(void) {\n    puts(\"hello, C\");\n    return 0;\n}\n",
    "notes": [
      "puts 不解释格式说明，输出失败时返回 EOF。",
      "使用前应核对操作对象的类型、有效范围与当前生命周期。",
      "组合到较大程序时应检查编译器告警，并覆盖失败或边界路径。"
    ],
    "related": [
      "printf-function",
      "fputs-function"
    ]
  },
  {
    "id": "getchar-function",
    "name": "getchar",
    "aliases": [
      "读取字符",
      "标准输入"
    ],
    "category": "标准库函数",
    "summary": "getchar 从标准输入读取下一个字节，并以 int 返回以便表示 EOF。",
    "syntax": "int getchar(void);",
    "headers": [
      "stdio.h"
    ],
    "usage": "“getchar”适合在标准库函数相关场景中使用；先确认前置条件，再按所示语法与完整示例组合到程序中。",
    "example": "#include <stdio.h>\n\nint main(void) {\n    int character = getchar();\n    if (character != EOF) {\n        printf(\"%c\\n\", character);\n    }\n    return 0;\n}\n",
    "notes": [
      "返回值必须先保存在 int 中，不能直接存入 char 后再与 EOF 比较。",
      "使用前应核对操作对象的类型、有效范围与当前生命周期。",
      "组合到较大程序时应检查编译器告警，并覆盖失败或边界路径。"
    ],
    "related": [
      "fgets-function"
    ]
  },
  {
    "id": "fopen-function",
    "name": "fopen",
    "aliases": [
      "打开文件",
      "file open",
      "文件 IO"
    ],
    "category": "文件 IO",
    "summary": "fopen 按模式打开文件并返回流指针，失败时返回空指针。",
    "syntax": "FILE *fopen(const char *restrict path, const char *restrict mode);",
    "headers": [
      "stdio.h"
    ],
    "usage": "“fopen”适合在文件 IO相关场景中使用；先确认前置条件，再按所示语法与完整示例组合到程序中。",
    "example": "#include <stdio.h>\n\nint main(void) {\n    FILE *file = fopen(\"sample.txt\", \"w\");\n    if (file == NULL) return 1;\n    fputs(\"C11\\n\", file);\n    fclose(file);\n    return 0;\n}\n",
    "notes": [
      "文本与二进制模式在部分系统上行为不同；始终检查返回值。",
      "使用前应核对操作对象的类型、有效范围与当前生命周期。",
      "组合到较大程序时应检查编译器告警，并覆盖失败或边界路径。"
    ],
    "related": [
      "fclose-function",
      "fputs-function"
    ]
  },
  {
    "id": "fclose-function",
    "name": "fclose",
    "aliases": [
      "关闭文件",
      "close stream"
    ],
    "category": "文件 IO",
    "summary": "fclose 刷新缓冲数据并关闭流，返回值可报告失败。",
    "syntax": "int fclose(FILE *stream);",
    "headers": [
      "stdio.h"
    ],
    "usage": "“fclose”适合在文件 IO相关场景中使用；先确认前置条件，再按所示语法与完整示例组合到程序中。",
    "example": "#include <stdio.h>\n\nint main(void) {\n    FILE *file = tmpfile();\n    if (file == NULL) return 1;\n    if (fclose(file) == EOF) return 1;\n    return 0;\n}\n",
    "notes": [
      "关闭后流指针不再有效，不应再次使用或关闭。",
      "使用前应核对操作对象的类型、有效范围与当前生命周期。",
      "组合到较大程序时应检查编译器告警，并覆盖失败或边界路径。"
    ],
    "related": [
      "fopen-function"
    ]
  },
  {
    "id": "fprintf-function",
    "name": "fprintf",
    "aliases": [
      "文件格式化输出",
      "写文件"
    ],
    "category": "文件 IO",
    "summary": "fprintf 按格式把文本写入指定流。",
    "syntax": "int fprintf(FILE *restrict stream, const char *restrict format, ...);",
    "headers": [
      "stdio.h"
    ],
    "usage": "“fprintf”适合在文件 IO相关场景中使用；先确认前置条件，再按所示语法与完整示例组合到程序中。",
    "example": "#include <stdio.h>\n\nint main(void) {\n    FILE *file = tmpfile();\n    if (file == NULL) return 1;\n    if (fprintf(file, \"%d\\n\", 42) < 0) { fclose(file); return 1; }\n    fclose(file);\n    return 0;\n}\n",
    "notes": [
      "检查返回值可发现写入错误，关闭文件时也可能报告延迟错误。",
      "使用前应核对操作对象的类型、有效范围与当前生命周期。",
      "组合到较大程序时应检查编译器告警，并覆盖失败或边界路径。"
    ],
    "related": [
      "fscanf-function",
      "printf-function"
    ]
  },
  {
    "id": "fscanf-function",
    "name": "fscanf",
    "aliases": [
      "文件格式化输入",
      "读文件"
    ],
    "category": "文件 IO",
    "summary": "fscanf 按格式从指定流读取并转换输入。",
    "syntax": "int fscanf(FILE *restrict stream, const char *restrict format, ...);",
    "headers": [
      "stdio.h"
    ],
    "usage": "“fscanf”适合在文件 IO相关场景中使用；先确认前置条件，再按所示语法与完整示例组合到程序中。",
    "example": "#include <stdio.h>\n\nint main(void) {\n    FILE *file = tmpfile();\n    if (file == NULL) return 1;\n    fputs(\"17\", file);\n    rewind(file);\n    int value = 0;\n    if (fscanf(file, \"%d\", &value) == 1) printf(\"%d\\n\", value);\n    fclose(file);\n    return 0;\n}\n",
    "notes": [
      "检查成功转换数量；读取字符串时要限制最大字段宽度。",
      "使用前应核对操作对象的类型、有效范围与当前生命周期。",
      "组合到较大程序时应检查编译器告警，并覆盖失败或边界路径。"
    ],
    "related": [
      "fprintf-function",
      "scanf-function"
    ]
  },
  {
    "id": "fgets-function",
    "name": "fgets",
    "aliases": [
      "读取一行",
      "文件读取",
      "缓冲区"
    ],
    "category": "文件 IO",
    "summary": "fgets 从流读取至多容量减一字符，并在成功时补上空字符。",
    "syntax": "char *fgets(char *restrict buffer, int size, FILE *restrict stream);",
    "headers": [
      "stdio.h"
    ],
    "usage": "“fgets”适合在文件 IO相关场景中使用；先确认前置条件，再按所示语法与完整示例组合到程序中。",
    "example": "#include <stdio.h>\n\nint main(void) {\n    FILE *file = tmpfile();\n    if (file == NULL) return 1;\n    fputs(\"line\\n\", file);\n    rewind(file);\n    char buffer[16];\n    if (fgets(buffer, (int)sizeof buffer, file) != NULL) fputs(buffer, stdout);\n    fclose(file);\n    return 0;\n}\n",
    "notes": [
      "若读到换行且容量足够，换行会保留在缓冲区中。",
      "使用前应核对操作对象的类型、有效范围与当前生命周期。",
      "组合到较大程序时应检查编译器告警，并覆盖失败或边界路径。"
    ],
    "related": [
      "fputs-function",
      "getchar-function"
    ]
  },
  {
    "id": "fputs-function",
    "name": "fputs",
    "aliases": [
      "写字符串",
      "文件写入"
    ],
    "category": "文件 IO",
    "summary": "fputs 把字符串写入指定流，但不会自动追加换行。",
    "syntax": "int fputs(const char *restrict string, FILE *restrict stream);",
    "headers": [
      "stdio.h"
    ],
    "usage": "“fputs”适合在文件 IO相关场景中使用；先确认前置条件，再按所示语法与完整示例组合到程序中。",
    "example": "#include <stdio.h>\n\nint main(void) {\n    FILE *file = tmpfile();\n    if (file == NULL) return 1;\n    if (fputs(\"hello\\n\", file) == EOF) { fclose(file); return 1; }\n    fclose(file);\n    return 0;\n}\n",
    "notes": [
      "需要换行时应在字符串中显式包含换行字符。",
      "使用前应核对操作对象的类型、有效范围与当前生命周期。",
      "组合到较大程序时应检查编译器告警，并覆盖失败或边界路径。"
    ],
    "related": [
      "fgets-function",
      "puts-function"
    ]
  },
  {
    "id": "fseek-function",
    "name": "fseek 与 ftell",
    "aliases": [
      "文件定位",
      "随机访问",
      "seek"
    ],
    "category": "文件 IO",
    "summary": "fseek 改变流位置，ftell 获取当前文件位置指示器。",
    "syntax": "int fseek(FILE *stream, long offset, int origin);\nlong ftell(FILE *stream);",
    "headers": [
      "stdio.h"
    ],
    "usage": "“fseek 与 ftell”适合在文件 IO相关场景中使用；先确认前置条件，再按所示语法与完整示例组合到程序中。",
    "example": "#include <stdio.h>\n\nint main(void) {\n    FILE *file = tmpfile();\n    if (file == NULL) return 1;\n    fputs(\"abc\", file);\n    if (fseek(file, 0L, SEEK_END) != 0) { fclose(file); return 1; }\n    long size = ftell(file);\n    if (size >= 0L) printf(\"%ld\\n\", size);\n    fclose(file);\n    return 0;\n}\n",
    "notes": [
      "文本流只保证对先前由 ftell 获得的位置可靠定位。",
      "使用前应核对操作对象的类型、有效范围与当前生命周期。",
      "组合到较大程序时应检查编译器告警，并覆盖失败或边界路径。"
    ],
    "related": [
      "fopen-function"
    ]
  }
  ];

  function revise(id, usage, notes, body) {
    var entry = entries.find(function (candidate) { return candidate.id === id; });
    entry.usage = usage;
    entry.notes = notes;
    if (body) entry.example = program(entry.headers, body);
  }

  revise("printf-function", "向标准输出组合文字与多个类型值时使用 printf；格式说明逐项匹配实参，并以负返回值判断写入失败。",
    ["格式说明与实参类型不匹配会产生未定义行为。", "不可信文本应作为百分号 s 的参数，不能直接充当格式串。", "成功返回写出的字符数，末尾空字符不计入数量。"],
    ["int value = 42;", "if (printf(\"value = %d\\n\", value) < 0) return 1;"]);
  revise("scanf-function", "读取受控的简单标准输入时可用 scanf；除数组外传对象地址，给字符串指定宽度，并核对成功赋值数量。",
    ["返回值是成功赋值项目数，首次转换前输入失败才返回 EOF。", "百分号 s 不设字段宽度可能写穿目标字符数组。", "复杂数值解析宜用 fgets 配合 strtol，以便细分错误。"],
    ["int value = 0;", "if (scanf(\"%d\", &value) == 1) {", "    return value == 0 ? 0 : 1;", "}"]);
  revise("puts-function", "输出无需格式转换的一整行文本时使用 puts；不要在字符串末尾再放换行，并用 EOF 检查输出失败。",
    ["puts 不解析百分号，因此固定文本比 printf 更直接。", "输入必须指向以空字符结尾的有效字符串。", "函数一定尝试追加换行，不能保持片段原样。"],
    ["if (puts(\"hello, C\") == EOF) return 1;"]);
  revise("getchar-function", "逐字节扫描标准输入时使用 getchar；先保存为 int 并与 EOF 比较，通过后才能转换为字符类型。",
    ["用 int 保存结果才能同时容纳全部字节值与 EOF。", "EOF 不能区分正常结束和读取错误，应查询 ferror(stdin)。", "文本模式可能把平台行结束序列转换成换行字符。"],
    ["int character = getchar();", "if (character == EOF) return 0;", "return putchar(character) == EOF ? 1 : 0;"]);
  revise("fopen-function", "确需访问具名文件时使用 fopen；选择正确的读写及文本二进制模式，立即判 NULL，并保证成功路径关闭流。",
    ["打开失败返回 NULL，具体原因可由 errno 和 perror 诊断。", "Windows 文本模式可能转换换行与文件结束表示。", "模式中的 b 在部分系统无效果，但对跨平台二进制数据重要。"],
    ["FILE *stream = fopen(\"path-that-should-not-exist.tmp\", \"rb\");", "if (stream != NULL) {", "    if (fclose(stream) == EOF) return 1;", "}"]);
  revise("fclose-function", "不再使用已打开流时调用 fclose；即使此前写入成功也检查返回值，以捕获最终刷新阶段的错误。",
    ["关闭后 FILE 指针失效，再访问或二次关闭都是错误。", "成功返回零，失败返回 EOF。", "缓冲写入错误可能直到 fclose 才被报告。"],
    ["FILE *stream = tmpfile();", "if (stream == NULL) return 1;", "if (fclose(stream) == EOF) return 1;"]);
  revise("fprintf-function", "需要把格式化内容发送到文件流或 stderr 时使用 fprintf；传入有效 FILE 指针，并检查写入与关闭结果。",
    ["第一个参数决定目标流，stderr 常用于诊断信息。", "写入错误可能延迟到刷新或关闭时才暴露。", "格式串规则与 printf 相同，参数类型仍须对应。"],
    ["FILE *stream = tmpfile();", "if (stream == NULL) return 1;", "if (fprintf(stream, \"%s %d\\n\", \"item\", 7) < 0) { fclose(stream); return 1; }", "if (fclose(stream) == EOF) return 1;"]);
  revise("fscanf-function", "从结构固定的文本流读取少量字段时使用 fscanf；检查返回项目数，并在失败后结合 feof 与 ferror 判断原因。",
    ["空白格式字符会消费任意数量空白，交互时可能继续等待。", "转换失败字符通常留在流中，循环不能原地反复重试。", "字符串转换必须设置不超过数组容量减一的宽度。"],
    ["FILE *stream = tmpfile();", "if (stream == NULL) return 1;", "if (fputs(\"17\", stream) == EOF) { fclose(stream); return 1; }", "rewind(stream);", "int value = 0;", "if (fscanf(stream, \"%d\", &value) != 1) { fclose(stream); return 1; }", "if (fclose(stream) == EOF) return 1;", "return value == 17 ? 0 : 1;"]);
  revise("fgets-function", "按行读取文本时优先使用 fgets；传真实数组容量，检查空指针结果，并判断换行是否读入以识别长行。",
    ["容量足够时，读到的换行会保存在目标数组中。", "返回 NULL 可能是文件结束，也可能是读取错误。", "size 小于等于一的边界行为不适合通用代码依赖。"],
    ["FILE *stream = tmpfile();", "if (stream == NULL) return 1;", "if (fputs(\"line\\n\", stream) == EOF) { fclose(stream); return 1; }", "rewind(stream);", "char buffer[16];", "if (fgets(buffer, (int)sizeof buffer, stream) == NULL) { fclose(stream); return 1; }", "if (fclose(stream) == EOF) return 1;"]);
  revise("fputs-function", "向文件或 stdout 写入原样字符串片段时使用 fputs；需要换行就显式写入，并以 EOF 识别错误。",
    ["fputs 不会把字符串结尾的空字符写入流。", "字符串和流指针都必须在调用期间保持有效。", "成功只保证返回非负值，不能假定等于写入长度。"],
    ["FILE *stream = tmpfile();", "if (stream == NULL) return 1;", "if (fputs(\"hello\\n\", stream) == EOF) { fclose(stream); return 1; }", "if (fclose(stream) == EOF) return 1;"]);
  revise("fseek-function", "对可定位流进行随机访问时使用 fseek；二进制流可用字节偏移，文本流通常只用零或 ftell 返回的位置。",
    ["成功定位会清除文件结束指示器，并撤销 ungetc 效果。", "文本流任意数值偏移不可移植，Windows 换行转换尤其明显。", "返回非零表示失败，不能继续假设位置已经改变。"],
    ["FILE *stream = tmpfile();", "if (stream == NULL) return 1;", "if (fputs(\"abc\", stream) == EOF) { fclose(stream); return 1; }", "if (fseek(stream, 0L, SEEK_END) != 0) { fclose(stream); return 1; }", "long size = ftell(stream);", "if (fclose(stream) == EOF) return 1;", "return size < 0L ? 1 : 0;"]);

  extraEntries.find(function (entry) { return entry.id === "printf-specifiers"; }).example = program(
    ["inttypes.h", "stddef.h", "stdio.h"],
    ["size_t size = 3U;", "intmax_t wide = INTMAX_C(9);", "int (*printer)(const char *, ...) = printf;",
      "if (printer(\"%d %i %u %f %e %g %x %o %c %s %p %% %zu %jd\\n\",",
      "    -1, 2, 3U, 1.0, 1.0, 1.0, 15U, 8U, 'A', \"text\", (void *)0, size, wide) < 0) return 1;"]);
  extraEntries.find(function (entry) { return entry.id === "size-t-format"; }).example = program(
    ["stdio.h"], ["size_t count = sizeof(double);", "int (*printer)(const char *, ...) = printf;",
      "if (printer(\"%zu\\n\", count) < 0) return 1;"]);
  extraEntries.find(function (entry) { return entry.id === "remove-function"; }).example = program(
    ["stdio.h"], ["if (0) {", "    (void)remove(\"example.tmp\");", "}"]);
  extraEntries.find(function (entry) { return entry.id === "rename-function"; }).example = program(
    ["stdio.h"], ["if (0) {", "    (void)rename(\"old.tmp\", \"new.tmp\");", "}"]);

  var behaviors = {
    "printf-function": "把数据按格式字符串的要求转换成文字，再写到标准输出 stdout。格式中的 `%d`、`%s` 等转换说明会依次取用后面的参数；说明符与参数类型不一致会造成未定义行为，也就是 C 标准不规定会发生什么。成功时返回实际写出的字符数，不包含字符串结尾的空字符；输出或编码失败时返回负数。",
    "scanf-function": "从标准输入 stdin 读取文字，并按格式说明把匹配内容转换后写进调用者提供的变量。除字符数组等少数情况外，参数必须是变量地址；`%s` 还必须给出字段宽度以免写出数组。返回成功赋值的项目数；第一个字段就不匹配时返回 0；在任何转换成功前遇到文件结束或读取错误时返回 EOF。",
    "puts-function": "把一个以空字符 `\\0` 结尾的字符串原样写到标准输出，并在末尾自动再写一个换行，所以传入的文字通常不必自带换行。它不解释字符串里的百分号。写入成功时返回非负数，但该数不保证等于字符数；写入失败时返回 EOF。传入空指针或没有结尾空字符的数组会产生未定义行为。",
    "getchar-function": "从标准输入读取下一个字节，常用于逐字符处理键盘或重定向输入。读到普通字节时，先把它当作 unsigned char 再提升为 int 返回，因此结果非负；到达文件末尾或发生读取错误时都返回 EOF。必须用 int 接收，再用 feof(stdin) 与 ferror(stdin) 区分正常结束和错误，不能先存进 char。",
    "fopen-function": "按 path 指定的路径和 mode 指定的模式打开文件，并建立一个 FILE 流；FILE 流是标准库保存文件位置、缓冲和错误状态的控制对象。成功时返回可供后续读写的 `FILE *`，用完必须 fclose；打开失败时返回 NULL，并设置 errno 供 perror 等取得原因。模式不合法、文件不存在或权限不足都可能失败。",
    "fclose-function": "结束一个已打开的流：先把尚在缓冲区中的输出尝试写出，再释放该 FILE 对象及相关资源。全部成功时返回 0；刷新或关闭失败时返回 EOF，因此先前写入看似成功也仍要检查这里。无论返回什么，原 FILE 指针都不能再使用或再次关闭；把无效指针传入会产生未定义行为。",
    "fprintf-function": "把参数按格式字符串转换成文字，并写入第一个参数指定的 FILE 流，规则与 printf 相同，只是目标可为文件、stdout 或 stderr。成功时返回写出的字符数，不含任何字符串结尾空字符；输出或编码出错时返回负数。格式说明与实参类型不一致，或 stream 不是有效可写流，会导致错误或未定义行为。",
    "fscanf-function": "从指定 FILE 流取得文字，按格式匹配并把转换结果写入后续指针所指的对象。返回成功赋值的项目数；首个可转换内容不匹配时返回 0；尚未完成任何转换就到达文件末尾或发生读取错误时返回 EOF。字符串转换必须限制宽度，失败后还要用 feof 和 ferror 判断是正常结束还是 I/O 错误。",
    "fgets-function": "从指定流最多读取 `size - 1` 个字符到 buffer，遇到换行或文件结束会提前停止；读到的换行会保留，随后补上空字符 `\\0` 作为字符串结尾。只要成功取得至少一个字符就返回 buffer；在读到任何字符前遇到文件结束或读取错误则返回 NULL。调用者应提供有效数组并让 size 大于 1，不依赖更小容量的边界行为。",
    "fputs-function": "把以空字符结尾的 string 写到指定流，但不写结尾空字符，也不会像 puts 那样自动加换行。成功时返回非负数，具体数值不保证是长度；失败时返回 EOF。string 必须是完整有效的字符串，stream 必须可写；实际设备错误还可能延迟到 fflush 或 fclose 时才报告。",
    "fseek-function": "改变流的当前位置，offset 表示相对 origin 的偏移；origin 可用 SEEK_SET、SEEK_CUR 或 SEEK_END 表示开头、当前位置或末尾。fseek 成功返回 0，并清除文件结束标志；失败返回非零，位置不能假定已改变。ftell 成功返回可保存并交回 fseek 的 long 位置值，失败返回 -1L；文本流的位置未必等于字节数。",
    "sprintf-function": "把格式化结果写入 buffer，并在末尾追加空字符，而不是输出到文件。它没有容量参数，会依次展开格式说明和参数；目标空间不足就越界写入，属于未定义行为。成功时返回生成的字符数，不含末尾空字符；编码错误时返回负数。只有能严格证明数组足够大时才能用，通常应改用 snprintf。",
    "snprintf-function": "把格式化文字写进容量为 size 的 buffer，最多存放 `size - 1` 个可见字符并在 size 大于 0 时补空字符；超出的部分被截断。成功时返回假如空间无限本来需要的字符数，不含末尾空字符，所以返回值大于等于 size 就表示截断；编码错误返回负数。size 为 0 时不写数据，buffer 可以是 NULL，可用来查询所需长度。",
    "vprintf-function": "把 va_list 参数列表按 format 格式写到标准输出；va_list 是可变参数函数用来逐项访问省略号实参的状态对象。它和 printf 的输出规则相同。成功时返回写出的字符数，输出或编码失败时返回负数。调用方要先 va_start、最后 va_end；同一列表若还要再用，必须在调用前用 va_copy 复制。",
    "vfprintf-function": "把 va_list 中的参数按格式转换后写入指定 FILE 流，适合让日志包装函数转发自己收到的可变参数。成功时返回实际写出的字符数；输出或编码错误时返回负数。stream 必须有效且可写，格式与列表中的真实类型必须对应；创建参数列表的一方仍负责 va_end，重复遍历前要 va_copy。",
    "vsprintf-function": "从 va_list 依次取得参数，按 format 生成字符串写入 buffer，并补上结尾空字符。它不知道 buffer 的容量，展开结果放不下时会越界写入并产生未定义行为。成功时返回生成的字符数，不含末尾空字符；编码错误时返回负数。调用之后该 va_list 的状态不可移植，需要再次使用时应预先 va_copy。",
    "vsnprintf-function": "从 va_list 生成格式化字符串，并把写入限制在 buffer 的 size 个字节内；size 大于 0 时结果始终用空字符结束。成功时返回未截断情况下需要的字符数，不含结尾空字符，因此返回值大于等于 size 表示发生截断；编码错误返回负数。size 为 0 时可只计算长度，再次生成前必须重建或复制 va_list。",
    "putchar-function": "把参数 c 转成 unsigned char 对应的单个字节，再写到标准输出 stdout；它处理的是一个字符值，不是字符串。成功时返回刚写入的字节提升为 int 后的值；写入失败时返回 EOF。因为 EOF 也是 int 范围中的特殊负值，调用者应直接检查返回值，换行则需要另写一次 `putchar('\\n')`。",
    "putc-function": "把 c 转成 unsigned char 后写入指定 FILE 流；它可能由实现定义成宏，所以 stream 表达式应简单且没有自增等副作用。成功时返回所写字节提升为 int 后的值，失败时返回 EOF。它一次只写一个字节，大块数据更适合 fwrite；stream 无效或不可写时不能继续依赖结果。",
    "fputc-function": "把 c 的低位 unsigned char 值作为一个字节写入指定流，功能与 putc 相近但保证是函数接口。成功时返回实际写入字节提升为 int 后的值，并不是写入数量；失败时返回 EOF。二进制流可用它写 0 到 UCHAR_MAX 的任意字节，连续大量写入则通常应改用 fwrite。",
    "fwrite-function": "从 pointer 指向的内存开始，向 stream 写出 count 个对象，每个对象占 size 字节；它按原始字节复制，不理解字符串、结构体字段或结尾空字符。返回完整写出的对象个数，等于 count 才表示全部完成；较小值表示短写，可用 ferror 查错。size 或 count 为 0 时不访问数组并返回 0，其他情况下源区域必须足够大。",
    "sscanf-function": "从已经在内存中的字符串读取内容，按 format 匹配并把转换结果写到后续指针所指对象，不会读取 stdin。返回成功赋值的项目数；首个字段不匹配时返回 0；字符串在第一次转换完成前已经结束时返回 EOF。`%s` 和扫描集要设置不超过数组容量减一的宽度，格式与目标指针类型必须准确对应。",
    "gets-removed": "历史上的 gets 会从标准输入读一行到 buffer、丢弃换行并补空字符；成功原本返回 buffer，文件结束或错误时返回 NULL。但它完全没有容量参数，任何过长输入都能越界写入，所以 C11 已删除该函数，现代程序不能调用。替代方案是传入真实数组容量的 fgets，并自行处理它保留的换行。",
    "getc-function": "从指定 FILE 流读取下一个字节；它可能实现为宏，因此 stream 参数不要写成会产生副作用的复杂表达式。成功时返回该字节先转成 unsigned char、再提升为 int 的非负值；到达文件末尾或发生读取错误时返回 EOF。结果必须先保存在 int 中，再用 feof 或 ferror 区分两种 EOF 原因。",
    "fgetc-function": "从指定 FILE 流读取下一个字符，作用与 getc 相同但以函数形式提供。读到字节时返回其 unsigned char 值提升成的非负 int；文件结束或读取错误都返回 EOF。若先转成 char 再比较 EOF，某些有效字节可能被误判，因此要用 int 接收，并在 EOF 后查询 feof 与 ferror。",
    "ungetc-function": "把一个字符推回输入流，使下一次字符读取先得到它，常用于解析器多看了一个分隔符后退一步。成功时返回被推回的字符值，并清除该流的文件结束标志；失败返回 EOF。参数 c 本身若是 EOF 必然失败，标准只保证至少能连续推回一个字符，定位、读取或其他操作可能取消推回内容。",
    "fread-function": "从 stream 读取 count 个对象到 pointer 指向的内存，每个对象占 size 字节；它按原始字节工作，不补字符串结束符。返回完整读到的对象个数；小于 count 可能是文件结束，也可能是读取错误，必须结合 feof 和 ferror 判断。size 或 count 为 0 时返回 0 且不访问目标，其余情况下只能使用返回数量范围内的新数据。",
    "freopen-function": "先处理已有 stream，再让它按 filename 和 mode 重新关联文件，常用于重定向 stdin、stdout 或 stderr。成功时返回重新打开后的 FILE 指针，后续应使用这个返回值；失败返回 NULL，原流与文件的关联已经失效，不能继续使用旧指针。filename 为 NULL 的改模式形式是否支持由实现决定。",
    "fflush-function": "把输出流缓冲区中尚未提交的数据交给宿主环境；传具体 stream 处理一个输出流，传 NULL 会处理所有已打开的输出流。全部成功返回 0，写入出错返回 EOF。它只刷新 C 库缓冲，不保证物理磁盘已经持久化；对输入流调用在 ISO C 中没有“清空键盘输入”的含义。",
    "ftell-function": "取得 stream 的当前位置表示，便于稍后恢复或配合 fseek 计算位置。成功时返回一个非负 long 值；失败时返回 -1L，并可能设置 errno。二进制流中它通常是从文件开头算的字节偏移，文本流中则可能只是一个不透明标记，只保证可原样交给 fseek，不能总当作文件字节数。",
    "rewind-function": "把可定位流移回文件开头，同时清除该流的文件结束标志和错误标志，效果近似 `fseek(stream, 0, SEEK_SET)` 后再 clearerr。它没有返回值，因此无法直接报告定位失败；若程序必须知道是否成功，应改用会返回状态的 fseek。对管道等不可定位的流调用后，不能假定位置真的改变。",
    "fgetpos-function": "把 stream 当前的完整位置状态保存到 position 指向的 fpos_t 对象；fpos_t 是实现定义的位置类型，可能还包含多字节字符转换状态。成功返回 0，失败返回非零并可能设置 errno。目标必须可写，保存值只应在同一个仍打开的流上交给 fsetpos，不能把它当普通整数计算。",
    "fsetpos-function": "把 stream 恢复到此前由 fgetpos 为同一流保存的位置，并同时恢复该位置相关的多字节转换状态；成功还会清除文件结束标志并撤销 ungetc 的推回效果。成功返回 0，失败返回非零并可能设置 errno。position 必须来自同一打开流且仍有效，不能自行拼造或跨文件复用。",
    "feof-function": "检查 stream 的文件结束指示器是否已经被先前的读取操作置位。指示器已置位时返回非零值，否则返回 0；它不会预先判断下一次读取是否到末尾，所以循环应先尝试读取，再在失败后调用 feof。返回 0 也可能是读取错误，此时要另查 ferror；定位或 clearerr 可以清除此标志。",
    "ferror-function": "检查 stream 的错误指示器是否已被先前的输入输出操作置位。存在错误时返回非零值，没有记录错误时返回 0；返回 0 不代表一定还有数据，因为文件结束由 feof 单独表示。该函数只读取状态，不会清除它，若要继续使用流需在处理原因后调用 clearerr 或执行合适的重新定位。",
    "clearerr-function": "同时清除 stream 上保存的文件结束指示器和错误指示器，让后续 I/O 可以重新报告状态。它不移动文件位置、不修复磁盘或设备故障，也不会丢弃输入数据。函数没有返回值，因此调用后只能通过新的读写操作及 feof、ferror 判断是否恢复；stream 必须仍是有效的打开流。",
    "perror-function": "把可选前缀 string、冒号分隔符以及当前 errno 对应的错误说明写到标准错误流 stderr，末尾再写换行；errno 是许多库调用失败后保存错误编号的全局机制。函数没有返回值，无法直接判断诊断是否写出成功。传 NULL 或空字符串时只输出错误说明，调用前应保留真正失败操作留下的 errno。",
    "remove-function": "按 filename 删除一个文件；实现也可能允许它删除空目录。删除成功时返回 0，失败时返回非零值，并可能设置 errno 说明不存在、权限不足或文件正被占用等原因。成功后该名称不再指向原文件，但已经打开的流如何受影响取决于宿主系统；传空指针会产生未定义行为。",
    "rename-function": "把文件或目录名称从 old_name 改为 new_name，通常不会复制文件内容。成功时返回 0，原名称随后不再有效；失败时返回非零值并可能设置 errno，此时不能假定已完成一半改名。若 new_name 已存在会怎样由实现和宿主系统规则决定，因此需要可移植代码时应事先设计冲突处理。",
    "tmpfile-function": "创建一个临时二进制更新流，也就是既可读又可写的临时文件，并安排在关闭或程序正常结束时自动删除。成功时返回可用的 `FILE *`，失败返回 NULL。名称由实现管理，调用者通常看不到路径；仍要检查写入、定位和 fclose 的返回值，异常终止时是否清理由宿主环境决定。",
    "tmpnam-function": "生成一个调用当时尚未对应现有文件的临时路径名，但并不同时创建文件。传入数组时成功返回该数组指针并写入名称；传 NULL 时成功返回内部静态数组指针，后续调用可能覆盖它；无法生成时返回 NULL。检查名称到真正创建文件之间存在竞态，其他程序可能抢先占用，因此优先用 tmpfile。",
    "setvbuf-function": "在流进行任何其他 I/O 之前设置缓冲方式：`_IOFBF` 为全缓冲、`_IOLBF` 为行缓冲、`_IONBF` 为无缓冲，并可提供 buffer 与 size。设置成功返回 0，无法采用请求时返回非零。自备缓冲区必须一直存活到流关闭；该调用只配置策略，不会返回实际采用的内部容量。",
    "setbuf-function": "用简化接口为 stream 选择缓冲方式：buffer 为 NULL 时请求无缓冲，否则用至少 BUFSIZ 字节的数组作为全缓冲区。它必须在该流执行其他操作前调用，而且自备数组要一直存在到流关闭。函数没有返回值，无法报告配置失败；需要状态、行缓冲或自定义大小时应改用 setvbuf。",
    "file-type": "表示一个已经建立的标准 I/O 流控制对象，内部记录当前位置、缓冲区、文件结束和错误状态等信息；这些成员是不透明的，程序只能持有 `FILE *` 并交给 stdio 函数。打开函数成功会返回这种指针，关闭后指针立即失效。不能按值复制 FILE、猜测内部布局或在多个函数中重复关闭同一流。",
    "stderr-streams": "程序启动时预先提供三个 FILE 流：stdin 是默认输入，stdout 承载普通结果，stderr 承载诊断信息。它们可能连接终端，也可能被重定向到文件或管道；stdout 常按环境选择行缓冲或全缓冲，stderr 的行为也不应靠猜测。读写函数各自返回成功或失败，跨流显示顺序需要显式 fflush 协调。",
    "eof-constant": "表示“没有读到普通字符”的负 int 常量，字符输入函数在文件结束或错误时返回它，部分字符输出函数失败时也返回它。EOF 的具体负值由实现决定，不能写死为 -1，也不能先塞进 char 再比较。输入函数返回 EOF 后还要查 feof 和 ferror 才能区分正常结束与错误；块读写函数则返回对象数量。",
    "bufsiz-constant": "给出实现认为适合标准 I/O 缓冲区的一个正整数，可用来声明交给 setbuf 的数组或作为普通块大小参考。它的数值由 C 实现决定，不保证等于磁盘块大小，也不是 fread、fwrite 必须使用的单位。数组若放在栈上仍会占用相应空间，函数的返回结果也不会因使用 BUFSIZ 就自动成功。",
    "seek-constants": "为 fseek 的第三个参数说明偏移起点：SEEK_SET 从文件开头算，SEEK_CUR 从当前位置算，SEEK_END 从文件末尾算。三个宏的实际整数值由实现决定，只能传宏名而不能猜 0、1、2。fseek 会根据流种类和偏移判断能否定位，成功返回 0、失败返回非零；文本流对非零偏移的限制更多。",
    "null-stdio-constant": "表示不指向任何对象或函数的空指针常量，可用来检查 fopen、tmpfile、fgets 等指针返回值，也可在接口明确允许时作为参数。stdio.h 与 stddef.h 都能提供该宏，具体展开可能是 0 或其他合法形式。NULL 不是数字错误码；返回 NULL 通常表示失败或无结果，仍要结合对应函数规则判断原因。",
    "printf-specifiers": "规定 printf 家族怎样解释每个实参并生成文字：标志控制符号和填充，宽度给最小栏宽，精度控制小数位或字符串上限，长度修饰符说明整数或浮点类型，最后的转换字母决定表示法。格式必须与默认参数提升后的真实类型一致。函数最终返回生成字符数，格式错配则是未定义行为。",
    "printf-width-precision": "控制格式化结果的排版而不改变原变量：字段宽度是最小宽度，内容更长时不会截断；精度对浮点数常表示小数位数，对字符串表示最多输出的字节数。负号标志左对齐，零标志常用于数字填充。printf 家族成功返回输出字符数，错误返回负数；字符串精度可能截断多字节字符。",
    "printf-string-n-risk": "说明两个容易造成内存问题的转换：`%s` 会从指针开始一直读到空字符，数组未正确结束就会越界读取；`%n` 不输出文字，而把目前已输出的字符数写进对应整数指针。若外部输入直接充当格式串，攻击者可能借这些规则读写内存。应固定格式为 `%s`，函数成功返回正常计数、出错返回负数。",
    "size-t-format": "说明输出 size_t 值时应使用 `%zu`：size_t 是用于对象大小和元素计数的无符号整数类型，底层究竟是 unsigned int、unsigned long 还是别的类型由平台决定。把它硬套 `%lu` 可能造成类型错配和未定义行为。printf 成功返回写出字符数、失败返回负数；scanf 读取 size_t 同样用 `%zu` 并传 size_t 指针。",
    "formatted-output-return": "解释格式化输出函数怎样报告结果：printf、fprintf 等成功时返回实际写出的字符数，负数表示输出或编码错误；sprintf 返回生成字符数。snprintf 与 vsnprintf 即使截断，也返回未截断时本来需要的字符数，因此非负结果大于等于容量就是截断。所有计数都不含末尾空字符，调用者不能只看非负就认定内容完整。",
    "scanf-specifiers": "规定 scanf 家族如何匹配输入、转换值并选择目标指针类型：例如 `%d` 要 int 指针，`%lf` 要 double 指针，`%s` 要有足够空间的字符数组；星号会读取但不赋值。空白、宽度和长度修饰符也会改变消费规则。函数返回成功赋值数，首项不匹配返回 0，首次转换前输入结束或错误返回 EOF。",
    "scanf-field-width": "限制一次 scanf 字符转换最多消费多少个输入字符。对 `%s` 或扫描集，宽度必须至多为目标数组容量减一，因为成功后还会写结尾空字符；对 `%c` 则不会自动补空字符。宽度只防止本次写越界，不会验证尾随垃圾。相关函数返回成功赋值数，匹配失败返回 0，输入先结束可能返回 EOF。",
    "scanf-scanset": "让 scanf 家族读取一段连续字符，只要每个字符属于方括号中的集合就继续；紧跟左方括号的 `^` 表示改为读取不在集合中的字符。扫描集至少匹配一个字符才算成功，并会给目标字符串补空字符，因此必须写容量减一的宽度。成功计入一个返回项目，首字符不匹配返回 0，输入先结束可返回 EOF。",
    "text-binary-streams": "区分两种标准流语义：文本流允许宿主系统在换行等外部表示与 C 字符之间转换，二进制流则按字节保持内容；例如 Windows 文本文件常在 CRLF 与 `\\n` 之间转换。fopen 模式带 `b` 可请求二进制。各读写函数仍按自身规则返回数量或错误，文本流的 ftell 值也未必是字节偏移。"
  };

  entries.concat(extraEntries).forEach(function (entry) {
    entry.behavior = behaviors[entry.id];
  });

  window.C_SYNTAX_ADD_ENTRIES(entries.concat(extraEntries));
}());
