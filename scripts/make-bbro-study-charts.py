import json
from pathlib import Path
import matplotlib.pyplot as plt
import numpy as np

BASE = Path('/tmp/bbro-study-data-2026-09-25.json')
OUT = Path('/home/ubuntu/research/bbro-study-charts')
OUT.mkdir(parents=True, exist_ok=True)
data = json.loads(BASE.read_text())
periods = data['periods']
labels = ['Julho', 'Agosto', 'Setembro\n01–23']
navy = '#071B46'; blue = '#0047BB'; green = '#059669'; orange = '#D97706'; magenta = '#C026D3'; grey = '#64748B'; light = '#EEF3F8'
plt.rcParams.update({'font.family':'DejaVu Sans','axes.titleweight':'bold','axes.titlesize':14,'axes.labelsize':10,'xtick.labelsize':10,'ytick.labelsize':10})

def brl(v):
    return f'R$ {v/1000:.1f} mil'

def savefig(name):
    plt.tight_layout(pad=1.2)
    plt.savefig(OUT/name, dpi=180, bbox_inches='tight', facecolor='white')
    plt.close()

# 1. Media timeline
spend = [p['media']['totals']['spend']/1000 for p in periods]
imps = [p['media']['totals']['impressions']/1e6 for p in periods]
platform = [p['media']['totals']['platformLeads'] for p in periods]
fig, ax = plt.subplots(1,2,figsize=(11,4.5), gridspec_kw={'width_ratios':[1,1]})
fig.suptitle('Mídia paga: escala, exposição e resultado de plataforma', color=navy, fontsize=17, fontweight='bold', x=.05, ha='left')
ax[0].bar(labels, spend, color=[grey, blue, green], width=.55)
ax[0].set_title('Investimento Windsor.ai')
ax[0].set_ylabel('R$ mil')
ax[0].grid(axis='y', color='#E2E8F0', linewidth=.8)
ax[0].set_axisbelow(True)
for i,v in enumerate(spend): ax[0].text(i,v+.8, f'R$ {v:.1f}k', ha='center', color=navy, fontweight='bold')
ax[1].bar(labels, imps, color=[grey, blue, green], width=.55, label='Impressões')
ax[1].set_title('Impressões e conversões da plataforma')
ax[1].set_ylabel('Impressões (milhões)')
ax[1].grid(axis='y', color='#E2E8F0', linewidth=.8); ax[1].set_axisbelow(True)
for i,(v,lead) in enumerate(zip(imps,platform)):
    ax[1].text(i,v+.08, f'{v:.2f}M', ha='center', color=navy, fontweight='bold')
    ax[1].text(i, max(v*.48,.12), f'{lead:,.0f} conv.\nplataforma'.replace(',','.'), ha='center', color='white', fontsize=9, fontweight='bold')
fig.text(.05,.01,'Fonte: Windsor.ai, nível campanha, quatro contas oficiais. Conversões de plataforma não são contatos únicos de CRM.', fontsize=8, color=grey)
savefig('01-media-timeline.png')

# 2. Funnel by BU Jul/Aug
metrics = ['leads','mql','sql']
metric_labels = ['Leads técnicos','MQL','SQL']
fig, axes = plt.subplots(1,3,figsize=(12,4.7), sharey=False)
fig.suptitle('Funil comercial: volume cresce, progressão precisa acompanhar', color=navy, fontsize=17, fontweight='bold', x=.05, ha='left')
for ax,metric,mlabel in zip(axes,metrics,metric_labels):
    med = [periods[0]['funnel']['byBu'][0]['totals'][metric], periods[1]['funnel']['byBu'][0]['totals'][metric]]
    beauty = [periods[0]['funnel']['byBu'][1]['totals'][metric], periods[1]['funnel']['byBu'][1]['totals'][metric]]
    x=np.arange(2); w=.34
    ax.bar(x-w/2, med, w, label='MedSystems', color=blue)
    ax.bar(x+w/2, beauty, w, label='BeautySystems', color=orange)
    ax.set_xticks(x, ['Julho','Agosto']); ax.set_title(mlabel)
    ax.grid(axis='y', color='#E2E8F0', linewidth=.8); ax.set_axisbelow(True)
    for xi,v in zip(x-w/2,med): ax.text(xi,v+max(med+beauty)*.02,f'{v:,.0f}'.replace(',','.'),ha='center',fontsize=9,color=navy)
    for xi,v in zip(x+w/2,beauty): ax.text(xi,v+max(med+beauty)*.02,f'{v:,.0f}'.replace(',','.'),ha='center',fontsize=9,color=navy)
