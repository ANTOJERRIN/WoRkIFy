import { test, expect, type Page } from '@playwright/test';
const base='https://workify-browser-test.supabase.co';
const owner='44444444-4444-4444-8444-444444444444';
const row={ id:'11111111-1111-4111-8111-111111111111',slug:'session-fixture',title:'Session fixture workshop',host_name:'Test owner', mode:'Online — Google Meet',starts_at:'2099-10-20T14:00:00Z',ends_at:'2099-10-20T15:00:00Z',timezone:'Asia/Kolkata',status:'open',short_description:'Test only',full_description:'Test only',tags:['Testing'] };
const user={id:owner,aud:'authenticated',role:'authenticated',email:'member@example.test',email_confirmed_at:'2026-01-01T00:00:00Z',app_metadata:{},user_metadata:{full_name:'Test Member',role:'admin'},created_at:'2026-01-01T00:00:00Z'};
const token = `${Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url')}.${Buffer.from(JSON.stringify({sub:owner,role:'authenticated',aud:'authenticated',exp:Math.floor(Date.now()/1000)+3600})).toString('base64url')}.test-signature`;
async function setup(page:Page, {admin=false,roleDelay=0,roleFail=false,loginFail=false,logoutFail=false}={}) {
  const requests: {path:string;method:string;body:Record<string,unknown>|null}[]=[];
  const workshops=[{...row}];
  await page.route(`${base}/**`,async route=>{
    const url=new URL(route.request().url());
    const path=url.pathname;
    const method=route.request().method();
    const body=route.request().postDataJSON() as Record<string,unknown>|null;
    requests.push({path,method,body});
    if(path==='/auth/v1/token') return route.fulfill(loginFail ? {status:400,json:{error_code:'invalid_credentials',msg:'Invalid login credentials'}} : {json:{access_token:token,refresh_token:'test-refresh-token',token_type:'bearer',expires_in:3600,user}});
    if(path==='/auth/v1/user') return route.fulfill({json:user});
    if(path==='/auth/v1/logout') return route.fulfill(logoutFail ? {status:500,json:{message:'test failure'}} : {status:204});
    if(path==='/auth/v1/signup') return route.fulfill({json:{...user,identities:[]}});
    if(path==='/auth/v1/recover') return route.fulfill({json:{}});
    if(path==='/rest/v1/admin_users') {
      if(roleDelay) await new Promise(resolve=>setTimeout(resolve,roleDelay));
      return route.fulfill(roleFail ? {status:403,json:{message:'test role failure'}} : {json:admin ? [{user_id:owner}] : []});
    }
    if(path==='/rest/v1/workshops') {
      if(method==='POST') { const saved={...row,...body,id:'55555555-5555-4555-8555-555555555555'}; workshops.push(saved); return route.fulfill({json:saved}); }
      if(method==='PATCH') { const selected=workshops.find(workshop=>`eq.${workshop.id}`===url.searchParams.get('id'))!; Object.assign(selected,body); return route.fulfill({json:selected}); }
      return route.fulfill({json:workshops});
    }
    if(path==='/rest/v1/profiles') return route.fulfill({json:{id:owner,name:'Test Member',email:user.email,skills:[]}});
    if(path==='/rest/v1/registrations') return route.fulfill({json:[]});
    if(path==='/rest/v1/workshop_links') return route.fulfill({json:method==='GET'?[]:{workshop_id:row.id}});
    return route.fulfill({status:404,json:{message:'Unexpected test request'}});
  });
  return requests;
}
async function login(page:Page) {
  await page.getByLabel('Email address').fill(user.email);
  await page.getByLabel('Password',{exact:true}).fill('test-password-only');
  await page.getByRole('button',{name:'Sign in to Workify',exact:true}).click();
}
test('login screen renders and failed sign-in retains input with an actionable error',async({page},testInfo)=>{
  await setup(page,{loginFail:true});
  await page.goto('/login');
  await expect(page.getByRole('heading',{name:'Welcome back.'})).toBeVisible();
  await page.screenshot({path:testInfo.outputPath('login-default.png'),fullPage:true});
  await login(page);
  await expect(page.getByRole('alert')).toHaveText('Email or password is incorrect. Please try again.');
  await expect(page.getByLabel('Email address')).toHaveValue(user.email);
  await expect(page.getByRole('button',{name:'Sign in to Workify',exact:true})).toBeEnabled();
  await page.screenshot({path:testInfo.outputPath('login.png'),fullPage:true});
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test('signup requires matching passwords and sends only display metadata',async({page})=>{
  const requests=await setup(page);
  await page.goto('/login');
  await page.getByRole('button',{name:'Create account',exact:true}).click();
  await page.getByLabel('Full name').fill('New member');
  await page.getByLabel('Email address').fill(user.email);
  await page.getByLabel('Password',{exact:true}).fill('strong-test-password');
  await page.getByLabel('Confirm password').fill('different-test-password');
  await page.getByRole('button',{name:'Create your account'}).click();
  await expect(page.getByRole('alert')).toHaveText('Passwords do not match.');
  expect(requests.some(request=>request.path==='/auth/v1/signup')).toBe(false);
  await page.getByLabel('Confirm password').fill('strong-test-password');
  await page.getByRole('button',{name:'Create your account'}).click();
  await expect(page.getByRole('status')).toContainText('confirmation link');
  const signup=requests.find(request=>request.path==='/auth/v1/signup');
  expect(signup?.body?.data).toEqual({full_name:'New member'});
});
test('password reset uses the current origin and displays a neutral confirmation',async({page})=>{
  const requests=await setup(page);
  await page.goto('/login');
  await page.getByRole('button',{name:'Forgot password?'}).click();
  await page.getByLabel('Email address').fill(user.email);
  await page.getByRole('button',{name:'Send reset link'}).click();
  await expect(page.getByRole('status')).toContainText('If an account exists');
  const recover=requests.find(request=>request.path==='/auth/v1/recover');
  expect(recover?.body?.email).toBe(user.email);
});
test('member login preserves protected destination and ignores editable admin metadata',async({page})=>{
  const requests=await setup(page);
  await page.goto('/admin');
  await login(page);
  await expect(page.getByRole('heading',{name:'Admin access only'})).toBeVisible();
  await expect(page.getByRole('button',{name:'Create workshop',exact:true})).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Host',exact:true})).toHaveCount(0);
  expect(requests.filter(request=>request.method==='POST'&&request.path.startsWith('/rest/'))).toEqual([]);
  await page.reload();
  await expect(page.getByRole('heading',{name:'Admin access only'})).toBeVisible();
});
test('admin access waits for server permission, then supports creating and editing workshops',async({page},testInfo)=>{
  test.setTimeout(60000);
  const requests=await setup(page,{admin:true,roleDelay:500});
  await page.goto('/admin');
  await login(page);
  await expect(page.getByRole('button',{name:'Create workshop',exact:true})).toHaveCount(0);
  await expect(page.getByRole('heading',{name:'Your workshops.'})).toBeVisible();
  await page.getByRole('button',{name:'Create workshop',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'Create workshop'});
  await dialog.getByLabel('Title',{exact:true}).fill('New fixture session');
  await expect(dialog.getByLabel('Workshop URL slug')).toHaveValue('new-fixture-session');
  await dialog.getByRole('button',{name:'Create workshop',exact:true}).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('heading',{name:'New fixture session',level:2})).toBeVisible();
  const saved=requests.find(request=>request.path==='/rest/v1/workshops'&&request.method==='POST');
  expect(saved?.body).toMatchObject({slug:'new-fixture-session',status:'coming_soon',starts_at:null,ends_at:null});
  await page.screenshot({path:testInfo.outputPath('admin.png'),fullPage:true});
  await page.getByRole('button',{name:'Edit',exact:true}).click();
  const editor=page.getByRole('dialog',{name:'Edit workshop'});
  await editor.getByLabel('Publication status').selectOption('open');
  await editor.getByLabel('Starts at (IST)').fill('2099-10-20T19:30');
  await editor.getByLabel('Ends at (IST)').fill('2099-10-20T20:30');
  await editor.getByRole('button',{name:'Save changes',exact:true}).click();
  await expect(editor).toHaveCount(0);
  expect(requests.find(request=>request.path==='/rest/v1/workshops'&&request.method==='PATCH')?.body).toMatchObject({starts_at:'2099-10-20T14:00:00.000Z',ends_at:'2099-10-20T15:00:00.000Z',status:'open'});
  await page.getByLabel('Private Google Meet link').fill('https://meet.google.com/abc-defg-hij');
  await page.getByRole('button',{name:'Save meeting link',exact:true}).click();
  await expect(page.getByRole('status')).toContainText('Private meeting link saved');
  expect(requests.find(request=>request.path==='/rest/v1/workshop_links'&&request.method==='POST')?.body).toMatchObject({meet_url:'https://meet.google.com/abc-defg-hij'});
});
test('late admin permission results cannot restore controls after logout',async({page})=>{
  await setup(page,{admin:true,roleDelay:1500});
  await page.goto('/admin');
  await login(page);
  await expect(page.getByText('Checking admin access…',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Test Member',exact:true}).click();
  await page.getByRole('button',{name:'Sign out',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Welcome back.'})).toBeVisible();
  await page.waitForTimeout(1600);
  await expect(page.getByRole('button',{name:'Create workshop',exact:true})).toHaveCount(0);
});
test('role lookup failure denies admin access and offers retry',async({page})=>{
  await setup(page,{roleFail:true});
  await page.goto('/admin');
  await login(page);
  await expect(page.getByRole('heading',{name:'Could not verify admin access'})).toBeVisible();
  await expect(page.getByRole('button',{name:'Create workshop',exact:true})).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Try again',exact:true})).toBeVisible();
});
test('direct workshop URL survives refresh and navigation history',async({page})=>{
  await setup(page);
  await page.goto('/workshops/session-fixture');
  await expect(page.getByRole('heading',{name:row.title,exact:true})).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading',{name:row.title,exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Back to all workshops',exact:true}).click();
  await expect(page).toHaveURL(/\/workshops$/);
  await page.goBack();
  await expect(page.getByRole('heading',{name:row.title,exact:true})).toBeVisible();
});

test('logout clears admin access and reports partial global revocation honestly',async({page})=>{
  await setup(page,{admin:true,logoutFail:true});
  await page.goto('/admin');
  await login(page);
  await expect(page.getByRole('heading',{name:'Your workshops.'})).toBeVisible();
  await page.getByRole('button',{name:'Test Member',exact:true}).click();
  await page.getByRole('button',{name:'Sign out',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('Signed out on this device');
  await expect(page.getByRole('heading',{name:'Welcome back.'})).toBeVisible();
  await expect(page.getByRole('button',{name:'Create workshop',exact:true})).toHaveCount(0);
  await page.route(`${base}/auth/v1/logout**`,route=>route.fulfill({status:204}));
  await login(page);
  await expect(page.getByRole('heading',{name:'Your workshops.'})).toBeVisible();
  await page.getByRole('button',{name:'Test Member',exact:true}).click();
  await page.getByRole('button',{name:'Sign out',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Welcome back.'})).toBeVisible();
  await expect(page.getByRole('button',{name:'Create workshop',exact:true})).toHaveCount(0);
});
test('PKCE password recovery opens a new-password form and updates the account',async({page})=>{
  const requests=await setup(page);
  await page.addInitScript(()=>localStorage.setItem('sb-workify-browser-test-auth-token-code-verifier',JSON.stringify('test-verifier/recovery')));
  await page.goto('/login?code=test-recovery-code');
  await expect(page.getByRole('heading',{name:'Set a new password'})).toBeVisible();
  await page.getByLabel('New password',{exact:true}).fill('updated-test-password');
  await page.getByLabel('Confirm password').fill('updated-test-password');
  await page.getByRole('button',{name:'Update password',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Dashboard',exact:true})).toBeVisible();
  expect(requests.find(request=>request.path==='/auth/v1/user'&&request.method==='PUT')?.body?.password).toBe('updated-test-password');
});
