'use client';
import {createContext,useContext,useEffect,useRef,useState, type ReactNode} from 'react';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {ArrowLeft,Bookmark,Check,ChevronLeft,Headphones,Pause,Play,RotateCcw,RotateCw,Volume2,X,Menu} from 'lucide-react';
import {type Episode,type Tool,initialEpisodes,cleanTitle,fa,tools as initialTools} from '@/lib/site-data';

import defaultSettings from '@/content/settings.json';
import defaultEditorial from '@/content/editorial.json';
import {CONTENT_PATHS,parseBundle,settingsSchema,type ContentBundle,type SiteSettings} from '@/lib/content-schema';

type Progress={id:string;time:number;updated:number};
type SiteState={episodes:Episode[];tools:Tool[];settings:SiteSettings;contentReady:boolean;applyContent:(data:ContentBundle)=>void;savedTools:string[];savedEpisodes:string[];current:Episode|null;playing:boolean;progress:Progress|null;play:(ep:Episode)=>void;toggleTool:(id:string)=>void;toggleEpisode:(id:string)=>void;toast:(text:string)=>void;ready:boolean};
const SiteContext=createContext<SiteState|null>(null);
export function useSite(){const context=useContext(SiteContext);if(!context)throw new Error('Site provider missing');return context;}
function read<T,>(key:string,fallback:T):T{try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw):fallback;}catch{return fallback;}}
function write(key:string,value:unknown){try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;}}
function clock(n:number){if(!Number.isFinite(n))return '00:00';return [Math.floor(n/60),Math.floor(n%60)].map(x=>String(x).padStart(2,'0')).join(':');}

