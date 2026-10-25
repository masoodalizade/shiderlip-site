import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {parseFeed,FEED_URL} from '../lib/rss.ts';
import {routeShell} from '../lib/route-shell.ts';

const localPath=process.env.SHIDERLIP_RSS_INPUT;
let xml;
if(localPath)xml=await readFile(localPath,'utf8');
else{
 const response=await fetch(FEED_URL,{signal:AbortSignal.timeout(30000),headers:{'User-Agent':'Shiderlip-RSS-Sync/1.0'}});
 if(!response.ok)throw new Error('RSS request failed: '+response.status);
 xml=await response.text();
}
if(!/<rss[\s>]/i.test(xml)||!/<channel[\s>]/i.test(xml))throw new Error('The response is not an RSS feed.');
const parsed=parseFeed(xml);
if(!parsed.length||parsed.some(ep=>!/^([A-Za-z0-9][A-Za-z0-9_-]{0,119})$/.test(ep.id))||new Set(parsed.map(ep=>ep.id)).size!==parsed.length)throw new Error('RSS contains no valid episodes or duplicate IDs.');
const old=JSON.parse(await readFile('content/podcast.json','utf8'));
if(parsed.length<Math.floor(old.episodes.length*.8))throw new Error('RSS episode count unexpectedly decreased; preserving the previous snapshot.');
const changed=JSON.stringify(parsed)!==JSON.stringify(old.episodes.map(({id,title,subtitle,description,publishedAt,duration,durationSeconds,audioUrl,url,cover,season,episodeNumber})=>({id,title,subtitle,description,publishedAt,duration,durationSeconds,audioUrl,url,cover,season,episodeNumber})));
const result={...old,feedUrl:FEED_URL,fetchedAt:new Date().toISOString(),episodeCount:parsed.length,episodes:parsed.map(ep=>({...old.episodes.find(oldEp=>oldEp.id===ep.id),...ep})),verification:{...old.verification,httpStatus:200,notes:[...(old.verification?.notes||[]),'Public RSS snapshot is refreshed by the repository workflow; editorial overrides are stored separately.'].filter((value,index,list)=>list.indexOf(value)===index)}};
await writeFile('content/podcast.json',JSON.stringify(result,null,2)+'\n');
let shell;try{shell=await readFile('index.html','utf8');}catch{}
if(shell?.includes('<!--app:start-->'))for(const ep of parsed){
 const directory='podcast/'+ep.id;
 try{await readFile(directory+'/index.html');}catch{await mkdir(directory,{recursive:true});await writeFile(directory+'/index.html',routeShell(shell,ep.title,'/'+directory+'/'));}
}
console.log(JSON.stringify({episodes:parsed.length,feed:FEED_URL,contentChanged:changed,newestTitle:parsed[0].title}));

const catalog=JSON.parse(await readFile('content/tools.json','utf8'));
const editorial=JSON.parse(await readFile('content/editorial.json','utf8'));
const publicUrls=['/','/about/','/tools/','/podcast/','/privacy/',...catalog.products.filter(t=>!t.hidden).map(t=>'/tools/'+t.id.toLowerCase()+'/'),...parsed.filter(ep=>!editorial.episodes[ep.id]?.hidden).map(ep=>'/podcast/'+ep.id+'/')];
await writeFile('sitemap.xml','<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+publicUrls.map(url=>'<url><loc>https://shiderlip.ir'+url+'</loc></url>').join('')+'</urlset>\n');
