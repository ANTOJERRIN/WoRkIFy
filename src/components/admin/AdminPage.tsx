import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { CalendarDays, CheckCircle2, Edit2, ExternalLink, Loader2, Plus, Shield, Users, Video, X } from 'lucide-react';
import { useWorkify } from '../../context/WorkifyContext';
import { createWorkshop, updateWorkshop, setWorkshopStatus, getAdminMeetUrl, setWorkshopMeetUrl, listWorkshopRegistrations, type WorkshopInput } from '../../api/admin';
import { fromIST, toIST, validateWorkshop } from '../../domain/workshop';
import { formatWorkshopDateIST } from '../../api/workshops';
import { useModalDialog } from '../layout/useModalDialog';
import type { Workshop, WorkshopStatus, AdminRegistrationItem } from '../../types';

const emptyForm = (): WorkshopInput => ({ title: '', slug: '', hostName: 'Jerrin Anto', status: 'coming_soon', shortDescription: '', fullDescription: '', tags: [], startsAt: null, endsAt: null, timezone: 'Asia/Kolkata' });
const fieldClass = 'w-full min-h-11 mt-2 px-3 py-2 rounded-xl bg-[#F3F4F7] dark:bg-white/5 border border-[#DDE0E8] dark:border-white/15 outline-none focus:ring-2 focus:ring-[#2F6BFF]/30 text-sm';
const primaryClass = 'inline-flex items-center justify-center gap-2 rounded-xl bg-[#2F6BFF] hover:bg-[#1F54E0] text-white px-5 py-3 text-sm font-semibold disabled:opacity-50';

