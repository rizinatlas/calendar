import {PROMOTION_SOURCES} from './sources.js';

export const onRequestGet=async({request,env})=>{
  const url=new URL(request.url);
  const promotion=url.searchParams.get('promotion');
  const source=promotion?PROMOTION_SOURCES.find(item=>item.id===promotion.toLowerCase()||item.name.toLowerCase()===promotion.toLowerCase()):null;
  if(promotion&&!source)return Response.json({error:'Unsupported promotion'},{status:404});
  return Response.json({
    schemaVersion:1,
    timezone:'Asia/Seoul',
    source:source||'all',
    message:'Official schedule-source adapter endpoint. Scheduled refresh writes only source-verified records.',
    fields:['id','promotion','startsAtKst','startsAtLocal','venue','coordinates','posterUrl','fightOrderImageUrl','fights[]']
  },{headers:{'cache-control':'public, max-age=300'}});
};
