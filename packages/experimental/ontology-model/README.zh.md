# @deepseek-ai/dsh-experimental-ontology-model

[English](README.md) | 中文

类 Palantir 的本体语义模型，以纯内存库的形式提供：六种实体类型——带类型化属性的对象类型、链接类型、动作类型、值类型、指标与规则——外加样本实例、沙箱表达式引擎、引用完整性校验、测试引擎以及带版本的 JSON 序列化/反序列化。范围取舍由[本体模型 Agent Note](../../../.agents/notes/implemented/feature/2026-08-21-experimental-ontology-model.zh.md)负责记录。

## 领域模型

`src/types.ts` 定义带版本的 `Ontology` 文档。每个实体携带一个不透明 `id`（跨实体引用的通货）、每种类型内唯一的 lowerCamelCase `apiName`、显示名与描述。

- **ObjectType（对象类型）** — 类型化的 `PropertyDef` 列表，外加 `primaryKey` 与 `titleProperty`（均为自身属性的 apiName）。
- **LinkType（链接类型）** — `sourceObjectTypeId`/`targetObjectTypeId`，以及 `ONE_TO_ONE`/`ONE_TO_MANY`/`MANY_TO_MANY` 基数。
- **ActionType（动作类型）** — 类型化参数、修改目标（对某对象类型的 `create`/`modify`/`delete`），以及引用规则 id 的提交准则。
- **ValueType（值类型）** — 带约束的原始类型（`pattern`、`min`/`max`、`enumValues`），可被对象属性复用。
- **Metric（指标）** — 对某对象类型实例做 `count`/`sum`/`avg`/`min`/`max` 聚合，可选表达式过滤。
- **Rule（规则）** — 某对象类型实例必须满足的布尔表达式，带 `error`/`warning` 严重级别。

刻意不存在“操作类型”这一概念；动作类型是唯一的修改概念。

## 表达式引擎

`evaluate(src, scope)` 与 `checkSyntax(src)` 实现一套封闭的递归下降文法：字面量、作用域标识符、算术、比较、`&&`/`||`/`!`（以及 `and`/`or`/`not` 别名）与括号。没有属性访问、没有函数调用、没有可达的原型链，也不使用 JavaScript `eval`；未知标识符以及数值运算符收到非数值操作数时会抛错。

## 校验与测试

`validateOntology(o)` 返回覆盖以下方面的 `ValidationIssue`：apiName 规范性与每种类型内的唯一性、属性唯一性与值类型引用、主键/标题属性存在性、链接两端、动作目标与提交准则、指标的对象/属性/数值检查、规则与过滤表达式语法，以及样本实例的对象引用。动作缺少修改目标与无属性的对象类型是警告；其余均为错误。

测试引擎针对 `sampleInstances` 运行：`runRule` 统计通过/未通过实例与求值错误；`runMetric` 先过滤再聚合（无数值匹配时为 null）；`checkInstances` 按对象类型的属性模式对每个实例的取值做类型检查（必填、数组、元素基础类型、未知键）。

## 文档辅助

`emptyOntology`/`sampleOntology` 构造文档（示例为一个物流领域，覆盖全部实体类型，并包含一个刻意违反其规则的实例）。`ontologyReducer` 以不可变方式应用编辑器变更；`KIND_FIELD` 把实体类型映射到文档字段。`parseOntology` 只接受实体字段为数组的 `formatVersion: 1` JSON 对象；`stringifyOntology` 输出带缩进的 JSON。

## YAML 投影

`stringifyOntologyYaml` 以结构与字段名不变的方式把同一份六类文档渲染为 YAML。`toOsiYaml` 把模型转换为 OSI 规范的本体 YAML：值类型转换为 `ValueType` 概念，`extends` 指向映射后的基础类型，pattern/min/max/enum 约束转换为 `requires`；对象类型转换为 `EntityType` 概念，其属性成为指向各自值概念的 relationship（主键 relationship 为 `OneToOne` 并写入 `identify_by`）；链接类型转换为多端上的 relationship（`ONE_TO_MANY` 挂在目标对象类型上），`MANY_TO_MANY` 链接转换为一个连接 `EntityType`，带一个合成 id relationship 以及每端各一个 `ManyToOne` relationship；指标转换为 `derived_by` relationship；规则表达式按原文作为实体级 `requires` 携带。动作类型与样本实例没有 OSI 对应概念，OSI 投影中省略。

## Known Limitations and Deferred Work

- **尚无产品客户端组合** — 本包是领域内核；独立的 [`dsh-experimental-ontology-studio`](../ontology-studio/README.zh.md) 编辑器消费它，但基于 `apps/web` 的客户端插件被推迟。
- **实例解析是结构性而非语义性的** — `parseOntology` 只检查外层信封与数组形状；实体级形状错误由后续的 `validateOntology`/`checkInstances` 暴露，而非在解析时。
- **值类型约束未在实例上强制执行** — `pattern`/`min`/`max`/`enumValues` 作为定义被校验，但 `checkInstances` 只检查基础类型。
