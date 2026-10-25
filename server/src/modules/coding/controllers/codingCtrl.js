import { z } from 'zod';
import { codingMdl } from '../models/codingMdl.js';
import { languages, runProgram } from '../../../services/code-runner.service.js';
import { queueStats } from '../../../services/judge.service.js';
import { codeRunnerConfig } from '../../../../config/code-runner.config.js';
import { isPlatformRole } from '../../../utils/enums.js';
import { audit } from '../../../services/audit.service.js';
import { idSchema } from '../../../utils/ids.js';

const program = z.object({
    language: z.string().min(1).max(20),
    code: z.string().min(1, 'Write some code first').max(65536, 'The program is too long (64 KB at most).'),
});
const runSchema = program.extend({ customInput: z.string().max(1024 * 1024).optional() });
const listSchema = z.object({ problemId: idSchema.optional(), all: z.enum(['1', 'true']).optional() });

const languageIds = () => languages().map(l => l.id);
const problemSchema = z.object({
    title: z.string().trim().min(3).max(150),
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).default('EASY'),
    topic: z.string().trim().max(80).default(''),
    track: z.string().trim().min(1).max(40).optional(),
    statement: z.string().trim().min(10).max(20000),
    inputFormat: z.string().trim().max(5000).default(''),
    outputFormat: z.string().trim().max(5000).default(''),
    constraints: z.string().trim().max(5000).default(''),
    timeLimitMs: z.number().int().min(500).max(10000).default(2000),
    memoryLimitMb: z.number().int().min(64).max(1024).default(256),
    visibility: z.enum(['PRACTICE', 'SHARED', 'ASSESSMENT']).default('PRACTICE'),
    languages: z.array(z.string()).max(20).nullish().transform(value => value?.length ? value : null)
        .refine(value => !value || value.every(id => languageIds().includes(id)), 'Unknown language'),
    checker: z.enum(['TRIMMED', 'EXACT', 'TOKEN', 'CASE_INSENSITIVE', 'NUMERIC', 'UNORDERED']).default('TRIMMED'),
    epsilon: z.number().min(0).max(1).default(0.000001),
    scoring: z.enum(['WEIGHTED', 'GROUP', 'BINARY']).default('WEIGHTED'),
    maxScore: z.number().positive().max(1000).default(100),
    referenceLanguage: z.string().max(20).nullish().transform(value => value || null),
    referenceSolution: z.string().max(65536).nullish().transform(value => value || null),
});
const caseSchema = z.object({
    input: z.string().max(8 * 1024 * 1024),
    expectedOutput: z.string().max(8 * 1024 * 1024).refine(value => value.trim() !== '', 'Expected output cannot be empty'),
    isSample: z.boolean().default(false),
    weight: z.number().min(0).max(1000).default(1),
    group: z.string().trim().max(40).default(''),
    explanation: z.string().trim().max(2000).default(''),
});
const casesSchema = z.object({ cases: z.array(caseSchema).min(1).max(200) });
const ctx = req => [req.identity, req.collegeId];
export async function editorOptionsCtrl(_req, res) {
    res.json({ languages: languages() });
}
export async function previewCodeCtrl(req, res) {
    const input = program.extend({
        input: z.string().max(1024 * 1024).default(''),
        timeLimitMs: z.number().int().min(500).max(10000).default(2000),
        memoryLimitMb: z.number().int().min(64).max(1024).default(256),
    }).parse(req.body);
    res.json(await runProgram(input.language, input.code, [{ input: input.input, expectedOutput: '' }], input.timeLimitMs, { compare: () => true, memoryMb: input.memoryLimitMb }));
}

// ---- Practice ----
export async function listProblemsCtrl(req, res) {
    res.json({ problems: await codingMdl.list(...ctx(req)), languages: languages(), runner: codeRunnerConfig.mode });
}
export async function problemCtrl(req, res) {
    res.json(await codingMdl.detail(...ctx(req), req.params.id));
}
export async function runCtrl(req, res) {
    res.status(202).json(await codingMdl.run(...ctx(req), req.params.id, runSchema.parse(req.body)));
}
export async function submitCtrl(req, res) {
    res.status(202).json(await codingMdl.submit(...ctx(req), req.params.id, program.parse(req.body)));
}
export async function submissionsCtrl(req, res) {
    const { problemId, all } = listSchema.parse(req.query);
    res.json(await codingMdl.submissions(...ctx(req), { problemId, all: Boolean(all) }));
}
// Long poll: with ?wait=1, answer once the judge is done or after 15 s, whichever comes first.
export async function waitUntilJudged(read, wait) {
    const end = Date.now() + (wait ? 15000 : 0);
    for (;;) {
        const result = await read();
        if (!['QUEUED', 'RUNNING'].includes(result.jobStatus) || Date.now() >= end) return result;
        await new Promise(resolve => setTimeout(resolve, 300));
    }
}
export async function submissionCtrl(req, res) {
    res.json(await waitUntilJudged(() => codingMdl.submission(...ctx(req), req.params.id), Boolean(req.query.wait)));
}
export async function queueCtrl(req, res) {
    res.json(await queueStats());
}

// ---- Authoring ----
export async function manageListCtrl(req, res) {
    res.json(await codingMdl.manageList(...ctx(req)));
}
export async function editorDetailCtrl(req, res) {
    res.json(await codingMdl.editorDetail(...ctx(req), req.params.id));
}
export async function createProblemCtrl(req, res) {
    const after = await codingMdl.create(...ctx(req), problemSchema.parse(req.body));
    await audit(req, { action: 'create', collegeId: isPlatformRole(req.identity.role) ? null : req.collegeId, entityType: 'coding_problem', entityId: after.id, after: { title: after.title } });
    res.status(201).json(after);
}
export async function updateProblemCtrl(req, res) {
    const { before, after } = await codingMdl.update(...ctx(req), req.params.id, problemSchema.parse(req.body));
    await audit(req, { action: 'update', collegeId: isPlatformRole(req.identity.role) ? null : req.collegeId, entityType: 'coding_problem', entityId: after.id, before: { title: before.title, status: before.status }, after: { title: after.title, status: after.status } });
    res.json(after);
}
export async function deleteProblemCtrl(req, res) {
    const before = await codingMdl.remove(...ctx(req), req.params.id);
    await audit(req, { action: 'delete', collegeId: isPlatformRole(req.identity.role) ? null : req.collegeId, entityType: 'coding_problem', entityId: before.id, before: { title: before.title } });
    res.json({ success: true });
}
export async function saveTestCasesCtrl(req, res) {
    const { cases } = casesSchema.parse(req.body);
    const after = await codingMdl.saveTestCases(...ctx(req), req.params.id, cases);
    await audit(req, { action: 'set_test_cases', collegeId: isPlatformRole(req.identity.role) ? null : req.collegeId, entityType: 'coding_problem', entityId: req.params.id, after: { count: cases.length, samples: cases.filter(c => c.isSample).length } });
    res.json(after);
}
export async function publishCtrl(req, res) {
    const result = await codingMdl.validateAndPublish(...ctx(req), req.params.id);
    if (result.published) await audit(req, { action: 'publish', collegeId: isPlatformRole(req.identity.role) ? null : req.collegeId, entityType: 'coding_problem', entityId: req.params.id });
    res.json(result);
}
export async function unpublishCtrl(req, res) {
    const result = await codingMdl.unpublish(...ctx(req), req.params.id);
    await audit(req, { action: 'unpublish', collegeId: isPlatformRole(req.identity.role) ? null : req.collegeId, entityType: 'coding_problem', entityId: req.params.id });
    res.json(result);
}
