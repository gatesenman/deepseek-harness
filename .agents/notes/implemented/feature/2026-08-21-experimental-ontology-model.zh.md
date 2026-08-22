# Agent Note: 实验性本体语义模型包

Status: implemented

[English](2026-08-21-experimental-ontology-model.md) | 中文

## Problem

一个类 Palantir 的本体工作台需要一套语义模型——带类型化属性的对象类型、链接类型、动作类型、值类型、指标与规则——外加校验与基于样本实例的测试引擎。Harness 中没有这一领域的归属方：它不是工具，不是对外部系统的能力接缝，也没有任何发布分组的产品职责覆盖“用户编写的语义模式”。规则与指标过滤表达式还需要求值，而在 harness 进程内用 JavaScript `eval` 运行用户编写的文本是不可接受的。

## Decision

一个私有包 `@deepseek-ai/dsh-experimental-ontology-model`，以纯内存库的形式承载领域内核：带版本的 `Ontology` 文档及其六种实体类型、一个封闭的递归下降表达式引擎（字面量、作用域标识符、算术、比较、布尔逻辑——没有属性访问、函数调用或可达的原型链）、负责标识符规范性与引用完整性的 `validateOntology`、基于样本实例的测试引擎（`runRule`/`runMetric`/`checkInstances`）、不可变的编辑器 reducer，以及只接受 `formatVersion: 1` 的格式检查 JSON 序列化/反序列化。

实体类型集合刻意封闭在六种：不存在“操作类型”。Palantir 的本体用动作类型建模用户发起的变更；一个独立的操作概念会与该职责重复，且没有任何消费者能证明其必要。

该包不注册任何服务和工具——它只导出纯函数，因此未来任何编辑器 Consumer（网页 UI 插件、工具或 SDK 表面）都能在没有生命周期耦合的情况下组合它。其 invariant 伴生是带解释的空实现：包不拥有事件流或可变运行时数据；一致性由 `validateOntology` 与 100% 覆盖率的单元测试套件保证。

## Alternatives considered

**放入发布分组的包（如 `packages/core` 或新的 `ontology/` 分组）。** 否决：其公共契约完全是实验性的，尚无稳定归属方或生产消费者；`packages/experimental` 正是为此而存在，之后的晋升是一次原子重命名。

**现在就做成 Cordis 服务（`ctx.ontology`）。** 否决：服务接缝需要面向现有 Consumer 设计；在没有 Consumer 的情况下，服务会固化一套缺乏证据的公共操作集合。纯导出让未来的接缝保持开放。

**复用 JavaScript 表达式求值器（`eval`、`Function` 或外部依赖）。** 否决：`eval`/`Function` 会把宿主进程暴露给用户编写的文本，而表达式语言依赖会引入远超领域所需六种运算符封闭文法的更大文法；手写解析器约 200 行且有完整测试覆盖。

## Consequences

消费者获得一个确定性的、沙箱化的建模内核，可以安全地处理不可信文档。独立的 `dsh-experimental-ontology-studio` 编辑器是其第一个消费方；组合进产品客户端是自然的下一步，并将决定是否需要服务接缝。值类型约束（`pattern`/`min`/`max`/`enumValues`）作为定义被校验，但尚未在实例上强制执行；该强制执行属于同一个后续步骤。
