# @deepseek-ai/dsh-experimental-ontology-studio

[English](README.md) | 中文

基于 [`@deepseek-ai/dsh-experimental-ontology-model`](../ontology-model/README.zh.md) 的浏览器编辑器：一个 Web 客户端插件（外加独立 Vite 页面），侧边栏在六种本体实体类型之间导航——对象类型（含类型化对象属性）、链接类型、动作类型、值类型、指标与规则——外加样本实例编辑器和一个实时运行校验、规则、指标与实例模式检查的测试面板。范围取舍由[本体工作台 Agent Note](../../../.agents/notes/implemented/feature/2026-08-21-experimental-ontology-studio.zh.md)负责记录。

## 运行

```sh
pnpm --filter @deepseek-ai/dsh-experimental-ontology-studio dev        # dev server on port 5199
pnpm --filter @deepseek-ai/dsh-experimental-ontology-studio build:app  # static bundle in dist/
pnpm dsh web --patch examples/web-ontology/cordis.yml                  # mount into the Web profile
```

独立应用从 `index.html` → `src/main.tsx` 启动，自带图标（`public/icon.svg`）与样式表（`public/styles.css`，为界面样式消费的主题令牌提供暗色取值）。

## Web 客户端插件

`src/client/index.ts` 是浏览器插件入口（以 `exports["./client"]` 发布，通过 package.json 的 `dsh.client` 声明块声明，由 `pnpm --filter @deepseek-ai/dsh-experimental-ontology-studio bundle` 打包）。它的 `apply` 创建一个 entry 声明的 store（`src/client/store.ts`：本体文档——持久化在 localStorage 的 `dsh-ontology-studio` 键下——外加覆盖层可见性、当前分区与选中项），并在其上注册两个 slot 条目：`sidebar.footer.action` 启动器（`src/client/OntologyLauncher.tsx`）与 `shell.overlay` 编辑器界面（`src/client/OntologyOverlay.tsx`）。组件只通过 props 接收状态与回调；每次文档变更都经由 store 的 `dispatchDocument` 动作流经模型包的 `ontologyReducer`。该包是实验包，官方发布不包含它；[examples/web-ontology](../../../examples/web-ontology/README.zh.md) 是从源码检出将其挂载进 Web profile 的可选覆盖层。

## 编辑器设计

`src/client/StudioSurface.tsx` 是两种宿主共享的受控编辑器界面：文档、查看状态与回调全部通过 props 传入。`src/client/App.tsx` 是其上的独立外壳：用 `useReducer` 套住模型包的 `ontologyReducer`，挂载时加载持久化文档（读不到时回落到内置的物流示例），并在每次变更后自动保存。顶栏可重命名本体、显示实时校验错误计数，并提供导入/导出（JSON 文件）、载入示例与清空。侧边栏在六个实体分区（各自是列表窗格加 `src/client/editors.tsx` 中按类型分派的编辑器）、样本实例编辑器（`src/client/InstancesPanel.tsx`）与测试面板（`src/client/TestPanel.tsx`，渲染 `validateOntology`、`runRule`、`runMetric` 与 `checkInstances` 的结果）之间切换。刻意不存在“操作类型”分区；动作类型是唯一的修改概念。

`src/helpers.ts`（包的公开入口）保留与 React 无关的编辑器逻辑——类型标签、基础类型列表与 `newEntity` 工厂——因此 node 测试通道可以覆盖它。

## 持久化

`src/client/bridge.ts` 将序列化文档持久化到 `localStorage` 的 `dsh-ontology-studio-document` 键下，并通过浏览器下载/文件选择原语实现文件导入/导出。文档使用模型包带版本的 `parseOntology`/`stringifyOntology` JSON 格式，因此文件可与模型的任何其他消费方互通。

## Known Limitations and Deferred Work

- **官方发布不包含** —— 该包是实验包，随附的 Web 组合不包含它；加载它需要在源码检出上叠加 `examples/web-ontology` 覆盖层。
- **React 组件缺少自动化覆盖** —— `src/client/*.tsx` 与 `src/main.tsx` 带有 TODO(gui) 覆盖豁免；与 React 无关的辅助逻辑有单元测试，`tests/client-bundle.client.spec.ts` 覆盖构建产物的交接、slot 注册与销毁。
- **仅 localStorage 持久化** —— 没有工作区或服务端持久化；清除浏览器存储会丢失文档，除非先导出。
