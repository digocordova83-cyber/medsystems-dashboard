import json
from pathlib import Path
import matplotlib.pyplot as plt
import numpy as np

ROOT = Path('/home/ubuntu/medsystems-rdstation-oauth')
OUT = Path('/home/ubuntu/exports/bbro_defesa_estudo_2026-09-25')
OUT.mkdir(parents=True, exist_ok=True)

study = json.loads(Path('/tmp/bbro-study-data-2026-09-25.json').read_text())
periods = {p['key']: p for p in study['periods']}
prog = json.loads(Path('/tmp/medsystems-programmatic-sales-2026-09-24.json').read_text())['programmatic']['monthly']

NAVY = '#071B46'
BLUE = '#0047BB'
GREEN = '#059669'
ORANGE = '#D97706'
GREY = '#94A3B8'
LIGHT = '#E5E7EB'
plt.rcParams.update({'font.family': 'DejaVu Sans', 'axes.titleweight': 'bold', 'axes.titlesize': 13, 'axes.labelsize': 11, 'xtick.labelsize': 10, 'ytick.labelsize': 10})

labels = ['Jul/26', 'Ago/26', 'Set/26\n01–23']
keys = ['2026-07','2026-08','2026-09']
media = [periods[k]['media']['totals'] for k in keys]

# 1. Media scale and efficiency
fig, axs = plt.subplots(1, 3, figsize=(14, 4.8), dpi=160)
fig.patch.set_facecolor('white')
metrics = [
    ('Investimento (R$ mil)', [m['spend']/1000 for m in media], 'R$ {:.1f}k', [GREY, BLUE, GREEN]),
    ('Impressões (milhões)', [m['impressions']/1e6 for m in media], '{:.2f}M', [GREY, BLUE, GREEN]),
    ('Cliques (mil)', [m['clicks']/1000 for m in media], '{:.1f}k', [GREY, BLUE, GREEN]),
]
for ax, (title, vals, fmt, colors) in zip(axs, metrics):
    bars = ax.bar(labels, vals, color=colors, width=0.62)
    ax.set_title(title, color=NAVY, loc='left', pad=12)
    ax.spines[['top','right','left']].set_visible(False)
    ax.spines['bottom'].set_color(LIGHT)
    ax.grid(axis='y', color=LIGHT, linewidth=0.8)
    ax.set_axisbelow(True)
    ax.tick_params(axis='y', colors=NAVY, length=0)
    ax.tick_params(axis='x', colors=NAVY, length=0)
    for bar, val in zip(bars, vals):
        ax.text(bar.get_x()+bar.get_width()/2, bar.get_height()+max(vals)*0.03, fmt.format(val), ha='center', va='bottom', fontsize=10, color=NAVY, fontweight='bold')
    ax.margins(y=0.18)
fig.suptitle('Escala de mídia Meta + Google', x=0.05, ha='left', fontsize=16, color=NAVY, fontweight='bold')
fig.tight_layout(rect=[0,0,1,0.92])
fig.savefig(OUT/'01_escala_midia.png', bbox_inches='tight')
plt.close(fig)

# 2. Funnel growth by BU Jul vs Aug
fig, axs = plt.subplots(1, 2, figsize=(14, 5.2), dpi=160)
fig.patch.set_facecolor('white')
for ax, brand, title in zip(axs, ['medsystems','beautysystems'], ['MedSystems','BeautySystems']):
    july = next(p['totals'] for p in periods['2026-07']['funnel']['byBu'] if p['brand']==brand)
    august = next(p['totals'] for p in periods['2026-08']['funnel']['byBu'] if p['brand']==brand)
    cats = ['Leads','MQL','SQL','Negócios\nganhos']
    vals_j = [july['leads'],july['mql'],july['sql'],july['wonDeals']]
    vals_a = [august['leads'],august['mql'],august['sql'],august['wonDeals']]
    x = np.arange(len(cats)); w=0.35
    b1=ax.bar(x-w/2, vals_j, w, label='Julho', color=GREY)
    b2=ax.bar(x+w/2, vals_a, w, label='Agosto', color=GREEN if brand=='medsystems' else BLUE)
    ax.set_title(title, color=NAVY, loc='left', pad=12)
    ax.set_xticks(x, cats)
    ax.spines[['top','right','left']].set_visible(False)
    ax.spines['bottom'].set_color(LIGHT)
    ax.grid(axis='y', color=LIGHT, linewidth=0.8); ax.set_axisbelow(True)
    ax.tick_params(axis='both', colors=NAVY, length=0)
    for bars in [b1,b2]:
        for bar in bars:
            ax.text(bar.get_x()+bar.get_width()/2, bar.get_height()+max(vals_a)*0.03, f'{bar.get_height():,.0f}'.replace(',','.'), ha='center', va='bottom', fontsize=9, color=NAVY, fontweight='bold')
    ax.legend(frameon=False, loc='upper left', fontsize=9)
    ax.margins(y=0.22)
