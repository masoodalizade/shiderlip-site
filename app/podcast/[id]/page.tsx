import {notFound} from 'next/navigation';
import {EpisodeDetail} from '@/components/experience';
import {initialEpisodes,cleanTitle} from '@/lib/site-data';
import {FEED_URL,parseFeed} from '@/lib/rss';
type Props={params:Promise<{id:string}>};
async function getEpisode(id:string){const stored=initialEpisodes.find(ep=>ep.id===id);if(stored)return stored;try{const r=await fetch(FEED_URL,{signal:AbortSignal.timeout(10000)});if(!r.ok)return null;return parseFeed(await r.text()).find(ep=>ep.id===id)||null;}catch{return null;}}
export async function generateMetadata({params}:Props){const {id}=await params;const ep=await getEpisode(id);return {title:ep?cleanTitle(ep.title):'قسمت پیدا نشد',description:ep?.subtitle,openGraph:ep?{images:[ep.cover]}:undefined};}
export default async function EpisodePage({params}:Props){const {id}=await params;const ep=await getEpisode(id);if(!ep)notFound();return <EpisodeDetail episode={ep}/>;}
