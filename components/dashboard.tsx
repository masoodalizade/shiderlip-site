'use client';
import {useEffect,useMemo,useState,type ReactNode} from 'react';
import Link from 'next/link';
import {usePathname,useSearchParams} from 'next/navigation';
import {ArrowLeft,Bell,BookOpen,BriefcaseBusiness,CalendarDays,CheckSquare,ChevronLeft,ChevronDown, CircleHelp, ClipboardCheck,Headphones,Home,LayoutGrid,Library,Menu,Search,Settings2,ShieldCheck,Sparkles,Users,Wallet,TrendingUp,X,GraduationCap,Layers,ExternalLink,PlayCircle,Clock} from 'lucide-react';
import {useSite,ToolCard,EpisodeCard} from './site-provider';
import {cleanTitle,type Category} from '@/lib/site-data';

type IconComponent=typeof Home;
type NavItem={name:string;href:string;icon:IconComponent};
const NAV:NavItem[]=[
 {name:'پادکست',href:'/podcast',icon:Headphones},
 {name:'ابزارها',href:'/tools',icon:BriefcaseBusiness},
 {name:'مشکلات متداول',href:'/problems',icon:CircleHelp},
 {name:'آموزش‌ها',href:'/education',icon:GraduationCap},
 {name:'منابع',href:'/resources',icon:BookOpen},
 {name:'خدمات',href:'/services',icon:Layers},
 {name:'اپلیکیشن‌ها',href:'/apps',icon:LayoutGrid},
 {name:'تست‌ها',href:'/tests',icon:ClipboardCheck},
];
export type ManagerProblem={slug:string;title:string;category:string;domain:Category;icon:IconComponent;firstStep:string;keywords:string};
export const MANAGER_PROBLEMS:ManagerProblem[]=[
 {slug:'cash-sales',title:'چطور فروش نقدی کسب‌وکارم را بیشتر کنم؟',category:'فروش',domain:'money',icon:TrendingUp,firstStep:'ابتدا فروش نقدی را به تفکیک مشتری، محصول و کانال فروش در چهار هفته اخیر اندازه بگیر؛ بعد گلوگاه را مشخص کن.',keywords:'فروش نقد مشتری نقدی افزایش درآمد'},
 {slug:'cash-shortage',title:'چرا با اینکه فروش داریم، همیشه مشکل نقدینگی داریم؟',category:'مالی',domain:'money',icon:Wallet,firstStep:'برای ۱۳ هفته آینده، دریافت‌ها و پرداخت‌های قطعی و احتمالی را در یک جدول جریان نقد بنویس.',keywords:'نقدینگی جریان نقد وصول پرداخت حقوق مالی'},
 {slug:'founder-dependency',title:'چطور کاری کنم شرکت بدون حضور من هم درست کار کند؟',category:'سیستم‌سازی',domain:'execution',icon:Settings2,firstStep:'پنج تصمیم یا کاری را که فقط با حضور تو انجام می‌شود فهرست کن و برای یکی از آن‌ها مسئول، اختیار و معیار کنترل تعیین کن.',keywords:'سیستم سازی نبود مدیر تفویض استقلال ساختار'},
 {slug:'employee-performance',title:'چطور عملکرد کارکنانم را اندازه بگیرم؟',category:'تیم',domain:'people',icon:Users,firstStep:'برای هر نقش، دو یا سه خروجی قابل‌سنجش تعریف کن؛ فعالیت و نتیجه را با هم اشتباه نگیر.',keywords:'عملکرد کارکنان KPI ارزیابی نیروی انسانی'},
 {slug:'collect-receivables',title:'چطور مطالباتم را سریع‌تر وصول کنم؟',category:'مالی',domain:'money',icon:Wallet,firstStep:'مطالبات را براساس تاریخ سررسید، مبلغ و احتمال وصول دسته‌بندی کن و برای هر مورد یک اقدام بعدی مشخص کن.',keywords:'مطالبات بدهکار وصول چک سررسید'},
 {slug:'customer-retention',title:'چطور مشتری‌ها را وفادار نگه دارم؟',category:'فروش',domain:'decisions',icon:TrendingUp,firstStep:'مشتریان ازدست‌رفته و تکرار خرید را بررسی کن و با چند مشتری واقعی درباره دلیل انتخاب یا ترک کسب‌وکار گفت‌وگو کن.',keywords:'مشتری وفاداری نگهداشت ریزش'},
 {slug:'commission',title:'چطور یک سیستم پورسانت عادلانه طراحی کنم؟',category:'تیم',domain:'people',icon:Users,firstStep:'قبل از انتخاب درصد پورسانت، مشخص کن کدام رفتار و کدام خروجی باید پاداش بگیرد و هزینه‌های مستقیم فروش چیست.',keywords:'پورسانت فروش پاداش انگیزش'},
 {slug:'hiring',title:'چطور نیروهای خوب پیدا کنم و نگه دارم؟',category:'تیم',domain:'people',icon:Users,firstStep:'نتیجه‌ای را که از این جایگاه انتظار داری بنویس و مصاحبه را بر شواهد رفتاری و توان یادگیری بنا کن.',keywords:'استخدام منابع انسانی جذب نگهداری نیرو'},
 {slug:'meetings',title:'چطور جلسات تیم را به تصمیم و اقدام واقعی تبدیل کنم؟',category:'تیم',domain:'execution',icon:Users,firstStep:'در پایان هر جلسه، برای هر تصمیم فقط سه چیز ثبت کن: مسئول، موعد و معیار اتمام.',keywords:'جلسه مصوبات پیگیری تسک'},
 {slug:'profitability',title:'چطور بفهمم کدام بخش کسب‌وکارم واقعاً سودآور است؟',category:'مالی',domain:'money',icon:Wallet,firstStep:'درآمد و هزینه مستقیم هر محصول یا خط کسب‌وکار را جدا کن؛ سود ناخالص و نقدینگی را یکی فرض نکن.',keywords:'سود زیان حاشیه سود لاین'},
 {slug:'choose-projects',title:'از بین چند محصول یا پروژه، روی کدام سرمایه‌گذاری کنم؟',category:'استراتژی',domain:'decisions',icon:Settings2,firstStep:'گزینه‌ها را با معیارهای مشترک مثل سرمایه اولیه، زمان رسیدن به بازار، حاشیه سود و ریسک مقایسه کن.',keywords:'پروژه انتخاب سرمایه محصول اولویت بندی'},
 {slug:'sales-report',title:'چه گزارشی باید هر هفته از تیم فروش بگیرم؟',category:'فروش',domain:'execution',icon:TrendingUp,firstStep:'تعداد فرصت‌های جدید، نرخ تبدیل، فروش وصول‌شده و اقدامات بعدی هر فروشنده را به شکل یکسان ثبت کن.',keywords:'گزارش فروش داشبورد فروشنده'},
 {slug:'job-descriptions',title:'چطور شرح وظایف و مسئولیت افراد را روشن کنم؟',category:'سیستم‌سازی',domain:'execution',icon:Settings2,firstStep:'برای هر نقش، خروجی اصلی، اختیارات تصمیم‌گیری و مرز همکاری با سایر نقش‌ها را بنویس.',keywords:'چارت سازمانی شرح وظایف ساختار'},
 {slug:'stable-revenue',title:'چطور درآمد کسب‌وکارم را قابل‌پیش‌بینی‌تر کنم؟',category:'فروش',domain:'decisions',icon:TrendingUp,firstStep:'قراردادهای تکرارشونده، تمرکز درآمد روی مشتریان بزرگ و فاصله بین ایجاد فرصت تا دریافت وجه را بررسی کن.',keywords:'درآمد پایدار پیش بینی فروش'},
 {slug:'delegate',title:'چطور از کارهای روزمره فاصله بگیرم و تفویض کنم؟',category:'سیستم‌سازی',domain:'execution',icon:Settings2,firstStep:'کارهای تکراری یک هفته را ثبت کن و برای اولین واگذاری، نتیجه مطلوب و حد اختیار را شفاف کن.',keywords:'تفویض مدیر دخالت زیاد زمان'},
 {slug:'launch',title:'چطور محصول جدید را سریع‌تر وارد بازار کنم؟',category:'استراتژی',domain:'decisions',icon:Settings2,firstStep:'کوچک‌ترین نسخه قابل‌آزمون محصول را تعریف کن و پیش از توسعه کامل، با خریدار واقعی اعتبارسنجی کن.',keywords:'محصول توسعه لانچ بازار'},
 {slug:'working-capital',title:'چقدر ذخیره نقدی برای عبور از بحران لازم دارم؟',category:'مالی',domain:'money',icon:Wallet,firstStep:'هزینه‌های ضروری ماهانه و تعهدات غیرقابل‌تعویق را محاسبه کن و سناریوی افت درآمد بساز.',keywords:'بقا بحران ذخیره پول'},
 {slug:'grow-without-chaos',title:'چطور کسب‌وکارم را بزرگ کنم بدون اینکه بی‌نظم شود؟',category:'سیستم‌سازی',domain:'execution',icon:Settings2,firstStep:'فرایندهایی را که با افزایش حجم کار بیشترین خطا یا تأخیر را ایجاد می‌کنند شناسایی کن.',keywords:'رشد مقیاس پذیری عملیات'},
 {slug:'recruitment-shortage',title:'وقتی نیروی مناسب پیدا نمی‌شود، چه‌کار کنم؟',category:'تیم',domain:'people',icon:Users,firstStep:'پیش از افزایش هزینه جذب، کارها را به مهارت‌های ضروری و قابل‌آموزش تفکیک کن.',keywords:'کمبود نیرو استخدام آموزش'},
 {slug:'where-to-start',title:'می‌دانم کسب‌وکارم مشکل دارد؛ از کجا شروع کنم؟',category:'مدیریت',domain:'decisions',icon:CircleHelp,firstStep:'ابتدا یک تصویر یک‌صفحه‌ای از فروش، نقدینگی، مشتریان، افراد و وابستگی‌های کلیدی شرکت تهیه کن.',keywords:'تشخیص مسئله شروع آشفتگی کسب و کار'},
];
const normalize=(t:string)=>t.replace(/[ي]/g,'ی').replace(/[ك]/g,'ک').replace(/\s+/g,' ').trim().toLowerCase();
const formatDate=(date:Date)=>new Intl.DateTimeFormat('fa-IR-u-ca-persian',{timeZone:'Asia/Tehran',weekday:'long',day:'numeric',month:'long'}).format(date);
const formatTime=(date:Date)=>new Intl.DateTimeFormat('fa-IR',{timeZone:'Asia/Tehran',hour:'2-digit',minute:'2-digit'}).format(date);

