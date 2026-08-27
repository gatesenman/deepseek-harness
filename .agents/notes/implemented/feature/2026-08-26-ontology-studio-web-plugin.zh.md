# Agent Note：本体工作台 Web 客户端插件

Status: implemented

[English](2026-08-26-ontology-studio-web-plugin.md) | 中文

## 问题

本体工作台编辑器此前只是独立的 Vite 应用：全局字面量颜色样式、没有 slot/store 集成，也无法在产品 Web 客户端里打开。晋升进外壳是[本体工作台笔记](2026-08-21-experimental-ontology-studio.zh.md)推迟的后续工作。

## 决定

包新增浏览器插件半边（`src/client/index.ts`、`exports["./client"]`、带 `platform: web` 的 `dsh.client`，经共享的 `clientBundle` 预设打包），同时保留独立 Vite 页面。编辑器 UI 是两种宿主共享的一个受控组件 `StudioSurface`：独立 `App.tsx` 用 `useReducer` + `bridge.ts` 持久化驱动它，插件则用一个 entry 声明的 store（`store.ts`：持久化在 `dsh-ontology-studio` 键下的本体文档，外加覆盖层可见性、分区与选中项）驱动它。插件在同一个 store 句柄上注册两个条目：`sidebar.footer.action` 启动器与 `shell.overlay` 编辑器界面，因此工作台在应用框架之上打开，不触碰 `root` slot。

样式从全局字面量颜色迁移为基于主题 `--dsw-alias-*` 令牌的 CSS Module；独立页面的 `public/styles.css` 现在只定义这些令牌的暗色取值和页面基础样式。

由于该包是实验包，随附的 Web 组合不包含它。`examples/web-ontology/cordis.yml` 是从源码检出将其挂载进 Web profile 的可选覆盖层（沿用 `web-schedule` 模式）。浏览器 bundle 内联 `dsh-experimental-ontology-model`（已加入 `packages/client/tsdown.client.ts` 的 `INLINE_SAFE`）：模型是纯内存库，没有 context 或单例状态，而动态 external 会要求 Web 宿主随附它。

真实组合覆盖是 `tests/client-bundle.client.spec.ts`：执行构建出的 `lib/client.js`，断言 `window.__ModuleLoader__` 交接 id 与 DI-require 工厂，在声明了框架席位的真实 `SlotRegistry` 上以对象插件方式挂载导出，断言两个注册均落位，并断言销毁会移除它们、且带插件标记的 module CSS 已注入。

## 考虑过的替代方案

**把包登记进 `packages/bundle/web-app/cordis.patch.yml`。** 否决：那是发布 Web 组合，发布组合不得依赖 `packages/experimental`。

**让本体模型保持动态 external。** 否决：只有随附的宿主包才是可服务的 external；实验性的值依赖要么内联，要么在运行时弄坏 Loader。

## 后果

`pnpm dsh web --patch examples/web-ontology/cordis.yml` 挂载工作台：侧边栏底部的 ◈ 启动器切换一个承载完整编辑器（六类实体、样本实例、测试面板）的框架级覆盖层。插件的文档 store 与独立页面的 `bridge.ts` 持久化使用不同的 localStorage 键，因此两种宿主各自维护独立文档。工作区/服务端持久化与 locale 记录仍然推迟。
