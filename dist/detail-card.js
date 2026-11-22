const originalDetailRenderer=renderDetail;
renderDetail=()=>{
  originalDetailRenderer();
  const detail=document.querySelector('.detail-panel');
  const tag=detail.querySelector('.detail-tag'),title=detail.querySelector('h2'),date=detail.querySelector('.detail-date'),poster=detail.querySelector('.poster'),info=detail.querySelector('.info'),map=detail.querySelector('.world-map'),heading=detail.querySelector('.card-heading'),links=detail.querySelector('.links');
  const fights=[...detail.querySelectorAll('.fight')],status=detail.querySelector('.fight-status');
  const infoPanel=document.createElement('section');infoPanel.className='event-info-panel';
  const orderPanel=document.createElement('section');orderPanel.className='fight-order-panel';
  [tag,title,date,info,map].forEach(node=>node&&infoPanel.append(node));
  let posterWrap;
  if(active.posterUrl&&active.posterType==='event-poster'){posterWrap=document.createElement('div');posterWrap.className='poster-wrap poster-under-card';const image=document.createElement('img');image.src=active.posterUrl;image.alt=`${active.n} 공식 포스터`;image.loading='lazy';image.onerror=()=>posterWrap.remove();posterWrap.append(image)}
  heading.textContent='FIGHT ORDER · 공식 카드 순서';orderPanel.append(heading);
  status&&orderPanel.append(status);
  fights.forEach((node,index)=>{if(index>1)node.classList.add('extra-fight');orderPanel.append(node)});
  if(fights.length>2){const more=document.createElement('button');more.className='show-all-fights';more.textContent=`모든 대진 보기 (${fights.length})`;more.onclick=()=>{orderPanel.classList.toggle('expanded');more.textContent=orderPanel.classList.contains('expanded')?'대진 접기':`모든 대진 보기 (${fights.length})`};orderPanel.append(more)}
  links&&orderPanel.append(links);posterWrap&&orderPanel.append(posterWrap);detail.replaceChildren(infoPanel,orderPanel);
};
renderDetail();
