import { dateRangePresets, type DateRangeValue } from '../lib/format'
import { Input } from './ui'

export function DateRange({ value, onChange }: { value: DateRangeValue; onChange: (value: DateRangeValue) => void }) {
  return (
    <div className="crm-date-range">
      <div className="crm-segmented">
        {dateRangePresets.map((preset) => {
          const range = preset.range()
          const active = range.from === value.from && range.to === value.to
          return <button key={preset.label} type="button" className={active ? 'active' : ''} onClick={() => onChange(range)}>{preset.label}</button>
        })}
      </div>
      <Input type="date" value={value.from} max={value.to} onChange={(event) => event.target.value && onChange({ ...value, from: event.target.value })} aria-label="From date" />
      <span className="crm-muted">to</span>
      <Input type="date" value={value.to} min={value.from} onChange={(event) => event.target.value && onChange({ ...value, to: event.target.value })} aria-label="To date" />
    </div>
  )
}
