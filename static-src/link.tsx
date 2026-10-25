import {forwardRef,type AnchorHTMLAttributes} from 'react';
import {navigate} from './navigation';
type Props=AnchorHTMLAttributes<HTMLAnchorElement>&{href:string;prefetch?:boolean};
const Link=forwardRef<HTMLAnchorElement,Props>(function Link({href,onClick,prefetch,...props},ref){
 return <a {...props} href={href} ref={ref} onClick={event=>{
  onClick?.(event);if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||props.target||props.download||!href.startsWith('/')||href.startsWith('//'))return;
  event.preventDefault();navigate(href);
 }}/>;
});
export default Link;
