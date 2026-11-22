const ORIGIN='https://gonkaku.jp';
const headers={'user-agent':'MMA Calendar schedule bot (+https://mmacalendar.pages.dev)','accept':'text/html,application/xhtml+xml'};
const clean=value=>String(value||'').replaceAll(/<[^>]*>/g,' ').replaceAll('&amp;','&').replaceAll(/\s+/g,' ').trim();
const promotionFor=title=>[
  [/KROSS\s*[×xX]?\s*OVER/i,'KROSS OVER',['japan','striking']],[/\bKrush\b/i,'Krush',['japan','striking']],[/\bRISE\b/i,'RISE',['japan','striking']],
  [/(?:プロ)?修斗|\bSHOOTO\b/i,'SHOOTO',['japan']],[/FIGHTING\s*NEXUS/i,'FIGHTING NEXUS',['japan']],[/STRIKE\s*NEXUS/i,'STRIKE NEXUS',['japan','striking']],
  [/SHOOT\s*BOXING/i,'SHOOT BOXING',['japan','striking']],[/\bHEAT\b/i,'HEAT',['japan']],[/KNOCK\s*OUT/i,'KNOCK OUT',['japan','striking']],
  [/\bK-?1\b/i,'K-1',['japan','striking']],[/BREAKING\s*DOWN/i,'BREAKING DOWN',['japan','striking']],[/\bDEEP\b/i,'DEEP',['japan']],
  [/\bGRACHAN\b/i,'GRACHAN',['japan']],[/\bPANCRASE\b/i,'PANCRASE',['japan','fightpass']]
].find(([pattern])=>pattern.test(title))||null;
function listingRecords(html){
  const seen=new Set(),records=[];
  for(const match of html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)){
    const label=clean(match[2]),dateMatch=label.match(/(20\d{2})年\s*(\d{1,2})月\s*(\d{1,2})日/),promotion=promotionFor(label);
    if(!dateMatch||!promotion)continue;
    const [,year,month,day]=dateMatch,date=`${year}-${month.padStart(2,'0')}-${day.padStart(2,'0')}`;
    const title=label.slice(0,dateMatch.index).replace(/^(?:MMA|キックボクシング|シュートボクシング|ストライキング)\s*/,'').trim();
    const id=`${promotion[1]}-${date}-${title}`.toLowerCase().replaceAll(/[^a-z0-9]+/g,'-');
    if(!seen.has(id)){seen.add(id);records.push({id,promotion:promotion[1],title,date,categories:promotion[2],venue:label.slice((dateMatch.index||0)+dateMatch[0].length).trim()||'공식 장소 확인 중',referenceUrl:new URL(match[1].replaceAll('&amp;','&'),ORIGIN).toString(),source:'GONG Kakutogi event calendar',fetchedAt:new Date().toISOString()})}
  }
  return records;
}
function months(){const list=[],base=new Date();base.setDate(1);for(let offset=-1;offset<4;offset++){const value=new Date(base.getFullYear(),base.getMonth()+offset,1);list.push([value.getFullYear(),value.getMonth()+1])}return list}
export const onRequestGet=async()=>{
  try{
    const pages=await Promise.all(months().map(async([year,month])=>{const response=await fetch(`${ORIGIN}/events?event%5Bmonth%5D=${month}&event%5Byear%5D=${year}`,{headers,cf:{cacheTtl:1800,cacheEverything:true}});return response.ok?listingRecords(await response.text()):[]}));
    return Response.json({schemaVersion:1,source:`${ORIGIN}/events`,events:[...new Map(pages.flat().map(event=>[event.id,event])).values()]},{headers:{'cache-control':'public, max-age=1800, stale-while-revalidate=7200'}});
  }catch{return Response.json({schemaVersion:1,source:`${ORIGIN}/events`,events:[],error:'reference-source-temporarily-unavailable'},{headers:{'cache-control':'public, max-age=60'}})};
};
