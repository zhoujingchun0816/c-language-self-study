/* 翁恺风格经典题（参考浙大翁恺《程序设计入门——C 语言》的课后练习题型）
   特点：题目短（8~15 行）、只考一个点、输入输出格式写清楚，
   只用最基础的函数（printf 与整数运算/循环/判断，最多一个自制小函数），
   不涉及文件、动态内存、可变参数等进阶内容。 */
window.C_SYNTAX_ADD_EXERCISES([
  {
    id: "ex-wk-temperature",
    title: "华氏温度转摄氏",
    entryIds: ["integer-division", "arithmetic-operators"],
    difficulty: 1,
    prompt: "已知华氏温度 fahr = 150，按公式 celsius = 5 × (fahr − 32) ÷ 9 算出摄氏温度（整数），按 fahr=150 celsius=65 的格式输出。",
    requirements: ["必须用整数运算完成计算", "必须先减 32 再乘 5 最后除以 9", "必须按 fahr=... celsius=... 的格式输出一行"],
    hints: ["公式里先算 fahr - 32，再乘 5，最后除以 9", "整数除法会直接丢掉小数部分，这里正好要整数结果"],
    starter: "#include <stdio.h>\n\nint main(void) {\n    /* 算出 150 华氏度对应的摄氏温度并输出 */\n    return 0;\n}\n",
    solution: "#include <stdio.h>\n\nint main(void) {\n    int fahr = 150;\n    int celsius = 5 * (fahr - 32) / 9;\n    printf(\"fahr=%d celsius=%d\\n\", fahr, celsius);\n    return 0;\n}\n",
    expectedOutput: "fahr=150 celsius=65\n",
    explanation: "先减 32 再乘 5、最后除以 9，除号两边都是整数，所以结果自动取整：5 × 118 ÷ 9 = 65。这就是最常见的一道入门题，练的是整数运算顺序和整数除法的特点。"
  },
  {
    id: "ex-wk-reverse-three",
    title: "逆序输出三位数",
    entryIds: ["integer-division", "arithmetic-operators"],
    difficulty: 1,
    prompt: "把三位整数 123 逆序输出成 321（只输出这一行数字）。",
    requirements: ["必须用 % 和 / 取出个位、十位、百位", "必须用一次 printf 打印三个数字", "必须只输出 321 这一行"],
    hints: ["x % 10 得到个位", "x / 10 % 10 得到十位，x / 100 得到百位"],
    starter: "#include <stdio.h>\n\nint main(void) {\n    /* 取出 123 的三位数字并倒着输出 */\n    return 0;\n}\n",
    solution: "#include <stdio.h>\n\nint main(void) {\n    int x = 123;\n    printf(\"%d%d%d\\n\", x % 10, x / 10 % 10, x / 100);\n    return 0;\n}\n",
    expectedOutput: "321\n",
    explanation: "取余得到低位、整除去掉低位，是拆分整数的两把钥匙：123 % 10 = 3，123 / 10 % 10 = 2，123 / 100 = 1，按 3、2、1 的顺序打印就是逆序。"
  },
  {
    id: "ex-wk-count-digits",
    title: "数一数有几位",
    entryIds: ["while-loop", "integer-division"],
    difficulty: 1,
    prompt: "用循环数出整数 352 一共有几位数字，按 digits=3 的格式输出。",
    requirements: ["必须用 while 循环", "循环里用除以 10 的方式去掉最后一位", "输出 digits=位数"],
    hints: ["每次 x = x / 10 就少一位，数到 x 变成 0 为止", "记得准备一个计数器从 0 开始"],
    starter: "#include <stdio.h>\n\nint main(void) {\n    /* 数出 352 有几位 */\n    return 0;\n}\n",
    solution: "#include <stdio.h>\n\nint main(void) {\n    int x = 352;\n    int count = 0;\n    while (x > 0) {\n        x = x / 10;\n        count = count + 1;\n    }\n    printf(\"digits=%d\\n\", count);\n    return 0;\n}\n",
    expectedOutput: "digits=3\n",
    explanation: "352 → 35 → 3 → 0，每除一次 10 就去掉一位，循环三次后 x 变成 0，计数器刚好是 3。这是「用循环处理数字」最典型的起手式。"
  },
  {
    id: "ex-wk-odd-even-count",
    title: "数奇数和偶数个数",
    entryIds: ["if-statement", "arithmetic-operators"],
    difficulty: 1,
    prompt: "数组里放着 1、2、3、4 四个整数，数出其中奇数与偶数各有几个，按 odd=2 even=2 输出。",
    requirements: ["必须用循环遍历数组", "必须用取余判断奇偶", "按 odd=... even=... 输出"],
    hints: ["x % 2 等于 1 是奇数，等于 0 是偶数", "准备两个计数器分别累加"],
    starter: "#include <stdio.h>\n\nint main(void) {\n    /* 先声明数组 values[4] 并填入 1、2、3、4，再数出奇数与偶数各几个 */\n    return 0;\n}\n",
    solution: "#include <stdio.h>\n\nint main(void) {\n    int values[4] = { 1, 2, 3, 4 };\n    int odd = 0;\n    int even = 0;\n    for (int i = 0; i < 4; i++) {\n        if (values[i] % 2 == 1) {\n            odd = odd + 1;\n        } else {\n            even = even + 1;\n        }\n    }\n    printf(\"odd=%d even=%d\\n\", odd, even);\n    return 0;\n}\n",
    expectedOutput: "odd=2 even=2\n",
    explanation: "取余 2 判断奇偶是固定套路：余 1 为奇、余 0 为偶。循环配合两个计数器，把「分类统计」这件事一次做完。"
  },
  {
    id: "ex-wk-leap-year",
    title: "判断闰年",
    entryIds: ["logical-operators", "relational-operators"],
    difficulty: 1,
    prompt: "判断 2024 年是不是闰年：能被 4 整除且不能被 100 整除，或者能被 400 整除。按 leap=1 输出（是闰年输出 1，否则输出 0）。",
    requirements: ["必须用一个逻辑表达式完成判断", "必须同时用到 && 与 ||", "输出 leap=0 或 leap=1"],
    hints: ["先写 (year % 4 == 0 && year % 100 != 0)", "再用 || 把「能被 400 整除」接在后面"],
    starter: "#include <stdio.h>\n\nint main(void) {\n    /* 先声明 int year = 2024; 再用逻辑表达式判断它是不是闰年 */\n    return 0;\n}\n",
    solution: "#include <stdio.h>\n\nint main(void) {\n    int year = 2024;\n    int leap = (year % 4 == 0 && year % 100 != 0) || year % 400 == 0;\n    printf(\"leap=%d\\n\", leap);\n    return 0;\n}\n",
    expectedOutput: "leap=1\n",
    explanation: "2024 能被 4 整除且不能被 100 整除，所以是闰年，判断结果是 1。把判断结果存进 int 再打印，是 C 语言里表示真假（0/1）的常规写法。"
  },
  {
    id: "ex-wk-decompose-forward",
    title: "正序分解整数",
    entryIds: ["for-loop", "integer-division"],
    difficulty: 2,
    prompt: "把 3721 从高位到低位逐位输出，数字之间用空格隔开，最后换行（结果形如 3 7 2 1）。",
    requirements: ["必须用 for 循环", "必须先取高位再逐位降低权重", "数字之间用空格分隔，末尾换行"],
    hints: ["从 1000 开始，每次除以 10 就下移一位", "x / mask % 10 可以取出当前这一位"],
    starter: "#include <stdio.h>\n\nint main(void) {\n    /* 先声明 int x = 3721; 再从千位开始逐位输出 */\n    return 0;\n}\n",
    solution: "#include <stdio.h>\n\nint main(void) {\n    int x = 3721;\n    for (int mask = 1000; mask > 0; mask = mask / 10) {\n        printf(\"%d\", x / mask % 10);\n        if (mask > 1) {\n            printf(\" \");\n        }\n    }\n    printf(\"\\n\");\n    return 0;\n}\n",
    expectedOutput: "3 7 2 1\n",
    explanation: "先用 mask 把要取的那一位「抬」到个位（x / mask），再用 % 10 取出来；mask 从 1000 一路降到 1，就按高位到低位输出完。和逆序题相对，练的是正序拆分。"
  },
  {
    id: "ex-wk-series-sum",
    title: "求序列前五项和",
    entryIds: ["for-loop", "explicit-cast"],
    difficulty: 2,
    prompt: "计算 1 + 1/2 + 1/3 + 1/4 + 1/5，保留两位小数输出，形如 sum=2.28。",
    requirements: ["必须用 for 循环累加", "必须让 1/i 按小数计算（不能全是整数除法）", "输出保留两位小数"],
    hints: ["写成 1.0 / i 就会按小数算", "sum 用 double，printf 用 %.2f"],
    starter: "#include <stdio.h>\n\nint main(void) {\n    /* 累加 1 + 1/2 + ... + 1/5 */\n    return 0;\n}\n",
    solution: "#include <stdio.h>\n\nint main(void) {\n    double sum = 0.0;\n    for (int i = 1; i <= 5; i++) {\n        sum = sum + 1.0 / i;\n    }\n    printf(\"sum=%.2f\\n\", sum);\n    return 0;\n}\n",
    expectedOutput: "sum=2.28\n",
    explanation: "关键在 1.0 / i：只要有一个操作数是小数，除法就按小数算，否则 1/2 会得 0。累加结果约 2.2833，保留两位小数是 2.28。"
  },
  {
    id: "ex-wk-read-digits",
    title: "念出每位数字",
    entryIds: ["switch-statement", "while-loop"],
    difficulty: 2,
    prompt: "把 25 的每一位用拼音念出来（2 念 er、5 念 wu），形如 er wu。",
    requirements: ["必须用 switch 把数字映射成拼音", "必须先用循环把各位拆出来", "两位之间用空格分隔"],
    hints: ["x / 10 是十位，x % 10 是个位", "switch 的每个 case 后面记得 break"],
    starter: "#include <stdio.h>\n\nint main(void) {\n    /* 先声明 int x = 25; 再把十位和个位分别念出来 */\n    return 0;\n}\n",
    solution: "#include <stdio.h>\n\nint main(void) {\n    int digits[4];\n    int count = 0;\n    int x = 25;\n    while (x > 0) {\n        digits[count] = x % 10;\n        count = count + 1;\n        x = x / 10;\n    }\n    for (int i = count - 1; i >= 0; i--) {\n        switch (digits[i]) {\n            case 2: printf(\"er\"); break;\n            case 5: printf(\"wu\"); break;\n            default: printf(\"?\"); break;\n        }\n        if (i > 0) {\n            printf(\" \");\n        }\n    }\n    printf(\"\\n\");\n    return 0;\n}\n",
    expectedOutput: "er wu\n",
    explanation: "先用循环把各位从低位拆进数组，再倒着遍历，用 switch 把每个数字换成拼音。取余拆位 + switch 分支，是这类「按位处理」题的标准组合。"
  },
  {
    id: "ex-wk-simplify-fraction",
    title: "约分最简分式",
    entryIds: ["function-definition", "function-parameters"],
    difficulty: 2,
    prompt: "写一个求最大公约数的函数，把 12/8 约分成最简分式，按 3/2 的格式输出。",
    requirements: ["必须自己写一个求最大公约数的函数", "函数要接收两个 int 参数并返回 int", "输出最简分式 num/den"],
    hints: ["辗转相除：当 b 不为 0 时，把 a % b 的结果继续和 b 相除", "分子分母同除以最大公约数就得到最简分式"],
    starter: "#include <stdio.h>\n\n/* 在这里写求最大公约数的函数 */\n\nint main(void) {\n    /* 用函数约分 12/8 */\n    return 0;\n}\n",
    solution: "#include <stdio.h>\n\nstatic int gcd(int a, int b) {\n    while (b != 0) {\n        int remainder = a % b;\n        a = b;\n        b = remainder;\n    }\n    return a;\n}\n\nint main(void) {\n    int num = 12;\n    int den = 8;\n    int divisor = gcd(num, den);\n    printf(\"%d/%d\\n\", num / divisor, den / divisor);\n    return 0;\n}\n",
    expectedOutput: "3/2\n",
    explanation: "gcd(12, 8) 用辗转相除算出 4，分子分母同时除以 4 得 3/2。把这段逻辑做成函数，main 里只剩「调用 + 输出」两件事，这就是函数存在的意义。"
  },
  {
    id: "ex-wk-prime-sum",
    title: "求 10 以内素数和",
    entryIds: ["for-loop", "function-definition"],
    difficulty: 2,
    prompt: "写一个判断素数的函数，用它求出 2 到 10 之间所有素数的和，按 sum=17 输出。",
    requirements: ["必须自己写 is_prime 函数", "主函数里用循环调用它并累加", "输出 sum=总和"],
    hints: ["小于 2 的数一律不是素数", "判断素数只需试除到 i * i <= n"],
    starter: "#include <stdio.h>\n\n/* 在这里写判断素数的函数 */\n\nint main(void) {\n    /* 累加 2 到 10 之间的素数 */\n    return 0;\n}\n",
    solution: "#include <stdio.h>\n\nstatic int is_prime(int n) {\n    if (n < 2) {\n        return 0;\n    }\n    for (int i = 2; i * i <= n; i++) {\n        if (n % i == 0) {\n            return 0;\n        }\n    }\n    return 1;\n}\n\nint main(void) {\n    int sum = 0;\n    for (int n = 2; n <= 10; n++) {\n        if (is_prime(n)) {\n            sum = sum + n;\n        }\n    }\n    printf(\"sum=%d\\n\", sum);\n    return 0;\n}\n",
    expectedOutput: "sum=17\n",
    explanation: "2、3、5、7 是 10 以内的素数，加起来等于 17。把「是不是素数」包成一个返回 0/1 的函数，主函数就只能看到判断和累加，读起来清楚得多。"
  }
]);
