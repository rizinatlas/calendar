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
  policy:'Add a calendar event only after it is present in the official Fight Pass schedule or the promotion’s official event announcement. Apply fightpass plus every applicable regional category.'
},{headers:{'cache-control':'public, max-age=3600'}});
