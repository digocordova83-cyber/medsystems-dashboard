import fs from 'node:fs';
const data=JSON.parse(fs.readFileSync('/tmp/b2b_programatica.json','utf8'));
const g=data.groups||{};
const clean=(x)=>{if(!x||typeof x!=='object')return x;return {name:x.name,format:x.format,metrics:x.metrics?{impressions:x.metrics.impressions,clicks:x.metrics.clicks,ctr:x.metrics.ctr,spend:x.metrics.spend,cpm:x.metrics.cpm,cpc:x.metrics.cpc,viewability:x.metrics.viewability}:undefined,creative:x.creative,ad:x.ad};};
console.log(JSON.stringify({formats:(g.formats||[]).map(clean),creatives:(g.creatives||[]).map(clean),strategies:(g.strategies||[]).map(clean)},null,2));
