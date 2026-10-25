import { performanceMdl } from '../models/performanceMdl.js';

export async function myPerformanceCtrl(req, res) {
    res.json(await performanceMdl.forStudent(req.identity, req.collegeId));
}
