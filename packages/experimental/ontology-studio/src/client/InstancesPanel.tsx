/** Sample-instance editor: JSON values per instance, used by the testing panel. */
import { newId } from '@deepseek-ai/dsh-experimental-ontology-model'
import type { Ontology, SampleInstance } from '@deepseek-ai/dsh-experimental-ontology-model'
import { useState } from 'react'
import css from './studio.module.css'

function InstanceCard(props: {
  o: Ontology
  instance: SampleInstance
  onChange: (s: SampleInstance) => void
  onRemove: () => void
}) {
  const { o, instance, onChange, onRemove } = props
  const [draft, setDraft] = useState(JSON.stringify(instance.values, null, 2))
  const [error, setError] = useState<string | null>(null)
  const apply = () => {
    try {
      const parsed: unknown = JSON.parse(draft)
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        throw new Error('必须是 JSON 对象')
      }
      onChange({ ...instance, values: parsed as Record<string, unknown> })
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }
  return (
    <div className={css.resultCard}>
      <h4 className={css.mono}>{instance.id}</h4>
      <div className={css.field}>
        <label>对象类型</label>
        <select
          value={instance.objectTypeId}
          onChange={(e) =>{  onChange({ ...instance, objectTypeId: e.target.value }) }}
        >
          {o.objectTypes.map(t => (
            <option key={t.id} value={t.id}>
              {t.displayName}
            </option>
          ))}
        </select>
      </div>
      <div className={css.field}>
        <label>属性值（JSON）</label>
        <textarea value={draft} onChange={(e) =>{  setDraft(e.target.value) }} rows={5} />
      </div>
      {error !== null && (
        <p className={css.errorText}>
          {error}
        </p>
      )}
      <button className={css.primary} onClick={apply}>
        应用
      </button>{' '}
      <button className={css.danger} onClick={onRemove}>
        删除实例
      </button>
    </div>
  )
}

/**
 * Editor list over all sample instances.
 * @param props - Current ontology plus upsert and removal callbacks.
 * @returns The panel element.
 */
export function InstancesPanel(props: {
  o: Ontology
  onUpsert: (s: SampleInstance) => void
  onRemove: (id: string) => void
}) {
  const { o, onUpsert, onRemove } = props
  const addInstance = () => {
    const first = o.objectTypes[0]
    if (first !== undefined) onUpsert({ id: newId('inst'), objectTypeId: first.id, values: {} })
  }
  return (
    <div className={css.editorPane}>
      <h3 className={css.section}>样本实例（用于规则/指标测试）</h3>
      <p>
        <button className={css.primary} disabled={o.objectTypes.length === 0} onClick={addInstance}>
          + 添加样本实例
        </button>
      </p>
      {o.sampleInstances.length === 0 && <p className={css.muted}>尚未添加样本实例。</p>}
      {o.sampleInstances.map(s => (
        <InstanceCard
          key={s.id}
          o={o}
          instance={s}
          onChange={onUpsert}
          onRemove={() =>{  onRemove(s.id) }}
        />
      ))}
    </div>
  )
}
