import { proxyService } from '../services/proxy.service.js';

export async function forward(req, res) {
    const upstream = await proxyService.forward(req);
    res.status(upstream.status).type(upstream.contentType).send(upstream.body);
}
