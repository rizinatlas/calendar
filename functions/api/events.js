const OFFICIAL_SOURCES={
  UFC:{url:'https://www.ufc.com/events',type:'official-html'},
  PFL:{url:'https://pflmma.com/',type:'official-html'},
  RIZIN:{url:'https://www.rizinff.com/en/',type:'official-html'},
  ONE:{url:'https://www.onefc.com/events/',type:'official-html'},
  KSW:{url:'https://www.kswmma.com/en/',type:'official-html'},
  ACA:{url:'https://aca-mma.com/',type:'official-html'}
};

export const onRequestGet=async({request,env})=>{
  const url=new URL(request.url);
  const promotion=url.searchParams.get('promotion');
  const source=promotion?OFFICIAL_SOURCES[promotion.toUpperCase()]:null;
  if(promotion&&!source)return Response.json({error:'Unsupported promotion'},{status:404});
  return Response.json({
    schemaVersion:1,
    timezone:'Asia/Seoul',
    source:source||'all',
    message:'Official-source adapter endpoint. Connect D1/KV and scheduled refresh before production use.',
    fields:['id','promotion','startsAtKst','startsAtLocal','venue','coordinates','posterUrl','fightOrderImageUrl','fights[]']
  },{headers:{'cache-control':'public, max-age=300'}});
};
