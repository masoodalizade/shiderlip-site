import {useEffect} from 'react';
import {Router,usePathname} from './navigation';
import Link from './link';
import {SiteProvider,useSite} from '../components/site-provider';
import {HomeExperience,Catalog,ToolDetail,EpisodeDetail,MyTools,About} from '../components/experience';
import {Admin} from './admin';
import {cleanTitle} from '../lib/site-data';
import {DashboardHome,DashboardProblem,DashboardSection,MANAGER_PROBLEMS} from '../components/dashboard';

export const listenPage = {
 title: 'پادکست شیدرلیپ',
 description: 'پادکست شیدرلیپ را در کست‌باکس، تلگرام و پلت‌فرم دلخواهت دنبال کن.',
};

const otherPlatforms = [
 ['شنیدن در همین سایت', '/podcast/'],
 ['یوتیوب', 'https://www.youtube.com/@Shiderlip/podcasts'],
 ['YouTube Music', 'https://music.youtube.com/@Shiderlip'],
 ['اسپاتیفای', 'https://open.spotify.com/show/1nmRcEVHr4bPxeG09UK5D4'],
 ['اپل پادکست', 'https://podcasts.apple.com/us/podcast/id1745513880'],
 ['تهران پادکست', 'https://tehranpodcast.ir/shiderlip/'],
 ['فیدیبو', 'https://fidibo.com/channel/30000833-shiderlip-%D8%B4%DB%8C%D8%AF%D8%B1%D9%84%DB%8C%D9%BE'],
 ['Acast', 'https://shows.acast.com/shiderlip'],
 ['Amazon Music', 'https://music.amazon.in/podcasts/da77e698-2e45-4ae4-8f8b-a363a607fb40/shiderlip-%D8%B4%DB%8C%D8%AF%D8%B1%D9%84%DB%8C%D9%BE'],
 ['Audible', 'https://www.audible.com/podcast/Shiderlip/B0DG91JHFK?overrideBaseCountry=true&ipRedirectOverride=true'],
 ['Pocket Casts', 'https://pca.st/itunes/1745513880'],
 ['Podcast Addict', 'https://podcastaddict.com/podcast/shiderlip/5217011'],
 ['Podcast Republic', 'https://podcastrepublic.net/podcast/1745513880'],
 ['Castro', 'https://castro.fm/podcast/bc9a10d5-9764-49f4-a36e-a9d463afe325'],
 ['Overcast', 'https://overcast.fm/itunes1745513880'],
 ['AntennaPod', 'https://antennapod.org/deeplink/subscribe/?url=https%3A%2F%2Ffeeds.acast.com%2Fpublic%2Fshows%2Fshiderlip&title=Shiderlip'],
 ['Podtail', 'https://podtail.com/en/podcast/shiderlip/'],
 ['GetPodcast', 'https://getpodcast.com/podcast/shiderlip-shydrlyp'],
 ['radio.net', 'https://www.radio.net/podcast/shiderlip-shydrlyp'],
 ['Podscan', 'https://podscan.fm/podcasts/shiderlip-sydrlyp'],
 ['PodParadise', 'https://www.podparadise.com/Podcast/1745513880'],
 ['TopPodcast', 'https://toppodcast.com/podcast_feeds/shiderlip-%D8%B4%DB%8C%D8%AF%D8%B1%D9%84%DB%8C%D9%BE/'],
 ['دیزر', 'https://www.deezer.com/show/1001213981'],
 ['Podimo', 'https://podimo.com/de/shows/shiderlip-shydrlyp'],
 ['Podbay', 'https://podbay.fm/p/shiderlip-or-shydrlyp'],
 ['Listen Notes', 'https://www.listennotes.com/podcasts/asUjERQF7Lu/'],
];