export function SiteProvider({children}:{children:ReactNode}){
 const [episodes,setEpisodes]=useState<Episode[]>(()=>initialEpisodes.map(ep=>({...ep,...(defaultEditorial.episodes as Record<string,{hidden?:boolean}>)[ep.id]})).filter(ep=>!ep.hidden));
 const [tools,setTools]=useState<Tool[]>(initialTools.filter(t=>!t.hidden));
 const [settings,setSettings]=useState<SiteSettings>(()=>settingsSchema.parse(defaultSettings));
 const [contentReady,setContentReady]=useState(false);
 const applyContent=(data:ContentBundle)=>{
  setSettings(data.settings);setTools((data.catalog.products as Tool[]).filter(t=>!t.hidden));
  setEpisodes((data.podcast.episodes as Episode[]).map(ep=>({...ep,...data.editorial.episodes[ep.id]})).filter(ep=>!(ep as Episode&{hidden?:boolean}).hidden));
 };
 const [savedTools,setSavedTools]=useState<string[]>([]),[savedEpisodes,setSavedEpisodes]=useState<string[]>([]);
 const [ready,setReady]=useState(false),[progress,setProgress]=useState<Progress|null>(null);
 const [current,setCurrent]=useState<Episode|null>(null),[playing,setPlaying]=useState(false);
 const [time,setTime]=useState(0),[duration,setDuration]=useState(0),[rate,setRate]=useState(1),[volume,setVolume]=useState(1),[audioError,setAudioError]=useState('');
 const [message,setMessage]=useState('');const audio=useRef<HTMLAudioElement>(null),resume=useRef(0),lastSaved=useRef(0);
 const currentRef=useRef<Episode|null>(null),toastTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const toast=(text:string)=>{setMessage(text);if(toastTimer.current)clearTimeout(toastTimer.current);toastTimer.current=setTimeout(()=>setMessage(''),3500);};
 useEffect(()=>{
  const st=read<unknown>('shiderlip.tools',[]),se=read<unknown>('shiderlip.episodes',[]),pr=read<Progress|null>('shiderlip.progress',null);
  setSavedTools(Array.isArray(st)?st.filter(x=>typeof x==='string'):[]);setSavedEpisodes(Array.isArray(se)?se.filter(x=>typeof x==='string'):[]);
  if(pr&&typeof pr.id==='string'&&Number.isFinite(pr.time))setProgress(pr);setReady(true);
  const c=new AbortController();
  Promise.all(CONTENT_PATHS.map(path=>fetch('/'+path,{signal:c.signal,cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('Content unavailable');return r.json();})))
   .then(values=>{if(!c.signal.aborted)applyContent(parseBundle(values));}).catch(()=>{}).finally(()=>{if(!c.signal.aborted)setContentReady(true);});
  return()=>{c.abort();if(toastTimer.current)clearTimeout(toastTimer.current);};
 },[]);
 useEffect(()=>{if(ready)write('shiderlip.tools',savedTools);},[savedTools,ready]);
 useEffect(()=>{if(ready)write('shiderlip.episodes',savedEpisodes);},[savedEpisodes,ready]);
 const saveProgress=()=>{const a=audio.current,ep=currentRef.current;if(!a||!ep)return;const pr={id:ep.id,time:a.currentTime,updated:Date.now()};write('shiderlip.progress',pr);write('shiderlip.progress.'+ep.id,pr);setProgress(pr);};
 useEffect(()=>{const unload=()=>saveProgress();window.addEventListener('pagehide',unload);return()=>window.removeEventListener('pagehide',unload);},[]);
 const play=(ep:Episode)=>{
  const a=audio.current;if(!a)return;
  if(currentRef.current?.id===ep.id){if(a.paused)a.play().catch(()=>{setAudioError('پخش شروع نشد؛ دوباره امتحان کن.');setPlaying(false);});else a.pause();return;}
  saveProgress();setAudioError('');currentRef.current=ep;setCurrent(ep);setTime(0);setDuration(ep.durationSeconds);
  const stored=read<Progress|null>('shiderlip.progress.'+ep.id,read<Progress|null>('shiderlip.progress',null));resume.current=stored?.id===ep.id&&stored.time<ep.durationSeconds-10?stored.time:0;
  a.src=ep.audioUrl;a.playbackRate=rate;a.volume=volume;
  a.play().catch(()=>{setAudioError('پخش صدا ممکن نشد؛ دوباره امتحان کن یا در میزبان اصلی بشنو.');setPlaying(false);});
  if('mediaSession' in navigator&&typeof MediaMetadata!=='undefined')navigator.mediaSession.metadata=new MediaMetadata({title:cleanTitle(ep.title),artist:'مسعود علیزاده',album:'شیدرلیپ',artwork:[{src:ep.cover||'/media/podcast-cover.jpeg',sizes:'1400x1400',type:'image/jpeg'}]});
 };
 const toggleTool=(id:string)=>{const exists=savedTools.includes(id);setSavedTools(v=>exists?v.filter(x=>x!==id):[...v,id]);toast(exists?'نشان ابزار برداشته شد.':'ابزار در «ابزارهای من» نشان شد.');};
 const toggleEpisode=(id:string)=>{const exists=savedEpisodes.includes(id);setSavedEpisodes(v=>exists?v.filter(x=>x!==id):[...v,id]);toast(exists?'از فهرست شنیدن برداشته شد.':'به فهرست شنیدن اضافه شد.');};
 const seek=(n:number)=>{const a=audio.current;if(!a||!Number.isFinite(a.duration))return;a.currentTime=Math.max(0,Math.min(n,a.duration));setTime(a.currentTime);saveProgress();};
 const next=()=>{if(!current)return;const older=episodes.find(ep=>ep.episodeNumber===current.episodeNumber+1);if(older)play(older);};
 const hasNext=current&&episodes.some(ep=>ep.episodeNumber===current.episodeNumber+1);
 return <SiteContext.Provider value={{episodes,tools,settings,contentReady,applyContent,savedTools,savedEpisodes,current,playing,progress,play,toggleTool,toggleEpisode,toast,ready}}>
  <div className={current?'site with-player':'site'}><Header/>{children}<Footer/></div>
  <audio ref={audio} preload="metadata" onPlay={()=>{setPlaying(true);setAudioError('');}} onPause={()=>{setPlaying(false);saveProgress();}} onLoadedMetadata={()=>{if(audio.current){setDuration(audio.current.duration||current?.durationSeconds||0);if(resume.current){audio.current.currentTime=resume.current;resume.current=0;}}}} onTimeUpdate={()=>{if(audio.current){setTime(audio.current.currentTime);if(Date.now()-lastSaved.current>10000){saveProgress();lastSaved.current=Date.now();}}}} onEnded={()=>{setPlaying(false);saveProgress();}} onError={()=>{setAudioError('دریافت صدا ممکن نشد. اتصال را بررسی کن یا در میزبان اصلی بشنو.');setPlaying(false);}}/>
  {current&&<section className="audio-dock" aria-label="پخش‌کننده پادکست">
   <div className="dock-inner">
    <div className="dock-episode"><img src={current.cover||'/media/podcast-cover.jpeg'} alt=""/><div><Link href={'/podcast/'+current.id}>{cleanTitle(current.title)}</Link><span>قسمت {fa(current.episodeNumber)} · مسعود علیزاده</span></div></div>
    <div className="dock-controls"><div className="playback-buttons"><button className="icon-btn" aria-label="۱۵ ثانیه عقب" onClick={()=>seek(time-15)}><RotateCcw size={18}/><small>۱۵</small></button><button className="play-circle" aria-label={playing?'توقف پخش':'ادامه پخش'} onClick={()=>play(current)}>{playing?<Pause size={18} fill="currentColor"/>:<Play size={18} fill="currentColor"/>}</button><button className="icon-btn" aria-label="۱۵ ثانیه جلو" onClick={()=>seek(time+15)}><RotateCw size={18}/><small>۱۵</small></button><button className="icon-btn next-track" aria-label="قسمت بعد" disabled={!hasNext} onClick={next}><ChevronLeft size={20}/></button></div><div className="seek-row" dir="ltr"><span>{clock(time)}</span><input type="range" min="0" max={duration||current.durationSeconds||1} value={Math.min(time,duration||current.durationSeconds||1)} step="1" onChange={e=>seek(Number(e.target.value))} aria-label="موقعیت پخش"/><span>{clock(duration||current.durationSeconds)}</span></div></div>
    <div className="dock-options"><select value={rate} aria-label="سرعت پخش" onChange={e=>{const v=Number(e.target.value);setRate(v);if(audio.current)audio.current.playbackRate=v;}}>{[1,1.25,1.5,1.75,2].map(r=><option key={r} value={r}>{r}×</option>)}</select><label className="volume-control"><Volume2 size={17}/><input type="range" min="0" max="1" step="0.05" value={volume} onChange={e=>{const v=Number(e.target.value);setVolume(v);if(audio.current)audio.current.volume=v;}} aria-label="بلندی صدا"/></label><button className="icon-btn" aria-label="بستن پخش‌کننده" onClick={()=>{audio.current?.pause();saveProgress();currentRef.current=null;setCurrent(null);}}><X size={18}/></button></div>
   </div>
   {audioError&&<p className="audio-error" role="status">{audioError} <a href={current.url} target="_blank" rel="noreferrer">شنیدن در میزبان اصلی</a></p>}
  </section>}
  {message&&<div className="toast" role="status"><Check size={16}/>{message}</div>}
 </SiteContext.Provider>;
}

