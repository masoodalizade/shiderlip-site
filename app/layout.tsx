import type {Metadata} from 'next';
import {SiteProvider} from '@/components/site-provider';
import './globals.css';
export const metadata:Metadata={metadataBase:new URL('https://shiderlip.oakenhill35.chatgpt.site'),title:{default:'شیدرلیپ | جعبه‌ابزار روزمرهٔ مدیر',template:'%s | شیدرلیپ'},description:'پادکست و ابزارهای کاربردی مدیریت و رهبری برای کسب‌وکارهای کوچک و متوسط. مسئله‌ات را پیدا کن، بشنو و قدم بعدی را بردار.',icons:{icon:'/media/logo.png',apple:'/media/logo.png'},openGraph:{locale:'fa_IR',siteName:'شیدرلیپ',type:'website',images:[{url:'/media/podcast-cover.jpeg'}]}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="fa" dir="rtl"><body><a className="skip-link" href="#main-content">رفتن به محتوای اصلی</a><SiteProvider><div id="main-content">{children}</div></SiteProvider></body></html>;}
