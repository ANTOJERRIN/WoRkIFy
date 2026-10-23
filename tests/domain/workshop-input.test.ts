import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeWorkshopInput, validateWorkshopInput, type WorkshopInput } from '../../src/domain/workshopInput.ts';
import { readSiteContacts } from '../../src/domain/siteContacts.ts';

const input: WorkshopInput = { slug:' workshop-fixture ',title:' Workshop ',hostName:' Host ',status:'open',shortDescription:'',fullDescription:'',
  tags:[' React ','React',''],startsAt:'2030-01-01T10:00:00Z',endsAt:'2030-01-01T11:00:00Z',timezone:'Asia/Kolkata' };
test('admin inputs normalize slug, text and tags without inventing schedules', () => {
  assert.equal(validateWorkshopInput(input),null);
  assert.equal(normalizeWorkshopInput({...input,slug:' WORKSHOP-FIXTURE '}).slug,'workshop-fixture');
  assert.deepEqual(normalizeWorkshopInput(input).tags,['React']);
  assert.equal(validateWorkshopInput({...input,status:'coming_soon',startsAt:null,endsAt:null}),null);
});
test('admin input rejects slug, field, schedule, timezone and public meeting-address violations', () => {
  for (const change of [
    {slug:'x'}, {slug:'bad--slug'}, {slug:'bad slug'}, {title:' '}, {title:'x'.repeat(161)}, {hostName:' '},
    {shortDescription:'x'.repeat(501)}, {fullDescription:'x'.repeat(12001)}, {tags:['x'.repeat(41)]},
    {tags:Array.from({length:11},(_,i)=>String(i))}, {timezone:'Not/AZone'}, {timezone:''},
    {startsAt:null}, {endsAt:'2029-01-01T00:00:00Z'}, {fullDescription:'https://meet.google.com/abc-defg-hij'},
  ]) assert.ok(validateWorkshopInput({...input,...change}),JSON.stringify(change));
});
test('host contacts preserve the local number and never turn placeholders or invalid URLs into links', () => {
  assert.equal(readSiteContacts({}).phone,'9566298639');
  for (const value of ['[FILL: website]','javascript:alert(1)','https://','https://user:pass@example.test']) assert.equal(readSiteContacts({VITE_F1FORGE_URL:value}).f1ForgeUrl,'');
  assert.deepEqual(readSiteContacts({VITE_HOST_CONTACT_NUMBER:'+91 95662 98639',VITE_F1FORGE_URL:'https://example.test/forge'}), {phone:'+919566298639',f1ForgeUrl:'https://example.test/forge'});
  assert.equal(readSiteContacts({VITE_HOST_CONTACT_NUMBER:'call me'}).phone,'');
  assert.equal(readSiteContacts({VITE_HOST_CONTACT_NUMBER:''}).phone,'');
});
