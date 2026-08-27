import fs from 'node:fs';
const data=JSON.parse(fs.readFileSync('/tmp/b2b_programatica.json','utf8'));
function walk(v,path='root'){
 if(Array.isArray(v)){ if(v.length) console.log(path,'ARRAY',v.length); for(let i=0;i<Math.min(v.length,8);i++) walk(v[i],`${path}[${i}]`); return; }
 if(!v||typeof v!=='object') return;
 for(const [k,x] of Object.entries(v)){ if(k==='formats' || k==='format' || (k==='name'&&/970|728|300|banner|display|native|mobile|story/i.test(String(x)))) console.log('MATCH',path+'.'+k,JSON.stringify(x).slice(0,500)); walk(x,path+'.'+k); }
}
walk(data);
