import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';
// @ts-expect-error The read-only Node script is JavaScript, outside the app build.
import { checkReleaseHost } from '../../scripts/check-release-host.mjs';

const html = '<html><script type="module" src="/assets/index-fixture.js"></script><div id="root"></div></html>';
async function site(catchAll: boolean) {
  const server = createServer((request,response) => {
    if (request.url === '/assets/index-fixture.js') {
      response.writeHead(200,{'Content-Type':'application/javascript'});
      response.end('const origin="https://fixtureproject.supabase.co";');
    } else if (request.url?.includes('not-present') && !catchAll) {
      response.writeHead(404,{'Content-Type':'text/plain'}); response.end('Not found');
    } else { response.writeHead(200,{'Content-Type':'text/html'}); response.end(html); }
  });
  await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
  const address=server.address();
  assert.ok(address && typeof address !== 'string');
  return {url:`http://127.0.0.1:${address.port}`,close:()=>new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve()))};
}

test('release host probe accepts SPA routes with genuine missing-resource errors',async()=>{
  const fixture=await site(false);
  try {
    const result=await checkReleaseHost(fixture.url);
    assert.equal(result.passed,true);
    assert.deepEqual(result.observedBackendOrigins,['https://fixtureproject.supabase.co']);
  } finally {await fixture.close();}
});

test('release host probe rejects catch-all HTML for missing assets and backend paths',async()=>{
  const fixture=await site(true);
  try {
    const result=await checkReleaseHost(fixture.url);
    assert.equal(result.passed,false);
    assert.equal(result.checks.filter((check:{passed:boolean})=>!check.passed).length,3);
  } finally {await fixture.close();}
});

test('release host probe refuses credentialed origins and arbitrary cleartext targets',async()=>{
  await assert.rejects(checkReleaseHost('https://user:password@example.test'),/origin only/);
  await assert.rejects(checkReleaseHost('http://example.test'),/Use HTTPS/);
});
