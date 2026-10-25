import {useEffect,useRef,useState,useId,Children,cloneElement,isValidElement,type ReactElement,type ReactNode} from 'react';
import {ArrowLeft,Check,ChevronLeft,Download,ExternalLink,FileText,Headphones,ImagePlus,LayoutDashboard,LoaderCircle,LogOut,Plus,RefreshCw,Save,Settings,ShieldCheck,Upload,Wallet} from 'lucide-react';
import {useSite} from '../components/site-provider';
import {categories,cleanTitle,fa,normalize,type Tool,type Episode} from '../lib/site-data';
import {errorMessage,type ContentBundle,type SiteSettings} from '../lib/content-schema';
import {GitHubCMS,REPOSITORY,type PendingAsset} from '../lib/github-cms';

type Tab='settings'|'tools'|'podcast'|'help';
type Session={login:string;avatar:string};
const tokenUrl='https://github.com/settings/personal-access-tokens/new?name=Shiderlip%20Admin&target_name=masoodalizade&contents=write&actions=write';
const clone=<T,>(value:T):T=>JSON.parse(JSON.stringify(value));
const lines=(text:string)=>text.split('\n').map(s=>s.trim()).filter(Boolean);
const latin=(text:string)=>text.replace(/[۰-۹]/g,c=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(c)));
function Field({label,help,children,wide=false}:{label:string;help?:string;children:ReactNode;wide?:boolean}){
 const id=useId();
 function labelControls(nodes:ReactNode):ReactNode{return Children.map(nodes,node=>{
  if(!isValidElement(node))return node;
  const element=node as ReactElement<Record<string,unknown>>;
  if(['input','textarea','select'].includes(String(element.type))&&element.props.type!=='file')return cloneElement(element,{'aria-labelledby':id});
  return element.props.children?cloneElement(element,{children:labelControls(element.props.children as ReactNode)}):element;
 });}
 return <div className={'admin-field'+(wide?' wide':'')}><span id={id}>{label}</span>{labelControls(children)}{help&&<small>{help}</small>}</div>;
}
function Spinner(){return <LoaderCircle size={17} className="admin-spin" aria-hidden="true"/>;}
function Guide(){return <div className="admin-guide">
 <h2>یک‌بار دسترسی مدیریت را آماده کن</h2>
 <ol><li>در گیت‌هاب، با حسابی که اجازهٔ ویرایش مخزن شیدرلیپ دارد وارد شو.</li><li>روی «ساخت کد دسترسی» بزن. در <bdi>Repository access</bdi> گزینهٔ <bdi>Only select repositories</bdi> و مخزن <bdi>shiderlip-site</bdi> را انتخاب کن.</li><li>مجوز <bdi>Contents: Read and write</bdi> را فعال کن. برای دکمهٔ به‌روزرسانی دستی RSS، <bdi>Actions: Read and write</bdi> هم لازم است. کد را بساز و در کادر ورود قرار بده.</li></ol>
 <p>کد فقط در حافظهٔ موقت این صفحه می‌ماند؛ با خروج یا بستن صفحه پاک می‌شود. محتوای سایت و فایل‌های بارگذاری‌شده عمومی‌اند؛ فایل فروشی یا اطلاعات خصوصی را اینجا بارگذاری نکن.</p>
 <a className="button button-outline" href={tokenUrl} target="_blank" rel="noreferrer">ساخت کد دسترسی در گیت‌هاب <ExternalLink size={15}/></a>
 </div>;}

