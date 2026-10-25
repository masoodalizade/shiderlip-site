import {z} from 'zod';

export const FEED_URL = 'https://feeds.acast.com/public/shows/shiderlip';
export const safeLink = (value:string) => value==='' || /^\/(?!\/)[A-Za-z0-9_./%-]+$/.test(value) || /^https:\/\/[^\s<>"']+$/i.test(value);
const link=z.string().max(3000).refine(safeLink,'نشانی باید با https:// یا مسیر داخلی / شروع شود.');
const text=z.string().max(50000);
const short=z.string().max(1000);
export const settingsSchema=z.object({
  version:z.literal(1),siteName:short.min(1),tagline:short,heroTitle:short.min(1),heroDescription:text,audience:short,
  toolsTitle:short,toolsDescription:text,podcastTitle:short,podcastDescription:text,aboutTitle:short,aboutText:text,
  instagramUrl:link,contactUrl:link,logoUrl:link,coverUrl:link,seoDescription:short,
}).passthrough();
const resource=z.object({title:short,url:link}).passthrough();
export const toolSchema=z.object({
  id:z.string().regex(/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/,'شناسه فقط شامل حروف انگلیسی، عدد، خط تیره و زیرخط باشد.'),
  title:short.min(1),category:z.enum(['people','money','decisions','execution']),sourceCategory:short,
  problem:short,description:text,priceToman:z.number().int().min(0).max(1000000000),
  availability:z.enum(['preparing','free']),hidden:z.boolean().optional(),audience:short,prerequisites:text,
  plannedVoice:z.object({topic:text,minutes:z.number().min(0).max(600)}).passthrough(),
  episodeNumbers:z.array(z.number().int().min(0)),episodeReference:short,
  mainResource:resource,additionalResources:z.array(resource),fileTypes:z.array(short),whenToUse:text,notFor:text,
  contents:z.array(short),downloadUrl:link.optional(),voiceUrl:link.optional(),cover:link.optional(),
  preview:z.object({columns:z.array(short).max(15),rows:z.array(z.array(short).max(15)).max(100)}).optional(),
}).passthrough().superRefine((tool,ctx)=>{
  if(tool.availability==='free'&&!tool.downloadUrl)ctx.addIssue({code:'custom',path:['downloadUrl'],message:'برای انتشار ابزار رایگان، لینک فایل را وارد کن.'});
});
export const catalogSchema=z.object({products:z.array(toolSchema).max(2000)}).passthrough().superRefine((catalog,ctx)=>{
  const ids=catalog.products.map(t=>t.id.toLowerCase());
  if(new Set(ids).size!==ids.length)ctx.addIssue({code:'custom',path:['products'],message:'شناسهٔ ابزارها باید یکتا باشد.'});
});
export const episodeSchema=z.object({
  id:z.string().regex(/^[A-Za-z0-9][A-Za-z0-9_-]{0,119}$/),title:short.min(1),subtitle:text,description:text,
  publishedAt:z.string().refine(v=>Number.isFinite(Date.parse(v))),duration:short,durationSeconds:z.number().min(0),
  audioUrl:link.refine(v=>v.startsWith('https://')),url:link,cover:link,season:z.number().int().min(1),episodeNumber:z.number().int().min(0),
}).passthrough();
export const podcastSchema=z.object({episodes:z.array(episodeSchema).min(1).max(10000),fetchedAt:z.string().optional()}).passthrough();
const overrideSchema=z.object({title:short.min(1).optional(),subtitle:text.optional(),description:text.optional(),cover:link.optional(),hidden:z.boolean().optional()}).strict();
export const editorialSchema=z.object({version:z.literal(1),episodes:z.record(overrideSchema)});
export type SiteSettings=z.infer<typeof settingsSchema>;
export type Editorial=z.infer<typeof editorialSchema>;
export type CatalogData=z.infer<typeof catalogSchema>;
export type PodcastData=z.infer<typeof podcastSchema>;
export type ContentBundle={settings:SiteSettings;catalog:CatalogData;podcast:PodcastData;editorial:Editorial};
export const CONTENT_PATHS=['content/settings.json','content/tools.json','content/podcast.json','content/editorial.json'] as const;
export function parseBundle(values:unknown[]):ContentBundle{
  return {settings:settingsSchema.parse(values[0]),catalog:catalogSchema.parse(values[1]),podcast:podcastSchema.parse(values[2]),editorial:editorialSchema.parse(values[3])};
}
export function errorMessage(error:unknown):string{
  if(error instanceof z.ZodError)return error.issues.slice(0,4).map(i=>`${i.path.join('.')}: ${i.message}`).join(' · ');
  return error instanceof Error?error.message:'عملیات انجام نشد؛ دوباره امتحان کن.';
}
