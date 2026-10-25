import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {GitHubCMS,CMSConflict,encodeUtf8,decodeUtf8,REPOSITORY} from '../lib/github-cms.ts';
import {parseBundle,CONTENT_PATHS,catalogSchema,editorialSchema,settingsSchema} from '../lib/content-schema.ts';
import {parseFeed} from '../lib/rss.ts';
import {routeShell} from '../lib/route-shell.ts';

const raw=await Promise.all(CONTENT_PATHS.map(async path=>JSON.parse(await readFile(new URL('../'+path,import.meta.url),'utf8'))));
const bundle=parseBundle(raw);
const html='<html><head><title>قدیمی</title></head><body><div id="app"><!--app:start--><div>صفحهٔ اول</div><!--app:end--></div></body></html>';
type Call={url:string;init:RequestInit;body:any};
function mockServer({write=true,race=false}:{write?:boolean;race?:boolean}={}){
 const calls:Call[]=[];let refRequests=0;
 const transport=async (input:RequestInfo|URL,init:RequestInit={})=>{
  const url=String(input);const pathname=new URL(url).pathname;const body=init.body?JSON.parse(String(init.body)):null;calls.push({url,init,body});
  let result:any={};
  if(pathname==='/user')result={login:'masoodalizade'};
  else if(pathname.endsWith('/shiderlip-site'))result={full_name:REPOSITORY,permissions:{push:write}};
  else if(pathname.endsWith('/git/ref/heads/main')){refRequests++;result={object:{sha:race&&refRequests>1?'concurrent-change':'old-head'}};}
  else if(pathname.endsWith('/git/commits/old-head'))result={tree:{sha:'old-tree'}};
  else if(pathname.includes('/contents/')){const path=decodeURIComponent(pathname.split('/contents/')[1]);const content=path==='index.html'?html:JSON.stringify(raw[CONTENT_PATHS.indexOf(path as typeof CONTENT_PATHS[number])]);result={content:encodeUtf8(content)};}
  else if(pathname.includes('/git/trees/old-tree'))result={truncated:false,tree:[{path:'index.html',type:'blob'}]};
  else if(pathname.endsWith('/git/trees'))result={sha:'new-tree'};
  else if(pathname.endsWith('/git/commits'))result={sha:'new-commit'};
  else if(pathname.endsWith('/git/refs/heads/main')){assert.equal(body.force,false);result={object:{sha:body.sha}};}
  else throw new Error('Unexpected test request '+pathname);
  return new Response(JSON.stringify(result),{status:200,headers:{'Content-Type':'application/json'}});
 };
 return {calls,transport:transport as typeof fetch};
}
test('Persian content survives the GitHub base64 round-trip',()=>{const text='مسعود؛ شیدرلیپ 👋\nنقدینگی';assert.equal(decodeUtf8(encodeUtf8(text)),text);});
test('read-only identities cannot enter the editor',async()=>{const server=mockServer({write:false});const cms=new GitHubCMS('test-credential',server.transport);await assert.rejects(cms.authenticate(),/اجازه/);assert.equal(server.calls.some(c=>c.init.method==='POST'),false);});
test('authentication failures become useful messages without exposing credentials',async()=>{const secret='test-private-credential';const cms=new GitHubCMS(secret,async()=>new Response('{}',{status:401}));await assert.rejects(cms.authenticate(),error=>error instanceof Error&&/نامعتبر/.test(error.message)&&!error.message.includes(secret));});
test('publishing stores changes durably in one commit and never overwrites RSS',async()=>{
 const server=mockServer();const cms=new GitHubCMS('test-credential',server.transport);await cms.authenticate();const data=await cms.load();data.settings.heroTitle='عنوان تازه';data.editorial.episodes[data.podcast.episodes[0].id]={description:'متن اختصاصی'};
 const result=await cms.publish(data);assert.equal(result.sha,'new-commit');
 const tree=server.calls.find(call=>call.url.endsWith('/git/trees')&&call.init.method==='POST')!.body;
 assert.equal(tree.base_tree,'old-tree');assert.equal(tree.tree.some((e:any)=>e.path==='content/podcast.json'),false);
 assert.equal(JSON.parse(tree.tree.find((e:any)=>e.path==='content/settings.json').content).heroTitle,'عنوان تازه');
 assert.equal(JSON.parse(tree.tree.find((e:any)=>e.path==='content/editorial.json').content).episodes[data.podcast.episodes[0].id].description,'متن اختصاصی');
 assert.ok(tree.tree.some((e:any)=>e.path.startsWith('podcast/')&&e.content.includes('<!--app:start--><!--app:end-->')));
 const commit=server.calls.find(call=>call.url.endsWith('/git/commits')&&call.init.method==='POST')!.body;assert.deepEqual(commit.parents,['old-head']);
 const ref=server.calls.find(call=>call.init.method==='PATCH')!;assert.deepEqual(ref.body,{sha:'new-commit',force:false});
 for(const call of server.calls){assert.equal(new URL(call.url).origin,'https://api.github.com');assert.equal(new Headers(call.init.headers).get('Authorization'),'Bearer test-credential');assert.equal(call.url.includes('test-credential'),false);}
 cms.destroy();await assert.rejects(cms.load(),/پایان/);
});
test('a concurrent content change stops publishing before any write',async()=>{const server=mockServer({race:true});const cms=new GitHubCMS('test-credential',server.transport);await cms.load();await assert.rejects(cms.publish(bundle),CMSConflict);assert.equal(server.calls.some(call=>call.init.method==='POST'||call.init.method==='PATCH'),false);});
test('unsafe URLs, duplicate product routes, and incomplete free downloads are rejected',()=>{
 assert.equal(settingsSchema.safeParse({...bundle.settings,logoUrl:'javascript:alert(1)'}).success,false);
 assert.equal(settingsSchema.safeParse({...bundle.settings,contactUrl:'//evil.example'}).success,false);
 const first=bundle.catalog.products[0];assert.equal(catalogSchema.safeParse({products:[first,{...first,id:first.id.toLowerCase()}]}).success,false);
 assert.equal(catalogSchema.safeParse({products:[{...first,availability:'free',downloadUrl:''}]}).success,false);
 assert.equal(editorialSchema.safeParse({version:1,episodes:{x:{audioUrl:'https://evil.example'}}}).success,false);
});
test('new route shells contain no stale home page content and escape titles',()=>{const shell=routeShell(html,'<script>bad</script>','/tools/new/');assert.ok(!shell.includes('صفحهٔ اول'));assert.ok(shell.includes('&lt;script&gt;'));assert.ok(shell.includes('https://shiderlip.ir/tools/new/'));});
test('RSS extracts durable MP3 URLs, Persian episode numbers, and text safely',()=>{
 const xml=`<rss><channel><item><title>۳۸: قسمت تازه</title><link>https://shows.acast.com/shiderlip/episodes/abc</link><acast:episodeId>abc</acast:episodeId><pubDate>Sun, 25 Oct 2026 10:00:00 GMT</pubDate><itunes:duration>01:02:03</itunes:duration><itunes:season>3</itunes:season><description><![CDATA[<p>متن یک</p><p>متن دو</p>]]></description><enclosure url="https://sphinx.acast.com/p/open/media.mp3"/><itunes:image href="https://example.com/cover.jpg"/></item></channel></rss>`;
 const episodes=parseFeed(xml);assert.equal(episodes.length,1);assert.equal(episodes[0].episodeNumber,38);assert.equal(episodes[0].durationSeconds,3723);assert.equal(episodes[0].audioUrl,'https://sphinx.acast.com/p/open/media.mp3');assert.ok(!episodes[0].description.includes('<p>'));assert.equal(episodes[0].id,'abc');
});
