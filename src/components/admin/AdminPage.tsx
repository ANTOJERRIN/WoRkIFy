import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useWorkify } from '../../context/WorkifyContext';
import { createWorkshop, updateWorkshop, setWorkshopStatus, listAdminWorkshops, getAdminMeetUrl, setWorkshopMeetUrl, listWorkshopRegistrations, type WorkshopInput } from '../../api/admin';
import { formatWorkshopSchedule, workshopLifecycle, parseWorkshopInstant } from '../../domain/workshopLifecycle';
import { validateWorkshopInput, RETIRED_WORKSHOP_ID } from '../../domain/workshopInput';
import { useWorkshopClock } from '../../hooks/useWorkshopClock';
import { useResource } from '../../hooks/useResource';
import { useModalDialog } from '../layout/useModalDialog';
import type { Workshop, WorkshopStatus } from '../../types';
import { Shield, Plus, Edit2, Video, Users, RefreshCw, Loader2, AlertCircle, X, ExternalLink } from 'lucide-react';

const panel = 'rounded-3xl bg-white dark:bg-[#0B1533] border border-[#DDE0E8] dark:border-white/10 p-6 sm:p-8 shadow-sm';
const field = 'w-full min-w-0 px-3 py-2 rounded-xl bg-[#F3F4F7] dark:bg-[#070C1F] border border-[#DDE0E8] dark:border-white/10 text-sm text-[#070C1F] dark:text-white focus:outline-none focus:border-[#2F6BFF]';
const primary = 'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#2F6BFF] hover:bg-[#1F54E0] disabled:opacity-50 text-white text-xs font-semibold';
type Run = (label: string, operation: (signal: AbortSignal) => Promise<unknown>, after?: (value: unknown) => void) => Promise<boolean>;