function ListenHome() {
 useEffect(() => {
  document.title = listenPage.title;
  document.querySelector('meta[name="description"]')?.setAttribute('content', listenPage.description);
  document.querySelector('meta[name="robots"]')?.remove();
 }, []);

 return (
  <main id="main-content" className="listen-home">
   <div className="listen-panel">
    <div className="listen-mark">
     <img src="/media/logo.png" width="1140" height="1050" alt="" />
    </div>
    <h1>{listenPage.title}</h1>
    <p className="listen-host">با <a href="https://masoodalizade.ir/">مسعود علیزاده</a></p>
    <p className="listen-intro">از پلتفرم دلخواهت گوش کن.</p>
    <nav className="listen-links" aria-label="پلتفرم‌های شنیدن شیدرلیپ">
     <a className="listen-link" href="https://castbox.fm/channel/Shiderlip-%7C-%D8%B4%DB%8C%D8%AF%D8%B1%D9%84%DB%8C%D9%BE-id6163968">کست‌باکس</a>
     <a className="listen-link" href="https://t.me/masood_alizadee">تلگرام</a>
     <details className="listen-more">
      <summary className="listen-link">دیگر پلت‌فرم‌ها</summary>
      <ul className="listen-platforms">
       {otherPlatforms.map(([label, href]) => (
        <li key={href}><a href={href} dir="auto">{label}</a></li>
       ))}
      </ul>
     </details>
    </nav>
    <footer className="listen-footer">
     <a className="listen-consult" href="https://forms.gle/QeD4tJvMyKrH1XUj9">درخواست مشاوره کسب‌وکار</a>
     <div className="listen-secondary">
      <a href="https://t.me/shiderlip">پیام مستقیم در تلگرام</a>
      <a href="https://www.instagram.com/shiderlip">اینستاگرام شیدرلیپ</a>
      <a href="https://feeds.acast.com/public/shows/shiderlip">فید RSS</a>
     </div>
    </footer>
   </div>
  </main>
 );
}

function Pages(){
 const path=usePathname();const {tools,episodes,settings,contentReady}=useSite();
 const problem=path.startsWith('/problems/')?MANAGER_PROBLEMS.find(p=>p.slug===path.split('/')[2]):undefined;
 const tool=path.startsWith('/tools/')?tools.find(t=>t.id.toLowerCase()===path.split('/')[2]?.toLowerCase()):undefined;
 const episode=path.startsWith('/podcast/')?episodes.find(ep=>ep.id===path.split('/')[2]):undefined;
 useEffect(()=>{
  const title=problem?.title||tool?.title||(episode?cleanTitle(episode.title):({'/':settings.siteName,'/problems':'مشکلات متداول','/education':'آموزش‌ها','/resources':'منابع','/services':'خدمات','/apps':'اپلیکیشن‌ها','/tests':'تست‌ها','/tools':settings.toolsTitle,'/podcast':settings.podcastTitle,'/my-tools':'ابزارهای من','/about':settings.aboutTitle,'/admin':'مدیریت شیدرلیپ','/privacy':'حریم خصوصی'}[path]||'صفحه پیدا نشد'));
  document.title=title+' | جعبه‌ابزار روزمرهٔ مدیر';
  document.querySelector('meta[name="description"]')?.setAttribute('content',tool?.description||episode?.subtitle||settings.seoDescription);
  let robots=document.querySelector('meta[name="robots"]');
  if(path==='/admin'){if(!robots){robots=document.createElement('meta');robots.setAttribute('name','robots');document.head.appendChild(robots);}robots.setAttribute('content','noindex,nofollow');}else robots?.remove();
 },[path,tool,episode,settings]);
 if(path==='/problems')return <DashboardHome full/>;
 if(problem)return <DashboardProblem slug={problem.slug}/>;
 if(path==='/education')return <DashboardSection kind="education"/>;
 if(path==='/resources')return <DashboardSection kind="resources"/>;
 if(path==='/services')return <DashboardSection kind="services"/>;
 if(path==='/apps')return <DashboardSection kind="apps"/>;
 if(path==='/tests')return <DashboardSection kind="tests"/>;
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
function SiteRoutes() {
 const path = usePathname();
 if (path === '/') return <ListenHome/>;
 return <SiteProvider><div id="main-content"><Pages/></div></SiteProvider>;
}

export function App({initialPath='/'}:{initialPath?:string}){
 return <Router initialPath={initialPath}><SiteRoutes/></Router>;
}
