import { test, expect, type Page } from '@playwright/test';
import { setupSession, archived, profile } from './session-fixture';
import type {} from './session-control';

const open = { ...archived,id:'11111111-1111-4111-8111-111111111111',slug:'admin-fixture',title:'Admin fixture',status:'open',starts_at:'2099-01-01T10:00:00Z',ends_at:'2099-01-01T11:00:00Z' };
const createdId='22222222-2222-4222-8222-222222222222';
async function setup(page: Page) {
  await setupSession(page,true,true);
  let rows=[open,archived];
  let meeting='';
  let failure: 'duplicate' | 'deny' | 'empty' | null=null;
  let publicFailure=false, detailsFailure=false;
  let writes=0;
  await page.route('**/rest/v1/workshops*',async route=>{
    const request=route.request(), params=new URL(request.url()).searchParams;
    expect(params.get('select')).not.toMatch(/meet_url|email/);
    if(['POST','PATCH'].includes(request.method())) {
      writes++;
      if(failure==='duplicate') return route.fulfill({status:409,json:{code:'23505',message:'duplicate'}});
      if(failure==='deny') return route.fulfill({status:403,json:{code:'42501',message:'Denied fixture'}});
      if(failure==='empty') return route.fulfill({status:406,json:{code:'PGRST116',message:'No rows'}});
      const payload=request.postDataJSON();
      const row=request.method()==='POST' ? {...open,...payload,id:createdId} : {...rows.find(row=>`eq.${row.id}`===params.get('id'))!,...payload};
      rows=request.method()==='POST' ? [...rows,row] : rows.map(old=>old.id===row.id?row:old);
      return route.fulfill({json:row});
    }
    if(publicFailure && params.has('status')) return route.fulfill({status:403,json:{message:'Public refresh denied'}});
    return route.fulfill({json:rows.filter(row=>(!params.has('status') || row.status!=='archived') && (!params.has('id') || params.get('id')===`eq.${row.id}`))});
  });
  await page.route('**/rest/v1/workshop_links*',route=>{
    if(route.request().method()==='POST') {
      const body=route.request().postDataJSON(); meeting=body.meet_url;
      return route.fulfill({json:{workshop_id:body.workshop_id,meet_url:meeting}});
    }
    return route.fulfill({json:meeting?[{meet_url:meeting}]:[]});
  });
  await page.route('**/rest/v1/registrations*',route=>{
    const params=new URL(route.request().url()).searchParams;
    if(!params.has('workshop_id')) return route.fulfill({json:[]});
    if(detailsFailure) return route.fulfill({status:403,json:{message:'Private details denied'}});
    return route.fulfill({json:[{id:'reservation',user_id:profile.id,workshop_id:params.get('workshop_id')!.slice(3),created_at:'2026-01-01T00:00:00Z'}]});
  });
  return {rows:()=>rows,writes:()=>writes,meeting:()=>meeting,fail:(value:typeof failure)=>{failure=value;}, failPublic:(value:boolean)=>{publicFailure=value;},failDetails:(value:boolean)=>{detailsFailure=value;}};
}
async function createForm(page:Page) {
  await page.getByRole('button',{name:'Create Workshop',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'Create New Workshop',exact:true});
  await dialog.getByLabel('Title *',{exact:true}).fill('Created fixture');
  await dialog.getByLabel('Slug * (URL friendly)',{exact:true}).fill('created-fixture');
  await dialog.getByLabel('Publication status',{exact:true}).selectOption('open');
  await dialog.getByLabel('Starts At (UTC)',{exact:true}).fill('2099-01-02T10:00');
  await dialog.getByLabel('Ends At (UTC)',{exact:true}).fill('2099-01-02T11:00');
  return dialog;
}
async function publicWorkshops(page:Page) {
  const toggle=page.getByRole('button',{name:'Toggle navigation',exact:true});
  if(await toggle.isVisible()) await toggle.click();
  await page.getByRole('banner').getByRole('button',{name:'Workshops',exact:true}).click();
}