function WorkshopEditor({ workshop, busy, error, onClose, onSave }: {
  workshop: Workshop | null; busy: boolean; error: string | null; onClose: () => void; onSave: (input: WorkshopInput) => void;
}) {
  const dialog = useModalDialog(true, onClose);
  const instant = (value: string | null) => { const time = parseWorkshopInstant(value); return time === null ? '' : new Date(time).toISOString().slice(0,16); };
  const [input, setInput] = useState(() => ({ slug: workshop?.slug ?? '', title: workshop?.title ?? '', hostName: workshop?.hostName ?? 'Workify',
    status: workshop?.status ?? 'coming_soon' as WorkshopStatus, shortDescription: workshop?.shortDescription ?? '', fullDescription: workshop?.fullDescription ?? '',
    tags: workshop?.tags.join(', ') ?? '', startsAt: instant(workshop?.startsAt ?? null), endsAt: instant(workshop?.endsAt ?? null), timezone: workshop?.timezone ?? 'Asia/Kolkata' }));
  const [validation, setValidation] = useState<string | null>(null);
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    try {
      const value: WorkshopInput = { ...input, tags: input.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        startsAt: input.startsAt ? new Date(`${input.startsAt}Z`).toISOString() : null,
        endsAt: input.endsAt ? new Date(`${input.endsAt}Z`).toISOString() : null };
      const problem = validateWorkshopInput(value);
      setValidation(problem);
      if (!problem) onSave(value);
    } catch { setValidation('Provide valid UTC start and end times.'); }
  };
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
    <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby="workshop-editor-title" tabIndex={-1} className={`${panel} w-full max-w-2xl max-h-[90vh] overflow-y-auto`}>
      <div className="flex items-center justify-between border-b border-[#DDE0E8] dark:border-white/10 pb-4 mb-5">
        <h2 id="workshop-editor-title" className="text-lg font-bold">{workshop ? 'Edit Workshop' : 'Create New Workshop'}</h2>
        <button aria-label="Close workshop editor" onClick={onClose} disabled={busy}><X className="w-5 h-5" /></button>
      </div>
      {(validation || error) && <p role="alert" className="text-xs text-red-600 dark:text-red-400 mb-4">{validation || error}</p>}
      <form onSubmit={submit} noValidate>
        <fieldset disabled={busy} className="space-y-4 min-w-0 text-xs">
          <legend className="sr-only">Workshop details</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {([['title','Title *',160],['slug','Slug * (URL friendly)',80],['hostName','Host Name *',100],['timezone','Display timezone (IANA)',100]] as const).map(([key,label,max]) => <div key={key}>
              <label htmlFor={`workshop-${key}`} className="block font-semibold mb-1">{label}</label>
              <input id={`workshop-${key}`} className={field} value={input[key]} maxLength={max} required onChange={event => setInput(previous => ({ ...previous, [key]: event.target.value }))} />
            </div>)}
          </div>
          <div><label htmlFor="workshop-status" className="block font-semibold mb-1">Publication status</label>
            <select id="workshop-status" className={field} value={input.status} disabled={workshop?.id === RETIRED_WORKSHOP_ID} onChange={event => setInput(previous => ({ ...previous, status: event.target.value as WorkshopStatus }))}>
              <option value="open">Open publication</option><option value="coming_soon">Coming Soon</option><option value="cancelled">Cancelled</option><option value="archived">Archived</option>
            </select>
            {workshop?.id === RETIRED_WORKSHOP_ID && <p className="mt-2 text-[#636875] dark:text-gray-400">The retired workshop remains archived.</p>}
          </div>
          <div><label htmlFor="workshop-short" className="block font-semibold mb-1">Short Description</label>
            <input id="workshop-short" className={field} value={input.shortDescription} maxLength={500} onChange={event => setInput(previous => ({ ...previous, shortDescription: event.target.value }))} />
          </div>
          <div><label htmlFor="workshop-full" className="block font-semibold mb-1">Full Description</label>
            <textarea id="workshop-full" rows={4} className={field} value={input.fullDescription} maxLength={12000} onChange={event => setInput(previous => ({ ...previous, fullDescription: event.target.value }))} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {([['startsAt','Starts At (UTC)'],['endsAt','Ends At (UTC)']] as const).map(([key,label]) => <div key={key}>
              <label htmlFor={`workshop-${key}`} className="block font-semibold mb-1">{label}</label>
              <input id={`workshop-${key}`} type="datetime-local" className={field} value={input[key]} onChange={event => setInput(previous => ({ ...previous, [key]: event.target.value }))} />
            </div>)}
          </div>
          <p className="text-[#636875] dark:text-gray-400">Enter UTC instants. The display timezone controls how attendees see the schedule.</p>
          <div><label htmlFor="workshop-tags" className="block font-semibold mb-1">Tags (comma separated)</label>
            <input id="workshop-tags" className={field} value={input.tags} placeholder="AI Agents, Gen AI, Automation" onChange={event => setInput(previous => ({ ...previous, tags: event.target.value }))} />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-[#DDE0E8] dark:border-white/10">
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit" className={primary}>{busy ? 'Saving...' : workshop ? 'Save Changes' : 'Create Workshop'}</button>
          </div>
        </fieldset>
      </form>
    </div>
  </div>;
}

