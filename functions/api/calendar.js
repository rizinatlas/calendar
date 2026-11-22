const icsEscape=value=>String(value||'').replaceAll('\\','\\\\').replaceAll(';','\\;').replaceAll(',','\\,').replaceAll(/\r?\n/g,'\\n');
const addHours=(date,hours)=>{const instant=new Date(`${date}T03:00:00Z`);instant.setUTCHours(instant.getUTCHours()+hours);return instant.toISOString().replaceAll(/[-:]/g,'').replace(/\.\d{3}/,'')};

export const onRequestGet=async({request})=>{
  const origin=new URL(request.url).origin;
  try{
    const script=await fetch(`${origin}/app.js`,{cf:{cacheTtl:300,cacheEverything:true}}).then(response=>response.text());
    const feed=[];
    for(const match of script.matchAll(/\{date:'([^']+)',p:'([^']+)',n:'([^']+)',city:'([^']+)'[\s\S]{0,600}?kst:'([^']+)'[\s\S]{0,800}?venue:'([^']+)'/g)){
      const [,date,promotion,name,city,kst,venue]=match;
      const uid=`${date}-${promotion}-${name}`.replaceAll(/[^a-z0-9]+/gi,'-').toLowerCase();
      feed.push(`BEGIN:VEVENT\r\nUID:${uid}@mmacalendar.pages.dev\r\nDTSTAMP:${new Date().toISOString().replaceAll(/[-:]/g,'').replace(/\.\d{3}/,'')}\r\nDTSTART:${addHours(date,0)}\r\nDTEND:${addHours(date,4)}\r\nSUMMARY:${icsEscape(`${promotion} — ${name}`)}\r\nLOCATION:${icsEscape(`${venue}, ${city}`)}\r\nDESCRIPTION:${icsEscape(`MMA CALENDAR · ${kst} · 공식 발표 기준`) }\r\nURL:${origin}\r\nEND:VEVENT`);
    }
    const body=`BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//MMA CALENDAR//MMA schedule//KO\r\nX-WR-CALNAME:MMA CALENDAR 일정\r\nX-WR-TIMEZONE:Asia/Seoul\r\nX-PUBLISHED-TTL:PT1H\r\n${[...new Set(feed)].join('\r\n')}\r\nEND:VCALENDAR\r\n`;
    return new Response(body,{headers:{'content-type':'text/calendar; charset=utf-8','cache-control':'public, max-age=300, stale-while-revalidate=900','content-disposition':'inline; filename="mma-calendar.ics"'}});
  }catch{return new Response('BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//MMA CALENDAR//MMA schedule//KO\r\nEND:VCALENDAR\r\n',{headers:{'content-type':'text/calendar; charset=utf-8','cache-control':'public, max-age=60'}})};
};