function WorkshopEditor({ workshop, onClose, onSaved }: { workshop: Workshop | null; onClose: () => void; onSaved: (workshop: Workshop) => void }) {
  const ref = useModalDialog(true, onClose);
  const [form, setForm] = useState<WorkshopInput>(() => workshop ? { ...workshop } : emptyForm());
  const [tags, setTags] = useState(workshop?.tags.join(', ') || '');
  const [start, setStart] = useState(toIST(workshop?.startsAt || null));
  const [end, setEnd] = useState(toIST(workshop?.endsAt || null));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const saving = useRef(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (saving.current) return;
    saving.current = true; setBusy(true); setError(null);
    try {
      const input = { ...form, startsAt: fromIST(start), endsAt: fromIST(end), tags: tags.split(',').map(tag => tag.trim()).filter(Boolean) };
      validateWorkshop(input);
      const saved = workshop ? await updateWorkshop(workshop.id, input) : await createWorkshop(input);
      onSaved(saved);
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Workshop could not be saved.'); }
    finally { saving.current = false; setBusy(false); }
  };
  const update = (key: keyof WorkshopInput, value: string) => setForm(previous => ({ ...previous, [key]: value }));
  return <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
    <div ref={ref} role="dialog" aria-modal="true" aria-label={workshop ? 'Edit workshop' : 'Create workshop'} tabIndex={-1} className="w-full max-w-2xl max-h-[90dvh] overflow-y-auto rounded-3xl p-6 sm:p-8 bg-white dark:bg-[#0B1533] shadow-2xl">
      <div className="flex justify-between gap-4 items-center mb-6"><h2 className="text-2xl font-bold">{workshop ? 'Edit workshop' : 'Create workshop'}</h2><button onClick={onClose} aria-label="Close editor" className="p-2"><X size={20} /></button></div>
      <form onSubmit={submit} aria-busy={busy}>
        <fieldset disabled={busy} className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-4"><label className="text-sm font-semibold">Title<input className={fieldClass} required maxLength={200} value={form.title} onChange={e => { update('title', e.target.value); if (!workshop) update('slug', e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0,100)); }} /></label><label className="text-sm font-semibold">Workshop URL slug<input className={fieldClass} required maxLength={100} pattern="[a-z0-9]+(-[a-z0-9]+)*" value={form.slug} onChange={e => update('slug', e.target.value)} /><span className="text-xs font-normal text-[#636875]">/workshops/{form.slug || 'your-workshop'}</span></label></div>
          <div className="grid sm:grid-cols-2 gap-4"><label className="text-sm font-semibold">Host name<input className={fieldClass} required maxLength={100} value={form.hostName} onChange={e => update('hostName',e.target.value)} /></label><label className="text-sm font-semibold">Publication status<select className={fieldClass} value={form.status} onChange={e => update('status',e.target.value)}><option value="coming_soon">Coming soon</option><option value="open">Open for registration</option><option value="cancelled">Cancelled</option><option value="archived">Archived</option></select></label></div>
          <label className="block text-sm font-semibold">Summary<input className={fieldClass} maxLength={500} value={form.shortDescription} onChange={e => update('shortDescription',e.target.value)} /></label>
          <label className="block text-sm font-semibold">Workshop description<textarea className={fieldClass} rows={4} maxLength={20000} value={form.fullDescription} onChange={e => update('fullDescription',e.target.value)} /></label>
          <div className="grid sm:grid-cols-2 gap-4"><label className="text-sm font-semibold">Starts at (IST)<input className={fieldClass} type="datetime-local" required={form.status === 'open'} value={start} onChange={e => setStart(e.target.value)} /></label><label className="text-sm font-semibold">Ends at (IST)<input className={fieldClass} type="datetime-local" required={form.status === 'open'} value={end} onChange={e => setEnd(e.target.value)} /></label></div>
          <p className="text-xs text-[#636875] dark:text-gray-400">All times use Asia/Kolkata (UTC +05:30). Coming soon announcements may leave both dates empty.</p>
          <label className="block text-sm font-semibold">Tags<input className={fieldClass} placeholder="AI Agents, Automation" value={tags} onChange={e => setTags(e.target.value)} /><span className="text-xs font-normal text-[#636875]">Separate tags with commas. Up to 12 tags.</span></label>
        </fieldset>
        {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400 mt-5">{error}</p>}
        <div className="flex justify-end items-center gap-3 mt-7 pt-5 border-t border-[#DDE0E8] dark:border-white/10"><button type="button" disabled={busy} onClick={onClose} className="text-sm px-4 py-3">Cancel</button><button disabled={busy} className={primaryClass}>{busy && <Loader2 size={16} className="animate-spin" />}{busy ? 'Saving…' : workshop ? 'Save changes' : 'Create workshop'}</button></div>
      </form>
    </div>
  </div>;
}

export function AdminPage() {
  const { isAdmin, workshops, workshopsLoading, workshopsError, reloadWorkshops } = useWorkify();
  const [selectedId, setSelectedId] = useState('');
  const [editor, setEditor] = useState<{ workshop: Workshop | null } | null>(null);
  const [meetUrl, setMeetUrl] = useState('');
  const [registrations, setRegistrations] = useState<AdminRegistrationItem[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const mutation = useRef(false);
  const detailGeneration = useRef(0);
  const closeEditor = useCallback(() => setEditor(null), []);
  const selected = workshops.find(workshop => workshop.id === selectedId);
  useEffect(() => { if (!workshops.some(workshop => workshop.id === selectedId)) setSelectedId(workshops[0]?.id || ''); }, [workshops, selectedId]);
  useEffect(() => {
    const request = ++detailGeneration.current;
    setMeetUrl(''); setRegistrations([]); setDetailsError(null); setNotice(null); setError(null);
    if (!isAdmin || !selectedId) return;
    setDetailsLoading(true);
    void Promise.all([getAdminMeetUrl(selectedId), listWorkshopRegistrations(selectedId)]).then(([url, rows]) => {
      if (request === detailGeneration.current) { setMeetUrl(url); setRegistrations(rows); }
    }).catch(() => { if (request === detailGeneration.current) setDetailsError('Private workshop details could not be loaded.'); }).finally(() => { if (request === detailGeneration.current) setDetailsLoading(false); });
    return () => { detailGeneration.current++; };
  }, [isAdmin, selectedId, attempt]);
  if (!isAdmin) return null;
  const mutate = async (action: () => Promise<void>, success: string) => {
    if (mutation.current) return;
    mutation.current = true; setBusy(true); setError(null); setNotice(null);
    try { await action(); setNotice(success); }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'The change could not be saved.'); }
    finally { mutation.current = false; setBusy(false); }
  };
  const changeStatus = (status: WorkshopStatus) => {
    if (!selected || !window.confirm(`${status === 'archived' ? 'Archive' : 'Cancel'} “${selected.title}”? Registration history will be preserved.`)) return;
    void mutate(async () => { await setWorkshopStatus(selected.id, status); await reloadWorkshops(); }, `Workshop ${status}. Registration history is preserved.`);
  };
  return <div className="max-w-7xl mx-auto w-full px-4 sm:px-8 py-10 sm:py-14">
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8"><div><span className="inline-flex items-center gap-2 text-xs font-semibold text-[#8B4CFF] rounded-full bg-[#8B4CFF]/10 px-3 py-1.5 mb-4"><Shield size={14} /> ADMIN WORKSPACE</span><h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Your workshops.</h1><p className="text-sm text-[#636875] dark:text-gray-400 mt-3">Create sessions, manage private meeting links, and see who’s joining.</p></div><button className={primaryClass} onClick={() => setEditor({ workshop: null })}><Plus size={18} /> Create workshop</button></div>
    <div className="grid sm:grid-cols-3 gap-4 mb-8">{[[CalendarDays, workshops.length, 'Total workshops'], [Video, workshops.filter(workshop => workshop.status === 'open').length, 'Open for registration'], [Shield, 'Admin only', 'Workshop publishing']].map(([Icon, value, label]) => { const StatIcon = Icon as typeof Shield; return <div key={String(label)} className="rounded-2xl p-5 bg-white dark:bg-[#0B1533] border border-[#DDE0E8] dark:border-white/10"><StatIcon size={18} className="text-[#2F6BFF] mb-4" /><p className="text-2xl font-bold">{String(value)}</p><p className="text-xs text-[#636875] dark:text-gray-400 mt-1">{String(label)}</p></div>; })}</div>
    {notice && <p role="status" className="flex gap-2 text-sm text-emerald-700 dark:text-emerald-300 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 mb-5"><CheckCircle2 size={18} />{notice}</p>}
    {(error || workshopsError) && <div role="alert" className="text-sm text-red-600 p-4 mb-5">{error || workshopsError}{workshopsError && <button className="ml-3 underline" onClick={() => void reloadWorkshops()}>Retry catalog</button>}</div>}
    <div className="grid lg:grid-cols-[1fr_1.2fr] gap-6">
      <section className="bg-white dark:bg-[#0B1533] rounded-3xl border border-[#DDE0E8] dark:border-white/10 p-5 sm:p-6"><h2 className="text-lg font-bold mb-5">Workshop library</h2>{workshopsLoading ? <p role="status">Loading workshops…</p> : !workshops.length ? <div className="py-12 text-center"><CalendarDays className="mx-auto text-[#2F6BFF] mb-4" size={28} /><h3 className="font-bold mb-2">Make room for your first workshop.</h3><p className="text-sm text-[#636875] dark:text-gray-400">Create a coming soon announcement or schedule a live session.</p></div> : <div className="space-y-3">{workshops.map(workshop => <button key={workshop.id} onClick={() => setSelectedId(workshop.id)} className={`w-full text-left p-4 rounded-2xl border transition ${selectedId === workshop.id ? 'border-[#2F6BFF] bg-[#2F6BFF]/5' : 'border-[#DDE0E8] dark:border-white/10 hover:border-[#2F6BFF]/40'}`}><span className="text-[11px] uppercase tracking-wider text-[#8B4CFF] font-bold">{workshop.status.replace('_',' ')}</span><h3 className="font-bold text-base mt-2">{workshop.title}</h3><p className="text-xs text-[#636875] dark:text-gray-400 mt-2">{formatWorkshopDateIST(workshop.startsAt,workshop.endsAt)}</p></button>)}</div>}</section>
      <section className="bg-white dark:bg-[#0B1533] rounded-3xl border border-[#DDE0E8] dark:border-white/10 p-5 sm:p-6 min-w-0">{selected ? <>
        <div className="flex justify-between gap-4 mb-6"><div><h2 className="text-xl font-bold">{selected.title}</h2><p className="text-xs text-[#636875] dark:text-gray-400 mt-2">{selected.hostName} · {selected.status.replace('_',' ')}</p></div><button onClick={() => setEditor({ workshop: selected })} className="self-start inline-flex gap-2 items-center text-sm font-semibold text-[#2F6BFF]"><Edit2 size={15} /> Edit</button></div>
        <div className="flex flex-wrap gap-4 text-xs font-semibold border-b border-[#DDE0E8] dark:border-white/10 pb-6 mb-6"><button disabled={busy || selected.status === 'cancelled'} onClick={() => changeStatus('cancelled')} className="text-red-600 disabled:opacity-40">Cancel workshop</button><button disabled={busy || selected.status === 'archived'} onClick={() => changeStatus('archived')} className="text-[#636875] dark:text-gray-400 disabled:opacity-40">Archive workshop</button></div>
        {detailsLoading ? <p role="status">Loading private workshop details…</p> : detailsError ? <div role="alert"><p className="text-sm text-red-600">{detailsError}</p><button onClick={() => setAttempt(n => n + 1)} className="text-sm text-[#2F6BFF] mt-3">Try again</button></div> : <>
          <form onSubmit={event => { event.preventDefault(); const request = detailGeneration.current; void mutate(() => setWorkshopMeetUrl(selected.id, meetUrl), 'Private meeting link saved.').then(() => { if (request !== detailGeneration.current) setNotice(null); }); }} className="mb-8"><label className="text-sm font-bold flex items-center gap-2" htmlFor="meet-url"><Video size={17} className="text-[#2F6BFF]" /> Private Google Meet link</label><input id="meet-url" type="url" className={fieldClass} placeholder="https://meet.google.com/abc-defg-hij" value={meetUrl} onChange={event => setMeetUrl(event.target.value)} disabled={busy} /><p className="text-xs leading-5 text-[#636875] dark:text-gray-400 mt-2 mb-4">Visible to the admin and eligible registered attendees. Leave empty to remove the link.</p><div className="flex items-center gap-5"><button className={primaryClass} disabled={busy}>{busy ? 'Saving…' : 'Save meeting link'}</button>{meetUrl && /^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/.test(meetUrl) && <a href={meetUrl} target="_blank" rel="noreferrer" className="inline-flex gap-2 items-center text-sm text-[#2F6BFF] font-semibold">Host session <ExternalLink size={14} /></a>}</div></form>
          <div className="flex gap-2 items-center mb-4"><Users size={18} className="text-[#8B4CFF]" /><h3 className="font-bold">Registrations ({registrations.length})</h3></div>{!registrations.length ? <p className="text-sm text-[#636875] dark:text-gray-400">No one has registered for this workshop yet.</p> : <ul className="divide-y divide-[#DDE0E8] dark:divide-white/10">{registrations.map(row => <li key={row.id} className="py-3"><p className="font-semibold text-sm">{row.profile?.name || 'Member'}</p><p className="text-xs text-[#636875] dark:text-gray-400 break-all mt-1">{row.profile?.email || 'No contact details available'}</p></li>)}</ul>}
        </>}
      </> : <p className="text-sm text-[#636875] dark:text-gray-400 py-16 text-center">Select a workshop to manage its session and registrations.</p>}</section>
    </div>
    {editor && <WorkshopEditor workshop={editor.workshop} onClose={closeEditor} onSaved={saved => { setEditor(null); void reloadWorkshops().then(() => { setSelectedId(saved.id); setNotice('Workshop saved.'); }); }} />}
  </div>;
}
