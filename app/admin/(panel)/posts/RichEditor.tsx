'use client';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import { useEffect, useState } from 'react';
import { MediaPicker, type MediaItem } from './MediaPicker';

/**
 * Article body editor. Visual mode (Tiptap) for writers, HTML mode for exact control. Until the body is actually
 * edited, the original HTML is submitted untouched — imported WordPress articles never change by just being opened.
 */
export default function RichEditor({ name, initialHtml }: { name: string; initialHtml: string }) {
  const [html, setHtml] = useState(initialHtml);
  const [dirty, setDirty] = useState(false);
  const [mode, setMode] = useState<'visual' | 'html'>('visual');
  const [picker, setPicker] = useState(false);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] } }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { rel: null, target: null } }),
      Image.configure({ HTMLAttributes: { loading: 'lazy' } }),
      TextAlign.configure({ types: ['heading', 'paragraph'], defaultAlignment: 'right' }),
      Placeholder.configure({ placeholder: 'اكتب المقال هنا…' }),
      Table.configure({ resizable: false }), TableRow, TableHeader, TableCell,
    ],
    content: initialHtml,
    editorProps: { attributes: { class: 'prose-ed', dir: 'rtl' } },
    onUpdate: ({ editor: e }) => { setDirty(true); setHtml(e.getHTML()); },
  });

  useEffect(() => { if (mode === 'visual' && editor && dirty) editor.commands.setContent(html, false); }, [mode]); // eslint-disable-line

  const words = html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  return (
    <div className="ed">
      <input type="hidden" name={name} value={dirty ? html : initialHtml} />
      <div className="ed-bar">
        {mode === 'visual' && editor && <Toolbar editor={editor} onImage={() => setPicker(true)} />}
        <span style={{ flex: 1 }} />
        <span className="small muted num">{words} كلمة</span>
        <button type="button" className="btn btn-s btn-sm" onClick={() => setMode(mode === 'visual' ? 'html' : 'visual')}>{mode === 'visual' ? 'HTML' : 'محرر مرئي'}</button>
      </div>
      {mode === 'visual'
        ? <EditorContent editor={editor} />
        : <textarea className="ta ltr ed-html" value={html} onChange={(e) => { setDirty(true); setHtml(e.target.value); }} spellCheck={false} />}
      {picker && <MediaPicker onClose={() => setPicker(false)} onPick={(m: MediaItem) => {
        editor?.chain().focus().setImage({ src: m.sizes?.large?.path || m.path, alt: m.alt || '' }).run(); setPicker(false);
      }} />}
    </div>
  );
}

function Toolbar({ editor, onImage }: { editor: Editor; onImage: () => void }) {
  const b = (label: string, run: () => void, active?: boolean, title?: string) => (
    <button type="button" className={`tb${active ? ' on' : ''}`} onMouseDown={(e) => e.preventDefault()} onClick={run} title={title || label} aria-pressed={!!active}>{label}</button>
  );
  const c = () => editor.chain().focus();
  return (
    <>
      {b('ع٢', () => c().toggleHeading({ level: 2 }).run(), editor.isActive('heading', { level: 2 }), 'عنوان رئيسي H2')}
      {b('ع٣', () => c().toggleHeading({ level: 3 }).run(), editor.isActive('heading', { level: 3 }), 'عنوان فرعي H3')}
      {b('ف', () => c().setParagraph().run(), editor.isActive('paragraph'), 'فقرة')}
      <i className="sep" />
      {b('B', () => c().toggleBold().run(), editor.isActive('bold'), 'غامق')}
      {b('I', () => c().toggleItalic().run(), editor.isActive('italic'), 'مائل')}
      {b('U', () => c().toggleUnderline().run(), editor.isActive('underline'), 'تسطير')}
      <i className="sep" />
      {b('• قائمة', () => c().toggleBulletList().run(), editor.isActive('bulletList'))}
      {b('١. قائمة', () => c().toggleOrderedList().run(), editor.isActive('orderedList'))}
      {b('اقتباس', () => c().toggleBlockquote().run(), editor.isActive('blockquote'))}
      <i className="sep" />
      {b('يمين', () => c().setTextAlign('right').run(), editor.isActive({ textAlign: 'right' }))}
      {b('وسط', () => c().setTextAlign('center').run(), editor.isActive({ textAlign: 'center' }))}
      <i className="sep" />
      {b('رابط', () => {
        const prev = editor.getAttributes('link').href as string | undefined;
        const url = window.prompt('الرابط (مثال: /المدونة/ أو https://…)', prev || '');
        if (url === null) return;
        if (!url) { c().unsetLink().run(); return; }
        if (!/^(\/|https?:\/\/|mailto:|tel:)/.test(url)) { alert('رابط غير صالح'); return; }
        c().extendMarkRange('link').setLink({ href: url, target: /^https?:\/\//.test(url) && !url.includes('bynh.sa') ? '_blank' : null }).run();
      }, editor.isActive('link'))}
      {b('صورة', onImage)}
      {b('جدول', () => c().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run())}
      <i className="sep" />
      {b('↶', () => c().undo().run(), false, 'تراجع')}
      {b('↷', () => c().redo().run(), false, 'إعادة')}
    </>
  );
}
