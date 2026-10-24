import {Suspense} from 'react';
import {Catalog} from '@/components/experience';
export const metadata={title:'ابزارهای مدیریت و رهبری'};
export default function ToolsPage(){return <Suspense fallback={<p className="loading-content">در حال بارگذاری ابزارها…</p>}><Catalog kind="tools"/></Suspense>;}
