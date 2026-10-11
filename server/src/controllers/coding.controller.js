import { z } from 'zod';
import { codingModel } from '../models/coding.model.js';
import { languages, runProgram } from '../services/code-runner.service.js';
import { queueStats } from '../services/judge.service.js';
import { codeRunnerConfig } from '../../config/code-runner.config.js';
import { audit } from '../services/audit.service.js';

const program = z.object({
    language: z.string().min(1).max(20),
    code: z.string().min(1, 'Write some code first').max(65536, 'The program is too long (64 KB at most).'),
});
const runSchema = program.extend({ customInput: z.string().max(1024 * 1024).optional() });
const listSchema = z.object({ problemId: z.string().uuid().optional(), all: z.enum(['1', 'true']).optional() });

const languageIds = () => languages().map(l => l.id);
const problemSchema = z.object({
    title: z.string().trim().min(3).max(150),
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).default('EASY'),
    topic: z.string().trim().max(80).default(''),
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
export async function editorOptions(_req, res) {
    res.json({ languages: languages() });
}
export async function previewCode(req, res) {
    const input = program.extend({
        input: z.string().max(1024 * 1024).default(''),
        timeLimitMs: z.number().int().min(500).max(10000).default(2000),
        memoryLimitMb: z.number().int().min(64).max(1024).default(256),
    }).parse(req.body);
    res.json(await runProgram(input.language, input.code, [{ input: input.input, expectedOutput: '' }], input.timeLimitMs, { compare: () => true, memoryMb: input.memoryLimitMb }));
}

// ---- Practice ----
export async function listProblems(req, res) {
    res.json({ problems: await codingModel.list(...ctx(req)), languages: languages(), runner: codeRunnerConfig.mode });
}
export async function problem(req, res) {
    res.json(await codingModel.detail(...ctx(req), req.params.id));
}
export async function run(req, res) {
    res.status(202).json(await codingModel.run(...ctx(req), req.params.id, runSchema.parse(req.body)));
}
export async function submit(req, res) {
    res.status(202).json(await codingModel.submit(...ctx(req), req.params.id, program.parse(req.body)));
}
export async function submissions(req, res) {
    const { problemId, all } = listSchema.parse(req.query);
    res.json(await codingModel.submissions(...ctx(req), { problemId, all: Boolean(all) }));
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
export async function submission(req, res) {
    res.json(await waitUntilJudged(() => codingModel.submission(...ctx(req), req.params.id), Boolean(req.query.wait)));
}
export async function queue(req, res) {
    res.json(await queueStats());
}

// ---- Authoring ----
export async function manageList(req, res) {
    res.json(await codingModel.manageList(...ctx(req)));
}
export async function editorDetail(req, res) {
    res.json(await codingModel.editorDetail(...ctx(req), req.params.id));
}
export async function createProblem(req, res) {
    const after = await codingModel.create(...ctx(req), problemSchema.parse(req.body));
    await audit(req, { action: 'create', collegeId: req.identity.role === 'SUPER_ADMIN' ? null : req.collegeId, entityType: 'coding_problem', entityId: after.id, after: { title: after.title } });
    res.status(201).json(after);
}
export async function updateProblem(req, res) {
    const { before, after } = await codingModel.update(...ctx(req), req.params.id, problemSchema.parse(req.body));
    await audit(req, { action: 'update', collegeId: req.identity.role === 'SUPER_ADMIN' ? null : req.collegeId, entityType: 'coding_problem', entityId: after.id, before: { title: before.title, status: before.status }, after: { title: after.title, status: after.status } });
    res.json(after);
}
export async function deleteProblem(req, res) {
    const before = await codingModel.remove(...ctx(req), req.params.id);
    await audit(req, { action: 'delete', collegeId: req.identity.role === 'SUPER_ADMIN' ? null : req.collegeId, entityType: 'coding_problem', entityId: before.id, before: { title: before.title } });
    res.json({ success: true });
}
export async function saveTestCases(req, res) {
    const { cases } = casesSchema.parse(req.body);
    const after = await codingModel.saveTestCases(...ctx(req), req.params.id, cases);
    await audit(req, { action: 'set_test_cases', collegeId: req.identity.role === 'SUPER_ADMIN' ? null : req.collegeId, entityType: 'coding_problem', entityId: req.params.id, after: { count: cases.length, samples: cases.filter(c => c.isSample).length } });
    res.json(after);
}
export async function publish(req, res) {
    const result = await codingModel.validateAndPublish(...ctx(req), req.params.id);
    if (result.published) await audit(req, { action: 'publish', collegeId: req.identity.role === 'SUPER_ADMIN' ? null : req.collegeId, entityType: 'coding_problem', entityId: req.params.id });
    res.json(result);
}
export async function unpublish(req, res) {
    const result = await codingModel.unpublish(...ctx(req), req.params.id);
    await audit(req, { action: 'unpublish', collegeId: req.identity.role === 'SUPER_ADMIN' ? null : req.collegeId, entityType: 'coding_problem', entityId: req.params.id });
    res.json(result);
}
