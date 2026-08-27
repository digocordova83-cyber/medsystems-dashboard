import fs from 'node:fs';
const files=['/tmp/b2b_google.json','/tmp/b2b_programatica.json','/tmp/b2b_meta.json'];
for(const file of files){
  const data=JSON.parse(fs.readFileSync(file,'utf8'));
  const c=data.campaign||{};
  const keys=Object.keys(data);
  const report=data.reportData ?? data.report ?? {};
  const formats=[];
  const walk=(value,path='')=>{
    if(Array.isArray(value)){ for(const item of value.slice(0,100)) walk(item,path); return; }
    if(!value || typeof value!=='object') return;
    if(value.format || value.name && /display|native|video|audio|banner|mobile|story|feed/i.test(String(value.name))) formats.push({path,format:value.format??null,name:value.name??null,type:value.type??null});
    for(const [k,v] of Object.entries(value)) if(['campaign','company','platform','type','objective','reportData','metrics','daily','formats','strategies','placements','regions','cities','publishers','creatives'].includes(k)) walk(v,path?`${path}.${k}`:k);
  };
  walk(data);
  console.log(JSON.stringify({file,campaign:{name:c.name,platformName:c.platformName,platform:c.platform,type:c.type,objective:c.objective,startDate:c.startDate,endDate:c.endDate,budget:c.budget,contractedImpressions:c.contractedImpressions,midiaPercentage:c.midiaPercentage},topLevelKeys:keys,reportDataKeys:report&&typeof report==='object'?Object.keys(report):[],formats:formats.slice(0,40)},null,2));
}
