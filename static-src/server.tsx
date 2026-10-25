import {renderToString} from 'react-dom/server';
import {App} from './site-app';
export function render(path:string){return renderToString(<App initialPath={path}/>);}