export function DashboardShell({children}:{children:ReactNode}){
 const path=usePathname();
 const [menuOpen,setMenuOpen]=useState(false),[search,setSearch]=useState('');
 const [now,setNow]=useState<Date|null>(null);
 useEffect(()=>{const tick=()=>setNow(new Date());tick();const timer=setInterval(tick,60000);return()=>clearInterval(timer)},[]);
 useEffect(()=>setMenuOpen(false),[path]);
 const submit=(e:React.FormEvent<HTMLFormElement>)=>{e.preventDefault();const q=search.trim();if(q)window.location.assign('/?q='+encodeURIComponent(q));};
 const active=(n:NavItem)=>n.href==='/problems'?(path==='/'||path.startsWith('/problems')):path===n.href||path.startsWith(n.href+'/');
 return <div className="dash-frame" dir="rtl">
  <aside className={'dash-sidebar '+(menuOpen?'dash-sidebar-open':'')} aria-label="منوی اصلی">
    <div className="dash-sidebar-head">
      <Link href="/" className="dash-brand" aria-label="شیدرلیپ، صفحه اصلی"><img className="dash-wordmark" src="/media/brand-wordmark.png" alt="شیدرلیپ"/></Link>
      <button type="button" aria-label="بستن منو" className="dash-close-mobile" onClick={()=>setMenuOpen(false)}><X size={20}/></button>
    </div>
    <nav className="dash-nav">{NAV.map(n=>{const Icon=n.icon;return <Link key={n.href} href={n.href} className={'dash-nav-item '+(active(n)?'dash-nav-active':'')} aria-current={active(n)?'page':undefined}><Icon size={21} strokeWidth={1.8}/><span>{n.name}</span></Link>})}</nav>
    <div className="dash-sidebar-bottom">رهبری کسب‌وکار، در عمل.</div>
  </aside>
  {menuOpen&&<button className="dash-screen" onClick={()=>setMenuOpen(false)} aria-label="بستن منو"/>}
  <div className="dash-workspace">
    <header className="dash-topbar">
      <div className="dash-search-area">
        <button type="button" className="dash-mobile-menu" aria-label="باز کردن منو" onClick={()=>setMenuOpen(true)}><Menu size={22}/></button>
        <form className="dash-search-box" role="search" onSubmit={submit}>
          <Search size={19} strokeWidth={1.9}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="جست‌وجو در شیدرلیپ..." aria-label="جست‌وجوی مسائل مدیران"/>
          {search&&<button aria-label="پاک کردن جست‌وجو" type="button" onClick={()=>setSearch('')}><X size={15}/></button>}
        </form>
      </div>
      <div className="dash-utilities">
       <span className="dash-clock"><CalendarDays size={16}/>{now?formatDate(now)+' | '+formatTime(now):' '}</span>
       <Link className="dash-tool-icon" href="/about" aria-label="درباره شیدرلیپ"><CircleHelp size={19}/></Link>
       <Link className="dash-tool-icon" href="/my-tools" aria-label="موارد نشان‌شده"><Bell size={19}/></Link>
       <Link className="dash-profile" href="/my-tools" aria-label="ابزارهای من"><span>م</span><ChevronDown size={13}/></Link>
      </div>
    </header>
    <div className="dash-page-slot">{children}</div>
    <footer className="dash-footer"><span>شیدرلیپ · رهبری کسب‌وکار، در عمل.</span><span><Link href="/about">درباره ما</Link><Link href="/privacy">حریم خصوصی</Link><Link href="/admin">مدیریت سایت</Link></span></footer>
  </div>
 </div>;
}

