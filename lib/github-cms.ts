import {CONTENT_PATHS,parseBundle,type ContentBundle} from './content-schema.ts';
import {routeShell} from './route-shell.ts';

export const REPOSITORY='masoodalizade/shiderlip-site';
const API='https://api.github.com';
const ROOT=`/repos/${REPOSITORY}`;
export type PendingAsset={path:string;content:string;name:string};
type GitEntry={path:string;mode:'100644';type:'blob';content?:string;sha?:string};
export class CMSConflict extends Error {constructor(){super('در این فاصله نسخهٔ دیگری در مخزن ثبت شده است. از تغییرهایت نسخهٔ پشتیبان بگیر، سپس نسخهٔ تازه را بارگذاری کن.');}}
export function encodeUtf8(text:string){const bytes=new TextEncoder().encode(text);let raw='';for(let i=0;i<bytes.length;i+=16384)raw+=String.fromCharCode(...bytes.subarray(i,i+16384));return btoa(raw);}
export function decodeUtf8(encoded:string){return new TextDecoder().decode(Uint8Array.from(atob(encoded.replace(/\s/g,'')),c=>c.charCodeAt(0)));}

export class GitHubCMS{
 private token:string;
 private transport:typeof fetch;
 private head='';private tree='';private paths=new Set<string>();private shell='';
 constructor(token:string,transport:typeof fetch=fetch){
  if(!token.trim()||/[\s\r\n]/.test(token.trim()))throw new Error('کد دسترسی معتبر وارد کن.');
  this.token=token.trim();this.transport=transport;
 }
 destroy(){this.token='';this.head='';this.tree='';this.paths.clear();this.shell='';}
 private async request(path:string,init:RequestInit={}):Promise<any>{
  if(path!=='/user'&&!path.startsWith(ROOT+'/')&&path!==ROOT)throw new Error('درخواست نامعتبر است.');
  if(!this.token)throw new Error('نشست مدیریت پایان یافته؛ دوباره وارد شو.');
  const response=await this.transport(API+path,{...init,cache:'no-store',redirect:'error',headers:{Accept:'application/vnd.github+json',Authorization:'Bearer '+this.token,'X-GitHub-Api-Version':'2022-11-28',...(init.body?{'Content-Type':'application/json'}:{}),...init.headers}});
  if(!response.ok){
   if(response.status===401)throw new Error('کد دسترسی منقضی یا نامعتبر است.');
   if(response.status===403)throw new Error('دسترسی کافی نیست یا سقف درخواست‌ها پر شده است. مجوز Contents: Read and write را برای همین مخزن بررسی کن.');
   if(response.status===409||response.status===422)throw new CMSConflict();
   if(response.status===404)throw new Error('فایل یا مخزن در دسترس نیست؛ انتخاب مخزن در تنظیمات کد دسترسی را بررسی کن.');
   throw new Error(`ارتباط با گیت‌هاب انجام نشد (${response.status}). دوباره امتحان کن.`);
  }
  return response.status===204?null:response.json();
 }
 async authenticate(){
  const [user,repo]=await Promise.all([this.request('/user'),this.request(ROOT)]);
  if(repo.full_name!==REPOSITORY||!repo.permissions?.push)throw new Error('این حساب اجازهٔ ویرایش مخزن شیدرلیپ را ندارد.');
  return {login:String(user.login),avatar:String(user.avatar_url||'')};
 }
 async load():Promise<ContentBundle>{
  const ref=await this.request(ROOT+'/git/ref/heads/main');const sha=ref.object.sha;
  const [commit,...files]=await Promise.all([this.request(ROOT+'/git/commits/'+sha),...CONTENT_PATHS.map(path=>this.request(ROOT+'/contents/'+path+'?ref='+sha)),this.request(ROOT+'/contents/index.html?ref='+sha)]);
  const listing=await this.request(ROOT+'/git/trees/'+commit.tree.sha+'?recursive=1');
  if(listing.truncated)throw new Error('فهرست مخزن کامل دریافت نشد.');
  const data=parseBundle(files.slice(0,4).map(file=>JSON.parse(decodeUtf8(file.content))));
  this.head=sha;this.tree=commit.tree.sha;this.paths=new Set(listing.tree.filter((e:{type:string})=>e.type==='blob').map((e:{path:string})=>e.path));this.shell=decodeUtf8(files[4].content);
  return data;
 }
 async publish(input:ContentBundle,assets:PendingAsset[]=[]){
  const data=parseBundle([input.settings,input.catalog,input.podcast,input.editorial]);
  if(!this.head||!this.tree||!this.shell)throw new Error('ابتدا محتوای مخزن را دریافت کن.');
  const ref=await this.request(ROOT+'/git/ref/heads/main');if(ref.object.sha!==this.head)throw new CMSConflict();
  // RSS is a separate source. Publishing editorial changes never overwrites it.
  const values=[data.settings,data.catalog,data.editorial];const paths=[CONTENT_PATHS[0],CONTENT_PATHS[1],CONTENT_PATHS[3]];
  const entries:GitEntry[]=paths.map((path,i)=>({path,mode:'100644',type:'blob',content:JSON.stringify(values[i],null,2)+'\n'}));
  for(const asset of assets){
   if(!/^media\/uploads\/[a-zA-Z0-9_-]+\.(png|jpe?g|webp|gif|pdf|csv|txt|xlsx|docx|zip|mp3|m4a)$/i.test(asset.path))throw new Error('مسیر فایل معتبر نیست.');
   if(asset.content.length>22000000)throw new Error('اندازهٔ فایل بیش از حد مجاز است.');
   const blob=await this.request(ROOT+'/git/blobs',{method:'POST',body:JSON.stringify({content:asset.content,encoding:'base64'})});
   entries.push({path:asset.path,mode:'100644',type:'blob',sha:blob.sha});
  }
  const routes=[...data.catalog.products.map(t=>({path:`tools/${t.id.toLowerCase()}/index.html`,title:t.title,url:`/tools/${t.id.toLowerCase()}/`})),...data.podcast.episodes.map(ep=>({path:`podcast/${ep.id}/index.html`,title:ep.title,url:`/podcast/${ep.id}/`}))];
  for(const route of routes)if(!this.paths.has(route.path))entries.push({path:route.path,mode:'100644',type:'blob',content:routeShell(this.shell,route.title,route.url)});
  const publicRoutes=['/','/about/','/tools/','/podcast/','/privacy/',...data.catalog.products.filter(t=>!t.hidden).map(t=>`/tools/${t.id.toLowerCase()}/`),...data.podcast.episodes.filter(ep=>!data.editorial.episodes[ep.id]?.hidden).map(ep=>`/podcast/${ep.id}/`)];
  entries.push({path:'sitemap.xml',mode:'100644',type:'blob',content:'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+publicRoutes.map(url=>`<url><loc>https://shiderlip.ir${url}</loc></url>`).join('')+'</urlset>\n'});
  const tree=await this.request(ROOT+'/git/trees',{method:'POST',body:JSON.stringify({base_tree:this.tree,tree:entries})});
  const commit=await this.request(ROOT+'/git/commits',{method:'POST',body:JSON.stringify({message:'Update Shiderlip content from admin',tree:tree.sha,parents:[this.head]})});
  // A non-fast-forward update is rejected if another editor publishes meanwhile.
  await this.request(ROOT+'/git/refs/heads/main',{method:'PATCH',body:JSON.stringify({sha:commit.sha,force:false})});
  this.head=commit.sha;this.tree=tree.sha;for(const entry of entries)this.paths.add(entry.path);
  return {sha:String(commit.sha),url:`https://github.com/${REPOSITORY}/commit/${commit.sha}`};
 }
 async syncRss(){
  try{await this.request(ROOT+'/actions/workflows/sync-rss.yml/dispatches',{method:'POST',body:JSON.stringify({ref:'main'})});}
  catch(error){if(error instanceof Error&&/دسترسی کافی|در دسترس نیست/.test(error.message))throw new Error('برای به‌روزرسانی دستی، مجوز Actions: Read and write را هم به کد دسترسی بده. به‌روزرسانی خودکار RSS مستقل از ورود تو اجرا می‌شود.');throw error;}
 }
}
