import {PROMOTION_SOURCES} from './sources.js';

const UFC_EVENTS_URL='https://www.ufc.com/events#events-list-upcoming';
const UFC_ORIGIN='https://www.ufc.com';
const ROAD_TICKETS_URL='https://roadfc.com/main/ticket/ticket.php';
const ROAD_HOME_URL='https://m.roadfc.co.kr/main/index.php';
const BLACK_EVENTS_URL='https://www.blackcombat-official.com/event.php';
const DEEP_POSTS_URL='https://www.deep2001.com/wp-json/wp/v2/posts?after=2026-01-01T00:00:00&before=2028-01-01T00:00:00&per_page=100&_embed=1';
const ONE_EVENTS_URL='https://www.onefc.com/events/';
const ZFN_EVENTS_URL='https://zfnofficial.com/84';
const RIZIN_EVENTS_URL='https://jp.rizinff.com/_tags/%E5%A4%A7%E4%BC%9A%E6%83%85%E5%A0%B1';
const RIZIN_ORIGIN='https://jp.rizinff.com';
const UFC_POSTER_PRODUCTS={
  'ufc-335':'https://ufccollectibles.com/es/products/ufc-335-oliveira-vs-lopes-autographed-event-poster?variant=67684020289784',
  'ufc-fight-night-december-05-2026':'https://ufccollectibles.com/products/ufc-fight-night-adesanya-vs-magomedov-autographed-event-poster'
};
const requestHeaders={'user-agent':'MMA Calendar schedule bot (+https://mmacalendar.pages.dev)','accept':'text/html,application/xhtml+xml'};
const unique=items=>[...new Set(items)];