test('admin creates and edits a workshop, refreshes public discovery, and archives without losing admin/history access',async({page})=>{
  test.setTimeout(60_000);
  const state=await setup(page);
  await page.goto('/admin');
  await expect(page.getByLabel('Managing:',{exact:true}).locator('option').filter({hasText:`${archived.title} (archived)`})).toHaveCount(1);
  const dialog=await createForm(page);
  await dialog.getByRole('button',{name:'Create Workshop',exact:true}).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('status').filter({hasText:'Workshop saved.'})).toBeVisible();
  await publicWorkshops(page);
  await expect(page.getByRole('heading',{name:'Created fixture',exact:true})).toBeVisible();
  await page.goto('/admin');
  await page.getByRole('button',{name:'Edit Created fixture',exact:true}).click();
  await page.getByLabel('Title *',{exact:true}).fill('Edited fixture');
  await page.getByRole('button',{name:'Save Changes',exact:true}).click();
  await expect(page.getByRole('button',{name:'Edit Edited fixture',exact:true})).toBeVisible();
  page.on('dialog',dialog=>dialog.accept());
  const row=page.getByRole('row').filter({has:page.getByRole('button',{name:'Edit Edited fixture',exact:true})});
  await row.getByRole('button',{name:'Archive',exact:true}).click();
  await expect(page.getByRole('status').filter({hasText:'Workshop archived.'})).toBeVisible();
  expect(state.rows().find(row=>row.id===createdId)?.status).toBe('archived');
  await page.getByLabel('Managing:',{exact:true}).selectOption(createdId);
  await expect(page.getByText('Meeting management is unavailable for cancelled or archived workshops.',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Registrations',exact:true}).click();
  await expect(page.getByRole('cell',{name:profile.email,exact:true})).toBeVisible();
  await publicWorkshops(page);
  await expect(page.getByRole('heading',{name:'Edited fixture',exact:true})).toHaveCount(0);
});

test('admin form retains drafts on duplicate slug/denial and validates timezone, metadata and schedule before writing',async({page})=>{
  const state=await setup(page); await page.goto('/admin');
  const dialog=await createForm(page);
  await dialog.getByLabel('Display timezone (IANA)',{exact:true}).fill('Not/AZone');
  await dialog.getByRole('button',{name:'Create Workshop',exact:true}).click();
  await expect(dialog.getByRole('alert')).toContainText('valid IANA timezone'); expect(state.writes()).toBe(0);
  await dialog.getByLabel('Display timezone (IANA)',{exact:true}).fill('Asia/Kolkata');
  await dialog.getByLabel('Ends At (UTC)',{exact:true}).fill('');
  await dialog.getByRole('button',{name:'Create Workshop',exact:true}).click();
  await expect(dialog.getByRole('alert')).toContainText('valid start and end'); expect(state.writes()).toBe(0);
  await dialog.getByLabel('Ends At (UTC)',{exact:true}).fill('2099-01-02T11:00');
  state.fail('duplicate'); await dialog.getByRole('button',{name:'Create Workshop',exact:true}).click();
  await expect(dialog.getByRole('alert')).toContainText('slug is already in use');
  await expect(dialog.getByLabel('Title *',{exact:true})).toHaveValue('Created fixture');
  state.fail('empty'); await dialog.getByRole('button',{name:'Create Workshop',exact:true}).click();
  await expect(dialog.getByRole('alert')).toContainText('not confirmed');
  state.fail(null); await dialog.getByRole('button',{name:'Create Workshop',exact:true}).click();
  await expect(dialog).toHaveCount(0);
});

test('Meet management validates, confirms replacement/clearing, and refuses edits for closed workshops',async({page})=>{
  const state=await setup(page); await page.goto('/admin');
  const input=page.getByLabel('Google Meet URL',{exact:true});
  await input.fill('https://evil.test/meeting'); await page.getByRole('button',{name:'Save Meet Link',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('https://meet.google.com/abc-defg-hij'); expect(state.meeting()).toBe('');
  await input.fill('https://meet.google.com/abc-defg-hij'); await page.getByRole('button',{name:'Save Meet Link',exact:true}).click();
  await expect(page.getByRole('status').filter({hasText:'Meet link saved.'})).toBeVisible();
  expect(state.meeting()).toBe('https://meet.google.com/abc-defg-hij');
  await input.fill(''); await page.getByRole('button',{name:'Save Meet Link',exact:true}).click();
  await expect.poll(()=>state.meeting()).toBe('');
  await expect(page.getByRole('button',{name:'Save Meet Link',exact:true})).toBeEnabled();
  await page.getByLabel('Managing:',{exact:true}).selectOption(archived.id);
  await expect(page.getByLabel('Google Meet URL',{exact:true})).toHaveCount(0);
  await expect(page.getByText('Meeting management is unavailable for cancelled or archived workshops.',{exact:true})).toBeVisible();
});

test('saved workshop with failed public refresh reports partial success rather than failed save',async({page})=>{
  const state=await setup(page); await page.goto('/admin'); const dialog=await createForm(page);
  state.failPublic(true); await dialog.getByRole('button',{name:'Create Workshop',exact:true}).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('status').filter({hasText:'Saved, but the latest lists could not be loaded'})).toBeVisible();
  expect(state.writes()).toBe(1);
});

test('attendee read failure is a retry state, not zero registrations',async({page})=>{
  const state=await setup(page); await page.goto('/admin'); state.failDetails(true);
  await page.getByRole('button',{name:'Registrations',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('Admin details could not be loaded');
  await expect(page.getByText('No registrations yet for this workshop.',{exact:true})).toHaveCount(0);
  state.failDetails(false); await page.getByRole('button',{name:'Retry admin details',exact:true}).click();
  await expect(page.getByRole('cell',{name:profile.email,exact:true})).toBeVisible();
});

test('host contact remains signed-in and contact-first, with no placeholder F1 Forge links',async({page})=>{
  await setupSession(page,true); await page.goto('/workshops');
  await page.getByRole('button',{name:'Host',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'Host a Workshop',exact:true});
  await expect(dialog.getByRole('link',{name:'9566298639',exact:true})).toHaveAttribute('href','tel:9566298639');
  await expect(dialog.getByRole('button',{name:/publish|pay|create workshop/i})).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button',{name:'Host',exact:true})).toBeFocused();
  await expect(page.locator('a[href*="FILL"]')).toHaveCount(0);
  await expect(page.getByRole('contentinfo').getByRole('link',{name:'F1 Forge',exact:true})).toHaveCount(0);
});

test('ordinary account and anonymous visitors cannot reach admin controls or private attendees',async({page})=>{
  for(const signedIn of [false,true]) {
    const requests=await setupSession(page,signedIn);
    await page.goto('/admin');
    await expect(page.getByRole('heading',{name:signedIn?'Admin access required':'Sign-in temporarily unavailable',exact:true})).toBeVisible();
    await expect(page.getByRole('button',{name:'Create Workshop',exact:true})).toHaveCount(0);
    await expect(page.getByText(profile.email,{exact:true})).toHaveCount(0);
    expect(requests.some(url=>url.searchParams.has('workshop_id'))).toBe(false);
    await page.unrouteAll({behavior:'ignoreErrors'});
  }
});

test('admin logout discards a delayed private attendee response',async({page})=>{
  await setup(page); let release!:()=>void; let reads=0; const gate=new Promise<void>(resolve=>{release=resolve;});
  await page.route('**/rest/v1/registrations*',async route=>{
    if(!new URL(route.request().url()).searchParams.has('workshop_id')) return route.fallback();
    reads++; await gate; await route.fulfill({json:[{id:'late',user_id:profile.id,workshop_id:open.id,created_at:'2026-01-01T00:00:00Z'}]}).catch(()=>{});
  });
  await page.goto('/tests/browser/harness.html?session=controlled');
  await page.evaluate(()=>window.sessionTest.resolve(window.sessionTest.initial));
  await expect(page.getByLabel('Admin status')).toHaveText('true');
  await page.getByRole('button',{name:'Private admin',exact:true}).click();
  await page.getByRole('button',{name:'Registrations',exact:true}).click();
  await expect.poll(()=>reads).toBeGreaterThan(0);
  await page.evaluate(()=>window.sessionTest.emit(null)); release();
  await expect(page.getByRole('button',{name:'Create Workshop',exact:true})).toHaveCount(0);
  await expect(page.getByRole('cell',{name:profile.email,exact:true})).toHaveCount(0);
});
