import controlHandler from '../manager/control.js';

export default async function handler(req, res) {
  req.query = { ...(req.query || {}), action: 'validate' };
  return controlHandler(req, res);
}
