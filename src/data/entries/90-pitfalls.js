(function () {
  "use strict";

  const P = (headers, body, before = []) => [
    ...headers.map((h) => `#include <${h}>`), ...(headers.length ? [""] : []),
    ...before, ...(before.length ? [""] : []), "int main(void) {",
    ...body.map((line) => `    ${line}`), "    return 0;", "}", ""
  ].join("\n");
  const behaviors = {
    "uninitialized-variable": "这个坑发生在局部变量还没有得到初值时就读取它，例如先做 `value += 5`，却从未给 value 赋值。运行时可能看到每次不同的“垃圾值”、错误分支或看似偶尔正常的结果；某些读取甚至属于未定义行为，即 C 标准不保证会发生什么。危险之处是调试版本碰巧为零会掩盖问题，换编译器或优化级别就可能暴露。",
    "array-bounds": "这个坑发生在下标小于 0、等于或超过数组长度时仍去读写元素，常见原因是循环写成 `i <= length`。运行时可能立刻崩溃，也可能照常跑完却读到垃圾数据、改坏相邻变量或留下安全漏洞；这属于未定义行为，没有“只多访问一格也没事”的保证。所有外部下标和每一维边界都必须在访问前检查。",
    "dangling-pointer": "这个坑发生在对象已经释放或离开作用域后，程序仍保存并使用原来的地址；这个地址像过期门牌，已经不再代表那个对象。运行时可能暂时读到旧值，也可能被新数据覆盖、崩溃或悄悄破坏内存，表现往往随时机变化。释放后把拥有者指针置空只能防住这一份变量，其他指向同一对象的别名仍然悬空。",
    "memory-leak": "这个坑发生在 malloc 等分配出的内存还没 free，程序却覆盖或丢失了最后一个指向它的地址，于是那块空间再也无法回收。短时间运行可能看不出异常，长期进程会持续占用更多内存，最终变慢、触发分配失败或被系统终止。危险在于错误返回和提前退出路径很容易漏掉清理，所以每次成功分配都要有明确所有者和对应释放路径。",
    "integer-division": "这个坑发生在两个整数使用 `/` 时误以为会保留小数；C 会先计算整数商并向零截断，所以 `1 / 2` 得到 0，之后再存入 double 也只是 0.0。程序通常不会报错，却会悄悄算错比例、平均值或坐标，负数结果也不是向负无穷取整。需要小数时必须在除法前转换至少一个操作数，并在运算前检查分母不为零。",
    "format-mismatch": "这个坑发生在 printf、scanf 等函数的格式说明与实际参数类型不对应，例如拿 `%d` 读取 long，或给 scanf 的 `%f` 传 double 指针。运行时可能打印乱码、读写错误字节、破坏附近内存，甚至崩溃；因为可变参数本身不携带足够类型信息，这通常属于未定义行为。危险还包括外部输入被当成格式串后可读取或写入意外内存。",
    "operator-precedence": "这个坑发生在一条表达式混合多种运算符，却凭直觉猜测分组，例如把 `a + b * c` 当成 `(a + b) * c`。运行时会稳定地产生另一套合法结果，因此往往没有告警或崩溃，只是条件、掩码或计算结果悄悄出错。优先级只决定怎样分组，并不决定各部分先算谁；关键组合应写显式括号表达真实意图。",
    "signed-unsigned-comparison": "这个坑发生在负的有符号整数与无符号长度直接比较；按通常算术转换，负数可能先变成一个很大的无符号数。运行时会看到 `-1 < 3U` 竟然为假，范围检查被绕过，随后又可能拿错误下标访问内存。危险在于代码表面很自然且跨类型变化后才触发；应先单独排除负值，再安全转换，或从源头统一类型。",
    "off-by-one": "这个坑发生在把“元素个数”“最后一个下标”和“尾后位置”混为一谈，只多算或少算一格。运行时可能漏处理最后一个元素，也可能访问数组末尾之外；字符串还可能少留结尾空字符的位置，导致后续函数继续越界读取。它危险在于普通非空输入常看似正常，空数组、单元素和最大容量这些边界才会暴露问题。",
    "switch-fallthrough": "这个坑发生在 switch 的某个 case 做完后漏写 break 或 return，于是控制流继续执行下一个 case。运行时会看到本应互斥的多个分支连续生效，后一个分支可能覆盖前一个结果、重复释放资源或发出多次操作。C 允许这种贯穿，因此编译器未必拒绝；确实需要共享后续逻辑时必须清楚标注，否则每个分支都应显式结束。",
    "assignment-vs-equality": "这个坑发生在条件里把相等比较 `==` 误写成赋值 `=`。表达式会先修改变量，再把赋进去的值当作真假：`if (value = 0)` 会清零并跳过分支，赋非零值则总会进入。运行时通常没有崩溃，只表现为状态被莫名改写、分支永远执行或永远不执行，因此应开启相关告警，并让有意的条件赋值带明确括号。",
    "sizeof-pointer-vs-array": "这个坑发生在数组传给函数或赋给指针后，仍用 `sizeof pointer / sizeof pointer[0]` 猜元素数。此时 sizeof 得到的是指针对象本身的字节数，不是原数组容量；运行时可能得到 1、2 或另一个碰巧合理的数，随后漏处理元素或越界。裸指针不携带长度，数组大小只能在数组对象仍可见处计算，再与指针一起显式传递。",
    "modify-string-literal": "这个坑发生在让指针指向 `\"text\"` 这样的字符串字面量后尝试改写字符。字面量常放在只读内存，运行时可能立刻崩溃；即使某次似乎改成功，也属于未定义行为，而且相同字面量还可能共享存储，后果无法依赖。需要修改时应创建 `char text[]` 数组副本，只读引用则用 `const char *` 让误写尽早被编译器发现。",
    "scanf-width": "这个坑发生在用 scanf 的 `%s` 读取单词，却没有在格式串中限制最大字段宽度。输入比目标数组长时，函数会越过数组继续写，运行时可能破坏别的变量、崩溃或形成可利用漏洞；输入正常时又完全看不出问题。宽度必须等于容量减一，为自动追加的结尾空字符留一格，并且仍要检查成功赋值的项目数。",
    "gets-danger": "这个坑来自 gets 的接口根本不接收目标数组容量，因此它无法知道何时停止写入。只要用户输入比缓冲区长，运行时就会越界覆盖内存，可能崩溃、篡改控制数据或形成严重安全漏洞；把数组改大只能推迟问题，不能消除它。C11 已删除 gets，任何新旧代码都应改用带容量的 fgets 并检查结果。",
    "double-free": "这个坑发生在同一块动态内存被 free 两次，或把数组内部地址、栈地址等并非分配函数返回的起始地址交给 free。运行时可能立即报 `double free` 并终止，也可能损坏内存分配器状态，直到很久以后才在无关位置崩溃；行为未定义。必须明确唯一所有者和所有权转移规则，确保每次成功分配只配对一次释放。",
    "return-local-address": "这个坑发生在函数返回自动局部变量的地址；函数一结束，该对象的生存期也结束，返回指针立刻变成悬空指针。调用者可能暂时读到旧值，但下一次函数调用或栈使用就会覆盖它，出现随机数据或崩溃。危险在于简单测试常碰巧成功；小对象应按值返回，其他结果应写入调用者对象或使用所有权清晰的动态内存。",
    "uninitialized-pointer": "这个坑发生在指针变量尚未设为有效地址或 NULL 时，就拿它比较、解引用或交给 free。它含有不确定内容，运行时可能指向任意位置，造成随机崩溃、读写无关数据或破坏分配器；打印这个值本身也不是可靠诊断。指针应在声明时初始化，并只在分配或查找明确成功后解引用，结构体里的指针成员也不能遗漏。",
    "floating-accumulation": "这个坑发生在大量重复浮点加法时，每一步都把精确结果舍入到有限二进制位，微小误差会逐渐累积。运行时可能看到十次加 0.1 不精确等于 1.0，而且改变求和顺序就改变末位；大数先加入还可能把后续小量完全“吞掉”。直接相等测试会不稳定，重要计算应使用误差预算、更高精度或补偿求和等方法。",
    "macro-parentheses": "这个坑发生在函数式宏的参数或整个替换式没有括号，例如 `SQUARE(a+b)` 被文本展开成 `a+b*a+b`，运算符重新分组后结果错误。运行时通常只看到某些调用算错，没有真正的函数边界可供调试；即使补齐括号，`SQUARE(i++)` 仍会让参数被求值两次。简单宏要完整加括号，涉及重复求值时应改成 inline 函数。",
    "header-double-inclusion": "这个坑发生在同一个头文件经由不同包含路径被重复展开，却没有 include guard 保护。编译阶段会看到结构体、typedef 或其他声明重定义错误，项目依赖越复杂越难追踪；若保护宏与别的头碰巧同名，还可能反过来静默跳过真正需要的内容。每个头都应使用全局唯一的保护宏，并让它可以被任意顺序安全包含。",
    "integer-overflow-loop": "这个坑发生在循环计数器到达类型边界后仍递增或递减：无符号数会回绕，例如 0 再减一变成最大值；有符号溢出则属于未定义行为。运行时可能表现为循环永不结束、突然访问巨大下标或在优化后出现意外控制流。计数器必须容得下终点，采用半开区间；无符号反向遍历尤其不能写永远为真的 `i >= 0`。",
    "evaluation-order": "这个坑发生在同一条表达式里多次读写同一对象，或假定函数参数一定从左到右计算，例如 `i = i++ + 1`。许多运算符和实参之间没有规定先后，缺少必要顺序的读写甚至属于未定义行为；运行时可能因编译器、优化级别而得到不同结果。每次状态修改应拆成独立完整语句，再在下一句使用新值。"
  };
  const E = (id, name, aliases, summary, syntax, related, headers, usage, body, notes, before = []) => ({
    id, name, aliases, category: "常见易错点", summary, behavior: behaviors[id], syntax, headers, usage,
    example: P(headers, body, before), notes, related
  });

  window.C_SYNTAX_ADD_ENTRIES([
    E("uninitialized-variable", "未初始化变量", ["indeterminate","垃圾值","初始化"],
      "读取未初始化自动变量的值会产生未定义行为或未指定结果，应在首次读取前赋值。", "int value = 0;", ["array-initialization"], [],
      "声明自动变量时直接给出合理初值，或保证每条控制路径在首次读取前赋值；不要把调试环境中碰巧为零当成语言保证。",
      ["int value = 0;", "value += 5;", "if (value != 5) return 1;"],
      ["声明时初始化通常比依赖后续某条路径赋值更可靠。", "编译器告警只能发现部分未初始化读取，复杂别名路径仍需人工审查。", "静态存储期对象会零初始化，不能据此推断自动局部变量也为零。"]),

    E("array-bounds", "数组越界", ["out of bounds","缓冲区溢出","下标"],
      "访问数组有效范围之外的元素是未定义行为。", "for (size_t i = 0; i < length; ++i) { ... }", ["one-dimensional-array","string-copy"], ["stddef.h"],
      "数组遍历统一使用零到 length-1 的半开区间，并让长度与数组来自同一来源；外部下标必须先验证再访问。",
      ["int values[] = {1, 2, 3};", "size_t length = sizeof values / sizeof values[0];", "int sum = 0;", "for (size_t i = 0; i < length; ++i) sum += values[i];", "if (sum != 6) return 1;"],
      ["循环上界通常使用小于长度，而不是小于等于长度。", "即使越界地址落在已分配内存附近，访问仍没有定义。", "多维数组每一维都必须独立检查，不能只验证扁平总偏移。"]),

    E("dangling-pointer", "悬空指针", ["dangling pointer","释放后使用","use after free"],
      "对象生命周期结束后仍保存其地址的指针是悬空指针，不能再解引用。", "free(pointer); pointer = NULL;", ["free-function","null-pointer"], ["stdlib.h"],
      "释放动态对象后立即让拥有者指针失效并停止传播其别名；栈对象地址也不能在离开作用域后继续使用。",
      ["int *pointer = malloc(sizeof *pointer);", "if (pointer == NULL) return 1;", "*pointer = 8;", "free(pointer);", "pointer = NULL;", "if (pointer != NULL) return 1;"],
      ["置空只能降低同一变量被误用的风险，其他别名仍可能悬空。", "realloc 成功后旧地址可能已经失效，必须只使用返回的新指针。", "容器删除元素可能让内部地址失效，接口应说明指针稳定性期限。"]),

    E("memory-leak", "内存泄漏", ["memory leak","忘记释放","资源泄漏"],
      "失去动态分配块的所有可用地址而未释放，会造成内存泄漏。", "pointer = malloc(size); /* ... */ free(pointer);", ["malloc-function","free-function"], ["stdlib.h"],
      "每次成功分配都要指定唯一所有者与释放点，函数的正常、错误和提前返回路径必须汇合到完整清理逻辑。",
      ["int *value = malloc(sizeof *value);", "if (value == NULL) return 1;", "*value = 12;", "int result = *value;", "free(value);", "if (result != 12) return 1;"],
      ["为每条成功分配路径设计清晰的所有权和释放路径。", "覆盖保存唯一地址的指针前必须先释放旧块或保存可达别名。", "长期进程的小泄漏会持续累积，短命程序也不应把进程退出当作所有权策略。"]),

    E("integer-division", "整数除法截断", ["division","除法精度","类型转换"],
      "两个整数相除得到整数结果并向零截断，若需要小数应先转换操作数。", "double ratio = (double)numerator / denominator;", ["arithmetic-operators","double-type"], [],
      "比例和平均值需要小数时，在除法发生前把至少一个操作数转换为浮点；若确实要整数商，应明确余数如何处理。",
      ["int numerator = 1;", "int denominator = 2;", "double ratio = (double)numerator / denominator;", "if (ratio < 0.49 || ratio > 0.51) return 1;"],
      ["转换应在除法前发生；仅转换已经截断的结果无法恢复小数。", "负整数除法从 C99 起向零截断，不能假定向负无穷取整。", "除数为零无论整数还是浮点接口约定都必须在业务层检查。"]),

    E("format-mismatch", "格式说明不匹配", ["printf format","格式化类型","未定义行为"],
      "可变参数函数的格式说明与实参类型不匹配会导致未定义行为或错误输出。", "printf(\"%lu %ld\\n\", (unsigned long)size_value, long_value);", ["printf-function","variadic-function"], ["stdio.h"],
      "调用 printf 家族时逐项让转换说明与默认提升后的实参类型对应；平台相关整数优先使用标准专用格式或显式安全转换。",
      ["size_t size_value = 3U;", "long long_value = 9L;", "if (printf(\"%lu %ld\\n\", (unsigned long)size_value, long_value) < 0) return 1;"],
      ["使用与类型严格对应的转换说明，并开启编译器格式告警。", "%f 在 printf 接收 double，但 scanf 的 %f 却要求 float *，两族规则不同。", "格式串来自外部输入会引入格式串漏洞，必须使用固定格式和数据实参。"]),

    E("operator-precedence", "运算符优先级", ["precedence","结合性","括号"],
      "运算符优先级和结合性决定表达式分组，显式括号可表达意图并避免误读。", "result = (a + b) * c;", ["arithmetic-operators","logical-operators"], [],
      "混合算术、比较、位操作和逻辑操作时用括号直接表达预期分组；不要要求读者凭记忆还原一长串优先级。",
      ["int a = 2;", "int b = 3;", "int c = 4;", "int result = (a + b) * c;", "if (result != 20) return 1;"],
      ["优先级不决定不同子表达式的求值先后顺序。", "位与的优先级低于相等比较，测试掩码时应显式括住位运算。", "赋值运算符向右结合，但连续赋值仍要确认各目标类型转换。"]),

    E("signed-unsigned-comparison", "有符号与无符号比较", ["signed unsigned","类型转换陷阱"],
      "有符号整数与同等级无符号整数比较时，负值可能先转换成很大的无符号数。", "if (signed_value >= 0 && (unsigned)signed_value < limit)", ["integer-promotions"], [],
      "比较下标和长度前先排除负值，再转换到长度使用的无符号类型；更简单的办法是让同一概念从源头使用一致类型。",
      ["int index = -1;", "unsigned length = 3U;", "int in_range = index >= 0 && (unsigned)index < length;", "if (in_range) return 1;"],
      ["表达式 index < length 可能在 index 为负时得到假，原因是无符号转换。", "关闭 signed-compare 告警会掩盖边界缺陷，应该统一类型或分步检查。", "从无符号长度转成 int 前也要验证不超过 INT_MAX。"]),

    E("off-by-one", "差一错误", ["off by one","边界少一多一"],
      "循环端点或缓冲区容量相差一个元素会漏处理数据或发生越界。", "for (int i = 0; i < count; ++i)", ["for-loop","array-bounds"], [],
      "用半开区间 [begin, end) 统一表达遍历范围，元素个数等于 end-begin；写循环前先确定终点是最后元素还是尾后位置。",
      ["int values[4] = {1, 2, 3, 4};", "int sum = 0;", "for (int i = 0; i < 4; ++i) sum += values[i];", "if (sum != 10) return 1;"],
      ["数组最后下标是 count-1，而尾后位置 count 只能比较不能访问。", "字符串容量需要额外容纳结尾空字符，数据长度与缓冲区容量不同。", "空范围是检验循环边界的关键反例，此时循环体应执行零次。"]),

    E("switch-fallthrough", "switch 意外贯穿", ["fallthrough","忘记 break"],
      "case 末尾遗漏 break 会继续执行后续标签，常造成多个分支同时生效。", "case value: action(); break;", ["switch-statement","break-statement"], [],
      "每个互斥 case 完成后显式 break 或 return；只有确实要共享后续逻辑时允许贯穿，并用清楚注释标明意图。",
      ["int code = 1;", "int result = 0;", "switch (code) {", "case 1: result = 10; break;", "case 2: result = 20; break;", "default: result = -1; break;", "}", "if (result != 10) return 1;"],
      ["空 case 连续列出可以安全合并多个标签，不需要在每个标签后 break。", "有意贯穿也要确保前一个分支建立了后续分支所需的不变量。", "编译器的 implicit-fallthrough 告警可发现多数未注释的遗漏。"]),

    E("assignment-vs-equality", "赋值与相等混淆", ["single equals","条件赋值"],
      "在条件中误写单等号会修改变量，并按赋值结果真假决定分支。", "if (value == expected) { ... }", ["assignment-operators","relational-operators"], [],
      "比较值必须写双等号；确实要在条件内赋值时加括号并立即使用结果，让编译器和读者都能识别这是有意行为。",
      ["int value = 3;", "int expected = 3;", "if (value != expected) return 1;"],
      ["if (value = 0) 会把 value 清零且分支不执行，并不是相等判断。", "开启 parenthesis 类告警能发现多数可疑条件赋值。", "把常量写在左侧只能制造风格差异，不能替代编译器告警和评审。"]),

    E("sizeof-pointer-vs-array", "sizeof 指针与数组", ["pointer size","array size"],
      "sizeof 数组得到整个数组字节数，而数组退化后的指针只得到指针对象大小。", "sizeof array / sizeof array[0]", ["sizeof-array-decay","pointer-array-difference"], [],
      "只在数组定义仍可见的作用域计算元素数，并把结果显式传给函数；函数的数组形参实际是指针，不能用同一公式。",
      ["int values[5] = {0};", "int *pointer = values;", "unsigned long count = (unsigned long)(sizeof values / sizeof values[0]);", "if (count != 5UL || pointer != values) return 1;"],
      ["把 sizeof(pointer) 除以 sizeof(pointer[0]) 得不到动态数组长度。", "某些平台两者比值偶然像正确答案，换元素类型或架构就会暴露问题。", "分配接口应同时保存元素数或字节数，裸指针本身不携带容量。"]),

    E("modify-string-literal", "修改字符串字面量", ["read only string","literal write"],
      "字符串字面量虽然在 C 中具有字符数组类型，但尝试修改其内容是未定义行为。", "char text[] = \"mutable\";", ["string-literal","char-array"], [],
      "需要修改文本时让 char 数组从字面量复制初始化；只读引用应声明为 const char *，使误写在编译期暴露。",
      ["char text[] = \"mutable\";", "text[0] = 'M';", "if (text[0] != 'M') return 1;"],
      ["char *p = \"text\" 在 C11 可编译不代表 *p 可安全写入。", "字面量常放在只读内存，错误写入可能立即导致进程崩溃。", "数组副本的容量固定，修改内容时仍须保留终止空字符。"]),

    E("scanf-width", "scanf 的 %s 宽度", ["scanf overflow","输入宽度"],
      "scanf 的 %s 若没有最大字段宽度，输入可能写出目标字符数组边界。", "scanf(\"%15s\", buffer);", ["scanf-function"], ["stdio.h"],
      "必须使用 scanf 读取单词时，让宽度等于缓冲区容量减一并检查返回项数；读取整行通常优先 fgets。",
      ["char buffer[16] = {0};", "int assigned = sscanf(\"safe\", \"%15s\", buffer);", "if (assigned != 1 || buffer[0] != 's') return 1;"],
      ["字段宽度不包含 scanf 自动追加的结尾空字符，所以要预留一格。", "%s 会跳过前导空白并在下一个空白停止，不能读取含空格整行。", "宽度必须写在格式串中，运行时容量不能像 printf 精度那样直接传入。"]),

    E("gets-danger", "gets 的危险", ["unsafe input","removed function"],
      "gets 无法接收缓冲区容量，任何较长输入都可能造成溢出，C11 已删除该函数。", "fgets(buffer, sizeof buffer, stdin);", ["fgets-function"], ["stdio.h"],
      "永远不要调用 gets；读取有限缓冲区用 fgets 并检查返回值，再按需要识别或移除保留的换行符。",
      ["char buffer[8] = {0};", "FILE *stream = tmpfile();", "if (stream == NULL) return 1;", "if (fputs(\"ok\\n\", stream) == EOF) { fclose(stream); return 1; }", "rewind(stream);", "if (fgets(buffer, sizeof buffer, stream) == NULL) { fclose(stream); return 1; }", "if (fclose(stream) == EOF) return 1;", "if (buffer[0] != 'o') return 1;"],
      ["给 gets 传再大的数组也不安全，因为函数根本不知道目标容量。", "某些旧实现仍声明 gets，不代表它可用于 C11 程序或兼容代码。", "fgets 会保留读到的换行符，调用者应按协议决定是否删除。"]),

    E("double-free", "重复释放与配对错误", ["double free","invalid free","allocator pair"],
      "同一动态分配块被释放两次，或释放非分配起始地址，都会产生未定义行为。", "free(pointer); pointer = NULL;", ["malloc-function","free-function"], ["stdlib.h"],
      "建立单一所有者并确保每个成功分配只被释放一次；转移所有权后源指针应视为不可再释放或访问。",
      ["int *pointer = malloc(sizeof *pointer);", "if (pointer == NULL) return 1;", "*pointer = 4;", "free(pointer);", "pointer = NULL;", "if (pointer != NULL) return 1;"],
      ["只能把分配函数返回的原始地址或空指针传给 free。", "置空一个别名不能保护其他仍保存同一已释放地址的别名。", "realloc 成功后旧块已由实现处理，不能再次 free 旧指针。"]),

    E("return-local-address", "返回局部变量地址", ["stack address","lifetime bug"],
      "函数返回后自动局部对象生存期结束，指向它的返回指针立即悬空。", "return dynamically_allocated_or_caller_owned_pointer;", ["return-statement","scope-lifetime"], [],
      "函数需要返回单个小值时直接按值返回；较大结果写入调用者提供的对象，或动态分配并明确由谁释放。",
      ["int result = make_value();", "if (result != 7) return 1;"],
      ["即使旧栈内容暂时未覆盖，读取失效局部地址仍然没有定义。", "把局部对象改成 static 会延长寿命，却引入共享状态与不可重入问题。", "返回结构体按值是合法且常被优化的做法，不必为避免复制返回栈地址。"],
      ["static int make_value(void) { int local = 7; return local; }"]),

    E("uninitialized-pointer", "未初始化指针", ["wild pointer","野指针"],
      "未初始化自动指针具有不确定值，比较、解引用或释放它都可能导致未定义行为。", "int *pointer = NULL;", ["pointer-declaration","null-pointer"], ["stddef.h"],
      "指针声明时立即绑定有效对象或初始化为 NULL；随后只有在成功取得目标后才能解引用，清理路径也按状态判断。",
      ["int value = 9;", "int *pointer = NULL;", "pointer = &value;", "if (pointer == NULL || *pointer != 9) return 1;"],
      ["未初始化指针打印出来也不是安全诊断，读取其不确定值本身可能有问题。", "malloc 失败时返回空指针，不能因为变量已赋值就直接解引用。", "结构体中的指针成员同样需要初始化，部分字段赋值不能遗漏它。"]),

    E("floating-accumulation", "浮点累加误差", ["rounding accumulation","数值误差"],
      "大量浮点加法的舍入误差会累积，结果可能依赖求和顺序。", "sum += value; /* 使用容差验证 */", ["floating-comparison"], [],
      "累计大量小量时使用更高精度、补偿求和或按绝对值排序等数值方法，并按误差预算验证结果而非直接判等。",
      ["double sum = 0.0;", "for (int i = 0; i < 10; ++i) sum += 0.1;", "if (sum < 0.999999 || sum > 1.000001) return 1;"],
      ["重复加 0.1 通常不会精确得到十进制的一，因为 0.1 无有限二进制表示。", "先累加大数可能吞掉后续小增量，求和顺序会影响末位结果。", "金额等必须精确的领域常改用最小货币单位整数或十进制库。"]),

    E("macro-parentheses", "宏参数缺少括号", ["macro precedence","unsafe macro"],
      "函数式宏若不括住参数和整体结果，调用处运算符会改变预期分组。", "#define SQUARE(x) ((x) * (x))", ["function-macro"], [],
      "简单表达式宏至少为每个形参和整个替换体加括号；若形参会出现多次或需要类型检查，改写成 inline 函数。",
      ["int result = 2 * SQUARE(1 + 2);", "if (result != 18) return 1;"],
      ["#define SQUARE(x) x * x 会把 SQUARE(a+b) 展开成错误分组。", "加括号只能修复优先级，无法消除 i++ 被重复求值的问题。", "宏替换发生在语法分析前，调试器看到的执行位置可能不直观。"],
      ["#define SQUARE(x) ((x) * (x))"]),

    E("header-double-inclusion", "头文件重复包含", ["include guard missing","redefinition"],
      "头文件没有保护时被间接重复包含，会造成类型或对象重定义诊断。", "#ifndef PROJECT_HEADER_H\n#define PROJECT_HEADER_H\n/* declarations */\n#endif", ["include-guard","include-directive"], [],
      "项目头文件把全部内容放在唯一 include guard 内，让调用者可按需直接包含；不要用人工控制包含顺序掩盖缺失保护。",
      ["struct ProtectedType item = {3};", "if (item.value != 3) return 1;"],
      ["保护宏若不唯一会把另一个头静默屏蔽，命名应包含项目和路径信息。", "头文件中定义普通外部对象即使有保护也会在多翻译单元产生多重定义。", "前向声明可减少依赖，但需要完整类型的成员和 sizeof 仍必须包含定义。"],
      ["#ifndef EXAMPLE_PROTECTED_TYPE_H", "#define EXAMPLE_PROTECTED_TYPE_H", "struct ProtectedType { int value; };", "#endif"]),

    E("integer-overflow-loop", "整数溢出与循环边界", ["wraparound loop","counter overflow"],
      "循环计数器达到类型上限后回绕或溢出，可能让终止条件永远无法满足。", "for (unsigned i = 0; i < count; ++i)", ["for-loop","signed-overflow"], [],
      "计数器类型要能表示终点，并使用 i < count 的半开条件；反向遍历无符号下标时改写为 i-- > 0。",
      ["unsigned count = 3U;", "unsigned sum = 0U;", "for (unsigned i = 0U; i < count; ++i) sum += i;", "if (sum != 3U) return 1;"],
      ["无符号条件 i >= 0 永远为真，递减到零后会回绕为最大值。", "有符号计数器越过最大值是未定义行为，而非可预测的回绕。", "终点由外部长度转换而来时，转换前要确认计数器类型容得下。"]),

    E("evaluation-order", "求值顺序与副作用", ["unsequenced","sequence point","side effect"],
      "许多运算符和函数实参不规定求值先后，同一表达式无序读写对象可能未定义。", "value++; result = value + other;", ["increment-decrement","comma-operator"], [],
      "一个对象每次更新写成独立完整表达式，再在下一语句使用新值；不要依赖函数实参从左到右或从右到左求值。",
      ["int value = 1;", "int old = value;", "++value;", "int result = old + value;", "if (result != 3) return 1;"],
      ["表达式 i = i++ + 1 对同一对象的读写缺乏所需顺序，行为未定义。", "加法左右操作数和函数各实参的求值次序通常未指定。", "逻辑与、逻辑或、逗号运算符和条件运算符提供特定顺序保证。"])
  ]);
}());
