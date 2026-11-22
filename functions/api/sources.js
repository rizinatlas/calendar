const SOURCES={
  'UFC Fight Pass Schedule':'https://welcome.ufcfightpass.com/schedule',
  'UFC Fight Pass Promotions':'https://ufcfightpass.com/section/Fight%20Promotions',
  UFC:'https://www.ufc.com/events',
  'UFC Fight Pass':'https://ufcfightpass.com/',PFL:'https://pflmma.com/',RIZIN:'https://www.rizinff.com/en/',ONE:'https://www.onefc.com/events/',KSW:'https://www.kswmma.com/en/',ACA:'https://aca-mma.com/',
  'ROAD FC':'https://www.roadfc.com/',BLACKCOMBAT:'https://blackcombat.co.kr/',ZFN:'https://www.instagram.com/zfightnight/',DOMVS:'https://www.instagram.com/domvs.official/',
  'ZEUS FC':'https://www.instagram.com/zeusfc.official/',RINGS:'https://www.instagram.com/ringskorea/',AFC:'https://www.instagram.com/afc_mma/',
  DEEP:'https://www.deep2001.com/',SHOOTO:'https://www.shooto-mma.com/',PANCRASE:'https://www.pancrase.co.jp/',GRADIATOR:'https://gladiator-fc.com/',GRACHAN:'https://grachan.jp/',
  ROMAN:'https://www.instagram.com/roman_mma_official/',RISE:'https://rise-rc.com/',K1:'https://www.k-1.co.jp/',BREAKING_DOWN:'https://breakingdown.jp/',
  'UAE Warriors':'https://uae-warriors.com/', 'Cage Warriors':'https://cagewarriors.com/cage-warriors-events/', 'Cage Fury FC':'https://cffcmma.com/', 'Fury FC':'https://furyfightingchampionship.com/', 'LUX Fight League':'https://luxfightleague.com/', 'BRAVE CF':'https://bravecfs.com/', 'OPEN FC':'https://openfc.tv/', 'EAGLE FC':'https://eaglefc.com/',
  'MANGO FC':'https://www.instagram.com/mango_fight_official/',ECW:'https://www.instagram.com/ecw_mma/', 'JCK':'https://www.jckmma.com/'
  ,RCC:'https://t.me/rcc_sport', 'RCC Fair Fight':'https://rcc-sport.com/'
};
export const onRequestGet=()=>Response.json({sources:SOURCES,refreshStrategy:'Promotion-specific adapters; respect source terms, robots policies, and rate limits.'});
