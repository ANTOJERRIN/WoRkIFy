// Read-only checks of a local production build. Never print matched secrets.
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=fileURLToPath(new URL('../dist/',import.meta.url));
const findings=[];
let scanned=0;
function inspect(directory) {
  for(const entry of readdirSync(directory,{withFileTypes:true})) {
    const path=join(directory,entry.name);
    if(entry.isDirectory()) {inspect(path);continue;}
    if(!/\.(html|js|css|map)$/.test(entry.name)) continue;
    scanned++;
    const text=readFileSync(path,'utf8'), file=relative(root,path);
    for(const [label,pattern] of [
      ['Supabase secret key',/sb_secret_[A-Za-z0-9._-]{8,}/],
      ['private key material',/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
      ['OpenAI-style secret key',/sk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{20,}/],
      ['retired assessment reference',/review-linkedin|linkedin_reviews/],
      ['browser fixture reference',/sessionTest|sb-workify-browser-test-auth-token/],
    ]) if(pattern.test(text)) findings.push({file,label});
    for(const match of text.matchAll(/eyJ[A-Za-z0-9_-]+\.([A-Za-z0-9_-]+)\.[A-Za-z0-9_-]+/g)) {
      try { if(JSON.parse(Buffer.from(match[1],'base64url').toString()).role==='service_role') findings.push({file,label:'legacy service-role JWT'}); }
      catch { /* Ordinary text can resemble a token. */ }
    }
  }
}
inspect(root);
console.log(JSON.stringify({scanned,findings},null,2));
if(findings.length) process.exitCode=1;
