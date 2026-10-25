import {useEffect} from 'react';
import {Router,usePathname} from './navigation';
import Link from './link';
import {SiteProvider,useSite} from '../components/site-provider';
import {HomeExperience,Catalog,ToolDetail,EpisodeDetail,MyTools,About} from '../components/experience';
import {Admin} from './admin';
import {cleanTitle} from '../lib/site-data';

function Pages(){
 const path=usePathname();const {tools,episodes,settings,contentReady}=useSite();
 const tool=path.startsWith('/tools/')?tools.find(t=>t.id.toLowerCase()===path.split('/')[2]?.toLowerCase()):undefined;
 const episode=path.startsWith('/podcast/')?episodes.find(ep=>ep.id===path.split('/')[2]):undefined;
 useEffect(()=>{
  const title=tool?.title||(episode?cleanTitle(episode.title):({'/':settings.siteName,'/tools':settings.toolsTitle,'/podcast':settings.podcastTitle,'/my-tools':'ابزارهای من','/about':settings.aboutTitle,'/admin':'مدیریت شیدرلیپ','/privacy':'حریم خصوصی'}[path]||'صفحه پیدا نشد'));
  document.title=title+' | جعبه‌ابزار روزمرهٔ مدیر';
  document.querySelector('meta[name="description"]')?.setAttribute('content',tool?.description||episode?.subtitle||settings.seoDescription);
  let robots=document.querySelector('meta[name="robots"]');
  if(path==='/admin'){if(!robots){robots=document.createElement('meta');robots.setAttribute('name','robots');document.head.appendChild(robots);}robots.setAttribute('content','noindex,nofollow');}else robots?.remove();
 },[path,tool,episode,settings]);
 if(path==='/')return <HomeExperience/>;
 if(path==='/tools')return <Catalog key="tools" kind="tools"/>;
 if(path==='/podcast')return <Catalog key="podcast" kind="podcast"/>;
 if(path==='/my-tools')return <MyTools/>;
 if(path==='/about')return <About/>;
 if(path==='/admin')return <Admin/>;
 if(path==='/privacy')return <main className="content about-content prose-text"><span className="overline">شیدرلیپ</span><h1>حریم خصوصی و استفاده از سایت</h1><p>شنیدن پادکست و جست‌وجو در ابزارها به ساخت حساب نیاز ندارد. نشان‌ها و جای شنیدن فقط در مرورگر خودت ذخیره می‌شوند؛ با پاک کردن اطلاعات مرورگر، این داده‌ها هم پاک می‌شوند.</p><p>فایل صوتی قسمت‌ها از میزبان رسمی Acast پخش می‌شود و تابع سیاست حریم خصوصی همان سرویس است. این نسخهٔ سایت از ابزار تحلیل رفتار یا تبلیغات شخصی‌سازی‌شده استفاده نمی‌کند؛ زیرساخت میزبانی و میزبان صدا ممکن است اطلاعات فنی درخواست را ثبت کنند.</p><p>ابزارهایی که برچسب «در حال آماده‌سازی» دارند هنوز برای فروش عرضه نشده‌اند. نمونه‌های رایگان برای آشنایی با ساختار ابزارند و فایل نهایی محصول محسوب نمی‌شوند.</p><p>در بخش مدیریت، کد دسترسی فقط در حافظهٔ موقت همان صفحه نگه داشته می‌شود و مستقیماً برای درخواست‌های مجاز به گیت‌هاب استفاده می‌شود. پس از خروج یا بستن صفحه باید دوباره وارد شوی. فایل‌های بارگذاری‌شده و محتوای منتشرشدهٔ این سایت عمومی‌اند.</p><a className="button button-outline" href={settings.contactUrl} target="_blank" rel="noreferrer">ارتباط با شیدرلیپ</a></main>;
 if(tool)return <ToolDetail key={tool.id} tool={tool}/>;
 if(episode)return <EpisodeDetail key={episode.id} episode={episode}/>;
 if(!contentReady&&(path.startsWith('/tools/')||path.startsWith('/podcast/')))return <main className="content loading-content" role="status">در حال دریافت محتوا…</main>;
 return <main className="content empty-state"><span className="overline">۴۰۴</span><h1>این صفحه پیدا نشد.</h1><p>از یک مسئله شروع کن یا سراغ قسمت‌های پادکست برو.</p><Link className="button button-navy" href="/">صفحهٔ اول</Link></main>;
}
export function App({initialPath='/'}:{initialPath?:string}){return <Router initialPath={initialPath}><SiteProvider><div id="main-content"><Pages/></div></SiteProvider></Router>;}
