export function escapeHtml(value:string){return value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));}
export function routeShell(html:string,title:string,path:string){
 if(!/<!--app:start-->[\s\S]*?<!--app:end-->/.test(html))throw new Error('قالب انتشار پیدا نشد؛ صفحه را تازه کن.');
 let result=html.replace(/<!--app:start-->[\s\S]*?<!--app:end-->/,'<!--app:start--><!--app:end-->');
 result=result.replace(/<title>[\s\S]*?<\/title>/,`<title>${escapeHtml(title)} | شیدرلیپ</title>`);
 result=result.replace(/<link rel="canonical"[^>]*>/g,'');
 return result.replace('</head>',`<link rel="canonical" href="https://shiderlip.ir${escapeHtml(path)}"/></head>`);
}
