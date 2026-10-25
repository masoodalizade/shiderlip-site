import {createRoot,hydrateRoot} from 'react-dom/client';
import {App} from './site-app';
import '../app/globals.css';
import './admin.css';
const root=document.getElementById('app')!;
if(root.childElementCount)hydrateRoot(root,<App/>);else createRoot(root).render(<App/>);
