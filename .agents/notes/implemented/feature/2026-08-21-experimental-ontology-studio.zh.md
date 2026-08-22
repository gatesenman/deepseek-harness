# Agent Note: 实验性本体工作台编辑器

Status: implemented

[English](2026-08-21-experimental-ontology-studio.md) | 中文

## Problem

本体语义模型包（`dsh-experimental-ontology-model`）是一个没有用户界面的纯库：编写本体、编辑样本实例、查看校验/测试结果都只能靠编程访问。编辑器是该包的第一个真实消费方，也是弄清未来服务接缝需要哪些操作的最快途径。

## Decision

一个私有包 `@deepseek-ai/dsh-experimental-ontology-studio`，承载一个基于模型库、由 Vite 提供服务的独立 React 编辑器。外壳（`src/client/App.tsx`）通过 `useReducer` 驱动模型的 `ontologyReducer`，自动保存到 `localStorage`，并用侧边栏在六种实体类型、样本实例编辑器与测试面板之间切换；测试面板实时渲染 `validateOntology`、`runRule`、`runMetric` 与 `checkInstances`。导入/导出使用模型带版本的 JSON 格式。应用在 `public/` 下自带图标与样式表。

包的公开入口（`src/helpers.ts`）刻意与 React 无关——类型标签、基础类型列表与 `newEntity` 工厂——因此 node 测试通道覆盖编辑器逻辑，而 React 外壳与 `vitest.config.ts` 中其他客户端通道债务一起带 TODO(gui) 覆盖豁免。

它是独立应用而非客户端插件：不注册任何 slot、store 或服务，因此产品可见插件的真实组合测试要求不适用。与模型包一致，其 invariant 伴生是有解释的空实现。

## Alternatives considered

**现在就做一个挂在 `apps/web` 外壳上的 `packages/client/ui-ontology-*` 插件。** 本阶段否决：组合进产品客户端意味着 slot、入口声明的 store、locale 记录、主题令牌与真实组合测试——只有当编辑器的操作集稳定之后才值得做。独立应用以最小表面验证编辑器；晋升是带独立 Note 的后续工作。

**直接在 `apps/web` 中加一个本体路由。** 否决：`apps/web` 是 `dsh-client-web` 之上的薄 Vite 入口；把实验性编辑器嵌进去会让实验代码进入发布路径，这是 `packages/experimental` 规则禁止的。

## Consequences

用户获得一个可运行的编辑器（`pnpm --filter @deepseek-ai/dsh-experimental-ontology-studio dev`），覆盖完整建模闭环：编写实体、编辑实例、实时查看校验与测试更新。持久化仅限浏览器本地。编辑器的使用情况将决定模型是否需要 Cordis 服务接缝，以及产品客户端插件需要哪些操作；该晋升、更丰富的持久化与 React 外壳的测试覆盖是被推迟的后续工作。