function QuestionList({showAll=false}:{showAll?:boolean}){
 const params=useSearchParams();const query=normalize(params.get('q')||'');
 const [expanded,setExpanded]=useState(showAll);
 const matches=useMemo(()=>MANAGER_PROBLEMS.filter(p=>normalize(p.title+' '+p.keywords+' '+p.category).includes(query)),[query]);
 const shown=expanded||query?matches:matches.slice(0,10);
 return <div className="dash-question-area">
  {query&&<p className="dash-search-status">نتیجه جست‌وجو برای «{query}»</p>}
  <div className="dash-question-list">
   {shown.map(p=>{const Icon=p.icon;return <Link key={p.slug} href={'/problems/'+p.slug} className="dash-question-link"><span className="dash-question-text">{p.title}</span><span className="dash-tag"><Icon size={17} strokeWidth={1.8}/>{p.category}</span><ChevronLeft className="dash-question-arrow" size={18} strokeWidth={1.8}/></Link>})}
  </div>
  {matches.length===0&&<div className="dash-no-results">سؤالی با این عبارت پیدا نشد. <Link href="/tools">ابزارها را ببین</Link> یا عبارت دیگری جست‌وجو کن.</div>}
  {!query&&matches.length>10&&<button type="button" className="dash-see-more" onClick={()=>setExpanded(v=>!v)}>{expanded?'نمایش سؤال‌های کمتر':'مشاهده سؤال‌های بیشتر'} <ArrowLeft size={15}/></button>}
 </div>;
}
export function DashboardHome({full=false}:{full?:boolean}){
 return <main className="dash-home" id="dashboard-home">
  <div className="dash-home-inner">
    <div className="dash-home-heading">
     <h1>چه چیزی ذهن تو را درگیر کرده؟</h1>
     <span className="dash-accent" aria-hidden="true"/>
     <p>مسئله‌ات را انتخاب کن تا ابزارها، اپیزودها، آموزش‌ها و خدمات مرتبط را ببینی.</p>
    </div>
    <QuestionList showAll={full}/>
  </div>
 </main>;
}
export function DashboardProblem({slug}:{slug:string}){
 const {tools,episodes}=useSite();
 const p=MANAGER_PROBLEMS.find(x=>x.slug===slug);
 if(!p)return <main className="dash-simple"><h1>این مسئله پیدا نشد.</h1><Link href="/problems">بازگشت به مشکلات متداول</Link></main>;
 const relevant=tools.filter(t=>t.category===p.domain).slice(0,3);
 const relatedNumbers=new Set(relevant.flatMap(t=>t.episodeNumbers));
 const relatedEpisodes=episodes.filter(e=>relatedNumbers.has(e.episodeNumber)).slice(0,2);
 return <main className="dash-simple">
  <nav className="dash-breadcrumb"><Link href="/problems">مشکلات متداول</Link><ChevronLeft size={15}/><span>{p.category}</span></nav>
  <div className="dash-detail-intro"><span className="dash-eyebrow">{p.category} · مسئله مدیریتی</span><h1>{p.title}</h1><p>برای شروع، لازم نیست همه‌چیز را یک‌باره تغییر بدهی. اول مسئله را دقیق‌تر ببین، بعد یک اقدام کوچک و قابل‌اندازه‌گیری انتخاب کن.</p></div>
  <section className="dash-first-step"><span>اولین قدم پیشنهادی</span><p>{p.firstStep}</p></section>
  <section className="dash-related"><div className="dash-section-label"><h2>ابزارهای مرتبط</h2><Link href={'/tools?category='+p.domain}>همه ابزارها <ArrowLeft size={16}/></Link></div><div className="dash-related-grid">{relevant.map(t=><ToolCard key={t.id} tool={t} compact/>)}</div></section>
  {relatedEpisodes.length>0&&<section className="dash-related"><div className="dash-section-label"><h2>اپیزودهای پیشنهادی</h2><Link href="/podcast">همه اپیزودها <ArrowLeft size={16}/></Link></div><div className="dash-related-grid">{relatedEpisodes.map(e=><EpisodeCard key={e.id} episode={e}/>)}</div></section>}
  <div className="dash-detail-footer"><Link href="/problems"><ArrowLeft size={16}/> سایر مسائل مدیریتی</Link></div>
 </main>;
}
type ContentSection='education'|'resources'|'services'|'apps'|'tests';
const SECTION_CONTENT:Record<ContentSection,{name:string;desc:string;upcoming:string[]}> = {
 education:{name:'آموزش‌ها',desc:'یادگیری مدیریت و رهبری با تمرکز بر موقعیت‌های واقعی کسب‌وکار.',upcoming:['آموزش مدیریت فروش','آموزش استخدام و ارزیابی','آموزش سیستم‌سازی']},
 resources:{name:'منابع',desc:'کتاب‌ها، مقاله‌ها و منابع معتبر برای فهم عمیق‌تر مسائل مدیریتی.',upcoming:[]},
 services:{name:'خدمات',desc:'وقتی برای حل مسئله به همراهی یک متخصص نیاز داری.',upcoming:['ارزیابی اولیه کسب‌وکار','مشاوره سیستم‌سازی','مشاوره فروش و منابع انسانی']},
 apps:{name:'اپلیکیشن‌ها',desc:'ابزارهای نرم‌افزاری سبک برای کارهای تکرارشونده مدیران.',upcoming:['پیگیری مصوبات جلسات','گزارش هفتگی فروش','پیگیری مطالبات']},
 tests:{name:'تست‌ها',desc:'خودارزیابی و شناخت بهتر وضعیت کسب‌وکار و تیم.',upcoming:['ارزیابی بلوغ مدیریتی','خودارزیابی تفویض اختیار','ارزیابی فرایند استخدام']},
};
export function DashboardSection({kind}:{kind:ContentSection}){
 const {episodes,tools,settings}=useSite();
 const meta=SECTION_CONTENT[kind];
 const resources=tools.flatMap(t=>[t.mainResource,...t.additionalResources]).filter(r=>r&&/^https:\/\//.test(r.url||'')).filter((r,i,a)=>a.findIndex(x=>x.url===r.url)===i).slice(0,12);
 return <main className="dash-simple">
   <div className="dash-section-hero"><span className="dash-eyebrow">شیدرلیپ · رهبری کسب‌وکار، در عمل.</span><h1>{meta.name}</h1><p>{meta.desc}</p></div>
   {kind==='education'&&<><p className="dash-notice">دوره‌های اختصاصی در حال آماده‌سازی‌اند. فعلاً می‌توانی از اپیزودهای آموزشی پادکست شروع کنی.</p><div className="dash-related-grid">{episodes.slice(0,6).map(e=><EpisodeCard key={e.id} episode={e}/>)}</div><Link className="dash-section-cta" href="/podcast">دیدن تمام اپیزودها <ArrowLeft size={16}/></Link></>}
   {kind==='resources'&&<div className="dash-resource-list">{resources.map((r,i)=><a key={i} href={r.url} target="_blank" rel="noopener noreferrer"><BookOpen size={19}/><span>{r.title}</span><ExternalLink size={15}/></a>)}{resources.length===0&&<p>منابع منتخب به‌زودی اضافه می‌شوند.</p>}</div>}
   {kind==='services'&&<><div className="dash-offer"><h2>از تشخیص مسئله تا اقدام</h2><p>اگر مسئله کسب‌وکارت با یک ابزار آماده حل نمی‌شود، می‌توانی برای بررسی امکان همکاری پیام بدهی.</p><a className="dash-section-cta" href={settings.contactUrl} target="_blank" rel="noopener noreferrer">درخواست بررسی مشاوره <ExternalLink size={15}/></a></div><p className="dash-notice">درخواست خدمت فعلاً از طریق راه ارتباطی رسمی شیدرلیپ انجام می‌شود؛ سامانه رزرو آنلاین راه‌اندازی نشده است.</p></>}
   {(kind==='apps'||kind==='tests')&&<p className="dash-notice">این بخش در حال توسعه است؛ گزینه‌های زیر برنامه‌های پیشنهادی آینده‌اند و هنوز برای استفاده فعال نیستند.</p>}
   {kind!=='education'&&kind!=='resources'&&<div className="dash-upcoming-list">{meta.upcoming.map((s,i)=><div key={i} className="dash-upcoming-row"><CheckSquare size={19}/><span>{s}</span><small>{kind==='services'?'خدمت پیشنهادی':'در برنامه توسعه'}</small></div>)}</div>}
 </main>;
}