axes[0].set_ylabel('Quantidade')
axes[0].legend(frameon=False, loc='upper left', fontsize=9)
fig.text(.05,.01,'Fonte: Bitrix24, leads de Tráfego Pago no recorte completo do mês; a linha técnica pode conter candidatos múltiplos.', fontsize=8, color=grey)
savefig('02-funnel-by-bu.png')

# 3. Reach/frequency
meta = json.loads(Path('/tmp/meta-reach-frequency-summary.json').read_text())
mkeys=['2026-07','2026-08','2026-09-mtd']
meta_imps=[meta[k]['impressions']/1e6 for k in mkeys]; meta_reach=[meta[k]['reported_reach_sum']/1e6 for k in mkeys]; freq=[meta[k]['frequency_impressions_over_reach_sum'] for k in mkeys]
fig, ax = plt.subplots(1,2,figsize=(11,4.5), gridspec_kw={'width_ratios':[1.15,.85]})
fig.suptitle('Alcance e frequência: leitura de exposição, não de pessoas deduplicadas', color=navy, fontsize=16, fontweight='bold', x=.05, ha='left')
x=np.arange(3); w=.34
ax[0].bar(x-w/2, meta_imps,w,label='Impressões',color=blue)
ax[0].bar(x+w/2, meta_reach,w,label='Alcance reportado somado',color=green)
ax[0].set_xticks(x,['Julho','Agosto','Setembro\n01–24']); ax[0].set_ylabel('Milhões de eventos reportados')
ax[0].grid(axis='y',color='#E2E8F0',linewidth=.8); ax[0].set_axisbelow(True); ax[0].legend(frameon=False,fontsize=9)
for i,v in enumerate(meta_imps): ax[0].text(i-w/2,v+.05,f'{v:.2f}M',ha='center',fontsize=9,color=navy)
for i,v in enumerate(meta_reach): ax[0].text(i+w/2,v+.05,f'{v:.2f}M',ha='center',fontsize=9,color=navy)
ax[1].plot(['Julho','Agosto','Setembro\n01–24'],freq,color=orange,marker='o',linewidth=3)
ax[1].set_ylim(0.95,1.25); ax[1].set_ylabel('Frequência proxy = impressões / reach somado')
ax[1].grid(axis='y',color='#E2E8F0',linewidth=.8); ax[1].set_axisbelow(True)
for i,v in enumerate(freq): ax[1].text(i,v+.015,f'{v:.2f}x',ha='center',color=navy,fontweight='bold')
fig.text(.05,.01,'Meta Ads: Windsor.ai. Alcance é somado por dia/campanha e não representa pessoas únicas entre dias ou campanhas.',fontsize=8,color=grey)
savefig('03-reach-frequency.png')

# 4. Wins and value
fig, ax1 = plt.subplots(figsize=(10.5,4.7))
fig.suptitle('Negócios ganhos registrados no Bitrix24: crescimento de julho para agosto', color=navy, fontsize=16, fontweight='bold', x=.05, ha='left')
won=[sum(p['funnel']['byBu'][i]['totals']['wonDeals'] for i in range(2)) for p in periods]
value=[sum(p['funnel']['byBu'][i]['totals']['wonValue'] for i in range(2))/1e6 for p in periods]
ax2=ax1.twinx(); x=np.arange(3)
ax1.bar(x,won,color=[grey,green,blue],width=.55)
ax2.plot(x,value,color=orange,marker='o',linewidth=3)
ax1.set_xticks(x,['Julho','Agosto','Setembro\n01–23']); ax1.set_ylabel('Quantidade de negócios ganhos'); ax2.set_ylabel('Valor de negócios ganhos (R$ milhões)')
ax1.grid(axis='y',color='#E2E8F0',linewidth=.8); ax1.set_axisbelow(True)
for i,(n,v) in enumerate(zip(won,value)):
    ax1.text(i,n+2,str(n),ha='center',color=navy,fontweight='bold')
    ax2.text(i,v+.45,f'R$ {v:.1f}M',ha='center',color=orange,fontweight='bold')
fig.text(.05,.01,'Fonte: Bitrix24, negócios em estágio ganho e fechamento no período. Valor de negócio não é receita reconhecida e não é atribuído automaticamente à mídia.',fontsize=8,color=grey)
savefig('04-wins-value.png')
print('\n'.join(str(p) for p in sorted(OUT.glob('*.png'))))
