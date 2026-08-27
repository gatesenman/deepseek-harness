# web-ontology

English | [中文](README.zh.md)

Opt-in Web overlay loading [`@deepseek-ai/dsh-experimental-ontology-studio`](../../packages/experimental/ontology-studio/README.md): a Palantir-style ontology modeling and testing surface over the six entity kinds (objectType, linkType, actionType, valueType, metric, rule), sample instances, and a testing panel. The package is experimental, so official releases exclude it; this overlay is how a source checkout mounts it into the Web profile.

## Run it

```sh
pnpm dsh web --patch examples/web-ontology/cordis.yml
```

Open the Web UI, then press the ◈ launcher in the sidebar footer to open the studio over the app frame. The ontology document persists in the browser's localStorage; no server-side state is involved.
