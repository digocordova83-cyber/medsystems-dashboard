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

# 4. Reach and frequency evolution
# This view uses the same consolidated Meta + Google series as the scale chart.
# Frequency is impressions / reported reach, not deduplicated cross-platform frequency.
spend = [m['spend']/1000 for m in media]
reach = [m['reach']/1e6 for m in media]
imps = [m['impressions']/1e6 for m in media]
freq = [m['impressions']/m['reach'] for m in media]
fig, axs = plt.subplots(1, 3, figsize=(14, 4.8), dpi=160)
fig.patch.set_facecolor('white')
series = [(axs[0], 'Investimento disponível (R$ mil)', spend, 'R$ {:.1f}k', BLUE), (axs[1], 'Alcance reportado (M)', reach, '{:.2f}M', GREEN), (axs[2], 'Frequência média (x)', freq, '{:.2f}x', ORANGE)]
for ax, title, vals, fmt, color in series:
    bars = ax.bar(labels, vals, color=[GREY, BLUE, GREEN], width=.62)
    ax.set_title(title, color=NAVY, loc='left', pad=12, fontsize=13)
    ax.spines[['top','right','left']].set_visible(False); ax.spines['bottom'].set_color(LIGHT)
    ax.grid(axis='y', color=LIGHT, linewidth=.8); ax.set_axisbelow(True); ax.tick_params(axis='both', colors=NAVY, length=0)
    for bar, val in zip(bars, vals):
        ax.text(bar.get_x()+bar.get_width()/2, bar.get_height()+max(vals)*.035, fmt.format(val), ha='center', va='bottom', fontsize=10, color=NAVY, fontweight='bold')
    ax.margins(y=.22)
fig.suptitle('Mais cobertura com verba limitada: o trade-off foi reduzir repetição', x=.05, ha='left', fontsize=16, color=NAVY, fontweight='bold')
fig.text(.05, .01, 'Julho e agosto fechados; setembro = 01–23/09. Frequência = impressões / alcance reportado. O alcance não é pessoa única cross-platform.', fontsize=9, color='#6B7280')
fig.tight_layout(rect=[0, .06, 1, .92])
fig.savefig(OUT/'04_alcance_frequencia_proxy.png', bbox_inches='tight')
plt.close(fig)

# 5. Programmatic Display / Push
fig, axs = plt.subplots(2, 2, figsize=(13.5, 6.0), dpi=160)
fig.patch.set_facecolor('white')
months=['Ago/26','Set/26\n01–22']
disp=prog['2026-08']['programmaticOnly']['display']; disp2=prog['2026-09']['programmaticOnly']['display']
spend=[disp['spend']/1000,disp2['spend']/1000]
imps=[disp['impressions']/1e6,disp2['impressions']/1e6]
reach=[disp['reach']/1e3,disp2['reach']/1e3]
freq=[disp['impressions']/disp['reach'],disp2['impressions']/disp2['reach']]
series=[(axs[0,0],'Investimento (R$ mil)',spend,'R$ {:.1f}k'),(axs[0,1],'Impressões (M)',imps,'{:.2f}M'),(axs[1,0],'Alcance reportado (mil)',reach,'{:.0f}k'),(axs[1,1],'Frequência média',freq,'{:.2f}x')]
for ax,title,vals,fmt in series:
    bars=ax.bar(months,vals,color=[ORANGE,BLUE],width=.6)
    ax.set_title(title,color=NAVY,loc='left',pad=10,fontsize=13)
    ax.spines[['top','right','left']].set_visible(False); ax.spines['bottom'].set_color(LIGHT)
    ax.grid(axis='y',color=LIGHT,linewidth=.8); ax.set_axisbelow(True); ax.tick_params(axis='both',colors=NAVY,length=0)
    for bar,val in zip(bars,vals): ax.text(bar.get_x()+bar.get_width()/2,bar.get_height()+max(vals)*.04,fmt.format(val),ha='center',color=NAVY,fontweight='bold')
    ax.margins(y=.2)
fig.suptitle('Programática Display: geolocalização abre cobertura com verba controlada',x=.05,ha='left',fontsize=16,color=NAVY,fontweight='bold')
fig.text(.05,.01,'Ago → Set parcial: verba -33%, alcance +110%, impressões +54% e frequência 3,95x → 2,90x. Push em agosto: 6.768 disparos e 28 cliques.',fontsize=9,color='#6B7280')
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
