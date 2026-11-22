import {PROMOTION_SOURCES} from './sources.js';

const UFC_EVENTS_URL='https://www.ufc.com/events#events-list-upcoming';
const UFC_ORIGIN='https://www.ufc.com';
const ROAD_TICKETS_URL='https://roadfc.com/main/ticket/ticket.php';
const RIZIN_EVENTS_URL='https://jp.rizinff.com/_tags/%E5%A4%A7%E4%BC%9A%E6%83%85%E5%A0%B1';
const RIZIN_ORIGIN='https://jp.rizinff.com';
const UFC_POSTER_PRODUCTS={
  'ufc-335':'https://ufccollectibles.com/es/products/ufc-335-oliveira-vs-lopes-autographed-event-poster?variant=67684020289784',
  'ufc-fight-night-december-05-2026':'https://ufccollectibles.com/products/ufc-fight-night-adesanya-vs-magomedov-autographed-event-poster'
};
const requestHeaders={'user-agent':'MMA Calendar schedule bot (+https://mmacalendar.pages.dev)','accept':'text/html,application/xhtml+xml'};
const unique=items=>[...new Set(items)];

function eventUrls(html){
  return unique([...html.matchAll(/href=["']([^"']*\/event\/[^"'#?]+)["']/gi)]
    .map(match=>new URL(match[1].replaceAll('&amp;','&'),UFC_ORIGIN).toString())
    .filter(url=>url.startsWith(`${UFC_ORIGIN}/event/`)));
}

function field(html,pattern){return html.match(pattern)?.[1]?.trim()||null}
function plainText(value=''){return value.replaceAll(/<[^>]*>/g,' ').replaceAll(/&nbsp;/g,' ').replaceAll(/&#x([0-9a-f]+);/gi,(_,code)=>String.fromCodePoint(parseInt(code,16))).replaceAll(/&#(\d+);/g,(_,code)=>String.fromCodePoint(Number(code))).replaceAll(/&amp;/g,'&').replaceAll(/&quot;/g,'\"').replaceAll(/\s+/g,' ').trim()}
function metaContent(html,name){
  for(const tag of html.matchAll(/<meta\b[^>]*>/gi)){
    const value=tag[0];
    if(new RegExp(`(?:property|name)=["']${name}["']`,'i').test(value))return field(value,/content=["']([^"']+)["']/i);
  }
  return null;
}
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

async function officialUfcPoster(event){
  const slug=event.officialUrl.split('/').pop();
  const sourceUrl=UFC_POSTER_PRODUCTS[slug];
  if(!sourceUrl)return event;
  try{
    const response=await fetch(sourceUrl,{headers:requestHeaders,cf:{cacheTtl:3600,cacheEverything:true}});
    const posterUrl=response.ok?field(await response.text(),/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)/i):null;
    return posterUrl?{...event,posterUrl:posterUrl.replace(/^http:/,'https:'),posterType:'event-poster',posterSourceUrl:sourceUrl}:event;
  }catch{return event}
}

async function fetchUfcSchedule(){
  const response=await fetch(UFC_EVENTS_URL,{headers:requestHeaders,cf:{cacheTtl:900,cacheEverything:true}});
  if(!response.ok)throw new Error(`UFC Events returned ${response.status}`);
  const urls=eventUrls(await response.text()).slice(0,18);
  const records=await Promise.all(urls.map(async officialUrl=>{
    try{const eventResponse=await fetch(officialUrl,{headers:requestHeaders,cf:{cacheTtl:900,cacheEverything:true}});return eventResponse.ok?parseUfcEvent(await eventResponse.text(),officialUrl):null}catch{return null}
  }));
  return Promise.all(records.filter(Boolean).map(officialUfcPoster));
}

function pancraseRecords(html){
  const text=html.replaceAll(/<[^>]*>/g,' ').replaceAll(/\s+/g,' ');
  const pattern=/PANCRASE\s*(BLOOD\.\s*\d+|\d{3})\s*(\d{1,2})月(\d{1,2})日/g;
  const records=[];
  for(const match of text.matchAll(pattern)){
    const number=match[1].replaceAll(/\s+/g,'');
    const date=`2026-${match[2].padStart(2,'0')}-${match[3].padStart(2,'0')}`;
    const slug=number.startsWith('BLOOD')?number.toLowerCase().replace('.',''):number.toLowerCase();
    records.push({id:`pancrase-${slug}`,promotion:'PANCRASE',title:`PANCRASE ${number}`,date,officialUrl:`https://www.pancrase.co.jp/tour/2026/pancrase${slug}/index.html`,posterStatus:'official-page-pending-verification',source:'PANCRASE 2026 schedule',fetchedAt:new Date().toISOString()});
  }
  return records;
}

async function fetchPancraseSchedule(){
  const response=await fetch('https://www.pancrase.co.jp/rls/2026/schedule.html',{headers:requestHeaders,cf:{cacheTtl:1800,cacheEverything:true}});
  if(!response.ok)throw new Error(`PANCRASE schedule returned ${response.status}`);
  return pancraseRecords(await response.text());
}

function roadFcRecords(html){
  const records=[];
  const pattern=/class='bslush[^']*'><div class='tk_img'><img src='([^']+)'[\s\S]*?tk_tit'>(GOOBNE\s+ROAD\s+FC\s+(\d+))<\/div>[\s\S]{0,700}?(\d{4})-(\d{2})-(\d{2})/gi;
  for(const match of html.matchAll(pattern)){
    const [,imagePath,title,number,year,month,day]=match;
    const date=`${year}-${month}-${day}`,posterUrl=new URL(imagePath,'https://roadfc.com').toString();
    records.push({id:`road-fc-${number}`,promotion:'ROAD FC',title,number,date,city:'Seoul, Korea',venue:'장충체육관',officialUrl:ROAD_TICKETS_URL,instagramUrl:'https://www.instagram.com/roadfc/',posterUrl,posterType:'event-poster',posterSourceUrl:ROAD_TICKETS_URL,source:'ROAD FC ticket page',fetchedAt:new Date().toISOString()});
  }
  return records;
}

async function fetchRoadSchedule(){
  const response=await fetch(ROAD_TICKETS_URL,{headers:requestHeaders,cf:{cacheTtl:900,cacheEverything:true}});
  if(!response.ok)throw new Error(`ROAD FC tickets returned ${response.status}`);
  return roadFcRecords(await response.text());
}

function rizinListingRecords(html){
  const records=[],seen=new Set();
  for(const match of html.matchAll(/<a\b[^>]*href=["']([^"']*\/_ct\/\d+[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi)){
    const officialUrl=new URL(match[1].replaceAll('&amp;','&'),RIZIN_ORIGIN).toString();
    const label=plainText(match[2]);
    const dateMatch=label.match(/(20\d{2})年\s*(\d{1,2})月\s*(\d{1,2})日\s*(.+)/);
    if(!dateMatch||seen.has(officialUrl))continue;
    const [,year,month,day,title]=dateMatch;
    seen.add(officialUrl);
    records.push({id:`rizin-${officialUrl.match(/_ct\/(\d+)/)?.[1]}`,promotion:'RIZIN',title:plainText(title),date:`${year}-${month.padStart(2,'0')}-${day.padStart(2,'0')}`,officialUrl});
  }
  return records;
}

function rizinDetails(html,event){
  const text=plainText(html);
  const start=text.match(/(\d{1,2})[：:](\d{2})\s*開始/);
  const venue=text.match(/(?:会場|開催場所)\s*([^\s][\s\S]{0,100}?)(?=(?:アクセス|主催|制作協力|対戦カード|チケット|配信情報|FOR FANS|$))/);
  const heading=plainText(field(html,/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)||'').replace(/^[『「]|[』」]$/g,'').replace(/大会概要|チケット|[／/]/g,' ').replaceAll(/\s+/g,' ').trim();
  const posterUrl=metaContent(html,'og:image');
  return {...event,title:heading||event.title,venue:venue?plainText(venue[1]):null,startsAtLocal:start?`${start[1].padStart(2,'0')}:${start[2]}`:null,posterUrl:posterUrl?.replace(/^http:/,'https:')||null,posterType:posterUrl?'event-poster':null,posterSourceUrl:posterUrl?event.officialUrl:null,posterStatus:posterUrl?'official-event-page':'official-poster-not-published',source:'RIZIN official event page',fetchedAt:new Date().toISOString()};
}

async function fetchRizinSchedule(){
  const response=await fetch(RIZIN_EVENTS_URL,{headers:requestHeaders,cf:{cacheTtl:900,cacheEverything:true}});
  if(!response.ok)throw new Error(`RIZIN event list returned ${response.status}`);
  const listed=rizinListingRecords(await response.text()).filter(event=>event.date>='2026-01-01').slice(0,24);
  const records=await Promise.all(listed.map(async event=>{
    try{
      const detail=await fetch(event.officialUrl,{headers:requestHeaders,cf:{cacheTtl:900,cacheEverything:true}});
      return detail.ok?rizinDetails(await detail.text(),event):event;
    }catch{return event}
  }));
  return records;
}

export const onRequestGet=async({request})=>{
  const url=new URL(request.url);
  const promotion=(url.searchParams.get('promotion')||'').toLowerCase();
  if(promotion==='pancrase'){
    try{return Response.json({schemaVersion:2,timezone:'Asia/Seoul',promotion:'PANCRASE',source:'https://www.pancrase.co.jp/rls/2026/schedule.html',events:await fetchPancraseSchedule()},{headers:{'cache-control':'public, max-age=1800, stale-while-revalidate=7200'}})}
    catch{return Response.json({schemaVersion:2,timezone:'Asia/Seoul',promotion:'PANCRASE',events:[],error:'official-source-temporarily-unavailable'},{headers:{'cache-control':'public, max-age=60'}})};
  }
  if(promotion==='road-fc'){
    try{return Response.json({schemaVersion:2,timezone:'Asia/Seoul',promotion:'ROAD FC',source:ROAD_TICKETS_URL,events:await fetchRoadSchedule()},{headers:{'cache-control':'public, max-age=900, stale-while-revalidate=3600'}})}
    catch{return Response.json({schemaVersion:2,timezone:'Asia/Seoul',promotion:'ROAD FC',events:[],error:'official-source-temporarily-unavailable'},{headers:{'cache-control':'public, max-age=60'}})};
  }
  if(promotion==='rizin'){
    try{return Response.json({schemaVersion:2,timezone:'Asia/Tokyo',promotion:'RIZIN',source:RIZIN_EVENTS_URL,events:await fetchRizinSchedule()},{headers:{'cache-control':'public, max-age=900, stale-while-revalidate=3600'}})}
    catch{return Response.json({schemaVersion:2,timezone:'Asia/Tokyo',promotion:'RIZIN',source:RIZIN_EVENTS_URL,events:[],error:'official-source-temporarily-unavailable'},{headers:{'cache-control':'public, max-age=60'}})};
  }
  if(promotion&&promotion!=='ufc'){
    const source=PROMOTION_SOURCES.find(item=>item.id===promotion||item.name.toLowerCase()===promotion);
    if(!source)return Response.json({error:'Unsupported promotion'},{status:404});
    return Response.json({schemaVersion:2,timezone:'Asia/Seoul',promotion:source.name,events:[],status:'adapter-not-yet-enabled'},{headers:{'cache-control':'public, max-age=300'}});
  }
  try{return Response.json({schemaVersion:2,timezone:'Asia/Seoul',promotion:'UFC',source:UFC_EVENTS_URL,events:await fetchUfcSchedule()},{headers:{'cache-control':'public, max-age=900, stale-while-revalidate=3600'}})}
  catch{return Response.json({schemaVersion:2,timezone:'Asia/Seoul',promotion:'UFC',source:UFC_EVENTS_URL,events:[],error:'official-source-temporarily-unavailable'},{headers:{'cache-control':'public, max-age=60'}})};
};