function MeetingEditor({ workshop, initial, busy, run, userId }: { workshop: Workshop; initial: string; busy: boolean; run: Run; userId: string }) {
  const [value, setValue] = useState(initial);
  return <form noValidate onSubmit={event => { event.preventDefault(); void run('Meet link saved.', signal => setWorkshopMeetUrl(workshop.id, value, userId, signal)); }} className="flex flex-col sm:flex-row gap-3">
    <label className="sr-only" htmlFor="admin-meet-link">Google Meet URL</label>
    <input id="admin-meet-link" type="url" className={`${field} flex-1`} value={value} disabled={busy} onChange={event => setValue(event.target.value)} placeholder="https://meet.google.com/xxx-xxxx-xxx" />
    <button disabled={busy} className={primary}>Save Meet Link</button>
  </form>;
}
function WorkshopDetails({ workshop, userId, busy, run, tab }: { workshop: Workshop; userId: string; busy: boolean; run: Run; tab: 'workshops' | 'registrations' }) {
  const closed = ['cancelled','archived'].includes(workshop.status);
  const load = useCallback(async (signal: AbortSignal) => {
    if (tab === 'registrations') return { url: '', registrations: await listWorkshopRegistrations(workshop.id, userId, signal) };
    return { url: closed ? '' : await getAdminMeetUrl(workshop.id, userId, signal), registrations: [] };
  }, [workshop.id, userId, tab, closed]);
  const read = useResource(load, { url: '', registrations: [] });
  if (read.loading) return <p role="status" className="py-6 text-sm">Loading admin details...</p>;
  if (read.error) return <div role="alert" className={`${panel} text-sm text-red-600 dark:text-red-400`}><p>Admin details could not be loaded. {read.error}</p><button className="underline mt-2" onClick={() => read.reload()}>Retry admin details</button></div>;
  return <section className={panel}>
    <div className="flex gap-2 justify-between items-start mb-4">
      <h2 className="text-base font-bold inline-flex gap-2 items-center">{tab === 'workshops' ? <Video className="w-5 h-5 text-[#2F6BFF]" /> : <Users className="w-5 h-5 text-[#2F6BFF]" />}
        {tab === 'workshops' ? `Google Meet Link for "${workshop.title}"` : `Registrations for "${workshop.title}" (${read.refreshing ? '…' : read.data.registrations.length})`}
      </h2>
      <button aria-label="Refresh admin details" disabled={busy || read.refreshing} onClick={() => read.reload()}><RefreshCw className="w-4 h-4" /></button>
    </div>
    {read.refreshing && <p role="status" className="text-xs mb-3">Refreshing admin details...</p>}
    {tab === 'workshops' ? <>
      <p className="text-xs text-[#636875] dark:text-gray-400 mb-4">Meeting addresses stay private. Attendee access follows registration, publication and server-time rules. Leave the field empty to clear the link.</p>
      {closed ? <p className="text-sm">Meeting management is unavailable for cancelled or archived workshops.</p>
        : <MeetingEditor key={read.data.url} workshop={workshop} initial={read.data.url} userId={userId} busy={busy || read.refreshing} run={async (...args) => { const result = await run(...args); if (result) await read.reload(); return result; }} />}
    </> : read.data.registrations.length ? <div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr className="border-b border-[#DDE0E8] dark:border-white/10">
      {['Name','Email','Handle','LinkedIn','Registered At'].map(label => <th key={label} className="pb-3 pr-4">{label}</th>)}
    </tr></thead><tbody>{read.data.registrations.map(row => <tr key={row.id} className="border-b border-[#DDE0E8]/50 dark:border-white/5">
      <td className="py-3 pr-4">{row.profile?.name || 'Profile unavailable'}</td><td className="pr-4">{row.profile?.email || 'Unavailable'}</td><td className="pr-4">{row.profile?.handle ? `@${row.profile.handle}` : '—'}</td>
      <td className="pr-4">{row.profile?.linkedinUrl ? <a href={row.profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="inline-flex gap-1 text-[#2F6BFF]">View<ExternalLink className="w-3 h-3" /></a> : '—'}</td>
      <td className="whitespace-nowrap">{new Date(row.createdAt).toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})}</td>
    </tr>)}</tbody></table></div> : <p className="text-xs py-6 text-center">No registrations yet for this workshop.</p>}
  </section>;
}

