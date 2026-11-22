const detailRenderWithCards=renderDetail;
const coordinates={
  'Las Vegas, USA':[36.1699,-115.1398],'Tokyo, Japan':[35.6762,139.6503],'Kobe, Japan':[34.6901,135.1956],
  'Bangkok, Thailand':[13.7563,100.5018],'Abu Dhabi, UAE':[24.4539,54.3773],'Ho Chi Minh City, Vietnam':[10.8231,106.6297],
  'Riyadh, Saudi Arabia':[24.7136,46.6753],'Doha, Qatar':[25.2854,51.5310],'Shanghai, China':[31.2304,121.4737],'Gliwice, Poland':[50.2945,18.6714],
  'Yokohama, Japan':[35.4437,139.6380],'Nagoya, Japan':[35.1815,136.9066],'Dallas, USA':[32.7767,-96.7970],'Toronto, Canada':[43.6532,-79.3832],
  'Seoul, Korea':[37.4980,126.8670],'Incheon, Korea':[37.4602,126.4407]
};
renderDetail=()=>{
  detailRenderWithCards();
  const target=document.querySelector('.world-map'),point=coordinates[active.city];
  if(!target||!point||!window.L)return;
  target.replaceChildren();
  const map=L.map(target,{zoomControl:false,attributionControl:true,scrollWheelZoom:false,dragging:false}).setView(point,4);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'© OpenStreetMap contributors'}).addTo(map);
  L.marker(point).addTo(map).bindTooltip(active.city,{permanent:true,direction:'top',offset:[0,-12]}).openTooltip();
  requestAnimationFrame(()=>map.invalidateSize());
};
renderDetail();
