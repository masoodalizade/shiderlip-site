export const FEED_URL = 'https://feeds.acast.com/public/shows/shiderlip';
const entities: Record<string,string>={amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' '};
export function decode(text: string): string {
  return text.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/&(#x[\da-f]+|#\d+|\w+);/gi,(all,k:string)=>{
    if(k[0]==='#'){const n=k[1]?.toLowerCase()==='x'?parseInt(k.slice(2),16):parseInt(k.slice(1),10);return Number.isFinite(n)&&n>0&&n<=0x10ffff?String.fromCodePoint(n):'';}
    return entities[k]??all;
  });
}
function tag(xml: string,name: string){const safe=name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');return decode(xml.match(new RegExp('<'+safe+'(?:\\s[^>]*)?>([\\s\\S]*?)<\\/'+safe+'>','i'))?.[1]||'').trim();}
function attr(xml: string,name: string,key: string){const el=xml.match(new RegExp('<'+name+'\\b[^>]*>','i'))?.[0]||'';return decode(el.match(new RegExp('\\b'+key+'=["\x27]([^"\x27]*)["\x27]','i'))?.[1]||'');}
function plain(html: string){return decode(html.replace(/<\/(p|div)>|<br\s*\/?\s*>/gi,'\n').replace(/<[^>]*>/g,'')).replace(/\n{3,}/g,'\n\n').trim();}
function latin(s: string){return s.replace(/[۰-۹]/g,x=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(x))).replace(/[٠-٩]/g,x=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(x)));}
export function parseFeed(xml: string) {
  const items=Array.from(xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi));
  return items.map(match=>{
    const item=match[1]; const title=tag(item,'title'); const duration=tag(item,'itunes:duration');
    const parts=duration.split(':').map(Number);const durationSeconds=parts.reduce((v,n)=>v*60+n,0);
    const url=tag(item,'link');const id=tag(item,'acast:episodeId')||url.split('/').pop()||tag(item,'guid');
    const publishedAt=new Date(tag(item,'pubDate')).toISOString();
    return {id,title,subtitle:plain(tag(item,'itunes:subtitle')),description:plain(tag(item,'description')),publishedAt,duration,durationSeconds,audioUrl:attr(item,'enclosure','url'),url,cover:attr(item,'itunes:image','href'),season:Number(tag(item,'itunes:season'))||1,episodeNumber:Number(latin(title).match(/^(\d+)/)?.[1])||Number(tag(item,'itunes:episode'))||0};
  }).filter(ep=>ep.id&&/^https:\/\//.test(ep.audioUrl)&&ep.title).sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt));
}
