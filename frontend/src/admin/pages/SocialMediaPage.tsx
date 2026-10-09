import { useState, type FormEvent } from 'react'
import { PageHeader } from '../components/Layout'
import { Button, Card, ErrorState, Field, Input, Skeleton } from '../components/ui'
import { useSession, useToast } from '../context/contexts'
import { api, ApiError } from '../lib/api'
import { useQuery } from '../lib/hooks'
import type { SocialAccount } from '../lib/types'
import { SocialIcon, type SocialNetwork } from '../components/SocialIcons'

const networks = [
  { key: 'instagram', label: 'Instagram', placeholder: 'https://www.instagram.com/yourpage' },
  { key: 'facebook', label: 'Facebook', placeholder: 'https://www.facebook.com/yourpage' },
  { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@yourchannel' },
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://www.linkedin.com/company/yourpage' },
  { key: 'twitter', label: 'X (Twitter)', placeholder: 'https://x.com/yourhandle' },
] as const

type NetworkKey = (typeof networks)[number]['key']

function SocialLink({ url, network }: { url: string; network: SocialNetwork }) {
  const toast = useToast()
  if (!url) return <span className="crm-social-link crm-social-empty"><SocialIcon network={network} />Not added</span>
  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Link copied')
    } catch {
      toast.error('Could not copy the link')
    }
  }
  return (
    <div className="crm-social-link">
      <a href={url} target="_blank" rel="noopener noreferrer" title={url} className="crm-social-open"><SocialIcon network={network} />Open</a>
      <button type="button" className="crm-link" onClick={() => void copy()}>Copy</button>
    </div>
  )
}

export function SocialMediaPage() {
  const { meta } = useSession()
  const canEdit = meta.capabilities.isSuperAdmin
  const { data, error, reload } = useQuery('social-accounts', () => api.get<{ accounts: SocialAccount[] }>('/admin/social'))
  const [editing, setEditing] = useState(false)

  return (
    <>
      <PageHeader
        title="Social media"
        description="Official social media pages. Open or copy a link to share it with a customer."
        actions={canEdit && !editing && data && <Button variant="primary" onClick={() => setEditing(true)}>Edit links</Button>}
      />
      {error && !data ? <ErrorState error={error} onRetry={() => void reload()} /> : !data ? <Skeleton rows={4} /> : editing ? (
        <SocialEditor
          accounts={data.accounts}
          onCancel={() => setEditing(false)}
          onSaved={() => {
            setEditing(false)
            void reload({ silent: true })
          }}
        />
      ) : (
        <Card padded={false}>
          <div className="crm-table-wrap">
            <table className="crm-table">
              <thead><tr><th>Page</th>{networks.map((network) => <th key={network.key}>{network.label}</th>)}</tr></thead>
              <tbody>
                {data.accounts.length === 0 ? (
                  <tr><td colSpan={networks.length + 1} className="crm-muted">No pages added yet.</td></tr>
                ) : data.accounts.map((account, index) => (
                  <tr key={account._id ?? index}>
                    <td><strong>{account.name}</strong></td>
                    {networks.map((network) => <td key={network.key}><SocialLink url={account[network.key]} network={network.key} /></td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  )
}

function SocialEditor({ accounts, onCancel, onSaved }: { accounts: SocialAccount[]; onCancel: () => void; onSaved: () => void }) {
  const toast = useToast()
  const [rows, setRows] = useState<SocialAccount[]>(() => accounts.map((account) => ({ ...account })))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const update = (index: number, key: 'name' | NetworkKey, value: string) => setRows(rows.map((row, i) => (i === index ? { ...row, [key]: value } : row)))

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setErrors({})
    try {
      await api.put('/admin/social', { accounts: rows })
      toast.success('Social media links saved')
      onSaved()
    } catch (caught) {
      if (caught instanceof ApiError) setErrors(caught.fields)
      toast.error(caught)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="crm-stack" onSubmit={submit} noValidate>
      {rows.map((row, index) => (
        <Card
          key={row._id ?? `new-${index}`}
          title={row.name || 'New page'}
          actions={<Button size="sm" variant="ghost" onClick={() => setRows(rows.filter((_, i) => i !== index))}>Remove</Button>}
        >
          <div className="crm-form-grid">
            <Field label="Page / brand name" required error={errors[`accounts.${index}.name`]}>
              <Input value={row.name} onChange={(event) => update(index, 'name', event.target.value)} placeholder="e.g. Dhanvia" />
            </Field>
            {networks.map((network) => (
              <Field key={network.key} label={`${network.label} link`} error={errors[`accounts.${index}.${network.key}`]}>
                <div className="crm-social-input"><SocialIcon network={network.key} size={22} /><Input type="url" inputMode="url" value={row[network.key] ?? ''} onChange={(event) => update(index, network.key, event.target.value)} placeholder={network.placeholder} /></div>
              </Field>
            ))}
          </div>
        </Card>
      ))}
      <div className="crm-form-actions">
        <Button onClick={() => setRows([...rows, { name: '', instagram: '', facebook: '', youtube: '', linkedin: '', twitter: '' }])}>Add another page</Button>
        <span className="crm-spacer" />
        <Button onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="primary" loading={saving}>Save links</Button>
      </div>
    </form>
  )
}
