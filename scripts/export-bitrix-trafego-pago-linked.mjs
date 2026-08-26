import mysql from "mysql2/promise";
import fs from "node:fs/promises";
const OUT="/home/ubuntu/exports/bitrix-trafego-pago-todas-entidades-linked.json";
const END="2026-08-26 03:00:00";
function parse(v){try{return JSON.parse(v)}catch{return {}}}
function flat(v,p='',o={}){if(v==null)return o;if(Array.isArray(v)){v.forEach((x,i)=>flat(x,`${p}[${i}]`,o));return o}if(typeof v==='object'){for(const[k,x]of Object.entries(v))flat(x,p?`${p}.${k}`:k,o);return o}o[p]=String(v);return o}
function find(f,names){const set=new Set(names.map(n=>n.toLowerCase()));const e=Object.entries(f).find(([k,v])=>set.has(k.split('.').at(-1).toLowerCase())&&v);return e?.[1]??''}
const db=await mysql.createConnection(process.env.DATABASE_URL);
try{const [raw]=await db.query("SELECT bitrixId, portal, entityType, rawPayload, createdAtBitrix, updatedAtBitrix FROM bitrix24Entities WHERE entityType IN ('lead','deal','contact') AND updatedAtBitrix < ?",[END]);
 const all=raw.map(r=>{const payload=parse(r.rawPayload);const f=flat(payload);return {...r,payload,f}});
 const leads=all.filter(r=>r.entityType==='lead' && find(r.f,['UF_CRM_1744808620']).trim().toLowerCase()==='tráfego pago');
 const leadIds=new Set(leads.map(r=>String(r.bitrixId))); const contactIds=new Set(leads.map(r=>find(r.f,['CONTACT_ID'])).filter(Boolean));
 const direct=all.filter(r=>find(r.f,['UF_CRM_1744808620']).trim().toLowerCase()==='tráfego pago');
 const related=all.filter(r=>r.entityType!=='lead' && (leadIds.has(find(r.f,['LEAD_ID'])) || contactIds.has(find(r.f,['CONTACT_ID']))));
 const rows=[...leads.map(r=>({...r,relationship:'Fonte direta no lead',source_field:find(r.f,['UF_CRM_1744808620'])})),...related.map(r=>({...r,relationship:'Vinculado a lead Tráfego Pago',source_field:find(r.f,['UF_CRM_1744808620'])||'Não preenchido'}))];
 const summary={cutoff:'Até 25/08/2026 23:59 BRT',rule:'Lead com UF_CRM_1744808620 exatamente igual a Tráfego Pago; negócios/contatos vinculados por LEAD_ID ou CONTACT_ID',direct_by_type:{},export_by_type:{},lead_count:leads.length,lead_ids:[...leadIds]};
 for(const r of direct)summary.direct_by_type[r.entityType]=(summary.direct_by_type[r.entityType]??0)+1; for(const r of rows)summary.export_by_type[r.entityType]=(summary.export_by_type[r.entityType]??0)+1;
 const output=rows.map(r=>({bitrix_id:r.bitrixId,portal:r.portal,tipo:r.entityType,relacionamento:r.relationship,criado_em:r.createdAtBitrix,atualizado_em:r.updatedAtBitrix,nome:find(r.f,['NAME']),sobrenome:find(r.f,['LAST_NAME']),titulo:find(r.f,['TITLE']),email:Object.entries(r.f).find(([k,v])=>(/(^|\\.)email/i.test(k)&&v))?.[1]??'',telefone:Object.entries(r.f).find(([k,v])=>(/(^|\\.)(phone|telefone)/i.test(k)&&v))?.[1]??'',lead_id:find(r.f,['LEAD_ID']),contact_id:find(r.f,['CONTACT_ID']),source_id:find(r.f,['SOURCE_ID']),source_description:find(r.f,['SOURCE_DESCRIPTION']),source_structured:find(r.f,['UF_CRM_1744808620']),pipeline:find(r.f,['UF_CRM_1739195085']),stage:find(r.f,['STATUS_ID','STAGE_ID']),utm_source:Object.entries(r.f).find(([k,v])=>/utm[_\\.]source/i.test(k)&&v)?.[1]??'',utm_medium:Object.entries(r.f).find(([k,v])=>/utm[_\\.]medium/i.test(k)&&v)?.[1]??'',utm_campaign:Object.entries(r.f).find(([k,v])=>/utm[_\\.]campaign/i.test(k)&&v)?.[1]??'',payload_completo:r.payload}));
 await fs.writeFile(OUT,JSON.stringify({summary,rows:output},null,2));console.log(JSON.stringify({output,summary},null,2));
}finally{await db.end()}