export const AdminPage: React.FC = () => {
  const { isAdmin, authUser, reloadWorkshops } = useWorkify();
  const now = useWorkshopClock();
  const userId = authUser?.id;
  const load = useCallback((signal: AbortSignal) => listAdminWorkshops(userId, signal), [userId]);
  const list = useResource<Workshop[]>(load, [], !!isAdmin && !!userId);
  const [selectedId, setSelectedId] = useState('');
  const [tab, setTab] = useState<'workshops' | 'registrations'>('workshops');
  const [editor, setEditor] = useState<{ workshop: Workshop | null } | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const busy = useRef(false);
  const mounted = useRef(false);
  const controller = useRef<AbortController | null>(null);
  const closeEditor = useCallback(() => { if (!busy.current) { setEditor(null); setError(null); } }, []);
  useEffect(() => { mounted.current = true; const active = controller; return () => { mounted.current = false; active.current?.abort(); }; }, []);
  const selected = list.data.find(workshop => workshop.id === selectedId) ?? list.data[0];
  const run: Run = async (label, operation, after) => {
    if (busy.current || !mounted.current) return false;
    busy.current = true;
    setPending(label); setError(null); setNotice(null);
    const active = new AbortController(); controller.current = active;
    const timer = window.setTimeout(() => active.abort(), 15_000);
    let onAbort!: () => void;
    const cancelled = new Promise<never>((_resolve,reject) => { onAbort = () => reject(new Error('The operation could not be confirmed. Refresh before retrying.')); active.signal.addEventListener('abort', onAbort, { once: true }); });
    try {
      const value = await Promise.race([operation(active.signal),cancelled]);
      window.clearTimeout(timer);
      if (!mounted.current) return false;
      after?.(value);
      const [adminFresh, publicFresh] = await Promise.all([list.reload(), reloadWorkshops()]);
      if (mounted.current) setNotice(adminFresh && publicFresh ? label : `${label} Saved, but the latest lists could not be loaded. Refresh before another change.`);
      return true;
    } catch (problem) {
      if (mounted.current) {
        setError(problem instanceof Error ? problem.message : 'Admin operation failed. Refresh before retrying.');
        await Promise.all([list.reload(), reloadWorkshops()]);
      }
      return false;
    } finally {
      window.clearTimeout(timer); active.signal.removeEventListener('abort', onAbort); busy.current = false;
      if (mounted.current) setPending(null);
    }
  };
  if (!isAdmin || !userId) return null;
  const save = (input: WorkshopInput) => {
    void run('Workshop saved.', signal => editor?.workshop ? updateWorkshop(editor.workshop.id,input,userId,signal) : createWorkshop(input,userId,signal), value => {
      setSelectedId((value as Workshop).id); setEditor(null);
    });
  };
  return <div className="w-full py-10 md:py-16 bg-[#FAFAFC] dark:bg-[#070C1F] min-h-[calc(100vh-4rem)]"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-4"><div>
      <h1 className="text-3xl font-bold inline-flex items-center gap-2"><Shield className="w-6 h-6 text-[#8B4CFF]" />Admin Dashboard</h1>
      <p className="text-sm text-[#636875] dark:text-gray-400 mt-2">Manage workshops, protected meeting links and registrations.</p>
    </div><button className={primary} disabled={!!pending} onClick={() => { setError(null); setNotice(null); setEditor({workshop:null}); }}><Plus className="w-4 h-4" />Create Workshop</button></div>
    {pending && <p role="status" className="text-sm inline-flex gap-2"><Loader2 className="w-4 h-4 animate-spin" />Saving changes...</p>}
    {notice && <p role="status" className="text-sm text-emerald-700 dark:text-emerald-400">{notice}</p>}
    {error && !editor && <p role="alert" className="text-sm text-red-600 dark:text-red-400 inline-flex gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{error}</p>}
    <button disabled={!!pending || list.loading || list.refreshing} onClick={() => list.reload()} className="text-xs font-semibold text-[#2F6BFF]">Refresh admin workshops</button>
    {list.loading ? <p role="status">Loading admin workshops...</p> : list.error ? <div role="alert" className={panel}><p>{list.error}</p><button onClick={() => list.reload()} className="underline mt-3">Retry admin workshops</button></div> : <>
      {list.refreshing && <p role="status" className="text-sm">Refreshing admin workshops...</p>}
      <div className={`${panel} flex flex-wrap justify-between items-center gap-4`}>
        <div className="flex items-center gap-2 min-w-0"><label htmlFor="admin-workshop" className="text-xs font-semibold">Managing:</label>
          <select id="admin-workshop" className={`${field} max-w-xs`} value={selected?.id ?? ''} disabled={!!pending || list.refreshing} onChange={event => { setSelectedId(event.target.value); setError(null); setNotice(null); }}>
            {!list.data.length && <option value="">No workshops</option>}
            {list.data.map(workshop => <option key={workshop.id} value={workshop.id}>{workshop.title} ({workshop.status})</option>)}
          </select>
        </div>
        <div className="flex gap-2 text-xs"><button aria-pressed={tab === 'workshops'} disabled={!!pending} onClick={() => setTab('workshops')} className="px-3 py-2 rounded-xl bg-[#F3F4F7] dark:bg-white/10">Workshops</button><button aria-pressed={tab === 'registrations'} disabled={!!pending} onClick={() => setTab('registrations')} className="px-3 py-2 rounded-xl bg-[#F3F4F7] dark:bg-white/10">Registrations</button></div>
      </div>
      {selected && <WorkshopDetails key={`${selected.id}:${selected.status}:${tab}`} workshop={selected} userId={userId} busy={!!pending} run={run} tab={tab} />}
      {tab === 'workshops' && <section className={panel}><h2 className="text-base font-bold mb-4">All Workshops</h2>
        {!list.data.length ? <p className="text-sm">No workshops yet. Create a workshop to begin.</p> : <div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr className="border-b border-[#DDE0E8] dark:border-white/10">
          {['Title','Slug','Host','Status','Schedule','Actions'].map(label => <th key={label} className="pb-3 pr-4">{label}</th>)}
        </tr></thead><tbody>{list.data.map(workshop => <tr key={workshop.id} className="border-b border-[#DDE0E8]/50 dark:border-white/5">
          <td className="py-3 pr-4 font-semibold">{workshop.title}</td><td className="pr-4">{workshop.slug}</td><td className="pr-4">{workshop.hostName}</td><td className="pr-4">{workshop.status} · {workshopLifecycle(workshop,now).label}</td><td className="pr-4 min-w-48">{formatWorkshopSchedule(workshop)}</td>
          <td className="py-3"><div className="flex gap-3 items-center">
            <button title="Edit" aria-label={`Edit ${workshop.title}`} disabled={!!pending || list.refreshing} onClick={() => { setError(null); setEditor({workshop}); }} className="text-[#2F6BFF]"><Edit2 className="w-4 h-4" /></button>
            {workshop.status !== 'cancelled' && workshop.status !== 'archived' && <button disabled={!!pending || list.refreshing} onClick={() => { if (window.confirm('Cancel this workshop? Existing registrations will be preserved.')) void run('Workshop cancelled.',signal => setWorkshopStatus(workshop.id,'cancelled',userId,signal)); }} className="text-red-600 dark:text-red-400">Cancel</button>}
            {workshop.status !== 'archived' && <button disabled={!!pending || list.refreshing} onClick={() => { if (window.confirm('Archive this workshop? Registration history will be preserved.')) void run('Workshop archived.',signal => setWorkshopStatus(workshop.id,'archived',userId,signal)); }} className="text-[#8B4CFF]">Archive</button>}
          </div></td>
        </tr>)}</tbody></table></div>}
      </section>}
    </>}
  </div>{editor && <WorkshopEditor workshop={editor.workshop} busy={!!pending} error={error} onClose={closeEditor} onSave={save} />}</div>;
};
