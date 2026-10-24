import {notFound} from 'next/navigation';
import {ToolDetail} from '@/components/experience';
import {tools} from '@/lib/site-data';
type Props={params:Promise<{id:string}>};
export async function generateMetadata({params}:Props){const {id}=await params;const tool=tools.find(t=>t.id.toLowerCase()===id.toLowerCase());return {title:tool?.title||'ابزار پیدا نشد',description:tool?.description};}
export default async function ProductPage({params}:Props){const {id}=await params;const tool=tools.find(t=>t.id.toLowerCase()===id.toLowerCase());if(!tool)notFound();return <ToolDetail tool={tool}/>;}
