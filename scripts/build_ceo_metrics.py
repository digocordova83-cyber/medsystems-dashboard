import json

funnel = json.load(open('/tmp/ceo_funnel_audit.json', encoding='utf-8'))
rd = json.load(open('/tmp/ceo_rd_audit.json', encoding='utf-8'))
publya = json.load(open('/tmp/ceo_publya_audit.json', encoding='utf-8'))

media = {
    'july': {
        'medsystems': {'spend': 6888.85 + 16672.89, 'results': 94 + 368},
        'beautysystems': {'spend': 4706.30 + 21580.74, 'results': 22 + 455},
    },
    'august': {
        'medsystems': {'spend': 7512.45 + 31548.96, 'results': 106 + 456},
        'beautysystems': {'spend': 7058.05 + 27945.24, 'results': 29 + 461},
    },
}

def pct(new, old):
    return ((new / old) - 1) * 100 if old else None

def pp(new, old):
    return new - old

def funnel_row(bu):
    july = funnel['july'][bu]
    aug = funnel['august'][bu]
    jt, at = july['totals'], aug['totals']
    jf = {row['key']: row for row in july['funnel']}
    af = {row['key']: row for row in aug['funnel']}
    return {
        'july': jt,
        'august': at,
        'delta': {
            'leads_pct': pct(at['leads'], jt['leads']),
            'mql_pct': pct(at['mql'], jt['mql']),
            'sql_pct': pct(at['sql'], jt['sql']),
            'deals_pct': pct(at['dealLeads'], jt['dealLeads']),
            'discarded_pct': pct(at['discardedLeads'], jt['discardedLeads']),
            'lead_to_mql_pp': pp(af['mql']['conversionFromPrevious'], jf['mql']['conversionFromPrevious']),
            'mql_to_sql_pp': pp(af['sql']['conversionFromPrevious'], jf['sql']['conversionFromPrevious']),
        },
        'rates': {
            'july_lead_to_mql': jf['mql']['conversionFromPrevious'],
            'august_lead_to_mql': af['mql']['conversionFromPrevious'],
            'july_mql_to_sql': jf['sql']['conversionFromPrevious'],
            'august_mql_to_sql': af['sql']['conversionFromPrevious'],
        }
    }

def media_row(bu):
    july = media['july'][bu]
    aug = media['august'][bu]
    return {
        'july': {**july, 'cpr': july['spend'] / july['results']},
        'august': {**aug, 'cpr': aug['spend'] / aug['results']},
        'delta': {
            'spend_pct': pct(aug['spend'], july['spend']),
            'results_pct': pct(aug['results'], july['results']),
            'cpr_pct': pct(aug['spend'] / aug['results'], july['spend'] / july['results']),
        }
    }

media['july']['all'] = {
    'spend': sum(v['spend'] for v in media['july'].values()),
    'results': sum(v['results'] for v in media['july'].values()),
}
media['august']['all'] = {
    'spend': sum(v['spend'] for v in media['august'].values()),
    'results': sum(v['results'] for v in media['august'].values()),
}

output = {
    'cutoff': {
        'funnel_rd_windsor_comparison': '01-26/07/2026 vs 01-26/08/2026',
        'publya': 'até 28/08/2026',
    },
    'funnel': {
        'all': funnel_row('allPaidTraffic'),
        'medsystems': funnel_row('medsystems'),
        'beautysystems': funnel_row('beautysystems'),
    },
    'rd': {
        bu: {
            'july': rd['july'][bu],
            'august': rd['august'][bu],
            'delta': {
                'converted_pct': pct(rd['august'][bu]['convertedContacts'], rd['july'][bu]['convertedContacts']),
                'utm_pct': pct(rd['august'][bu]['utmLeads'], rd['july'][bu]['utmLeads']),
            },
        } for bu in ('medsystems', 'beautysystems')
    },
    'media': {
        'all': media_row('all'),
        'medsystems': media_row('medsystems'),
        'beautysystems': media_row('beautysystems'),
    },
    'publya': {
        'totals': publya['totals'],
        'campaigns': publya['campaigns'],
        'push': publya['push'],
        'top_sites': publya['sites'][:3],
        'top_formats': publya['formats'][:3],
        'quality': publya['quality'],
        'warnings': publya['warnings'],
    },
}

with open('/tmp/ceo_metrics.json', 'w', encoding='utf-8') as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print('Métricas consolidadas: /tmp/ceo_metrics.json')