function eventUrls(html){
  return unique([...html.matchAll(/href=["']([^"']*(?:\/event\/|\/index(?:%2e|\.)php\/event\/)[^"'#?]+)["']/gi)]
    .map(match=>new URL(match[1].replaceAll('&amp;','&').replace('/index%2ephp/event/','/event/').replace('/index.php/event/','/event/'),UFC_ORIGIN).toString())
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
  const description=field(html,/<meta[^>]+(?:name|property)=["'](?:description|og:description)["'][^>]+content=["']([^"']+)/i)||'';
  const dateText=description.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s*(2026)/i);
  const monthIndex={january:1,february:2,march:3,april:4,may:5,june:6,july:7,august:8,september:9,october:10,november:11,december:12};
  const fallbackStart=dateText?`2026-${String(monthIndex[dateText[1].toLowerCase()]).padStart(2,'0')}-${dateText[2].padStart(2,'0')}T12:00:00Z`:null;
  return {
    id:`ufc-${officialUrl.split('/').pop()}`,
    promotion:'UFC',
    title:title.replace(/^UFC\s*/i,'UFC ').trim(),
    officialUrl,
    startsAt:field(html,/"startDate"\s*:\s*"([^"]+)/i)||field(html,/<time[^>]+datetime=["']([^"']+)/i)||fallbackStart,
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
  const pages=await Promise.all([0,1,2,3,4].map(async page=>{
    const response=await fetch(`${UFC_EVENTS_URL}${page?`?page=${page}`:''}`,{headers:requestHeaders,cf:{cacheTtl:900,cacheEverything:true}});
    if(!response.ok)throw new Error(`UFC Events returned ${response.status}`);
    return eventUrls(await response.text());
  }));
  const urls=unique(pages.flat()).slice(0,60);
  const records=await Promise.all(urls.map(async officialUrl=>{
    try{const eventResponse=await fetch(officialUrl,{headers:requestHeaders,cf:{cacheTtl:900,cacheEverything:true}});return eventResponse.ok?parseUfcEvent(await eventResponse.text(),officialUrl):null}catch{return null}
  }));
  return Promise.all(records.filter(event=>event&&event.startsAt?.startsWith('2026-')).map(officialUfcPoster));
}

function pancraseRecords(html,year){
  const text=html.replaceAll(/<[^>]*>/g,' ').replaceAll(/\s+/g,' ');
  const pattern=/PANCRASE\s*(BLOOD\.\s*\d+|\d{3})\s*(\d{1,2})月(\d{1,2})日/g;
  const records=[];
  for(const match of text.matchAll(pattern)){
    const number=match[1].replaceAll(/\s+/g,'');
    const date=`${year}-${match[2].padStart(2,'0')}-${match[3].padStart(2,'0')}`;
    const slug=number.startsWith('BLOOD')?number.toLowerCase().replace('.',''):number.toLowerCase();
    records.push({id:`pancrase-${year}-${slug}`,promotion:'PANCRASE',title:`PANCRASE ${number}`,date,officialUrl:`https://www.pancrase.co.jp/rls/${year}/schedule.html`,posterStatus:'official-page-pending-verification',source:`PANCRASE ${year} schedule`,fetchedAt:new Date().toISOString()});
  }
  return records;
}

async function fetchPancraseSchedule(){
  const years=[2026,2027];
  const responses=await Promise.all(years.map(async year=>{try{const response=await fetch(`https://www.pancrase.co.jp/rls/${year}/schedule.html`,{headers:requestHeaders,cf:{cacheTtl:1800,cacheEverything:true}});return response.ok?pancraseRecords(await response.text(),year):[]}catch{return []}}));
  const records=responses.flat();
  if(!records.length)throw new Error('PANCRASE schedules unavailable');
  return [...new Map(records.map(record=>[record.id,record])).values()];
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

function roadFcAnnouncementRecords(html){
  const records=[];
  const text=plainText(html);
  const pattern=/(?:GOOBNE|굽네)\s+ROAD\s*FC\s*(\d+)\s*\/?\s*(20\d{2})년\s*(\d{1,2})월\s*(\d{1,2})일/gi;
  for(const match of text.matchAll(pattern)){
    const [,number,year,month,day]=match;
    const listedVenue=text.slice(match.index,match.index+180).match(/서울\s*장충체육관|SEOUL\s+JANGCHUNG\s+ARENA/i)?.[0];
    const venue=/SEOUL/i.test(listedVenue||'')?'장충체육관':listedVenue?.replaceAll(/\s+/g,' ').trim()||'공식 장소 확인 중';
    records.push({id:`road-fc-${number}`,promotion:'ROAD FC',title:`굽네 ROAD FC ${number}`,number,date:`${year}-${month.padStart(2,'0')}-${day.padStart(2,'0')}`,city:'Seoul, Korea',venue,officialUrl:ROAD_HOME_URL,instagramUrl:'https://www.instagram.com/roadfc/',source:'ROAD FC official homepage announcement',fetchedAt:new Date().toISOString()});
  }
  return [...new Map(records.map(record=>[record.id,record])).values()];
}

async function fetchRoadSchedule(){
  const [tickets,homepage]=await Promise.all([
    fetch(ROAD_TICKETS_URL,{headers:requestHeaders,cf:{cacheTtl:900,cacheEverything:true}}),
    fetch(ROAD_HOME_URL,{headers:requestHeaders,cf:{cacheTtl:900,cacheEverything:true}})
  ]);
  if(!tickets.ok&&!homepage.ok)throw new Error('ROAD FC official sources unavailable');
  const ticketRecords=tickets.ok?roadFcRecords(await tickets.text()):[];
  const announcementRecords=homepage.ok?roadFcAnnouncementRecords(await homepage.text()):[];
  return [...new Map([...ticketRecords,...announcementRecords].map(record=>[record.id,record])).values()];
}
function blackCombatRecords(html){const records=[];for(const match of html.matchAll(/([\s\S]{0,1800}?)eventSeq=(\d+)/g)){const context=match[1],date=[...context.matchAll(/(2026)년\s*(\d{1,2})월\s*(\d{1,2})일/g)].pop();if(!date)continue;const [,year,month,day]=date;records.push({id:`black-combat-${match[2]}`,promotion:'BLACK COMBAT',date:`${year}-${month.padStart(2,'0')}-${day.padStart(2,'0')}`,officialUrl:`https://www.blackcombat-official.com/eventDetail.php?eventSeq=${match[2]}`,source:'BLACK COMBAT official event archive',fetchedAt:new Date().toISOString()})}return [...new Map(records.map(item=>[item.id,item])).values()]}
function blackCombatDetails(html,event){const title=plainText(field(html,/<title[^>]*>\s*([^<|]+)/i)||'').replaceAll('BLACK COMBAT','').trim();const seq=event.id.split('-').pop();const poster=field(html,/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)/i)||`https://www.blackcombat-official.com/theme/blackcombat/img/event/${seq}/2.jpg`;return {...event,title:title||`BLACK COMBAT ${seq}`,city:'Seoul, Korea',venue:plainText(html.match(/(?:장소|장소 안내)\s*[:：]?\s*([^<\n]{2,80})/i)?.[1]||'공식 장소 확인 중'),posterUrl:poster.replace(/^\//,'https://www.blackcombat-official.com/'),posterType:'event-poster',posterSourceUrl:event.officialUrl}}
async function fetchBlackCombatSchedule(){const response=await fetch(BLACK_EVENTS_URL,{headers:requestHeaders,cf:{cacheTtl:900,cacheEverything:true}});if(!response.ok)throw new Error(`BLACK COMBAT events returned ${response.status}`);const events=blackCombatRecords(await response.text());return Promise.all(events.map(async event=>{try{const detail=await fetch(event.officialUrl,{headers:requestHeaders,cf:{cacheTtl:900,cacheEverything:true}});return detail.ok?blackCombatDetails(await detail.text(),event):event}catch{return event}}))}
function deepRecords(posts){const records=[],posterByEvent=new Map();const canonical=/^(?:DEEP \d+ IMPACT|DEEP (?:TOKYO|OSAKA|NAGOYA|HAMAMATSU) IMPACT 20\d{2} (?:\d+(?:st|nd|rd|th) ROUND|(?:FIRST|SECOND|THIRD) STAGE)|DEEP FIGHT CHALLENGE 20\d{2} \d+(?:st|nd|rd|th) ROUND|DEEP JEWELS \d+)$/i;for(const post of posts){const title=plainText(post.title?.rendered||'');if(!/ポスター画像/.test(title))continue;const eventTitle=title.replace(/^.*?Presents\s*/i,'').replace(/のポスター画像.*$/,'');const image=field(post.content?.rendered||'',/<img\b[^>]*\bsrc=["']([^"']+)/i);if(canonical.test(eventTitle)&&image)posterByEvent.set(eventTitle,image.replace(/^http:/,'https:'))}for(const post of posts){const title=plainText(post.title?.rendered||'');const content=plainText(post.content?.rendered||'');if(!canonical.test(title))continue;const date=content.match(/(20\d{2})年\s*(\d{1,2})月\s*(\d{1,2})日/);if(!date)continue;const eventDate=`${date[1]}-${date[2].padStart(2,'0')}-${date[3].padStart(2,'0')}`,posterUrl=posterByEvent.get(title)||null;const city=title.includes('OSAKA')||content.includes('大阪')?'Osaka, Japan':title.includes('NAGOYA')||content.includes('名古屋')?'Nagoya, Japan':'Tokyo, Japan';records.push({id:`deep-${post.id}`,promotion:title.includes('JEWELS')?'DEEP JEWELS':'DEEP',title,date:eventDate,city,officialUrl:post.link,posterUrl,posterType:posterUrl?'event-poster':null,posterSourceUrl:posterUrl?post.link:null,source:'DEEP official homepage',fetchedAt:new Date().toISOString()})}return records}
async function fetchDeepSchedule(){const response=await fetch(DEEP_POSTS_URL,{headers:requestHeaders,cf:{cacheTtl:1800,cacheEverything:true}});if(!response.ok)throw new Error(`DEEP posts returned ${response.status}`);return deepRecords(await response.json())}
function oneRecords(html){const events=[];for(const match of html.matchAll(/<a\b[^>]*href=["'](https:\/\/www\.onefc\.com\/events\/[^"']+)["'][^>]*>([\s\S]{0,2800}?)<\/a>/gi)){const [,officialUrl,card]=match;const title=plainText(field(card,/<(?:span|h3)\b[^>]*class=["'][^"']*title[^"']*["'][^>]*>([\s\S]*?)<\//i)||'');const timestamp=field(card,/data-timestamp=["'](\d+)["']/i);if(!title||!timestamp)continue;const date=new Date(Number(timestamp)*1000).toISOString().slice(0,10);if(!date.startsWith('2026-'))continue;const posterUrl=field(card,/<img\b[^>]*\bsrc=["']([^"']+)/i)?.replace(/^http:/,'https:')||null;const venue=plainText(field(card,/<div\b[^>]*class=["']location["'][^>]*>([\s\S]*?)<\//i)||'');events.push({id:`one-${officialUrl.split('/').filter(Boolean).pop()}`,promotion:'ONE',title,date,city:venue,venue,officialUrl,startsAt:new Date(Number(timestamp)*1000).toISOString(),posterUrl,posterType:posterUrl?'event-poster':null,posterSourceUrl:posterUrl?officialUrl:null,source:'ONE Championship official events',fetchedAt:new Date().toISOString()})}return [...new Map(events.map(event=>[event.officialUrl,event])).values()]}
async function fetchOneSchedule(){const response=await fetch(ONE_EVENTS_URL,{headers:requestHeaders,cf:{cacheTtl:900,cacheEverything:true}});if(!response.ok)throw new Error(`ONE Events returned ${response.status}`);return oneRecords(await response.text())}
function zfnRecords(html){const records=[];for(const caption of html.matchAll(/<span class="blocked">([\s\S]{0,7000}?)<\/span>/gi)){const text=plainText(caption[1]),title=text.match(/\[\s*(?:ZFN|𝐙𝐅𝐍)\s*0?(\d+)\s*\]/i),date=text.match(/2026\.\s*(\d{1,2})\.\s*(\d{1,2})/);if(!title||!date)continue;const before=html.slice(Math.max(0,caption.index-14000),caption.index),assets=[...before.matchAll(/data-(?:org|src)=["']([^"']+)/gi)],links=[...before.matchAll(/<a\b[^>]*href=["'](https:\/\/www\.instagram\.com\/p\/[^"']+)/gi)],posterUrl=assets.at(-1)?.[1]?.replaceAll('&amp;','&')||null;records.push({id:`zfn-${title[1]}`,promotion:'ZFN',title:`ZFN ${title[1]}`,date:`2026-${date[1].padStart(2,'0')}-${date[2].padStart(2,'0')}`,city:'Incheon, Korea',venue:text.includes('인스파이어 아레나')?'Inspire Arena':'공식 장소 확인 중',officialUrl:ZFN_EVENTS_URL,instagramUrl:links.at(-1)?.[1]||null,posterUrl,posterType:posterUrl?'event-poster':null,posterSourceUrl:posterUrl?ZFN_EVENTS_URL:null,source:'ZFN official event page',fetchedAt:new Date().toISOString()})}return [...new Map(records.map(event=>[event.id,event])).values()]}
async function fetchZfnSchedule(){const response=await fetch(ZFN_EVENTS_URL,{headers:requestHeaders,cf:{cacheTtl:900,cacheEverything:true}});if(!response.ok)throw new Error(`ZFN events returned ${response.status}`);return zfnRecords(await response.text())}

function rizinListingRecords(html){
  const records=[],seen=new Set();
  const eventIndex=html.indexOf('関連情報');
  const eventSection=eventIndex>0?html.slice(0,eventIndex):html;
  for(const match of eventSection.matchAll(/<a\b[^>]*href=["']([^"']*\/_ct\/\d+[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi)){
    const parsedUrl=new URL(match[1].replaceAll('&amp;','&'),RIZIN_ORIGIN);
    parsedUrl.search='';
    const officialUrl=parsedUrl.toString();
    const label=plainText(match[2]);
    const dateMatch=label.match(/(20\d{2})年\s*(\d{1,2})月\s*(\d{1,2})日\s*(.+)/);
    if(!dateMatch||!/RIZIN|BELLATOR/i.test(dateMatch[4])||/発売|先行|来場|案内|受付|チケット|会見|スタート|販売|ご案内|PPV/.test(dateMatch[4])||seen.has(officialUrl))continue;
    const [,year,month,day,title]=dateMatch;
    seen.add(officialUrl);
    records.push({id:`rizin-${officialUrl.match(/_ct\/(\d+)/)?.[1]}`,promotion:'RIZIN',title:plainText(title),date:`${year}-${month.padStart(2,'0')}-${day.padStart(2,'0')}`,officialUrl});
  }
  return records;
}

function rizinDetails(html,event){
  const text=plainText(html);
  const start=text.match(/(\d{1,2})[：:](\d{2})\s*開始/);
  const venueSection=field(html,/<h3\b[^>]*>\s*会場\s*<\/h3>([\s\S]*?)(?=<h[23]\b|$)/i);
  const venue=venueSection?plainText(venueSection).split(/アクセス|主催|制作協力|対戦カード|チケット|配信情報/)[0].trim():null;
  const heading=plainText(field(html,/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)||'').replaceAll(/[『「』」]/g,'').replace(/大会概要|大会情報|チケット|[／/]/g,' ').replaceAll(/\s+/g,' ').trim();
  const posterUrl=metaContent(html,'og:image');
  return {...event,title:heading||event.title,venue,startsAtLocal:start?`${start[1].padStart(2,'0')}:${start[2]}`:null,posterUrl:posterUrl?.replace(/^http:/,'https:')||null,posterType:posterUrl?'event-poster':null,posterSourceUrl:posterUrl?event.officialUrl:null,posterStatus:posterUrl?'official-event-page':'official-poster-not-published',source:'RIZIN official event page',fetchedAt:new Date().toISOString()};
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
  if(promotion==='black-combat'){
    try{return Response.json({schemaVersion:2,timezone:'Asia/Seoul',promotion:'BLACK COMBAT',source:BLACK_EVENTS_URL,events:await fetchBlackCombatSchedule()},{headers:{'cache-control':'public, max-age=900, stale-while-revalidate=3600'}})}catch{return Response.json({schemaVersion:2,timezone:'Asia/Seoul',promotion:'BLACK COMBAT',events:[],error:'official-source-temporarily-unavailable'},{headers:{'cache-control':'public, max-age=60'}})};
  }
  if(promotion==='deep'){
    try{return Response.json({schemaVersion:2,timezone:'Asia/Tokyo',promotion:'DEEP',source:'https://www.deep2001.com/',events:await fetchDeepSchedule()},{headers:{'cache-control':'public, max-age=1800, stale-while-revalidate=7200'}})}catch{return Response.json({schemaVersion:2,timezone:'Asia/Tokyo',promotion:'DEEP',events:[],error:'official-source-temporarily-unavailable'},{headers:{'cache-control':'public, max-age=60'}})};
  }
  if(promotion==='one'){
    try{return Response.json({schemaVersion:2,timezone:'Asia/Bangkok',promotion:'ONE',source:ONE_EVENTS_URL,events:await fetchOneSchedule()},{headers:{'cache-control':'public, max-age=900, stale-while-revalidate=3600'}})}catch{return Response.json({schemaVersion:2,timezone:'Asia/Bangkok',promotion:'ONE',events:[],error:'official-source-temporarily-unavailable'},{headers:{'cache-control':'public, max-age=60'}})};
  }
  if(promotion==='zfn'){
    try{return Response.json({schemaVersion:2,timezone:'Asia/Seoul',promotion:'ZFN',source:ZFN_EVENTS_URL,events:await fetchZfnSchedule()},{headers:{'cache-control':'public, max-age=900, stale-while-revalidate=3600'}})}catch{return Response.json({schemaVersion:2,timezone:'Asia/Seoul',promotion:'ZFN',events:[],error:'official-source-temporarily-unavailable'},{headers:{'cache-control':'public, max-age=60'}})};
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