fig.suptitle('Funil comercial: mês fechado de julho vs agosto', x=0.05, ha='left', fontsize=16, color=NAVY, fontweight='bold')
fig.tight_layout(rect=[0,0,1,0.92])
fig.savefig(OUT/'02_funil_por_bu.png', bbox_inches='tight')
plt.close(fig)

# 3. Value won
fig, ax = plt.subplots(figsize=(10, 4.8), dpi=160)
fig.patch.set_facecolor('white')
xb = np.arange(2)
med_j = next(p['totals']['wonValue'] for p in periods['2026-07']['funnel']['byBu'] if p['brand']=='medsystems')/1e6
med_a = next(p['totals']['wonValue'] for p in periods['2026-08']['funnel']['byBu'] if p['brand']=='medsystems')/1e6
bea_j = next(p['totals']['wonValue'] for p in periods['2026-07']['funnel']['byBu'] if p['brand']=='beautysystems')/1e6
bea_a = next(p['totals']['wonValue'] for p in periods['2026-08']['funnel']['byBu'] if p['brand']=='beautysystems')/1e6
b1=ax.bar(xb-0.18,[med_j,bea_j],0.36,label='Julho',color=GREY)
b2=ax.bar(xb+0.18,[med_a,bea_a],0.36,label='Agosto',color=GREEN)
ax.set_xticks(xb,['MedSystems','BeautySystems']); ax.set_ylabel('R$ milhões')
ax.set_title('Valor de negócios ganhos no Bitrix24', color=NAVY, loc='left', pad=14, fontsize=16)
ax.spines[['top','right','left']].set_visible(False); ax.spines['bottom'].set_color(LIGHT)
ax.grid(axis='y', color=LIGHT, linewidth=0.8); ax.set_axisbelow(True)
ax.tick_params(axis='both', colors=NAVY, length=0)
for bars in [b1,b2]:
    for bar in bars:
        ax.text(bar.get_x()+bar.get_width()/2, bar.get_height()+0.25, f'R$ {bar.get_height():.1f}M', ha='center', va='bottom', fontsize=10, color=NAVY, fontweight='bold')
ax.legend(frameon=False, loc='upper left', fontsize=9)
ax.margins(y=0.2)
fig.tight_layout()
fig.savefig(OUT/'03_valor_negocios_ganhos.png', bbox_inches='tight')
plt.close(fig)

# 4. Reach and frequency proxy
fig, ax1 = plt.subplots(figsize=(10, 4.8), dpi=160)
fig.patch.set_facecolor('white')
imp=[m['impressions']/1e6 for m in media]
reach=[m['reach']/1e6 for m in media]
freq=[m['impressions']/m['reach'] if m['reach'] else 0 for m in media]
x=np.arange(3)
ax1.bar(x-0.18,imp,0.36,label='Impressões (M)',color=BLUE)
ax1.bar(x+0.18,reach,0.36,label='Alcance reportado (M)',color=ORANGE)
ax1.set_xticks(x,labels); ax1.set_ylabel('Milhões'); ax1.set_title('Alcance e frequência proxy', color=NAVY, loc='left', pad=14, fontsize=16)
ax1.spines[['top','right','left']].set_visible(False); ax1.spines['bottom'].set_color(LIGHT); ax1.grid(axis='y',color=LIGHT,linewidth=.8); ax1.set_axisbelow(True); ax1.tick_params(axis='both',colors=NAVY,length=0)
ax2=ax1.twinx(); ax2.plot(x,freq,color=GREEN,marker='o',linewidth=2.5,label='Frequência proxy'); ax2.set_ylabel('Impressões / alcance', color=GREEN); ax2.set_ylim(1.0,1.48); ax2.tick_params(axis='y',colors=GREEN,length=0); ax2.spines[['top','left']].set_visible(False)
for i,v in enumerate(freq): ax2.text(i,v-0.055,f'{v:.2f}x',ha='center',color=GREEN,fontweight='bold')
lines, labs = ax1.get_legend_handles_labels(); lines2,labs2=ax2.get_legend_handles_labels(); ax1.legend(lines+lines2,labs+labs2,frameon=False,loc='upper left',fontsize=9)
fig.text(0.05,0.01,'Proxy = impressões / alcance reportado. Não é alcance único cross-platform; Google não expôs reach no catálogo usado.',fontsize=9,color='#6B7280')
fig.tight_layout(rect=[0,0.06,1,1])
fig.savefig(OUT/'04_alcance_frequencia_proxy.png', bbox_inches='tight')
plt.close(fig)

