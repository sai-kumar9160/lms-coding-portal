import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { db } from '../../config/db.config.js';
import { fileModel } from '../../src/models/file.model.js';
import { tmpDir } from '../../src/services/file-storage.service.js';
import { extractPages } from '../../src/services/pdf-split.service.js';

// For each lesson with a page range, cuts that range out of the notes PDF, stores it as an upload of the
// college, and turns the lesson into a PDF lesson showing that chapter (its topic list stays as notes).
export async function attachChapterPdfs({ ownerId, collegeId, notesPath, lessons }) {
    let attached = 0;
    for (const lesson of lessons) {
        const [first, last] = lesson.pages;
        const bytes = await extractPages(notesPath, first, last, lesson.title);
        const tmp = path.join(tmpDir, randomUUID());
        fs.writeFileSync(tmp, bytes);
        const name = `${lesson.title.replace(/[^\w .&()-]+/g, '').trim().slice(0, 120)} (pages ${first}-${last}).pdf`;
        const file = await fileModel.store({ id: ownerId }, collegeId, 'DOCUMENT', { path: tmp, originalname: name, size: bytes.length });
        await db.lesson.update({ where: { id: lesson.id }, data: { lessonType: 'DOCUMENT', fileId: file.id, allowDownload: 1, updatedBy: ownerId } });
        attached++;
    }
    return attached;
}