function Header(){
 const path=usePathname();const {savedTools,settings}=useSite();const [open,setOpen]=useState(false);
 useEffect(()=>setOpen(false),[path]);
 const nav=[{href:'/',label:'از مسئله شروع کن'},{href:'/podcast',label:'پادکست'},{href:'/tools',label:'ابزارها'}];
 return <header className="site-header"><div className="header-inner"><Link className="brand" href="/" aria-label="شیدرلیپ؛ صفحه اول"><img src={settings.logoUrl||'/media/logo.png'} alt=""/><span>شیدر<span className="brand-green">لیپ</span></span></Link><button className="menu-toggle icon-btn" aria-label={open?'بستن منو':'باز کردن منو'} aria-expanded={open} onClick={()=>setOpen(!open)}>{open?<X size={22}/>:<Menu size={22}/>}</button><nav className={open?'main-nav open':'main-nav'} aria-label="بخش‌های سایت">{nav.map(n=><Link key={n.href} href={n.href} aria-current={(n.href==='/'?path==='/':path.startsWith(n.href))?'page':undefined}>{n.label}</Link>)}</nav><Link className="shelf-link" href="/my-tools" aria-current={path==='/my-tools'?'page':undefined}><Bookmark size={17}/><span>ابزارهای من</span>{savedTools.length>0&&<b>{fa(savedTools.length)}</b>}</Link></div></header>;
}
function Footer(){const {settings}=useSite();return <footer className="site-footer"><div><Link className="footer-name" href="/">{settings.siteName}</Link><span>{settings.audience}</span></div><nav aria-label="پیوندهای پایین صفحه"><Link href="/about">دربارهٔ شیدرلیپ</Link><a href={settings.instagramUrl} target="_blank" rel="noreferrer">اینستاگرام</a><a href="https://feeds.acast.com/public/shows/shiderlip" target="_blank" rel="noreferrer">RSS</a><Link href="/privacy">حریم خصوصی</Link><Link href="/admin">مدیریت</Link></nav></footer>;}

