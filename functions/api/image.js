const DEEP_HOST='www.deep2001.com';

export const onRequestGet=async({request})=>{
  const input=new URL(request.url).searchParams.get('src');
  if(!input)return new Response('Missing image source',{status:400});
  let source;
  try{source=new URL(input)}catch{return new Response('Invalid image source',{status:400})}
  if(source.protocol!=='https:'||source.hostname!==DEEP_HOST||!source.pathname.startsWith('/wp-content/uploads/'))return new Response('Unsupported image source',{status:403});
  const upstream=await fetch(source.toString(),{headers:{referer:'https://www.deep2001.com/future/','user-agent':'Mozilla/5.0'}});
  if(!upstream.ok)return new Response('Official image unavailable',{status:upstream.status});
  return new Response(upstream.body,{headers:{'content-type':upstream.headers.get('content-type')||'image/jpeg','cache-control':'public, max-age=86400, stale-while-revalidate=604800'}});
};
