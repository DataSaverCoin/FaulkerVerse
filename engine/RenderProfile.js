/* Select before creating WebGL resources, including on iPads using desktop UA. */
const query=new URLSearchParams(globalThis.location?.search||'');
const nav=globalThis.navigator||{};
const appleMobile=/iPhone|iPad|iPod/.test(nav.userAgent||'')||(/Mac/.test(nav.platform||'')&&nav.maxTouchPoints>1);
const lite=query.get('quality')==='lite'||(appleMobile&&query.get('quality')!=='full');
export const RenderProfile=Object.freeze({lite,traffic:lite?120:650,pedestrians:lite?350:460,landmarkTexture:lite?256:1024});
export const yieldForBrowser=()=>new Promise(resolve=>setTimeout(resolve,0));
