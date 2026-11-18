import { useEditorState } from '@tiptap/react';

const safeUrl = (url) => /^(https?:\/\/|mailto:)/i.test(url);

function Btn({ label, active, onClick, children, disabled }) {
  return (
    <button
      type="button"
      className={`tb-btn${active ? ' active' : ''}`}
      aria-label={label}
      title={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()} // keep the editor selection
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export default function Toolbar({ editor }) {
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive('bold'), italic: e.isActive('italic'), underline: e.isActive('underline'),
      bullet: e.isActive('bulletList'), ordered: e.isActive('orderedList'),
      quote: e.isActive('blockquote'), link: e.isActive('link'),
      h1: e.isActive('heading', { level: 1 }), h2: e.isActive('heading', { level: 2 }), h3: e.isActive('heading', { level: 3 }),
      canUndo: e.can().undo(), canRedo: e.can().redo(),
    }),
  });
  const run = () => editor.chain().focus();

  const setLink = () => {
    const url = window.prompt('Link URL (https://…)', editor.getAttributes('link').href || '');
    if (url === null) return;
    if (url === '') return run().unsetLink().run();
    if (!safeUrl(url)) return window.alert('Only http(s) and mailto links are allowed.');
    run().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="toolbar" role="toolbar" aria-label="Formatting">
      <Btn label="Undo" disabled={!s.canUndo} onClick={() => run().undo().run()}>↶</Btn>
      <Btn label="Redo" disabled={!s.canRedo} onClick={() => run().redo().run()}>↷</Btn>
      <span className="tb-sep" />
      <Btn label="Heading 1" active={s.h1} onClick={() => run().toggleHeading({ level: 1 }).run()}>H1</Btn>
      <Btn label="Heading 2" active={s.h2} onClick={() => run().toggleHeading({ level: 2 }).run()}>H2</Btn>
      <Btn label="Heading 3" active={s.h3} onClick={() => run().toggleHeading({ level: 3 }).run()}>H3</Btn>
      <span className="tb-sep" />
      <Btn label="Bold" active={s.bold} onClick={() => run().toggleBold().run()}><b>B</b></Btn>
      <Btn label="Italic" active={s.italic} onClick={() => run().toggleItalic().run()}><i>I</i></Btn>
      <Btn label="Underline" active={s.underline} onClick={() => run().toggleUnderline().run()}><u>U</u></Btn>
      <span className="tb-sep" />
      <Btn label="Bulleted list" active={s.bullet} onClick={() => run().toggleBulletList().run()}>• List</Btn>
      <Btn label="Numbered list" active={s.ordered} onClick={() => run().toggleOrderedList().run()}>1. List</Btn>
      <Btn label="Quote" active={s.quote} onClick={() => run().toggleBlockquote().run()}>❝</Btn>
      <Btn label="Link" active={s.link} onClick={setLink}>🔗</Btn>
    </div>
  );
}
