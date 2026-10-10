(function () {
  "use strict";

  var program = window.C_SYNTAX_PROGRAM;

  var behaviors = {
    "isalpha-function": "判断 character 在当前区域设置中是否属于字母。以默认 C 区域为例，`A` 到 `Z` 和 `a` 到 `z` 会命中：是字母就返回非零，不是就返回 0；这个非零值只代表“真”，标准不保证恰好为 1。参数只能是 EOF 或能表示为 unsigned char 的值，普通 char 应先转换，否则负值可能导致未定义行为。",
    "isdigit-function": "判断 character 是否是十进制数字字符 `0` 到 `9`，它检查的是字符类别，不是把一段文本转换成数值。命中时返回非零，未命中时返回 0；非零只表示“真”，不保证等于 1。参数必须是 EOF 或能表示为 unsigned char 的值，所以从 char 取得的字节应先转为 unsigned char 再传入。",
    "isalnum-function": "判断 character 是否属于字母或十进制数字，也就是把 isalpha 和 isdigit 的命中范围合在一起；下划线、连字符等不会因此自动算入。属于任一类就返回非零，否则返回 0，且非零不保证是 1。参数只允许 EOF 或 unsigned char 可表示的值，直接传入负的普通 char 可能产生未定义行为。",
    "isspace-function": "判断 character 是否属于空白字符。默认 C 区域中，空格、横向制表、换行、回车、换页和垂直制表都会命中；命中返回非零，不命中返回 0，非零值不保证为 1。它会把换行也当空白，若只检查一行内的空格与横向制表应看 isblank；参数仍须是 EOF 或 unsigned char 范围内的值。",
    "isupper-function": "判断 character 在当前区域设置中是否属于大写字母，它只回答类别，不会修改字符。大写字母返回非零，其他输入返回 0；非零表示“真”但标准不保证结果就是 1。例如默认 C 区域中的 `Q` 命中而 `q` 不命中。参数必须是 EOF 或可表示为 unsigned char 的值，负的 char 要先转换。",
    "islower-function": "判断 character 在当前区域设置中是否属于小写字母，它不会顺便生成大写形式。小写字母返回非零，其他字符返回 0；调用者只能按零与非零判断，不能假设真值等于 1。默认 C 区域中的 `q` 会命中而 `Q` 不会；传参只允许 EOF 或 unsigned char 可表示的值。",
    "toupper-function": "尝试把 character 转换成当前区域设置下对应的大写形式。输入是可转换的小写字母时返回对应大写字符的 unsigned char 值经整数提升后的 int；“提升”就是用能容纳该值的 int 来表达它。没有对应转换时返回原值，输入 EOF 也返回 EOF。结果是字符值而不是真假状态，参数不能是 EOF 以外的负整数。",
    "tolower-function": "尝试把 character 转换成当前区域设置下对应的小写形式。若输入有小写对应形式，就返回那个字符的 unsigned char 值提升成的 int；没有可用转换时返回原值，传入 EOF 时仍返回 EOF。因此返回非零不代表发生了转换，应该把结果当字符值使用。EOF 之外的参数必须能表示为 unsigned char，负的普通 char 要先转换。",
    "ispunct-function": "判断 character 是否是标点类字符：它必须可打印，同时既不是空白，也不是字母或十进制数字；当前区域设置会影响具体集合。属于标点类就返回非零，否则返回 0，且真值不保证等于 1。默认 C 区域中的 `!`、`,` 等会命中；参数只能是 EOF 或 unsigned char 可表示的值。",
    "isxdigit-function": "判断 character 能否作为一个十六进制数字，标准集合是 `0` 到 `9`、`a` 到 `f` 和 `A` 到 `F`；前缀 `0x` 中的 `x` 本身不会命中。可用数字返回非零，其他字符返回 0，非零不保证为 1。它一次只检查一个字节，不解析完整数字；参数须是 EOF 或 unsigned char 范围内的值。",
    "isprint-function": "判断 character 是否具有可打印表示，普通空格也算可打印，这是它与 isgraph 的关键区别。当前区域设置认定为可打印时返回非零，控制字符等返回 0；返回的非零值只代表“真”，不保证恰好是 1。参数必须是 EOF 或能表示为 unsigned char 的值，不能直接传入 EOF 以外的负整数。",
    "iscntrl-function": "判断 character 是否属于控制字符类，这些字符通常用来控制排版或设备而不是显示可见图形，例如默认 C 区域中的换行和横向制表。属于控制类就返回非零，否则返回 0；非零不保证等于 1。具体扩展字符可受区域设置影响，参数只能是 EOF 或 unsigned char 可表示的值。",
    "isgraph-function": "判断 character 是否有可见的图形表示；字母、数字和标点通常命中，但普通空格明确不命中。符合条件返回非零，否则返回 0，且标准不保证真值为 1。它与 isprint 的差别正是空格：isprint 对空格返回非零，isgraph 返回 0。参数必须是 EOF 或 unsigned char 可表示的值。",
    "isblank-function": "判断 character 是否属于横向空白，也就是在同一行内分隔内容的空白。C11 至少要求普通空格和横向制表命中，区域设置还可能加入其他字符；命中返回非零，否则返回 0，非零不保证为 1。换行应交给范围更广的 isspace 判断；参数只能是 EOF 或 unsigned char 可表示的值。"
  };

  function predicate(id, name, aliases, summary, usage, sample, expected, contrast) {
    return {
      id: id, name: name, aliases: aliases, category: "标准库函数", summary: summary, behavior: behaviors[id],
      headers: ["ctype.h"], usage: usage, syntax: "int " + name + "(int character);",
      example: program(["ctype.h"], [
        "char raw = '" + sample + "';",
        "int matched = " + name + "((unsigned char)raw);",
        "if (matched " + (expected ? "==" : "!=") + " 0) return 1;"
      ]),
      notes: [
        name + " 返回非零只表示条件为真，标准不保证这个非零值恰好等于 1。",
        name + " 的参数必须是 EOF 或可表示为 unsigned char 的值；其他负整数会导致未定义行为。",
        "普通 char 可能有符号；调用 " + name + " 前应先转换为 unsigned char。" + contrast
      ], related: []
    };
  }

  function conversion(id, name, aliases, summary, usage, sample, wanted, contrast) {
    return {
      id: id, name: name, aliases: aliases, category: "标准库函数", summary: summary, behavior: behaviors[id],
      headers: ["ctype.h"], usage: usage, syntax: "int " + name + "(int character);",
      example: program(["ctype.h"], [
        "char raw = '" + sample + "';",
        "int converted = " + name + "((unsigned char)raw);",
        "if (converted != '" + wanted + "') return 1;"
      ]),
      notes: [
        name + " 返回转换后的 unsigned char 值提升为 int；无可用转换时原值不变，它不是真假谓词。",
        name + " 仅接受 EOF 或可表示为 unsigned char 的值，直接传其他负整数属于未定义行为。",
        "读取到可能为负的 char 后，应先转成 unsigned char 再交给 " + name + "。" + contrast
      ], related: []
    };
  }

  window.C_SYNTAX_ADD_ENTRIES([
    predicate("isalpha-function", "isalpha", ["字母判断"], "isalpha 判断字符是否属于当前区域设置中的字母类。",
      "验证标识符或单词中的字母时调用 isalpha；返回值按是否为零判断，并在传 char 前转换成 unsigned char。", "A", true,
      " 与 isalnum 相比，它不接受数字。"),
    predicate("isdigit-function", "isdigit", ["十进制数字判断"], "isdigit 判断字符是否是十进制数字。",
      "逐字节验证十进制数字文本时调用 isdigit；非零表示数字，若还要接受十六进制字母则改用 isxdigit。", "7", true,
      " 它专指十进制数字字符，不等同于 isxdigit。"),
    predicate("isalnum-function", "isalnum", ["字母数字判断"], "isalnum 判断字符是否属于字母或十进制数字类。",
      "字段只允许字母和数字时调用 isalnum；按非零判断命中，并把下划线等额外许可字符单独处理。", "9", true,
      " 它等价于当前区域下 isalpha 或 isdigit 的并集。"),
    predicate("isspace-function", "isspace", ["空白字符判断"], "isspace 判断字符是否属于标准空白字符类。",
      "跳过空格、制表、换行等所有空白时调用 isspace；若只想识别横向空白，应选择 isblank。", " ", true,
      " 它通常也接受换行、回车、换页和垂直制表。"),
    predicate("isupper-function", "isupper", ["大写字母判断"], "isupper 判断字符是否属于当前区域的大写字母类。",
      "需要确认字节是大写字母时调用 isupper；非零即为真，若目的是转换大小写则调用 tolower。", "Q", true,
      " 它与 tolower 的转换功能不同，只执行分类。"),
    predicate("islower-function", "islower", ["小写字母判断"], "islower 判断字符是否属于当前区域的小写字母类。",
      "需要确认字节是小写字母时调用 islower；非零即命中，若要获得大写形式则使用 toupper。", "q", true,
      " 它只判断类别，不会像 toupper 那样返回转换字符。"),
    conversion("toupper-function", "toupper", ["转大写"], "toupper 在存在对应形式时把小写字符转换为大写。",
      "需要单字节的大写形式时调用 toupper；用 int 接收返回值，再在确认不是 EOF 后按 unsigned char 保存。", "a", "A",
      " 是否能转换以及结果会受当前区域设置影响。"),
    conversion("tolower-function", "tolower", ["转小写"], "tolower 在存在对应形式时把大写字符转换为小写。",
      "需要单字节的小写形式时调用 tolower；返回的是转换值而非状态码，不可用非零来判断是否发生变化。", "Z", "z",
      " 它不会扩展成多字节文本，也不执行 Unicode 大小写折叠。"),
    predicate("ispunct-function", "ispunct", ["标点判断"], "ispunct 判断字符是否为可打印但非空白、非字母数字的标点。",
      "词法分析中识别单字节标点时调用 ispunct；非零表示命中，具体集合可能随区域设置变化。", "!", true,
      " 它排除字母、数字和空白，但并不代表所有符号都有相同语义。"),
    predicate("isxdigit-function", "isxdigit", ["十六进制数字判断"], "isxdigit 判断字符是否可作为十六进制数字。",
      "解析十六进制数字前缀后的单个数字时调用 isxdigit；它接受 0-9、a-f、A-F，返回值只按零与非零解释。", "F", true,
      " 它不接受 0x 前缀中的字母 x，前缀需由解析器另外处理。"),
    predicate("isprint-function", "isprint", ["可打印字符判断"], "isprint 判断字符是否可打印并包含空格。",
      "过滤终端或日志中的不可打印控制字节时调用 isprint；空格也会得到非零，若要排除空格使用 isgraph。", " ", true,
      " 它与 isgraph 的差别在于普通空格属于 isprint。"),
    predicate("iscntrl-function", "iscntrl", ["控制字符判断"], "iscntrl 判断字符是否属于控制字符类。",
      "检查换行、制表或其他控制字节时调用 iscntrl；非零表示控制类，具体扩展字符受当前区域设置影响。", "\\n", true,
      " 控制字符通常不可打印，但不能用简单数值范围替代区域分类。"),
    predicate("isgraph-function", "isgraph", ["图形字符判断"], "isgraph 判断字符是否可打印且不是空格。",
      "要求字节具有可见图形表示时调用 isgraph；它对普通空格返回零，而 isprint 对空格返回非零。", "#", true,
      " 它包含字母、数字和标点，并明确排除普通空格。"),
    predicate("isblank-function", "isblank", ["横向空白判断"], "isblank 判断字符是否为空格或横向制表等空白。",
      "只想跳过同一行内的空格和横向制表时调用 isblank；需要同时接受换行等空白则选择 isspace。", "\\t", true,
      " C11 要求它识别空格与横向制表，区域设置还可能增加其他字符。")
  ]);
}());