# 5. Programmatic Display / Push
fig, axs = plt.subplots(1, 2, figsize=(12, 4.8), dpi=160)
fig.patch.set_facecolor('white')
months=['Ago/26','Set/26\n01–22']
disp=prog['2026-08']['programmaticOnly']['display']; disp2=prog['2026-09']['programmaticOnly']['display']
spend=[disp['spend']/1000,disp2['spend']/1000]; imps=[disp['impressions']/1e6,disp2['impressions']/1e6]; clicks=[disp['clicks'],disp2['clicks']]
for ax,title,vals,fmt in [ (axs[0],'Display — investimento (R$ mil)',spend,'R$ {:.1f}k'), (axs[1],'Display — impressões (M)',imps,'{:.2f}M') ]:
    bars=ax.bar(months,vals,color=[ORANGE,BLUE],width=.6); ax.set_title(title,color=NAVY,loc='left',pad=12,fontsize=13); ax.spines[['top','right','left']].set_visible(False); ax.spines['bottom'].set_color(LIGHT); ax.grid(axis='y',color=LIGHT,linewidth=.8); ax.set_axisbelow(True); ax.tick_params(axis='both',colors=NAVY,length=0)
    for bar,val in zip(bars,vals): ax.text(bar.get_x()+bar.get_width()/2,bar.get_height()+max(vals)*.04,fmt.format(val),ha='center',color=NAVY,fontweight='bold')
    ax.margins(y=.2)
fig.suptitle('Programática Display: cobertura comprovada; venda direta não atribuída',x=.05,ha='left',fontsize=16,color=NAVY,fontweight='bold')
fig.text(.05,.01,'Push em agosto: 6.768 disparos e 28 cliques; Display: 1.500 cliques no bimestre. Auditoria RD→Bitrix: 31 contatos programáticos, 0 negócios vinculados.',fontsize=9,color='#6B7280')
fig.tight_layout(rect=[0,.06,1,.92]); fig.savefig(OUT/'05_programatica_display_push.png',bbox_inches='tight'); plt.close(fig)

# CSV summary
summary_lines = [
'period,spend,impressions,reach,clicks,platform_leads,cpm,ctr_pct,cpc,platform_cpl',
]
for k,m in zip(keys,media):
    summary_lines.append(','.join(map(str,[k,m['spend'],m['impressions'],m['reach'],m['clicks'],m['platformLeads'],m['spend']/m['impressions']*1000,m['clicks']/m['impressions']*100,m['spend']/m['clicks'],m['spend']/m['platformLeads']])))
summary_lines += ['','bu,period,leads,mql,sql,won_deals,won_value,lead_to_mql_pct,mql_to_sql_pct']
for k in keys:
  for b in periods[k]['funnel']['byBu']:
    t=b['totals']; summary_lines.append(','.join(map(str,[b['brand'],k,t['leads'],t['mql'],t['sql'],t['wonDeals'],t['wonValue'],100*t['mql']/t['leads'],100*t['sql']/t['mql']])))
(OUT/'bbro_estudo_resumo.csv').write_text('\n'.join(summary_lines)+'\n')
print('generated', OUT)
for p in sorted(OUT.iterdir()): print(p.name, p.stat().st_size)
