import {FEED_URL,parseFeed} from '@/lib/rss';
import snapshot from '@/lib/data/podcast.json';
let cached: {expires:number; episodes:ReturnType<typeof parseFeed>} | null=null;
export async function GET(){
  try {
    if(cached&&cached.expires>Date.now())return Response.json({episodes:cached.episodes,live:true},{headers:{'Cache-Control':'public, max-age=900'}});
    const r=await fetch(FEED_URL,{headers:{Accept:'application/rss+xml, application/xml'},signal:AbortSignal.timeout(12000)});
    if(!r.ok)throw new Error('Feed unavailable');
    const episodes=parseFeed(await r.text());if(!episodes.length)throw new Error('Empty feed');
    cached={expires:Date.now()+30*60*1000,episodes};
    return Response.json({episodes,live:true},{headers:{'Cache-Control':'public, max-age=900'}});
  }catch(error){
    console.warn('Podcast feed refresh failed; serving the last verified snapshot.',error instanceof Error?error.message:String(error));
    return Response.json({episodes:snapshot.episodes,live:false},{headers:{'Cache-Control':'public, max-age=60'}});
  }
}
