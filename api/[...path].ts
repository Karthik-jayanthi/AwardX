import { resolveHandler } from './_handlers/registry';

export default async function handler(req: any, res: any) {
  const raw = req.query.path;
  const pathKey = Array.isArray(raw) ? raw.join('/') : raw || 'health';
  const method = (req.method || 'GET').toUpperCase();

  const routeHandler = resolveHandler(pathKey, method);
  if (!routeHandler) {
    res.status(404).json({ error: 'Not found', path: pathKey, method });
    return;
  }

  await routeHandler(req, res);
}
