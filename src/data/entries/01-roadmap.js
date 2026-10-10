(function () {
  "use strict";

  window.C_SYNTAX_ADD_ENTRIES([
    {
      id: "learning-roadmap",
      name: "C 语言学习路线图",
      aliases: ["C 学习路线", "入门流程图", "C 语言怎么学"],
      category: "入门基础",
      summary: "一张从零开始、直到能独立完成 C 语言小项目的学习顺序图。",
      behavior: "路线图把知识点按依赖关系从上到下排列：先让第一个程序成功运行并学会看报错，再学习变量、输入输出、流程控制、函数、数组、指针、结构体、内存和文件，最后把这些内容组合成小项目。每个节点都可作为下一步学习入口。",
      usage: "第一次学习 C、复习时找知识缺口，或不知道下一步该学什么时，从图的顶部开始，沿连线逐项学习；程序跑不起来时先走报错分支，修正后再继续向下。",
      syntax: "先跑通程序 → 看懂报错 → 变量类型 → 输入输出 → 运算符 → 分支循环 → 函数 → 数组字符串 → 指针 → 结构体 → 内存 → 文件 → 小项目",
      headers: ["stdio.h"],
      example: "#include <stdio.h>\n\nint main(void) {\n    printf(\"Hello, C!\\n\");\n    return 0;\n}\n",
      notes: [
        "按从上到下的顺序学习，不要在还不熟悉变量和数组时跳着学习指针。",
        "每学完一个知识点，就亲手运行词条下面的示例并完成对应练习。",
        "卡住时先保留完整报错和最小可复现代码，再交给 DeepSeek 帮你分析和批改。",
        "学完一阶段后尝试不看示例重写一次，确认自己能解释每一行代码。"
      ],
      related: ["first-program", "how-to-compile", "compile-error-reading", "small-program-structure"],
      keywords: ["学习路线", "入门顺序", "流程图", "怎么学", "学习计划"]
    }
  ]);
}());
