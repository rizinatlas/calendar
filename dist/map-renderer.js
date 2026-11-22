const layoutLock=document.createElement('style');
layoutLock.textContent=`
  .workspace{grid-template-columns:minmax(640px,680px) minmax(0,1fr)!important}
  .detail-panel{grid-template-columns:395px minmax(0,1fr)!important;align-content:start!important}
  .event-info-panel h2{height:66px!important;overflow:hidden!important;display:-webkit-box!important;-webkit-box-orient:vertical!important;-webkit-line-clamp:2!important}
  .event-info-panel .detail-date{height:38px!important;overflow:hidden!important}
  .event-info-panel .info{height:94px!important;overflow:hidden!important}
  @media(max-width:1180px){.workspace{grid-template-columns:1fr!important}.detail-panel{grid-template-columns:395px minmax(0,1fr)!important}}
  @media(max-width:700px){.detail-panel{grid-template-columns:1fr!important}.event-info-panel h2{height:auto!important}.event-info-panel .detail-date,.event-info-panel .info{height:auto!important}}
`;
document.head.append(layoutLock);
const detailRenderWithCards=renderDetail;
const coordinates={
  'Las Vegas, USA':[36.1699,-115.1398],'Tokyo, Japan':[35.6762,139.6503],'Kobe, Japan':[34.6901,135.1956],
  'Bangkok, Thailand':[13.7563,100.5018],'Abu Dhabi, UAE':[24.4539,54.3773],'Ho Chi Minh City, Vietnam':[10.8231,106.6297],
  'Riyadh, Saudi Arabia':[24.7136,46.6753],'Doha, Qatar':[25.2854,51.5310],'Shanghai, China':[31.2304,121.4737],'Gliwice, Poland':[50.2945,18.6714],
  'Yokohama, Japan':[35.4437,139.6380],'Nagoya, Japan':[35.1815,136.9066],'Dallas, USA':[32.7767,-96.7970],'Toronto, Canada':[43.6532,-79.3832],
  'Seoul, Korea':[37.4980,126.8670],'Incheon, Korea':[37.4602,126.4407],'Newcastle, United Kingdom':[54.9783,-1.6178],
  'Bishkek, Kyrgyzstan':[42.8746,74.5698],'St. Petersburg, Russia':[59.9343,30.3351],'Krasnodar, Russia':[45.0355,38.9753],
  'Shymkent, Kazakhstan':[42.3417,69.5901]
};
renderDetail=()=>{
  detailRenderWithCards();
  const target=document.querySelector('.world-map');
  const normalized=String(active.city||'').toLowerCase();
  const matched=Object.entries(coordinates).find(([name])=>normalized.includes(name.split(',')[0].toLowerCase()));
  const countryFallback=normalized.includes('japan')?coordinates['Tokyo, Japan']:
    normalized.includes('korea')?coordinates['Seoul, Korea']:
    normalized.includes('thailand')?coordinates['Bangkok, Thailand']:
    normalized.includes('vietnam')?coordinates['Ho Chi Minh City, Vietnam']:
    normalized.includes('uae')?coordinates['Abu Dhabi, UAE']:
    normalized.includes('china')?coordinates['Shanghai, China']:null;
  const point=coordinates[active.city]||matched?.[1]||countryFallback;
  if(!target)return;
  if(!point||!window.L){
    target.replaceChildren();
    target.style.cssText='display:grid;place-items:center;background:#202826;color:#dce1df;border-color:#5a6560';
    const message=document.createElement('p');
    message.textContent='개최지 공식 확인 대기';
    message.style.cssText='margin:0;font-size:13px;font-weight:700';
    target.append(message);
    return;
  }
  target.style.cssText='';
  target.replaceChildren();
  const map=L.map(target,{zoomControl:false,attributionControl:true,scrollWheelZoom:false,dragging:false}).setView(point,4);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'© OpenStreetMap contributors'}).addTo(map);
  L.marker(point).addTo(map).bindTooltip(active.city,{permanent:true,direction:'top',offset:[0,-12]}).openTooltip();
  requestAnimationFrame(()=>map.invalidateSize());
};
renderDetail();
