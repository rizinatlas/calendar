import {PROMOTION_SOURCES} from './sources.js';

const UFC_EVENTS_URL='https://www.ufc.com/events#events-list-upcoming';
const UFC_ORIGIN='https://www.ufc.com';
const requestHeaders={'user-agent':'MMA Calendar schedule bot (+https://mmacalendar.pages.dev)','accept':'text/html,application/xhtml+xml'};
const unique=items=>[...new Set(items)];

function eventUrls(html){
  return unique([...html.matchAll(/href=["']([^"']*\/event\/[^"'#?]+)["']/gi)]
    .map(match=>new URL(match[1].replaceAll('&amp;','&'),UFC_ORIGIN).toString())
    .filter(url=>url.startsWith(`${UFC_ORIGIN}/event/`)));
}

function field(html,pattern){return html.match(pattern)?.[1]?.trim()||null}
function parseUfcEvent(html,officialUrl){
  const title=field(html,/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)/i)||field(html,/<title[^>]*>\s*([^<|]+)/i);
  if(!title)return null;
  return {
    id:`ufc-${officialUrl.split('/').pop()}`,
    promotion:'UFC',
    title:title.replace(/^UFC\s*/i,'UFC ').trim(),
    officialUrl,
    startsAt:field(html,/"startDate"\s*:\s*"([^"]+)/i)||field(html,/<time[^>]+datetime=["']([^"']+)/i),
    venue:field(html,/"location"\s*:\s*\{[^}]*"name"\s*:\s*"([^"]+)/i),
    city:field(html,/"addressLocality"\s*:\s*"([^"]+)/i),
    posterCandidateUrl:field(html,/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)/i),
    posterStatus:'unverified',
    source:'UFC Events',
    fetchedAt:new Date().toISOString()
  };
}

async function fetchUfcSchedule(){
  const response=await fetch(UFC_EVENTS_URL,{headers:requestHeaders,cf:{cacheTtl:900,cacheEverything:true}});
  if(!response.ok)throw new Error(`UFC Events returned ${response.status}`);
  const urls=eventUrls(await response.text()).slice(0,18);
  const records=await Promise.all(urls.map(async officialUrl=>{
    try{const eventResponse=await fetch(officialUrl,{headers:requestHeaders,cf:{cacheTtl:900,cacheEverything:true}});return eventResponse.ok?parseUfcEvent(await eventResponse.text(),officialUrl):null}catch{return null}
  }));
  return records.filter(Boolean);
}

export const onRequestGet=async({request})=>{
  const url=new URL(request.url);
  const promotion=(url.searchParams.get('promotion')||'').toLowerCase();
  if(promotion&&promotion!=='ufc'){
    const source=PROMOTION_SOURCES.find(item=>item.id===promotion||item.name.toLowerCase()===promotion);
    if(!source)return Response.json({error:'Unsupported promotion'},{status:404});
    return Response.json({schemaVersion:2,timezone:'Asia/Seoul',promotion:source.name,events:[],status:'adapter-not-yet-enabled'},{headers:{'cache-control':'public, max-age=300'}});
  }
  try{return Response.json({schemaVersion:2,timezone:'Asia/Seoul',promotion:'UFC',source:UFC_EVENTS_URL,events:await fetchUfcSchedule()},{headers:{'cache-control':'public, max-age=900, stale-while-revalidate=3600'}})}
  catch{return Response.json({schemaVersion:2,timezone:'Asia/Seoul',promotion:'UFC',source:UFC_EVENTS_URL,events:[],error:'official-source-temporarily-unavailable'},{headers:{'cache-control':'public, max-age=60'}})};
};
