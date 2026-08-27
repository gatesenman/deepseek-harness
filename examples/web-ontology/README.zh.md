# web-ontology

[English](README.md) | 中文

按需加载 [`@deepseek-ai/dsh-experimental-ontology-studio`](../../packages/experimental/ontology-studio/README.zh.md) 的 Web 覆盖层：类 Palantir 的本体建模与测试界面，覆盖六类实体（objectType、linkType、actionType、valueType、metric、rule）、样本实例与测试面板。该包是实验包，官方发布不包含它；源码检出通过本覆盖层将其挂载进 Web profile。

## 运行

```sh
pnpm dsh web --patch examples/web-ontology/cordis.yml
```

打开 Web 界面后，点击侧边栏底部的 ◈ 启动器，即可在应用框架之上打开工作台。本体文档持久化在浏览器 localStorage 中，不涉及服务端状态。
