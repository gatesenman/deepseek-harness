# Agent Note：本体 YAML 投影（原生 + OSI）

Status: implemented

[English](2026-08-26-ontology-yaml-projections.md) | 中文

## 问题

本体模型此前只以 `formatVersion: 1` JSON 持久化。产品工作流用类 Palantir 的六类概念建模，完成后把设计交给 OSI 工具链，而后者消费的是另一套 YAML 模式（`ValueType`/`EntityType` 概念、snake_case relationship、`identify_by`、仅 `OneToOne`/`ManyToOne` 两种 multiplicity）。原生文档既没有 YAML 渲染，也没有到该模式的转换。

## 决定

`packages/experimental/ontology-model/src/osi.ts` 在不变的六类文档之上新增两种投影。`stringifyOntologyYaml` 通过一个面向 JSON 值子集的小型块式发射器，把文档渲染为结构与字段名完全一致的 YAML（不引入 YAML 依赖：发射器约 40 行、面向封闭值集合，模型包保持零依赖）。`toOsiYaml` 做确定性转换：值类型 → `ValueType` 概念（`extends` 指向映射后的基础类型；pattern/min/max/enum 转为 `requires` 表达式）；对象类型 → `EntityType` 概念，其属性成为指向各自值概念的 relationship，主键 relationship 为 `OneToOne` 并写入 `identify_by`；链接类型 → 多端上的 relationship（`ONE_TO_MANY` 挂在目标上），`MANY_TO_MANY` → 一个连接 `EntityType`，带合成的 `<link>_id` 标识 relationship 以及每端各一个 `ManyToOne` relationship；指标 → `derived_by` relationship（`COUNT`/`SUM`/`AVG`/`MIN`/`MAX`，过滤用 `WHERE`）；规则 → 按原文作为实体级 `requires`。动作类型与样本实例没有 OSI 对应概念，予以省略。

工作台顶栏把导出拆分为三个动作——原生 JSON（`stringifyOntology`）、原生 YAML（`stringifyOntologyYaml`，`ontology.yaml`）与 OSI YAML（`toOsiYaml`，`ontology.osi.yaml`）——经由加宽的 `exportFile(text, filename, mime)` 桥接实现。

## 曾考虑的替代方案

**依赖 `yaml` 包做序列化。** 否决：模型包是内联进浏览器包的零依赖内存库；值集合封闭，为约 40 行自有代码引入一个维护依赖并贯通客户端打包配置得不偿失。

**输出 `OneToMany`/`ManyToMany` multiplicity。** 否决：OSI 模式只定义 `OneToOne` 与 `ManyToOne`；转换改为把 relationship 重新锚定到多端。

## 后果

一份建模本体产出两份 YAML 文档：无损的原生渲染与 OSI 投影。OSI 输出按原文保留规则/过滤表达式，使用不同表达式文法的消费方需要自行翻译。YAML 反向解析回模型尚未实现；原生导入路径仍仅支持 JSON。
