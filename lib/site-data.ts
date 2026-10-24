import podcastSnapshot from './data/podcast.json';
import catalog from './data/tools.json';

export type Category = 'people' | 'money' | 'decisions' | 'execution';
export type Episode = {
  id: string; title: string; subtitle: string; description: string;
  publishedAt: string; duration: string; durationSeconds: number;
  audioUrl: string; url: string; cover: string; season: number;
  episodeNumber: number;
};
export type Tool = {
  id: string; title: string; category: Category; sourceCategory: string;
  problem: string; description: string; priceToman: number;
  availability: string; audience: string; prerequisites: string;
  plannedVoice: {topic: string; minutes: number};
  episodeNumbers: number[]; episodeReference: string;
  mainResource: {id?: string; title: string; url: string; author?: string; type?: string};
  additionalResources: {title: string; url: string}[];
  fileTypes: string[]; whenToUse: string; notFor: string; contents: string[];
  preview?: {columns: string[]; rows: string[][]};
};
export const initialEpisodes = podcastSnapshot.episodes as Episode[];
export const tools = catalog.products as unknown as Tool[];
export const FEED_URL = 'https://feeds.acast.com/public/shows/shiderlip';
export const categories: {id: Category; title: string; hint: string; short: string; numbers: number[]}[] = [
  {id:'people',title:'آدم‌ها و تیم',hint:'استخدام، عملکرد، گفت‌وگو',short:'آدم‌ها و تیم',numbers:[37,36,35,34,33,32,31,27,26,25,24,23,22]},
  {id:'money',title:'پول و فروش',hint:'نقدینگی، قیمت، مشتری',short:'پول و فروش',numbers:[3,13,12,6]},
  {id:'decisions',title:'تصمیم و مسیر',hint:'انتخاب، اولویت، ریسک',short:'تصمیم و مسیر',numbers:[16,15,14,13,12,11,10,9,8,7,6,5,4,2,1]},
  {id:'execution',title:'نظم و اجرای کارها',hint:'جلسه، پیگیری، تفویض',short:'نظم و اجرا',numbers:[30,29,28,27,26,25,24,23,22,21,20,19,18,17]},
];
export const fa = (n: number) => new Intl.NumberFormat('fa-IR').format(n);
export const money = (n: number) => fa(n) + ' تومان';
export const cleanTitle = (title: string) => title.replace(/^[۰-۹0-9]+\s*[:：]\s*/, '').trim();
export const normalize = (text: string) => text.toLowerCase().replace(/ي/g,'ی').replace(/ك/g,'ک').replace(/[\u200c\u200e\u200f]/g,' ').replace(/\s+/g,' ').trim();
export const categoryName = (id: string) => categories.find(c=>c.id===id)?.title || id;
export const relatedEpisodes = (tool: Tool, episodes: Episode[]) => {
  const direct = tool.episodeNumbers.map(n=>episodes.find(ep=>ep.episodeNumber===n)).filter((ep):ep is Episode=>!!ep);
  return direct.length ? direct : episodes.filter(ep=>categories.find(c=>c.id===tool.category)?.numbers.includes(ep.episodeNumber)).slice(0,2);
};
export function excerpt(ep: Episode) {
  if (ep.subtitle) return ep.subtitle;
  const lines=ep.description.split('\n').map(x=>x.trim()).filter(x=>x&&!/^(پادکست شیدرلیپ|اپیزود|در مورد|Hosted|درخواست|برای درخواست|instagram|https?:)/i.test(x));
  return lines.slice(1).join(' ').slice(0,220) || cleanTitle(ep.title);
}
export function episodeDate(iso: string) {
  return new Intl.DateTimeFormat('fa-IR',{year:'numeric',month:'long',day:'numeric',timeZone:'Asia/Tehran'}).format(new Date(iso));
}
