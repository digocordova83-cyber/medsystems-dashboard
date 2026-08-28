import fs from 'node:fs';
const data=JSON.parse(fs.readFileSync('/tmp/b2b_programatica.json','utf8'));
const sites=(data.groups?.sites||[]).map(x=>({name:x.name,metrics:x.metrics?{impressions:x.metrics.impressions,clicks:x.metrics.clicks,ctr:x.metrics.ctr,spend:x.metrics.spend,cpm:x.metrics.cpm,cpc:x.metrics.cpc,viewability:x.metrics.viewability}:null}));
console.log(JSON.stringify({count:sites.length,sites},null,2));
