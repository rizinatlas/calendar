const FIGHT_PASS={
  schedule:'https://welcome.ufcfightpass.com/schedule',
  promotions:'https://ufcfightpass.com/section/Fight%20Promotions',
  promotionNames:[
    'Cage Warriors','Cage Fury FC','Fury FC','UAE Warriors','LUX Fight League',
    'Premier Fight Promotions','Fight Club Rush','Eternal MMA','Shooto Brazil','Budo Sento Championship',
    'Tuff-N-Uff','Samourai MMA','ZFN','Battlefield Fight League','FCC','WOW FC','A-1 Combat',
    'Ultimate Warrior Challenge','Anthony Pettis FC','Combat FC','Shuriken Fight Series','559 Fights',
    'Bison Kombat','Fight League Atlantic','MMA Mexico','One Pride','Inka MMA'
  ]
};

export const onRequestGet=()=>Response.json({
  source:FIGHT_PASS,
  events:[
    ['2026-11-26','INKA MMA','INKA MMA 63','13:00','320895'],
    ['2026-11-28','CAGE WARRIORS','Cage Warriors 214: Unplugged','05:00','320900'],
    ['2026-11-28','ETERNAL MMA','Eternal MMA 113','20:00','320915'],
    ['2026-11-29','CAGE WARRIORS','Cage Warriors 215: Davies vs Vucenic','04:30','320917'],
    ['2026-11-29','MMA MEXICO','MMA Mexico 10','12:00','320919'],
    ['2026-12-04','BFL','BFL 89','13:00','320987'],
    ['2026-12-05','SHOOTO BRAZIL','Shooto Brazil 142','09:00','320988'],
    ['2026-12-05','BUDO SENTO CHAMPIONSHIP','Budo Sento Championship 38','10:00','319194'],
    ['2026-12-05','CAGE FURY FC','Cage Fury FC 162','11:00','320992'],
    ['2026-12-05','TUFF-N-UFF','Tuff-N-Uff 159','12:00','320994'],
    ['2026-12-06','FIGHT CLUB RUSH','Fight Club Rush 32','02:00','320995'],
    ['2026-12-06','CAGE WARRIORS','Cage Warriors 216: Newcastle','04:30','320997'],
    ['2026-12-07','FURY FC','Fury FC 126','07:00','313842']
  ].map(([date,promotion,title,kstTime,streamId])=>({id:`fightpass-${streamId}`,date,promotion,title,kstTime,officialUrl:`https://app.ufcfightpass.com/live/${streamId}`,watchUrl:`https://ufcfightpass.com/`,categories:['fightpass'],source:'UFC Fight Pass official upcoming schedule',fetchedAt:'2026-11-22T09:00:00.000Z'})),
  policy:'Add a calendar event only after it is present in the official Fight Pass schedule or the promotion’s official event announcement. Apply fightpass plus every applicable regional category.'
},{headers:{'cache-control':'public, max-age=3600'}});
