import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Toolbar from './Toolbar';

const extensions = [
  // StarterKit (v3) already includes underline + link.
  StarterKit.configure({ heading: { levels: [1, 2, 3] }, link: { openOnClick: false, autolink: true } }),
  Placeholder.configure({ placeholder: 'Start typing…' }),
];

/**
 * Thin wrapper around TipTap. Swapping the editor library only touches this file:
 * the rest of the app talks to it via { initialContent, editable, onChange(html) }.
 * Remount with a new `key` to load different content.
 */
export default function RichTextEditor({ initialContent, editable, onChange }) {
  const editor = useEditor({
    extensions,
    content: initialContent,
    editable,
    onUpdate: ({ editor: e }) => onChange(e.getHTML()),
  });

  if (!editor) return null;
  return (
    <div className="editor-shell">
      {editable ? <Toolbar editor={editor} /> : <div className="readonly-banner">You have view-only access to this document.</div>}
      <EditorContent editor={editor} className="editor-surface" />
    </div>
  );
}
