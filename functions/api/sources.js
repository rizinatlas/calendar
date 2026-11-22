const SOURCES={
  UFC:'https://www.ufc.com/events',PFL:'https://pflmma.com/',RIZIN:'https://www.rizinff.com/en/',ONE:'https://www.onefc.com/events/',KSW:'https://www.kswmma.com/en/',ACA:'https://aca-mma.com/'
};
export const onRequestGet=()=>Response.json({sources:SOURCES,refreshStrategy:'Promotion-specific adapters; respect source terms, robots policies, and rate limits.'});
