// Public, read-only hosting checks. Never execute downloaded code or print keys.
import { fileURLToPath } from 'node:url';
import { writeFile } from 'node:fs/promises';

export async function checkReleaseHost(address) {
  const base = new URL(address);
  if (base.username || base.password || base.search || base.hash || base.pathname !== '/') {
    throw new Error('Provide the site origin only, without credentials, a path or query parameters.');
  }
  if (base.protocol !== 'https:' && !(base.protocol === 'http:' && ['127.0.0.1','localhost','[::1]'].includes(base.hostname))) {
    throw new Error('Use HTTPS, or a local HTTP server for testing.');
  }
  async function get(path) {
    try {
      const response = await fetch(new URL(path, base), { signal: AbortSignal.timeout(20000), redirect: 'manual' });
      const body = await response.text();
      return { path, status: response.status, contentType: response.headers.get('content-type') ?? '',
        cacheControl: response.headers.get('cache-control') ?? '', body };
    } catch { return { path, status: 0, contentType: '', cacheControl: '', body: '', error: 'Request failed or timed out' }; }
  }
  const documentPaths = ['/', '/workshops', '/workshops/be33c1fc-e4c4-4def-b33e-078fdf662400', '/dashboard', '/profile', '/admin'];
  const missingPaths = ['/assets/workify-release-check-not-present.js', '/api/workify-release-check-not-present', '/rest/workify-release-check-not-present'];
  const documents = await Promise.all(documentPaths.map(get));
  const missing = await Promise.all(missingPaths.map(get));
  const home = documents[0];
  const assetPaths = [...new Set([...home.body.matchAll(/(?:src|href)=["']([^"']+\.(?:js|css))["']/g)]
    .map(match => new URL(match[1], base)).filter(url => url.origin === base.origin && url.pathname.startsWith('/assets/'))
    .map(url => url.pathname))];
  const assets = await Promise.all(assetPaths.map(get));
  const appDocument = body => /<div\s+id=["']root["']/.test(body) && /<script[^>]+type=["']module["']/.test(body);
  const summarize = ({ body: _body, ...result }, passed, expected) => ({ ...result, passed, expected });
  const checks = [
    ...documents.map(result => summarize(result, result.status === 200 && /text\/html/.test(result.contentType) && appDocument(result.body), '200 with the application document')),
    ...missing.map(result => summarize(result, result.status === 404 && !appDocument(result.body), '404 without the application entry document')),
    ...assets.map(result => summarize(result, result.status === 200 && !/text\/html/.test(result.contentType)
      && (result.path.endsWith('.css') ? /text\/css/.test(result.contentType) : /javascript/.test(result.contentType)), '200 with the correct asset content type')),
  ];
  if (!assetPaths.length) checks.push({ path: '/', passed: false, expected: 'At least one same-origin entry asset' });
  const source = assets.filter(asset => asset.path.endsWith('.js') && asset.status === 200).map(asset => asset.body).join('\n');
  return { origin: base.origin, checkedAt: new Date().toISOString(), checks,
    observedBackendOrigins: [...new Set(source.match(/https:\/\/[a-z0-9]+\.supabase\.co/g) ?? [])],
    bundleMarkers: { retiredReviewEndpoint: source.includes('review-linkedin'), historicalReviewTable: source.includes('linkedin_reviews'),
      newMeetingRpc: source.includes('get_workshop_join_state'), testSession: source.includes('sessionTest') },
    passed: checks.every(check => check.passed),
    limits: 'Public HTTP checks and entry-bundle strings only; no browser login, private data, mutation or deployment. Lazy chunks and runtime behavior are not covered.' };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (!process.argv[2]) throw new Error('Usage: node scripts/check-release-host.mjs https://your-site.example [report.json]');
  const report = await checkReleaseHost(process.argv[2]);
  if (process.argv[3]) await writeFile(process.argv[3], `${JSON.stringify(report,null,2)}\n`);
  console.log(JSON.stringify(report,null,2));
  if (!report.passed) process.exitCode = 1;
}
