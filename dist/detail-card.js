const originalDetailRenderer=renderDetail;
renderDetail=()=>{
  originalDetailRenderer();
  const detail=document.querySelector('.detail-panel');
  const tag=detail.querySelector('.detail-tag'),title=detail.querySelector('h2'),date=detail.querySelector('.detail-date'),poster=detail.querySelector('.poster'),info=detail.querySelector('.info'),map=detail.querySelector('.world-map'),heading=detail.querySelector('.card-heading'),links=detail.querySelector('.links');
  const fights=[...detail.querySelectorAll('.fight')],status=detail.querySelector('.fight-status');
  const infoPanel=document.createElement('section');infoPanel.className='event-info-panel';
  const orderPanel=document.createElement('section');orderPanel.className='fight-order-panel';
  [tag,title,date,info,map].forEach(node=>node&&infoPanel.append(node));
  const lang=document.documentElement.lang,labels=lang==='ja'?{heading:'FIGHT ORDER · 公式カード順',all:'全対戦を見る',close:'対戦を閉じる'}:lang==='en'?{heading:'FIGHT ORDER · OFFICIAL CARD ORDER',all:'View all fights',close:'Hide fights'}:{heading:'FIGHT ORDER · 공식 카드 순서',all:'모든 대진 보기',close:'대진 접기'};
  heading.textContent=labels.heading;orderPanel.append(heading);
  status&&orderPanel.append(status);
  [...fights].reverse().forEach((node,index)=>{if(index>1)node.classList.add('extra-fight');orderPanel.append(node)});
  if(fights.length>2){const more=document.createElement('button');more.className='show-all-fights';more.textContent=`${labels.all} (${fights.length})`;more.onclick=()=>{orderPanel.classList.toggle('expanded');more.textContent=orderPanel.classList.contains('expanded')?labels.close:`${labels.all} (${fights.length})`};orderPanel.append(more)}
  links&&orderPanel.append(links);detail.replaceChildren(infoPanel,orderPanel);
  const labelsInOrder=[...orderPanel.querySelectorAll('.fight strong')],total=labelsInOrder.length;labelsInOrder.forEach((label,index)=>{const order=index===0?'MAIN':index===1?'CO-MAIN':total-index;label.innerHTML=`${order}<br>VS`});
};
renderDetail();

const compactCalendarStyle=document.createElement('style');
compactCalendarStyle.textContent=`
  .calendar-panel .event.major{background:#202826;color:#fff}
  .calendar-panel .event.major span{color:#9ca4a2}
  .calendar-panel .day.compact-day .event{margin-top:3px;padding:4px 4px 4px 6px;font-size:11px;line-height:1.05}
  .calendar-panel .day.compact-day .event.major{font-size:12px}
`;
document.head.append(compactCalendarStyle);
const originalRenderDays=renderDays;
renderDays=()=>{
  originalRenderDays();
  document.querySelectorAll('.calendar-panel .day').forEach(day=>{
    const cards=[...day.querySelectorAll('.event')];
    if(cards.length<4)return;
    day.classList.add('compact-day');
    cards.forEach(card=>{
      const description=card.querySelector('span');
      if(description){card.setAttribute('aria-label',`${card.firstChild.textContent} · ${description.textContent}`);description.remove()}
    });
  });
};
renderDays();
