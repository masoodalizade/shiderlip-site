import {build} from 'vite';
import {readFile,writeFile,mkdir,cp,rm,readdir} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const project=process.cwd();
await build({configFile:path.join(project,'vite.pages.config.ts')});
await build({configFile:path.join(project,'vite.pages.config.ts'),publicDir:false,build:{ssr:path.join(project,'static-src/server.tsx'),outDir:'.pages-ssr',emptyOutDir:true,rollupOptions:{input:path.join(project,'static-src/server.tsx'),output:{entryFileNames:'server.mjs'}}}});
const {render,listenPage}=await import(pathToFileURL(path.join(project,'.pages-ssr/server.mjs')).href+'?v='+Date.now());
const output=path.join(project,'pages-dist');
let template=await readFile(path.join(output,'static-src/index.html'),'utf8');
template=template.replace('</head>',"<meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:; media-src 'self' https: blob:; connect-src 'self' https://api.github.com; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'\"/></head>");
template=template.replace('<div id="app"></div>','<div id="app"><!--app:start--><!--app:end--></div>');
// The listening homepage uses native links and details. Keep its layout
// independent of versioned assets that may expire while HTML is cached.
const stylesheet=template.match(/<link rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/);
if(!stylesheet)throw new Error('Missing compiled Pages stylesheet');
const homeCss=await readFile(path.join(output,stylesheet[1].replace(/^\//,'')),'utf8');
const homeLogo=(await readFile(path.join(output,'media/logo.png'))).toString('base64');
const settings=JSON.parse(await readFile('content/settings.json','utf8'));
const catalog=JSON.parse(await readFile('content/tools.json','utf8'));
const podcast=JSON.parse(await readFile('content/podcast.json','utf8'));
const editorial=JSON.parse(await readFile('content/editorial.json','utf8'));
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const routes=[
 {url:'/',...listenPage},
 {url:'/problems/',title:'مشکلات متداول',description:'پاسخ به مسائل واقعی مدیران کسب‌وکارهای کوچک و متوسط'},
 {url:'/education/',title:'آموزش‌ها'},
 {url:'/resources/',title:'منابع'},
 {url:'/services/',title:'خدمات'},
 {url:'/apps/',title:'اپلیکیشن‌ها'},
 {url:'/tests/',title:'تست‌ها'},
 ...[
  ['cash-sales','چطور فروش نقدی کسب‌وکارم را بیشتر کنم؟'],['cash-shortage','چرا با اینکه فروش داریم، همیشه مشکل نقدینگی داریم؟'],
  ['founder-dependency','چطور کاری کنم شرکت بدون حضور من هم درست کار کند؟'],['employee-performance','چطور عملکرد کارکنانم را اندازه بگیرم؟'],
  ['collect-receivables','چطور مطالباتم را سریع‌تر وصول کنم؟'],['customer-retention','چطور مشتری‌ها را وفادار نگه دارم؟'],
  ['commission','چطور یک سیستم پورسانت عادلانه طراحی کنم؟'],['hiring','چطور نیروهای خوب پیدا کنم و نگه دارم؟'],
  ['meetings','چطور جلسات تیم را به تصمیم و اقدام واقعی تبدیل کنم؟'],['profitability','چطور بفهمم کدام بخش کسب‌وکارم واقعاً سودآور است؟'],
  ['choose-projects','روی کدام محصول یا پروژه سرمایه‌گذاری کنم؟'],['sales-report','گزارش هفتگی فروش'],
  ['job-descriptions','شرح وظایف کارکنان'],['stable-revenue','درآمد قابل‌پیش‌بینی'],['delegate','تفویض اختیار'],
  ['launch','عرضه محصول جدید'],['working-capital','ذخیره نقدی'],['grow-without-chaos','رشد و سیستم‌سازی'],
  ['recruitment-shortage','کمبود نیروی کار'],['where-to-start','از کجا شروع کنم؟']
 ].map(([slug,title])=>({url:'/problems/'+slug+'/',title,description:'راهکارها و ابزارهای مرتبط با این مسئله مدیریتی در شیدرلیپ'})),
 {url:'/tools/',title:settings.toolsTitle,description:settings.toolsDescription},
 {url:'/podcast/',title:settings.podcastTitle,description:settings.podcastDescription},
 {url:'/my-tools/',title:'ابزارهای من'},
 {url:'/about/',title:settings.aboutTitle,description:settings.aboutText.slice(0,200)},
 {url:'/admin/',title:'مدیریت شیدرلیپ',noindex:true},
 {url:'/privacy/',title:'حریم خصوصی'},
 ...catalog.products.filter(t=>!t.hidden).map(t=>({url:`/tools/${t.id.toLowerCase()}/`,title:t.title,description:t.description})),
 ...podcast.episodes.filter(ep=>!editorial.episodes[ep.id]?.hidden).map(ep=>({url:`/podcast/${ep.id}/`,title:editorial.episodes[ep.id]?.title||ep.title,description:editorial.episodes[ep.id]?.subtitle||ep.subtitle})),
];
for(const route of [...routes,{url:'/404',title:'صفحه پیدا نشد',noindex:true}]){
 let html=template.replace('<title>شیدرلیپ | جعبه‌ابزار روزمرهٔ مدیر</title>',`<title>${escape(route.url==='/'?route.title:route.title+' | شیدرلیپ')}</title>`);
 html=html.replace(/<meta name="description"[^>]*>/,`<meta name="description" content="${escape(route.description||settings.seoDescription)}"/>`);
 html=html.replace('<!--app:start--><!--app:end-->','<!--app:start-->'+render(route.url.replace(/\/$/,'')||'/')+'<!--app:end-->');
 html=html.replace('</head>',`<link rel="canonical" href="https://shiderlip.ir${route.url}"/><meta property="og:title" content="${escape(route.title)}"/><meta property="og:description" content="${escape(route.description||settings.seoDescription)}"/><meta property="og:image" content="${escape(settings.coverUrl.startsWith('https://')?settings.coverUrl:'https://shiderlip.ir'+settings.coverUrl)}"/><meta property="og:locale" content="fa_IR"/>${route.noindex?'<meta name="robots" content="noindex,nofollow"/>':''}</head>`);
 if(route.url==='/'){
  html=html.replace(stylesheet[0],()=>`<style>${homeCss}</style>`)
   .replace(/<script type="module"[^>]*><\/script>/g,'')
   .replace('<link rel="preload" as="image" href="/media/logo.png"/>','')
   .replace('src="/media/logo.png"',`src="data:image/png;base64,${homeLogo}"`)
   .replace(/<noscript>.*?<\/noscript>/,'');
 }
 const destination=route.url==='/404'?path.join(output,'404.html'):path.join(output,route.url.slice(1),'index.html');
 await mkdir(path.dirname(destination),{recursive:true});await writeFile(destination,html);
}
await cp('content',path.join(output,'content'),{recursive:true});
await writeFile(path.join(output,'.nojekyll'),'');
await writeFile(path.join(output,'CNAME'),'shiderlip.ir\n');
await writeFile(path.join(output,'robots.txt'),'User-agent: *\nAllow: /\nDisallow: /admin/\nSitemap: https://shiderlip.ir/sitemap.xml\n');
await writeFile(path.join(output,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+routes.filter(r=>!r.noindex&&r.url!=='/my-tools/').map(r=>`<url><loc>https://shiderlip.ir${escape(r.url)}</loc></url>`).join('')+'</urlset>\n');
await rm(path.join(output,'static-src'),{recursive:true,force:true});
console.log(`Built ${routes.length} HTML routes; ${podcast.episodes.length} episodes, ${catalog.products.length} tools.`);

if(process.argv.includes('--publish-root')){
 const manifestName='.pages-generated.json';let previous=[];try{previous=JSON.parse(await readFile(manifestName,'utf8'));}catch{}
 const generated=[];
 async function collect(directory,prefix=''){for(const entry of await readdir(directory,{withFileTypes:true})){const relative=prefix+entry.name;if(entry.isDirectory())await collect(path.join(directory,entry.name),relative+'/');else generated.push(relative);}}
 await collect(output);
 for(const filename of previous)if(!generated.includes(filename)&&!filename.startsWith('content/'))await rm(path.join(project,filename),{force:true});
 for(const filename of generated){if(filename.startsWith('content/'))continue;const target=path.join(project,filename);await mkdir(path.dirname(target),{recursive:true});await cp(path.join(output,filename),target);}
 await writeFile(manifestName,JSON.stringify(generated,null,2)+'\n');
 console.log('Copied generated public files to the repository root for branch-based GitHub Pages.');
}