export function Admin(){
 const {applyContent,toast}=useSite();
 const cms=useRef<GitHubCMS|null>(null),baseline=useRef('');
 const [token,setToken]=useState(''),[session,setSession]=useState<Session|null>(null);
 const [draft,setDraft]=useState<ContentBundle|null>(null),[assets,setAssets]=useState<PendingAsset[]>([]);
 const [tab,setTab]=useState<Tab>('settings'),[selectedTool,setSelectedTool]=useState(''),[selectedEpisode,setSelectedEpisode]=useState('');
 const [query,setQuery]=useState(''),[busy,setBusy]=useState(''),[error,setError]=useState(''),[message,setMessage]=useState(''),[commitUrl,setCommitUrl]=useState('');
 const dirty=!!draft&&(JSON.stringify(draft)!==baseline.current||assets.length>0);
 useEffect(()=>()=>{cms.current?.destroy();},[]);
 useEffect(()=>{
  if(!dirty)return;
  const unload=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue='';};
  const navigate=(event:Event)=>{if(!window.confirm('تغییرهای منتشرنشده داری. از صفحهٔ مدیریت خارج می‌شوی؟'))event.preventDefault();};
  window.addEventListener('beforeunload',unload);window.addEventListener('shiderlip:before-navigate',navigate);
  return()=>{window.removeEventListener('beforeunload',unload);window.removeEventListener('shiderlip:before-navigate',navigate);};
 },[dirty]);
 function acceptData(data:ContentBundle){baseline.current=JSON.stringify(data);setDraft(clone(data));setAssets([]);setSelectedTool(data.catalog.products[0]?.id||'');setSelectedEpisode(data.podcast.episodes[0]?.id||'');}
 async function login(event:React.FormEvent){
  event.preventDefault();if(busy)return;setBusy('login');setError('');setMessage('');
  let client:GitHubCMS|null=null;
  try{client=new GitHubCMS(token);setToken('');const identity=await client.authenticate();const data=await client.load();cms.current?.destroy();cms.current=client;acceptData(data);setSession(identity);}
  catch(error){client?.destroy();setError(errorMessage(error));}finally{setBusy('');}
 }
 async function reload(){
  if(!cms.current||busy)return;if(dirty&&!window.confirm('نسخهٔ تازه بارگذاری شود؟ تغییرهای منتشرنشدهٔ این صفحه کنار گذاشته می‌شوند.'))return;
  setBusy('reload');setError('');try{const data=await cms.current.load();acceptData(data);setMessage('آخرین محتوای مخزن دریافت شد.');}catch(error){setError(errorMessage(error));}finally{setBusy('');}
 }
 async function publish(){
  if(!cms.current||!draft||busy||!dirty)return;setBusy('publish');setError('');setMessage('');
  try{const result=await cms.current.publish(draft,assets);baseline.current=JSON.stringify(draft);setAssets([]);setCommitUrl(result.url);applyContent(draft);setMessage('ذخیره در مخزن انجام شد. نسخهٔ عمومی پس از پایان انتشار گیت‌هاب، معمولاً طی یکی دو دقیقه، تازه می‌شود.');toast('تغییرها ذخیره شدند.');}
  catch(error){setError(errorMessage(error));}finally{setBusy('');}
 }
 async function syncRss(){
  if(!cms.current||busy||dirty)return;setBusy('rss');setError('');
  try{await cms.current.syncRss();setMessage('درخواست دریافت RSS ارسال شد. پس از پایان اجرا، «بارگذاری نسخهٔ تازه» را بزن.');}catch(error){setError(errorMessage(error));}finally{setBusy('');}
 }
 function logout(){if(busy)return;if(dirty&&!window.confirm('تغییرهای منتشرنشده ذخیره نشده‌اند. خارج می‌شوی؟'))return;cms.current?.destroy();cms.current=null;setSession(null);setDraft(null);setAssets([]);setToken('');setError('');setMessage('');}
 function updateSettings(key:keyof SiteSettings,value:string){setDraft(d=>d?{...d,settings:{...d.settings,[key]:value}}:d);}
 function updateTool(id:string,patch:Partial<Tool>){setDraft(d=>d?{...d,catalog:{...d.catalog,products:d.catalog.products.map(t=>t.id===id?{...t,...patch} as typeof t:t)}}:d);}
 function updateEpisode(id:string,patch:Record<string,string|boolean>){setDraft(d=>d?{...d,editorial:{...d.editorial,episodes:{...d.editorial.episodes,[id]:{...d.editorial.episodes[id],...patch}}}}:d);}
 function addTool(){
  const id='tool-'+Date.now().toString(36);const tool={id,title:'ابزار تازه',category:'people',sourceCategory:'مدیریت و رهبری',problem:'',description:'',priceToman:290000,availability:'preparing',hidden:true,audience:'مدیر کسب‌وکار',prerequisites:'',plannedVoice:{topic:'',minutes:10},episodeNumbers:[],episodeReference:'',mainResource:{title:'',url:''},additionalResources:[],fileTypes:[],whenToUse:'',notFor:'',contents:[]};
  setDraft(d=>d?{...d,catalog:{...d.catalog,products:[...d.catalog.products,tool as typeof d.catalog.products[number]]}}:d);setSelectedTool(id);setQuery('');
 }
 function backup(){
  if(!draft)return;const url=URL.createObjectURL(new Blob([JSON.stringify(draft,null,2)],{type:'application/json'}));const anchor=document.createElement('a');anchor.href=url;anchor.download='shiderlip-content-backup-'+new Date().toISOString().slice(0,10)+'.json';anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 async function upload(file:File|undefined,onUrl:(url:string)=>void){
  if(!file||busy)return;setError('');
  try{
   const ext=file.name.split('.').pop()?.toLowerCase()||'';
   if(!/^(png|jpe?g|webp|gif|pdf|csv|txt|xlsx|docx|zip|mp3|m4a)$/.test(ext))throw new Error('این نوع فایل پشتیبانی نمی‌شود. تصویر، PDF، فایل آفیس یا نمونهٔ رایگان انتخاب کن.');
   if(file.size>15*1024*1024)throw new Error('برای بارگذاری مستقیم، فایل باید حداکثر ۱۵ مگابایت باشد. فایل بزرگ‌تر را در میزبان فایل قرار بده و لینک آن را وارد کن.');
   const bytes=new Uint8Array(await file.arrayBuffer());
   const head=Array.from(bytes.subarray(0,12));
   const valid=ext==='png'?head.slice(0,8).join(',')==='137,80,78,71,13,10,26,10':/jpe?g/.test(ext)?head[0]===255&&head[1]===216:ext==='gif'?new TextDecoder().decode(bytes.subarray(0,6)).startsWith('GIF8'):ext==='webp'?new TextDecoder().decode(bytes.subarray(0,4))==='RIFF'&&new TextDecoder().decode(bytes.subarray(8,12))==='WEBP':true;
   if(!valid)throw new Error('محتوای فایل با پسوند تصویر مطابقت ندارد.');
   let binary='';for(let i=0;i<bytes.length;i+=16384)binary+=String.fromCharCode(...bytes.subarray(i,i+16384));
   const path='media/uploads/'+Date.now().toString(36)+'-'+crypto.randomUUID().slice(0,8)+'.'+ext;
   setAssets(a=>[...a,{path,content:btoa(binary),name:file.name}]);onUrl('/'+path);setMessage('فایل به تغییرهای این صفحه اضافه شد. با «ذخیره و انتشار» بارگذاری آن هم نهایی می‌شود.');
  }catch(error){setError(errorMessage(error));}
 }
 const uploadField=(onUrl:(url:string)=>void,accept='image/png,image/jpeg,image/webp,image/gif')=><label className="admin-upload"><Upload size={15}/><span>انتخاب فایل</span><input type="file" accept={accept} disabled={!!busy} onChange={e=>{void upload(e.target.files?.[0],onUrl);e.target.value='';}}/></label>;

 if(!session||!draft)return <main className="content admin-content"><div className="page-intro"><span className="overline"><ShieldCheck size={15}/> میز کار مسعود</span><h1>مدیریت شیدرلیپ</h1><p>صفحه‌ها، ابزارها و روایت هر قسمت را از همین‌جا به‌روز کن.</p></div><div className="admin-login-layout"><form className="admin-login" onSubmit={login}><div className="admin-login-icon"><ShieldCheck size={30}/></div><h2>ورود به میز کار</h2><p>دسترسی ویرایش از حساب گیت‌هاب تو بررسی می‌شود.</p><Field label="کد دسترسی گیت‌هاب" help="کد را فقط در این کادر وارد کن؛ لازم نیست آن را در گفتگو بفرستی."><input type="password" autoComplete="off" spellCheck={false} value={token} onChange={e=>setToken(e.target.value)} placeholder="github_pat_…" dir="ltr" required aria-label="کد دسترسی گیت‌هاب"/></Field>{error&&<p className="admin-error" role="alert">{error}</p>}<button className="button button-navy full-width" type="submit" disabled={!!busy||!token.trim()}>{busy?<Spinner/>:<ArrowLeft size={17}/>}ورود به مدیریت</button><small className="admin-repo"><bdi>{REPOSITORY}</bdi></small></form><Guide/></div></main>;

 const tool=draft.catalog.products.find(t=>t.id===selectedTool);
 const sourceEpisode=draft.podcast.episodes.find(e=>e.id===selectedEpisode);
 const episode=sourceEpisode?{...sourceEpisode,...draft.editorial.episodes[sourceEpisode.id]}:null;
 const filteredTools=draft.catalog.products.filter(t=>normalize(t.title+' '+t.problem).includes(normalize(query)));
 const filteredEpisodes=draft.podcast.episodes.filter(e=>normalize((draft.editorial.episodes[e.id]?.title||e.title)+' '+e.episodeNumber).includes(normalize(query)));
 const settingFields:[keyof SiteSettings,string,boolean?][]=[['siteName','نام سایت'],['tagline','عبارت کوتاه بالای صفحه'],['heroTitle','عنوان اصلی صفحهٔ اول'],['heroDescription','توضیح صفحهٔ اول',true],['audience','مخاطب سایت'],['toolsTitle','عنوان صفحهٔ ابزارها'],['toolsDescription','توضیح صفحهٔ ابزارها',true],['podcastTitle','عنوان آرشیو پادکست'],['podcastDescription','توضیح آرشیو پادکست',true],['aboutTitle','عنوان دربارهٔ شیدرلیپ'],['aboutText','متن دربارهٔ شیدرلیپ؛ بین بندها یک خط خالی بگذار',true],['seoDescription','توضیح سایت برای موتورهای جست‌وجو',true],['instagramUrl','نشانی اینستاگرام'],['contactUrl','نشانی ارتباط با شیدرلیپ']];
 return <main className="content admin-content">
  <div className="admin-heading"><div><span className="overline">میز کار مسعود</span><h1>مدیریت شیدرلیپ</h1><p>از یک تغییر کوچک تا انتشار نسخهٔ تازه.</p></div><button className="button button-outline" onClick={logout} disabled={!!busy}><LogOut size={16}/>خروج <bdi>{session.login}</bdi></button></div>
  <div className="admin-savebar"><span className={dirty?'admin-dirty':'admin-clean'}><span/>{dirty?'تغییرهای منتشرنشده داری':'همهٔ تغییرها ذخیره شده‌اند'}</span><div><button className="button button-outline" onClick={backup} disabled={!!busy}><Download size={15}/><span>پشتیبان</span></button><button className="button button-outline" onClick={()=>void reload()} disabled={!!busy} aria-label="بارگذاری نسخهٔ تازه">{busy==='reload'?<Spinner/>:<RefreshCw size={16}/>}</button><button className="button button-navy" onClick={()=>void publish()} disabled={!dirty||!!busy}>{busy==='publish'?<Spinner/>:<Save size={16}/>}ذخیره و انتشار</button></div></div>
  {error&&<div className="admin-error" role="alert">{error}</div>}{message&&<div className="admin-success" role="status"><Check size={17}/><span>{message} {commitUrl&&<a href={commitUrl} target="_blank" rel="noreferrer">مشاهدهٔ ثبت تغییر</a>}</span></div>}
  {assets.length>0&&<p className="admin-pending"><ImagePlus size={15}/>{fa(assets.length)} فایل در انتظار انتشار · {assets.map(a=>a.name).join('، ')}</p>}
  <div className="admin-layout"><aside className="admin-sidebar"><nav aria-label="بخش‌های مدیریت">{([{id:'settings',label:'صفحه‌ها و هویت سایت',icon:Settings},{id:'tools',label:'ابزارهای مدیریت',icon:Wallet},{id:'podcast',label:'پادکست و RSS',icon:Headphones},{id:'help',label:'راهنمای میز کار',icon:ShieldCheck}] as const).map(item=><button key={item.id} className={tab===item.id?'selected':''} onClick={()=>{setTab(item.id);setQuery('');}} aria-current={tab===item.id?'page':undefined}><item.icon size={18}/>{item.label}<ChevronLeft size={14}/></button>)}</nav><div className="admin-summary"><strong>{fa(draft.podcast.episodes.length)} قسمت</strong><strong>{fa(draft.catalog.products.length)} ابزار</strong><a href="/" target="_blank" rel="noreferrer">دیدن سایت <ExternalLink size={13}/></a></div></aside>
   <section className="admin-panel" aria-label="ویرایش محتوا">
    {tab==='settings'&&<><div className="admin-section-heading"><div><h2>صدای شیدرلیپ، در هر صفحه</h2><p>عنوان‌ها، معرفی و راه‌های ارتباطی را ویرایش کن.</p></div><LayoutDashboard size={24}/></div><div className="admin-fields">{settingFields.map(([key,label,multiline])=><Field key={key} label={label} wide={multiline}>{multiline?<textarea value={String(draft.settings[key])} rows={key==='aboutText'?7:3} onChange={e=>updateSettings(key,e.target.value)}/>:<input value={String(draft.settings[key])} onChange={e=>updateSettings(key,e.target.value)} dir={String(key).endsWith('Url')?'ltr':undefined}/>}</Field>)}{(['logoUrl','coverUrl'] as const).map(key=><Field key={key} label={key==='logoUrl'?'لوگوی سایت':'تصویر معرفی پادکست'} wide><div className="admin-asset-field"><input value={draft.settings[key]} dir="ltr" onChange={e=>updateSettings(key,e.target.value)}/>{uploadField(url=>updateSettings(key,url))}</div><img className="admin-image-preview" src={assets.some(a=>'/'+a.path===draft.settings[key])?'data:image/*;base64,'+assets.find(a=>'/'+a.path===draft.settings[key])!.content:draft.settings[key]} alt={key==='logoUrl'?'لوگوی سایت':'تصویر معرفی'}/></Field>)}</div></>}
    {tab==='tools'&&<><div className="admin-section-heading"><div><h2>کتابخانهٔ ابزارها</h2><p>ابزار تازه اضافه کن یا بسته‌های فعلی را کامل کن.</p></div><button className="button button-green" onClick={addTool} disabled={!!busy}><Plus size={16}/>ابزار تازه</button></div><div className="admin-editor-layout"><div className="admin-item-list"><input className="admin-list-search" placeholder="جست‌وجوی ابزار" value={query} onChange={e=>setQuery(e.target.value)} aria-label="جست‌وجوی ابزار در مدیریت"/>{filteredTools.map(t=><button key={t.id} className={t.id===selectedTool?'selected':''} onClick={()=>setSelectedTool(t.id)}><span>{t.title}</span><small>{t.hidden?'پنهان':t.availability==='free'?'رایگان':'در حال آماده‌سازی'}</small></button>)}</div>{tool&&<div className="admin-tool-editor"><div className="admin-editor-title"><span className="overline">{tool.id}</span><h3>{tool.title}</h3></div><div className="admin-fields">
      <Field label="عنوان ابزار" wide><input value={tool.title} onChange={e=>updateTool(tool.id,{title:e.target.value})}/></Field>
      <Field label="موضوع"><select value={tool.category} onChange={e=>updateTool(tool.id,{category:e.target.value as Tool['category']})}>{categories.map(c=><option key={c.id} value={c.id}>{c.title}</option>)}</select></Field>
      <Field label="دستهٔ تخصصی"><input value={tool.sourceCategory} onChange={e=>updateTool(tool.id,{sourceCategory:e.target.value})}/></Field>
      <Field label="قیمت پیشنهادی، به تومان"><input type="number" min="0" step="1000" value={tool.priceToman} onChange={e=>updateTool(tool.id,{priceToman:Number(e.target.value)})}/></Field>
      <Field label="وضعیت عرضه"><select value={tool.availability} onChange={e=>updateTool(tool.id,{availability:e.target.value})}><option value="preparing">در حال آماده‌سازی</option><option value="free">رایگان و آمادهٔ دریافت</option></select></Field>
      <Field label="نمایش در سایت" wide><span className="admin-checkbox"><input type="checkbox" checked={!tool.hidden} onChange={e=>updateTool(tool.id,{hidden:!e.target.checked})}/>این ابزار در سایت نمایش داده شود.</span></Field>
      {([['problem','مسئلهٔ مخاطب؛ به زبان خودش'],['description','معرفی ابزار'],['audience','مناسب چه کسانی است؟'],['whenToUse','چه زمانی به کار می‌آید؟'],['notFor','قبل از استفاده چه چیزی لازم است؟'],['prerequisites','پیش‌نیازها']] as const).map(([key,label])=><Field key={key} label={label} wide><textarea rows={key==='description'?4:2} value={tool[key]} onChange={e=>updateTool(tool.id,{[key]:e.target.value})}/></Field>)}
      <Field label="محتویات بسته؛ هر سطر یک مورد" wide><textarea rows={5} value={tool.contents.join('\n')} onChange={e=>updateTool(tool.id,{contents:e.target.value.split('\n')})}/></Field>
      <Field label="نوع فایل‌ها؛ با ویرگول جدا کن"><input value={tool.fileTypes.join('، ')} onChange={e=>updateTool(tool.id,{fileTypes:e.target.value.split(/[,،]/).map(s=>s.trim())})}/></Field>
      <Field label="شمارهٔ قسمت‌های مرتبط؛ با ویرگول جدا کن"><input value={tool.episodeNumbers.join(', ')} onChange={e=>updateTool(tool.id,{episodeNumbers:latin(e.target.value).split(/[,،\s]+/).filter(Boolean).map(Number).filter(Number.isFinite)})}/></Field>
      <Field label="موضوع راهنمای صوتی" wide><textarea rows={2} value={tool.plannedVoice.topic} onChange={e=>updateTool(tool.id,{plannedVoice:{...tool.plannedVoice,topic:e.target.value}})}/></Field>
      <Field label="مدت ویس، به دقیقه"><input type="number" min="0" value={tool.plannedVoice.minutes} onChange={e=>updateTool(tool.id,{plannedVoice:{...tool.plannedVoice,minutes:Number(e.target.value)}})}/></Field>
      <Field label="پیوند ویس آماده" help="فایل بارگذاری‌شده عمومی است." wide><div className="admin-asset-field"><input dir="ltr" value={tool.voiceUrl||''} onChange={e=>updateTool(tool.id,{voiceUrl:e.target.value})}/>{uploadField(url=>updateTool(tool.id,{voiceUrl:url}),'.mp3,.m4a')}</div></Field>
      <Field label="فایل ابزار رایگان" help="فایل فروشی را اینجا بارگذاری نکن؛ این لینک برای همه در دسترس خواهد بود." wide><div className="admin-asset-field"><input dir="ltr" value={tool.downloadUrl||''} onChange={e=>updateTool(tool.id,{downloadUrl:e.target.value})}/>{uploadField(url=>updateTool(tool.id,{downloadUrl:url}),'.pdf,.xlsx,.docx,.csv,.txt,.zip')}</div></Field>
      <Field label="نام منبع اصلی"><input value={tool.mainResource.title} onChange={e=>updateTool(tool.id,{mainResource:{...tool.mainResource,title:e.target.value}})}/></Field>
      <Field label="پیوند منبع اصلی"><input dir="ltr" value={tool.mainResource.url} onChange={e=>updateTool(tool.id,{mainResource:{...tool.mainResource,url:e.target.value}})}/></Field>
      <Field label="منابع تکمیلی؛ هر سطر: عنوان | پیوند" wide><textarea dir="auto" rows={4} value={tool.additionalResources.map(r=>r.title+' | '+r.url).join('\n')} onChange={e=>updateTool(tool.id,{additionalResources:e.target.value.split('\n').map(row=>{const [title,...url]=row.split('|');return {title:title.trim(),url:url.join('|').trim()};})})}/></Field>
      <Field label="عنوان ستون‌های نمونه؛ هر سطر یک عنوان" wide><textarea rows={3} value={tool.preview?.columns.join('\n')||''} onChange={e=>updateTool(tool.id,{preview:{columns:e.target.value.split('\n'),rows:tool.preview?.rows||[]}})}/></Field>
      <Field label="ردیف‌های نمونه؛ خانه‌های هر سطر را با | جدا کن" wide><textarea rows={5} value={tool.preview?.rows.map(row=>row.join(' | ')).join('\n')||''} onChange={e=>updateTool(tool.id,{preview:{columns:tool.preview?.columns||[],rows:e.target.value.split('\n').map(row=>row.split('|').map(cell=>cell.trim()))}})}/></Field>
     </div></div>}</div></>}
    {tab==='podcast'&&<><div className="admin-section-heading"><div><h2>پادکست و RSS</h2><p>قسمت‌ها از فید رسمی می‌آیند؛ ویرایش‌های تو جدا از RSS نگه داشته می‌شوند.</p></div><button className="button button-outline" disabled={!!busy||dirty} onClick={()=>void syncRss()}>{busy==='rss'?<Spinner/>:<RefreshCw size={16}/>}به‌روزرسانی RSS</button></div><div className="admin-rss-info"><span><bdi>feeds.acast.com/public/shows/shiderlip</bdi></span><small>دریافت خودکار: هر ۶ ساعت · آخرین دریافت: {draft.podcast.fetchedAt?new Intl.DateTimeFormat('fa-IR',{dateStyle:'short',timeStyle:'short',timeZone:'Asia/Tehran'}).format(new Date(draft.podcast.fetchedAt)):'ثبت نشده'}</small><a href={'https://github.com/'+REPOSITORY+'/actions/workflows/sync-rss.yml'} target="_blank" rel="noreferrer">وضعیت دریافت و انتشار <ExternalLink size={13}/></a></div><div className="admin-editor-layout"><div className="admin-item-list"><input className="admin-list-search" placeholder="جست‌وجوی قسمت" value={query} onChange={e=>setQuery(e.target.value)} aria-label="جست‌وجوی قسمت در مدیریت"/>{filteredEpisodes.map(ep=><button key={ep.id} className={ep.id===selectedEpisode?'selected':''} onClick={()=>setSelectedEpisode(ep.id)}><small>قسمت {fa(ep.episodeNumber)}{draft.editorial.episodes[ep.id]?.hidden?' · پنهان':''}</small><span>{cleanTitle(draft.editorial.episodes[ep.id]?.title||ep.title)}</span></button>)}</div>{episode&&<div className="admin-tool-editor"><span className="overline">فصل {fa(episode.season)} · قسمت {fa(episode.episodeNumber)}</span><h3>{cleanTitle(episode.title)}</h3><div className="admin-fields"><Field label="عنوان قسمت در سایت" wide><input value={episode.title} onChange={e=>updateEpisode(episode.id,{title:e.target.value})}/></Field><Field label="خلاصهٔ کوتاه" wide><textarea rows={3} value={episode.subtitle} onChange={e=>updateEpisode(episode.id,{subtitle:e.target.value})}/></Field><Field label="متن معرفی قسمت" wide><textarea rows={14} value={episode.description} onChange={e=>updateEpisode(episode.id,{description:e.target.value})}/></Field><Field label="تصویر قسمت" wide><div className="admin-asset-field"><input dir="ltr" value={episode.cover} onChange={e=>updateEpisode(episode.id,{cover:e.target.value})}/>{uploadField(url=>updateEpisode(episode.id,{cover:url}))}</div></Field><Field label="نمایش در سایت" wide><span className="admin-checkbox"><input type="checkbox" checked={!draft.editorial.episodes[episode.id]?.hidden} onChange={e=>updateEpisode(episode.id,{hidden:!e.target.checked})}/>این قسمت در سایت نمایش داده شود.</span></Field><Field label="صدای رسمی قسمت" help="نشانی فایل صوتی از RSS دریافت می‌شود." wide><audio controls preload="none" src={episode.audioUrl} aria-label="صدای رسمی قسمت"/></Field></div><button className="button button-outline" onClick={()=>{if(window.confirm('ویرایش این قسمت کنار گذاشته شود و متن RSS برگردد؟'))setDraft(d=>{if(!d)return d;const next=clone(d);delete next.editorial.episodes[episode.id];return next;});}}>بازگرداندن متن RSS</button></div>}</div></>}
    {tab==='help'&&<><Guide/><div className="admin-guide"><h2>از ویرایش تا نمایش در سایت</h2><p>ویرایش‌های هر بخش تا زدن «ذخیره و انتشار» پیش‌نویس‌اند. ذخیره یک ثبت کامل در مخزن ایجاد می‌کند و انتشار گیت‌هاب را به جریان می‌اندازد. اگر بلافاصله تغییر را ندیدی، پس از پایان انتشار صفحهٔ عمومی را تازه کن.</p><p>برای نگه‌داشتن یک نسخه از متن‌ها، «پشتیبان» را بزن. اگر هم‌زمان از جای دیگری محتوا تغییر کند، ذخیره متوقف می‌شود تا تغییرهای تازه بازنویسی نشوند.</p><p>قسمت تازهٔ پادکست خودکار از RSS وارد می‌شود. عنوان، معرفی، تصویر و وضعیت نمایش هر قسمت را می‌توانی در اینجا تغییر بدهی؛ دریافت بعدی RSS این ویرایش‌ها را پاک نمی‌کند.</p><p>فروش و تحویل امن فایل پولی پس از آماده‌شدن محصولات و اتصال سرویس پرداخت فعال می‌شود. فعلاً می‌توانی ابزار آماده را رایگان منتشر کنی یا بستهٔ در حال ساخت را معرفی کنی.</p><a className="button button-outline" href={'https://github.com/'+REPOSITORY+'/actions'} target="_blank" rel="noreferrer">پیگیری انتشار در گیت‌هاب <ExternalLink size={15}/></a></div></>}
   </section></div>
 </main>;
}
