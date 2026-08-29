/** Controlled studio surface: topbar, section navigation, entity CRUD, and the testing view. */
import {
  KIND_FIELD,
  emptyOntology,
  parseOntology,
  sampleOntology,
  stringifyOntology,
  stringifyOntologyYaml,
  toOsiYaml,
  validateOntology,
} from '@deepseek-ai/dsh-experimental-ontology-model'
import type {
  EntityKind, Ontology, OntologyAction, OntologyEntity,
} from '@deepseek-ai/dsh-experimental-ontology-model'
import { useMemo } from 'react'
import { KIND_LABELS, newEntity } from '../helpers.ts'
import { exportFile, importFile } from './bridge.ts'
import { EntityEditor } from './editors.tsx'
import { InstancesPanel } from './InstancesPanel.tsx'
import { TestPanel } from './TestPanel.tsx'
import css from './studio.module.css'

const KINDS: EntityKind[] = [
  'objectType',
  'linkType',
  'actionType',
  'valueType',
  'metric',
  'rule',
]

/** Navigable studio sections: the six entity kinds plus instances and testing. */
export type StudioSection = EntityKind | 'instances' | 'testing'

/** Controlled props of the studio surface: state and callbacks only, no context. */
export interface StudioSurfaceProps {
  /** Current ontology document. */
  ontology: Ontology
  /** Active navigation section. */
  section: StudioSection
  /** Selected entity id within an entity section, or null. */
  selectedId: string | null
  /** Dispatch one ontology document action. */
  onAction: (action: OntologyAction) => void
  /** Switch the active section. */
  onSectionChange: (section: StudioSection) => void
  /** Select an entity within the active section. */
  onSelect: (id: string | null) => void
  /** Close control rendered in the topbar when the host embeds the surface. */
  onClose?: () => void
}

/**
 * Render the full editor surface from controlled state. Import/export use the
 * browser file bridge; every document change flows through `onAction`.
 * @param props - Controlled state and callbacks; see {@link StudioSurfaceProps}.
 * @returns The surface element.
 */
export function StudioSurface(props: StudioSurfaceProps) {
  const { ontology, section, selectedId, onAction, onSectionChange, onSelect, onClose } = props
  const issues = useMemo(() => validateOntology(ontology), [ontology])
  const errorCount = issues.filter(i => i.severity === 'error').length

  const entities: OntologyEntity[] =
    section !== 'instances' && section !== 'testing' ? ontology[KIND_FIELD[section]] : []
  const selected = entities.find(e => e.id === selectedId) ?? null

  const importOntology = async () => {
    const json = await importFile()
    if (json === null) return
    try {
      onAction({ type: 'set', ontology: parseOntology(json) })
      onSelect(null)
    } catch (e) {
      alert(`导入失败: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  return (
    <div className={css.studio}>
      <div className={css.topbar}>
        <h1 className={css.title}>Ontology Studio</h1>
        <input
          className={css.name}
          value={ontology.name}
          onChange={(e) =>{  onAction({ type: 'rename', name: e.target.value }) }}
        />
        {errorCount > 0 ? (
          <span className={`${css.badge} ${css.badgeError}`}>{errorCount} 个校验错误</span>
        ) : (
          <span className={`${css.badge} ${css.badgeOk}`}>校验通过</span>
        )}
        <div className={css.spacer} />
        <button className={css.ghost} onClick={() => void importOntology()}>
          导入
        </button>
        <button className={css.ghost} onClick={() =>{  exportFile(stringifyOntology(ontology)) }}>
          导出 JSON
        </button>
        <button
          className={css.ghost}
          onClick={() =>{  exportFile(stringifyOntologyYaml(ontology), 'ontology.yaml', 'application/yaml') }}
        >
          导出 YAML
        </button>
        <button
          className={css.ghost}
          onClick={() =>{  exportFile(toOsiYaml(ontology), 'ontology.osi.yaml', 'application/yaml') }}
        >
          导出 OSI
        </button>
        <button
          className={css.ghost}
          onClick={() => {
            onAction({ type: 'set', ontology: sampleOntology() })
            onSelect(null)
          }}
        >
          载入示例
        </button>
        <button
          className={css.danger}
          onClick={() => {
            onAction({ type: 'set', ontology: emptyOntology() })
            onSelect(null)
          }}
        >
          清空
        </button>
        {onClose !== undefined && (
          <button className={css.ghost} onClick={onClose}>
            关闭
          </button>
        )}
      </div>
      <div className={css.layout}>
        <nav className={css.nav}>
          {KINDS.map(k => (
            <button
              key={k}
              className={section === k ? `${css.navButton} ${css.navButtonActive}` : css.navButton}
              onClick={() => {
                onSectionChange(k)
                onSelect(null)
              }}
            >
              {KIND_LABELS[k]}
              <span className={css.count}>{ontology[KIND_FIELD[k]].length}</span>
            </button>
          ))}
          <button
            className={section === 'instances' ? `${css.navButton} ${css.navButtonActive}` : css.navButton}
            onClick={() =>{  onSectionChange('instances') }}
          >
            样本实例
            <span className={css.count}>{ontology.sampleInstances.length}</span>
          </button>
          <button
            className={section === 'testing' ? `${css.navButton} ${css.navButtonActive}` : css.navButton}
            onClick={() =>{  onSectionChange('testing') }}
          >
            测试与校验
          </button>
        </nav>
        <div className={css.content}>
          {section === 'testing' ? (
            <TestPanel o={ontology} />
          ) : section === 'instances' ? (
            <InstancesPanel
              o={ontology}
              onUpsert={(s) =>{  onAction({ type: 'upsertInstance', instance: s }) }}
              onRemove={(id) =>{  onAction({ type: 'removeInstance', id }) }}
            />
          ) : (
            <>
              <div className={css.listPane}>
                <p>
                  <button
                    className={css.primary}
                    onClick={() => {
                      const e = newEntity(section, ontology)
                      onAction({ type: 'upsert', entity: e })
                      onSelect(e.id)
                    }}
                  >
                    + 新建{KIND_LABELS[section]}
                  </button>
                </p>
                {entities.map(e => (
                  <div
                    key={e.id}
                    className={e.id === selectedId ? `${css.item} ${css.itemSelected}` : css.item}
                    onClick={() =>{  onSelect(e.id) }}
                  >
                    <div>{e.displayName}</div>
                    <div className={css.api}>{e.apiName}</div>
                  </div>
                ))}
                {entities.length === 0 && <div className={css.empty}>暂无{KIND_LABELS[section]}</div>}
              </div>
              <div className={css.editorPane}>
                {selected === null ? (
                  <div className={css.empty}>从左侧选择或新建一个{KIND_LABELS[section]}</div>
                ) : (
                  <>
                    <EntityEditor
                      o={ontology}
                      entity={selected}
                      onChange={(e) =>{  onAction({ type: 'upsert', entity: e }) }}
                    />
                    <p>
                      <button
                        className={css.danger}
                        onClick={() => {
                          onAction({ type: 'remove', kind: selected.kind, id: selected.id })
                          onSelect(null)
                        }}
                      >
                        删除此{KIND_LABELS[selected.kind]}
                      </button>
                    </p>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
