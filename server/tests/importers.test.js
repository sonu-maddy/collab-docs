const { importFile, textToHtml } = require('../src/utils/importers');

describe('importers', () => {
  test('txt: paragraphs and escaping', () => {
    expect(textToHtml('Hello <b>\nworld\n\nSecond')).toBe('<p>Hello &lt;b&gt;<br>world</p><p>Second</p>');
  });

  test('md: converts to html and strips scripts', async () => {
    const { title, content } = await importFile({
      originalname: 'notes.md',
      buffer: Buffer.from('# Hi\n\n- a\n- b\n\n<script>alert(1)</script>'),
    });
    expect(title).toBe('notes');
    expect(content).toContain('<h1>Hi</h1>');
    expect(content).toContain('<li>a</li>');
    expect(content).not.toContain('script');
  });

  test('rejects unsupported types with a clear message', async () => {
    await expect(importFile({ originalname: 'x.exe', buffer: Buffer.from('') })).rejects.toMatchObject({
      status: 400,
      message: expect.stringContaining('.txt'),
    });
  });

  test('rejects a corrupt docx', async () => {
    await expect(importFile({ originalname: 'bad.docx', buffer: Buffer.from('not a zip') })).rejects.toMatchObject({ status: 400 });
  });
});
