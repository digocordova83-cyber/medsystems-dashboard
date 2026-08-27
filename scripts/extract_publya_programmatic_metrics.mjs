import fs from 'node:fs';
const data=JSON.parse(fs.readFileSync('/tmp/b2b_programatica.json','utf8'));
const pick=(v)=>{if(v===null||v===undefined)return v;if(Array.isArray(v))return v.slice(0,8).map(pick);if(typeof v==='object'){const o={};for(const [k,x] of Object.entries(v))o[k]=pick(x);return o;}return v;};
console.log(JSON.stringify({campaign:data.campaign,settings:pick(data.settings),progress:pick(data.progress),metrics:pick(data.metrics),daily:pick(data.daily),groups:pick(data.groups),exchange:pick(data.exchange)},null,2));
