import {createContext,useContext,useEffect,useMemo,useState,type ReactNode} from 'react';
type Location={pathname:string;search:string};
const Navigation=createContext<Location>({pathname:'/',search:''});
export function Router({children,initialPath='/'}:{children:ReactNode;initialPath?:string}){
 const [location,setLocation]=useState<Location>(()=>typeof window==='undefined'?{pathname:initialPath,search:''}:{pathname:window.location.pathname,search:window.location.search});
 useEffect(()=>{const update=()=>setLocation({pathname:window.location.pathname,search:window.location.search});window.addEventListener('popstate',update);return()=>window.removeEventListener('popstate',update);},[]);
 return <Navigation.Provider value={location}>{children}</Navigation.Provider>;
}
export function usePathname(){return useContext(Navigation).pathname.replace(/\/$/,'')||'/';}
export function useSearchParams(){const {search}=useContext(Navigation);return useMemo(()=>new URLSearchParams(search),[search]);}
export function navigate(href:string){
 if(!window.dispatchEvent(new Event('shiderlip:before-navigate',{cancelable:true})))return;
 const target=new URL(href,window.location.origin);
 if(target.origin!==window.location.origin){window.location.assign(target.href);return;}
 window.history.pushState({},'',target.pathname+target.search+target.hash);window.dispatchEvent(new PopStateEvent('popstate'));
 if(!target.hash)window.scrollTo({top:0,behavior:'instant'});
}
