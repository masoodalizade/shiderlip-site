import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import {readFile} from 'node:fs/promises';
export default defineConfig({
 plugins:[react(),{name:'shiderlip-pages-preview',configureServer(server){
  server.middlewares.use(async(req,res,next)=>{
   const pathname=(req.url||'/').split('?')[0];
   if(req.method!=='GET'||pathname.includes('.')||pathname.startsWith('/@')||pathname.startsWith('/node_modules/'))return next();
   try{const html=await server.transformIndexHtml(req.url||'/',await readFile(path.resolve('static-src/index.html'),'utf8'));res.statusCode=200;res.setHeader('Content-Type','text/html; charset=utf-8');res.end(html);}catch(error){next(error as Error);}
  });
 }}],
 resolve:{alias:[
  {find:'next/link',replacement:path.resolve('static-src/link.tsx')},
  {find:'next/navigation',replacement:path.resolve('static-src/navigation.tsx')},
  {find:'@',replacement:path.resolve('.')},
 ]},
 build:{outDir:'pages-dist',emptyOutDir:true,assetsDir:'assets/site',rollupOptions:{input:path.resolve('static-src/index.html')}},
 server:{host:'0.0.0.0',allowedHosts:['terminal.local']},
});
