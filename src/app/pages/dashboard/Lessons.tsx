import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BookOpen, Loader2, Plus, Edit2, Trash2, Eye, Video, Music, FileText, Link2 } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { apiFetch } from '../../lib/api';

export type LessonMediaItem = { type: 'video' | 'audio' | 'pdf' | 'ppt' | 'link'; url: string; title?: string };

interface Lesson {
  id: string;
  title: string;
  titleFr?: string | null;
  description?: string | null;
  descriptionFr?: string | null;
  content?: string | null;
  contentFr?: string | null;
  contentMedia?: LessonMediaItem[];
  programId?: string | null;
  sortOrder?: number;
  programName?: string | null;
  programNameFr?: string | null;
}

export function Lessons() {
  const { lang } = useLanguage();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [programs, setPrograms] = useState<{ id: string; name: string; nameFr?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [programFilter, setProgramFilter] = useState('');
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [viewingContent, setViewingContent] = useState<Lesson | null>(null);
  const [editing, setEditing] = useState<Lesson | null>(null);
  const [form, setForm] = useState({ title: '', titleFr: '', description: '', descriptionFr: '', content: '', contentFr: '', programId: '' as string, contentMedia: [] as LessonMediaItem[] });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const url = programFilter ? `/lessons?programId=${programFilter}` : '/lessons';
      const d = await apiFetch(url, { requireAuth: true });
      setLessons(d.lessons || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load');
      setLessons([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [programFilter]);

  useEffect(() => {
    apiFetch('/programs', { requireAuth: true }).then((d: any) => setPrograms(d.programs || [])).catch(() => {});
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ title: '', titleFr: '', description: '', descriptionFr: '', content: '', contentFr: '', programId: programs[0]?.id || '', contentMedia: [] });
    setModal('add');
  };

  const openEdit = (l: Lesson) => {
    setEditing(l);
    setForm({
      title: l.title,
      titleFr: l.titleFr || '',
      description: l.description || '',
      descriptionFr: l.descriptionFr || '',
      content: l.content || '',
      contentFr: l.contentFr || '',
      programId: l.programId || '',
      contentMedia: Array.isArray(l.contentMedia) ? l.contentMedia : [],
    });
    setModal('edit');
  };

  const save = async () => {
    if (!form.title.trim()) {
      setError(lang === 'fr' ? 'Titre requis' : 'Title required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (modal === 'add') {
        await apiFetch('/lessons', {
          method: 'POST',
          body: JSON.stringify({
            title: form.title,
            titleFr: form.titleFr || undefined,
            description: form.description || undefined,
            descriptionFr: form.descriptionFr || undefined,
            content: form.content || undefined,
            contentFr: form.contentFr || undefined,
            contentMedia: form.contentMedia?.filter(m => m.url?.trim())?.length ? form.contentMedia.filter(m => m.url?.trim()) : undefined,
            programId: form.programId || undefined,
          }),
          requireAuth: true,
        });
      } else if (editing) {
        await apiFetch(`/lessons/${editing.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            title: form.title,
            titleFr: form.titleFr || undefined,
            description: form.description || undefined,
            descriptionFr: form.descriptionFr || undefined,
            content: form.content || undefined,
            contentFr: form.contentFr || undefined,
            contentMedia: form.contentMedia?.filter(m => m.url?.trim()) ?? [],
            programId: form.programId || undefined,
          }),
          requireAuth: true,
        });
      }
      setModal(null);
      load();
    } catch (e: any) {
      setError(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm(lang === 'fr' ? 'Supprimer cette leçon ?' : 'Delete this lesson?')) return;
    try {
      await apiFetch(`/lessons/${id}`, { method: 'DELETE', requireAuth: true });
      load();
    } catch (e: any) {
      setError(e.message || 'Failed to delete');
    }
  };

  const filtered = lessons;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins', fontWeight: 700 }}>
            {lang === 'fr' ? 'Leçons' : 'Lessons'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {lang === 'fr' ? 'Créez les leçons (cours à enseigner). Vous les assignerez aux enseignants par créneau dans Plannings staff — pas les exercices ni les évaluations.' : 'Create lessons (content to be taught). You assign these to lecturers per slot in Staff schedules — not exercises or assessments.'}
          </p>
        </div>
        <button onClick={openAdd} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium" style={{ background: 'var(--btc-primary,#2E8B57)' }}>
          <Plus size={18} /> {lang === 'fr' ? 'Nouvelle leçon' : 'New lesson'}
        </button>
      </div>

      {error && <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">{error}</div>}

      <div className="flex items-center gap-4 flex-wrap">
        <label className="text-sm text-gray-600 dark:text-gray-400">{lang === 'fr' ? 'Programme' : 'Program'}</label>
        <select
          value={programFilter}
          onChange={e => setProgramFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
        >
          <option value="">{lang === 'fr' ? 'Tous' : 'All'}</option>
          {programs.map(p => (
            <option key={p.id} value={p.id}>{lang === 'fr' && p.nameFr ? p.nameFr : p.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={32} className="animate-spin text-gray-400" /></div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">{lang === 'fr' ? 'Titre' : 'Title'}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">{lang === 'fr' ? 'Programme' : 'Program'}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">{lang === 'fr' ? 'Description' : 'Description'}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">{lang === 'fr' ? 'Contenu' : 'Content'}</th>
                <th className="px-6 py-3 w-28" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">{lang === 'fr' ? 'Aucune leçon. Cliquez sur « Nouvelle leçon ».' : 'No lessons. Click « New lesson ».'}</td></tr>
              ) : (
                filtered.map((l) => {
                  const contentPreview = (lang === 'fr' && l.contentFr ? l.contentFr : l.content) || '';
                  return (
                    <tr key={l.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-3 font-medium text-gray-900 dark:text-white">{lang === 'fr' && l.titleFr ? l.titleFr : l.title}</td>
                      <td className="px-6 py-3 text-gray-600 dark:text-gray-400">{lang === 'fr' && l.programNameFr ? l.programNameFr : l.programName || '—'}</td>
                      <td className="px-6 py-3 text-gray-500 max-w-xs truncate">{lang === 'fr' && l.descriptionFr ? l.descriptionFr : l.description || '—'}</td>
                      <td className="px-6 py-3 text-gray-500 max-w-sm">
                        {contentPreview ? (
                          <span className="truncate block" title={contentPreview.slice(0, 200)}>{contentPreview.slice(0, 60)}…</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setViewingContent(l)} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700" title={lang === 'fr' ? 'Voir le contenu' : 'View content'}><Eye size={16} /></button>
                          <button onClick={() => openEdit(l)} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"><Edit2 size={16} /></button>
                          <button onClick={() => remove(l.id)} className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto" onClick={() => setModal(null)}>
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4" style={{ fontFamily: 'Poppins' }}>
              {modal === 'add' ? (lang === 'fr' ? 'Nouvelle leçon' : 'New lesson') : (lang === 'fr' ? 'Modifier la leçon' : 'Edit lesson')}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{lang === 'fr' ? 'Titre' : 'Title'} *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{lang === 'fr' ? 'Titre (FR)' : 'Title (FR)'}</label>
                <input value={form.titleFr} onChange={e => setForm(f => ({ ...f, titleFr: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{lang === 'fr' ? 'Programme' : 'Program'}</label>
                <select value={form.programId} onChange={e => setForm(f => ({ ...f, programId: e.target.value }))} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm">
                  <option value="">—</option>
                  {programs.map(p => <option key={p.id} value={p.id}>{lang === 'fr' && p.nameFr ? p.nameFr : p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{lang === 'fr' ? 'Description' : 'Description'}</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" placeholder={lang === 'fr' ? 'Résumé court' : 'Short summary'} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  {lang === 'fr' ? 'Contenu de la leçon (éditeur texte)' : 'Lesson content (text editor)'} *
                </label>
                <textarea
                  value={form.content}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  rows={10}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-mono"
                  placeholder={
                    lang === 'fr'
                      ? 'Rédigez ici le plan de cours, les objectifs, les grandes parties, les exemples, etc. (vous pouvez utiliser des titres, des listes, …).'
                      : 'Write the lesson plan, objectives, sections, examples, etc. here (you can use headings, bullet lists, …).'
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{lang === 'fr' ? 'Contenu (FR)' : 'Content (FR)'}</label>
                <textarea value={form.contentFr} onChange={e => setForm(f => ({ ...f, contentFr: e.target.value }))} rows={6} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-mono" placeholder={lang === 'fr' ? 'Contenu en français' : 'Content in French'} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                  {lang === 'fr' ? 'Ressources (vidéo, audio, PDF, PPT, lien)' : 'Resources (video, audio, PDF, PPT, link)'}
                </label>
                <div className="space-y-2">
                  {(form.contentMedia || []).map((m, idx) => (
                    <div key={idx} className="flex flex-wrap items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700">
                      <select value={m.type} onChange={e => setForm(f => ({ ...f, contentMedia: f.contentMedia.map((x, i) => i === idx ? { ...x, type: e.target.value as LessonMediaItem['type'] } : x) }))} className="px-2 py-1 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm w-24">
                        <option value="video">Video</option>
                        <option value="audio">Audio</option>
                        <option value="pdf">PDF</option>
                        <option value="ppt">PPT</option>
                        <option value="link">Link</option>
                      </select>
                      <input type="url" value={m.url} onChange={e => setForm(f => ({ ...f, contentMedia: f.contentMedia.map((x, i) => i === idx ? { ...x, url: e.target.value } : x) }))} placeholder="URL" className="flex-1 min-w-[120px] px-2 py-1 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm" />
                      <input type="text" value={m.title || ''} onChange={e => setForm(f => ({ ...f, contentMedia: f.contentMedia.map((x, i) => i === idx ? { ...x, title: e.target.value } : x) }))} placeholder={lang === 'fr' ? 'Titre (opt.)' : 'Title (opt.)'} className="w-28 px-2 py-1 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm" />
                      <button type="button" onClick={() => setForm(f => ({ ...f, contentMedia: f.contentMedia.filter((_, i) => i !== idx) }))} className="p-1 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 size={14} /></button>
                    </div>
                  ))}
                  <button type="button" onClick={() => setForm(f => ({ ...f, contentMedia: [...(f.contentMedia || []), { type: 'link', url: '', title: '' }] }))} className="text-sm text-green-600 dark:text-green-400 hover:underline flex items-center gap-1">
                    <Plus size={14} /> {lang === 'fr' ? 'Ajouter un média' : 'Add media'}
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setModal(null)} className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300">{lang === 'fr' ? 'Annuler' : 'Cancel'}</button>
              <button onClick={save} disabled={saving} className="px-4 py-2 rounded-xl text-white text-sm font-medium bg-green-600 hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
                {saving && <Loader2 size={14} className="animate-spin" />}{lang === 'fr' ? 'Enregistrer' : 'Save'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* View lesson content (read-only): text + audio, video, pdf, links */}
      {viewingContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto" onClick={() => setViewingContent(null)}>
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white" style={{ fontFamily: 'Poppins' }}>{lang === 'fr' && viewingContent.titleFr ? viewingContent.titleFr : viewingContent.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{lang === 'fr' && viewingContent.programNameFr ? viewingContent.programNameFr : viewingContent.programName || '—'}</p>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <section>
                <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-2">{lang === 'fr' ? 'Texte / Contenu' : 'Text content'}</h4>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl">
                    {(lang === 'fr' && viewingContent.contentFr ? viewingContent.contentFr : viewingContent.content) || (lang === 'fr' ? 'Aucun contenu texte.' : 'No text content.')}
                  </pre>
                </div>
              </section>
              {Array.isArray(viewingContent.contentMedia) && viewingContent.contentMedia.length > 0 && (
                <section>
                  <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-3">
                    {lang === 'fr' ? 'Ressources (audio, vidéo, PDF, PPT)' : 'Resources (audio, video, PDF, PPT)'}
                  </h4>
                  <div className="space-y-4">
                    {viewingContent.contentMedia.map((item: LessonMediaItem, idx: number) => (
                      <div key={idx} className="rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden bg-gray-50 dark:bg-gray-900/50">
                        {item.type === 'video' && (
                          <div className="p-2">
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                              {item.title || 'Video'} <Video size={12} />
                            </p>
                            <video src={item.url} controls className="w-full max-h-64 rounded-lg" />
                            <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-xs text-green-600 dark:text-green-400 mt-1 inline-block truncate max-w-full">
                              {item.url}
                            </a>
                          </div>
                        )}
                        {item.type === 'audio' && (
                          <div className="p-3">
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
                              {item.title || 'Audio'} <Music size={12} />
                            </p>
                            <audio src={item.url} controls className="w-full" />
                            <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-xs text-green-600 dark:text-green-400 mt-1 inline-block truncate max-w-full">
                              {item.url}
                            </a>
                          </div>
                        )}
                        {(item.type === 'pdf' || item.type === 'ppt') && (
                          <div className="p-3">
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                              {item.title || (item.type === 'ppt' ? 'PPT' : 'PDF')} <FileText size={12} />
                            </p>
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-sm text-green-600 dark:text-green-400 hover:underline"
                            >
                              <FileText size={16} />{' '}
                              {lang === 'fr'
                                ? item.type === 'ppt'
                                  ? 'Ouvrir le PPT'
                                  : 'Ouvrir le PDF'
                                : item.type === 'ppt'
                                  ? 'Open PPT'
                                  : 'Open PDF'}
                            </a>
                          </div>
                        )}
                        {item.type === 'link' && (
                          <div className="p-3">
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                              {item.title || 'Link'} <Link2 size={12} />
                            </p>
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-sm text-green-600 dark:text-green-400 hover:underline truncate max-w-full"
                            >
                              <Link2 size={16} /> {item.url}
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
            <div className="p-6 border-t border-gray-100 dark:border-gray-700">
              <button onClick={() => setViewingContent(null)} className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300">{lang === 'fr' ? 'Fermer' : 'Close'}</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
