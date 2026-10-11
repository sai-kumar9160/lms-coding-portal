import fs from 'node:fs';
import { PDFDocument } from 'pdf-lib';

// Copies pages [first, last] (1-based, inclusive) of a PDF into a new PDF and returns its bytes.
// Text, code listings and diagrams are copied as-is, so the chapter looks exactly like the original.
export async function extractPages(sourcePath, first, last, title) {
    const source = await PDFDocument.load(fs.readFileSync(sourcePath), { updateMetadata: false });
    const total = source.getPageCount();
    if (!(first >= 1 && last >= first && last <= total))
        throw new Error(`Pages ${first}-${last} are outside the PDF (1-${total})`);
    const chapter = await PDFDocument.create();
    const pages = await chapter.copyPages(source, Array.from({ length: last - first + 1 }, (_, i) => first - 1 + i));
    pages.forEach(page => chapter.addPage(page));
    if (title)
        chapter.setTitle(title);
    return Buffer.from(await chapter.save());
}
