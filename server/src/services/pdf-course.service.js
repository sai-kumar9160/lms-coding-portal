import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { db } from '../../config/db.config.js';
import { fileModel } from '../models/file.model.js';
import { tmpDir } from './file-storage.service.js';
import { extractPages } from './pdf-split.service.js';
import { createLogger } from '../utils/logger.js';
import { fail } from '../utils/http-error.js';

const log = createLogger('pdf-course');
const converter = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'scripts', 'pdf-course.py');
// The converter needs Python 3 with PyMuPDF (pip install pymupdf). PYTHON_PATH selects the interpreter.
const python = process.env.PYTHON_PATH || 'python';
const TIMEOUT_MS = 5 * 60 * 1000;
const MAX_PARALLEL = 2;
let running = 0;

// Runs scripts/pdf-course.py on a PDF and returns its output folder and manifest.
function convert(pdfPath) {
    const outdir = path.join(tmpDir, `convert-${randomUUID()}`);
    return new Promise((resolve, reject) => {
        // -I: isolated mode, so nothing from the working directory or user site-packages is imported.
        execFile(python, ['-I', converter, pdfPath, outdir], { timeout: TIMEOUT_MS, maxBuffer: 4 * 1024 * 1024, windowsHide: true }, (error, _stdout, stderr) => {
            if (error) {
                fs.rmSync(outdir, { recursive: true, force: true });
                log.error('PDF conversion failed', { code: error.code, signal: error.signal, stderr: String(stderr).slice(-800) });
                if (error.code === 'ENOENT' || /No module named/.test(stderr))
                    return reject(Object.assign(new Error('PDF conversion is not available on this server (it needs Python with PyMuPDF).'), { status: 503 }));
                if (error.killed)
                    return reject(Object.assign(new Error('The PDF took too long to convert. Try a smaller PDF.'), { status: 422 }));
                return reject(Object.assign(new Error('This PDF could not be read. Check that it is a text PDF, not a scanned image.'), { status: 422 }));
            }
            try {
                resolve({ outdir, manifest: JSON.parse(fs.readFileSync(path.join(outdir, 'manifest.json'), 'utf8')) });
            }
            catch (readError) {
                fs.rmSync(outdir, { recursive: true, force: true });
                reject(readError);
            }
        });
    });
}

async function storeBuffer(identity, collegeId, purpose, bytes, name, options) {
    const tmp = path.join(tmpDir, randomUUID());
    fs.writeFileSync(tmp, bytes);
    return fileModel.store(identity, collegeId, purpose, { path: tmp, originalname: name, size: bytes.length }, options);
}

// Creates the units and lessons of a course from converted PDF output: each lesson gets its formatted text,
// its figures (as lesson images) and its own pages of the PDF. Returns counts.
async function buildUnits(identity, collegeId, courseId, units, outdir, pdfPath) {
    const audit = { collegeId, createdBy: identity.id };
    let images = 0, lessons = 0;
    for (const [m, unit] of units.entries()) {
        const module = await db.courseModule.create({ data: { courseId, title: unit.title, position: m, ...audit } });
        for (const [l, entry] of unit.lessons.entries()) {
            const lesson = await db.lesson.create({ data: { moduleId: module.id, title: entry.title, position: l, content: '', contentFormat: 'MARKDOWN', ...audit } });
            let markdown = fs.readFileSync(path.join(outdir, entry.markdown), 'utf8').replace(/\r\n/g, '\n');
            for (const name of entry.images) {
                const file = await storeBuffer(identity, collegeId, 'IMAGE', fs.readFileSync(path.join(outdir, name)), name, { lessonId: lesson.id });
                markdown = markdown.split(`asset:${name}`).join(`file:${file.id}`);
                images++;
            }
            const [first, last] = entry.pages;
            const chapter = await storeBuffer(identity, collegeId, 'DOCUMENT', await extractPages(pdfPath, first, last, entry.title), `${entry.title.replace(/[^\w .&()-]+/g, '').trim().slice(0, 100) || 'chapter'} (pages ${first}-${last}).pdf`);
            await db.lesson.update({ where: { id: lesson.id }, data: { content: markdown, lessonType: 'DOCUMENT', fileId: chapter.id, allowDownload: 1 } });
            lessons++;
        }
    }
    return { units: units.length, lessons, images };
}

// Converts a PDF (at most MAX_PARALLEL at once), runs work(units, outdir) and always removes the temporary output.
async function withConversion(pdfPath, work) {
    if (running >= MAX_PARALLEL)
        fail(429, 'Another PDF is being converted. Please try again in a minute.');
    running++;
    let outdir = null;
    try {
        const result = await convert(pdfPath);
        outdir = result.outdir;
        const units = result.manifest.units.filter(unit => unit.lessons.length);
        if (!units.length)
            fail(422, 'No readable text was found in this PDF.');
        return await work(units, outdir);
    }
    finally {
        running--;
        if (outdir)
            fs.rmSync(outdir, { recursive: true, force: true });
    }
}

// Creates a DRAFT course from an uploaded PDF: one lesson per chapter with its formatted text, figures and chapter PDF;
// the whole PDF is linked as the course's syllabus / notes file. pdf = { fileId, path } of the stored upload.
export async function createCourseFromPdf(identity, collegeId, input, pdf) {
    return withConversion(pdf.path, async (units, outdir) => {
        const audit = { collegeId, createdBy: identity.id };
        const course = await db.course.create({ data: {
            title: input.title, description: input.description || `Course created from ${input.fileName}.`, code: input.code ?? null, level: input.level ?? null,
            syllabusFileId: pdf.fileId, teacherId: identity.id, ...audit,
            instructors: { create: { userId: identity.id, role: 'OWNER', ...audit } },
        } });
        try {
            const counts = await buildUnits(identity, collegeId, course.id, units, outdir, pdf.path);
            log.info('Course created from PDF', { courseId: course.id, ...counts, userId: identity.id });
            return { id: course.id, title: course.title, ...counts };
        }
        catch (error) {
            // Never leave a half-built course behind.
            await db.course.update({ where: { id: course.id }, data: { activeIndicator: 0, updatedBy: identity.id } }).catch(() => {});
            throw error;
        }
    });
}

// Re-converts a course's linked PDF (for example after converter improvements) and replaces all its units and lessons.
// The old units are soft-deleted only after the new ones are complete, so a failure leaves the course unchanged.
// Student progress on the replaced lessons does not carry over.
export async function rebuildCourseFromPdf(identity, collegeId, course, pdfPath) {
    return withConversion(pdfPath, async (units, outdir) => {
        const oldModules = await db.courseModule.findMany({ where: { courseId: course.id, activeIndicator: 1 }, select: { id: true } });
        try {
            const counts = await buildUnits(identity, collegeId, course.id, units, outdir, pdfPath);
            await db.courseModule.updateMany({ where: { id: { in: oldModules.map(m => m.id) } }, data: { activeIndicator: 0, updatedBy: identity.id } });
            log.info('Course rebuilt from PDF', { courseId: course.id, ...counts, userId: identity.id });
            return { id: course.id, title: course.title, ...counts };
        }
        catch (error) {
            // Remove any half-built new units; the old ones are still active.
            await db.courseModule.updateMany({ where: { courseId: course.id, activeIndicator: 1, id: { notIn: oldModules.map(m => m.id) } }, data: { activeIndicator: 0, updatedBy: identity.id } }).catch(() => {});
            throw error;
        }
    });
}
