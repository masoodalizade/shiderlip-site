import {Suspense} from 'react';
import {Catalog} from '@/components/experience';
export const metadata={title:'قسمت‌های پادکست'};
export default function PodcastPage(){return <Suspense fallback={<p className="loading-content">در حال بارگذاری قسمت‌ها…</p>}><Catalog kind="podcast"/></Suspense>;}