export function ToolCard({tool,compact=false}:{tool:Tool;compact?:boolean}){
 const {savedTools,toggleTool}=useSite();const saved=savedTools.includes(tool.id);
 return <article className={'tool-card '+(compact?'compact':'')}><div className="card-top"><span className="eyebrow"><span className="tiny-square"/> ابزار اجرایی</span><button className={'icon-btn bookmark '+(saved?'bookmarked':'')} aria-label={(saved?'برداشتن نشان ':'نشان کردن ')+tool.title} aria-pressed={saved} onClick={()=>toggleTool(tool.id)}><Bookmark size={18} fill={saved?'currentColor':'none'}/></button></div><h3><Link href={'/tools/'+tool.id.toLowerCase()}>{tool.title}</Link></h3><p className="card-description">{tool.problem}</p><div className="tool-format">فایل کاربردی <span>+</span> ویس مسعود <span>+</span> منابع منتخب</div><div className="card-bottom"><div><strong>{tool.availability==='free'?'رایگان':<>{fa(tool.priceToman/1000)} <small>هزار تومان</small></>}</strong><span className="availability">{tool.availability==='free'?'آمادهٔ دریافت':'در حال آماده‌سازی'}</span></div><Link className="button button-green" href={'/tools/'+tool.id.toLowerCase()}>دیدن ابزار <ArrowLeft size={16}/></Link></div></article>;
}
export function EpisodeCard({episode,featured=false}:{episode:Episode;featured?:boolean}){
 const {current,playing,play,toggleEpisode,savedEpisodes}=useSite();const active=current?.id===episode.id&&playing;const saved=savedEpisodes.includes(episode.id);
 return <article className={featured?'episode-card featured':'episode-card'}><div className="card-top"><span className="eyebrow"><Headphones size={15}/> پادکست · رایگان</span><button className={'icon-btn bookmark '+(saved?'bookmarked':'')} aria-label={(saved?'حذف از فهرست شنیدن ':'ذخیره برای شنیدن ')+cleanTitle(episode.title)} aria-pressed={saved} onClick={()=>toggleEpisode(episode.id)}><Bookmark size={18} fill={saved?'currentColor':'none'}/></button></div><div className="episode-body"><img src={episode.cover||'/media/podcast-cover.jpeg'} alt="" loading="lazy"/><div><span className="episode-number">قسمت {fa(episode.episodeNumber)} · {episode.duration}</span><h3><Link href={'/podcast/'+episode.id}>{cleanTitle(episode.title)}</Link></h3></div></div><p className="card-description">{episode.subtitle||cleanTitle(episode.title)}</p><div className="card-bottom"><Link className="text-link" href={'/podcast/'+episode.id}>دربارهٔ این قسمت <ArrowLeft size={14}/></Link><button className={featured?'button button-green':'button button-navy'} onClick={()=>play(episode)}>{active?<Pause size={15} fill="currentColor"/>:<Play size={15} fill="currentColor"/>}{active?'در حال پخش':'بشنو'}</button></div></article>;
}
