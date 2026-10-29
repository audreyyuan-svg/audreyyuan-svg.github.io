const { React: R } = window.AITrackerRuntime;
const h = R.createElement;
const colors = ['#181865', '#3479ed', '#12b9d7', '#d34c57'];
const css = `.market-dashboard{margin:20px 0 30px;padding:24px;border:1px solid #dedfe8;border-radius:16px;background:#fff}.market-dashboard h3{font-size:17px;margin:0 0 15px;color:#20235a}.market-dashboard h3 small{font-weight:400;font-size:12px;color:#777;margin-left:12px}.market-kpis{display:grid;grid-template-columns:repeat(5,1fr);background:#121653;color:white;border-radius:10px;overflow:hidden}.market-kpi{padding:18px 15px;border-right:1px solid #ffffff26}.market-kpi:last-child{border:0}.market-kpi span,.market-kpi small{display:block;font-size:12px;color:#d2d8f0}.market-kpi strong{display:block;font-size:26px;letter-spacing:-1px;margin:9px 0}.market-kpi b{font-size:17px}.market-up{color:#c84b48}.market-down{color:#218675}.market-kpis .market-up{color:#ff9992}.market-kpis .market-down{color:#69d6c4}.market-sub{margin:10px 0 24px;font-size:11px;line-height:1.8;color:#737687}.market-daily-bars{display:grid;grid-template-columns:1fr 1fr;gap:12px 28px;margin-bottom:24px}.market-bar-row{display:grid;grid-template-columns:76px 1fr 62px;align-items:center;gap:8px;font-size:12px}.market-bar-track{background:#f0f2f7;height:18px;display:flex;align-items:center;position:relative;border-radius:3px;overflow:hidden}.market-bar-track:before{content:'';position:absolute;left:50%;height:100%;border-left:1px solid #c4c9d5}.market-bar-fill{height:10px;position:absolute;border-radius:2px}.market-movers{width:100%;border-collapse:collapse;font-size:12px}.market-movers td,.market-movers th{padding:12px 8px;border-bottom:1px solid #e7e9ef;text-align:left;vertical-align:top}.market-movers th{background:#f5f6fb;color:#6c7186;font-weight:500}.market-movers small{display:block;color:#798096;line-height:1.6;margin-top:4px}.market-movers a{color:#292e67;text-decoration:none}.market-chart-note{background:#f6f7fb;border-left:3px solid #929cc3;padding:14px 16px;margin-top:18px;color:#747c92;font-size:12px;line-height:1.8}.market-chart-svg{width:100%;height:auto;display:block}.market-chart-legend{display:flex;gap:18px;flex-wrap:wrap;font-size:11px;margin:18px 0 8px}.market-chart-legend i{display:inline-block;width:16px;height:3px;margin:0 5px 3px 0}.market-source-list{font-size:11px;color:#81879a;line-height:1.8;margin-top:16px}.market-source-list a{color:inherit;margin-right:12px}@media(max-width:760px){.market-dashboard{padding:16px 12px}.market-kpis{grid-template-columns:repeat(2,1fr)}.market-kpi{padding:14px}.market-kpi:last-child{grid-column:1/-1}.market-kpi strong{font-size:23px}.market-daily-bars{grid-template-columns:1fr}.market-movers td,.market-movers th{padding:10px 4px}.market-movers{display:block;overflow-x:auto}.market-movers .market-catalyst{min-width:190px}.market-movers td{min-width:70px}.market-dashboard h3 small{display:block;margin:6px 0}.market-movers{font-size:11px}}`;
function fmt(n, digits=2) { return Number.isFinite(n) ? `${n>0?'+':''}${n.toFixed(digits)}%` : '未核验'; }
function tone(n) { return n >= 0 ? 'market-up' : 'market-down'; }
function safeUrl(value) { try { const u=new URL(value); return /https?:/.test(u.protocol)?u.href:undefined; } catch { return undefined; } }
function Trend({ chart }) {
  const series=(chart?.series || []).filter(s=>s.points?.length>1);
  if (!series.length) return h('div',{className:'market-chart-note'},h('b',null,'年内走势 · 数据缺口'),h('div',null,chart?.gap || 'SOX、四大CSP等权、IGV与10年美债历史序列尚未完整核验；不使用示意曲线或截图估值。'));
  const dates=[...new Set(series.flatMap(s=>s.points.map(p=>p.date)))].sort();
  const w=920,H=340,pad={l:48,r:52,t:20,b:35};
  const domain=axis=>{const v=series.filter(s=>(s.axis||'left')===axis).flatMap(s=>s.points.map(p=>p.value).filter(Number.isFinite));if(!v.length)return [0,1];const min=Math.min(...v),max=Math.max(...v),margin=(max-min||1)*.1;return [min-margin,max+margin];};
  const left=domain('left'),right=domain('right');
  const xx=d=>pad.l+dates.indexOf(d)/Math.max(1,dates.length-1)*(w-pad.l-pad.r);
  const yy=(v,axis)=>{const [lo,hi]=axis==='right'?right:left;return H-pad.b-(v-lo)/(hi-lo)*(H-pad.t-pad.b);};
  return h(R.Fragment,null,
    h('div',{className:'market-chart-legend'},series.map((s,i)=>h('span',{key:s.name},h('i',{style:{background:colors[i%4]}}),s.name,s.axis==='right'?'（右轴，%）':''))),
    h('svg',{className:'market-chart-svg',viewBox:`0 0 ${w} ${H}`,role:'img','aria-label':'SOX、四大CSP等权、IGV及10年美债历史走势'},
      [0,.25,.5,.75,1].map((r,i)=>{const y=pad.t+r*(H-pad.t-pad.b);return h('g',{key:i},h('line',{x1:pad.l,y1:y,x2:w-pad.r,y2:y,stroke:'#e9ecf3'}),h('text',{x:pad.l-8,y:y+4,textAnchor:'end',fontSize:11,fill:'#7d8495'},(left[1]-r*(left[1]-left[0])).toFixed(0)),h('text',{x:w-pad.r+8,y:y+4,fontSize:11,fill:'#d34c57'},(right[1]-r*(right[1]-right[0])).toFixed(2)));}),
      series.map((s,i)=>{let prev=-2;const path=s.points.filter(p=>Number.isFinite(p.value)).map(p=>{const pos=dates.indexOf(p.date);const cmd=pos===prev+1?'L':'M';prev=pos;return `${cmd}${xx(p.date).toFixed(1)},${yy(p.value,s.axis).toFixed(1)}`;}).join(' ');return h('path',{key:s.name,d:path,fill:'none',stroke:colors[i%4],strokeWidth:2});}),
      [dates[0],dates[Math.floor((dates.length-1)/2)],dates[dates.length-1]].map((d,i)=>h('text',{key:i,x:xx(d),y:H-8,textAnchor:'middle',fontSize:11,fill:'#7d8495'},d))),
    h('p',{className:'market-sub'},chart.methodology));
}
export default function MarketDashboard({ data }) {
  if (!data) return null;
  const perf=data.performance || []; const max=Math.max(1,...perf.map(x=>Math.abs(x.changePct)));
  return h('section',{className:'market-dashboard','aria-label':'每日市场图表'},h('style',null,css),
    h('h3',null,'01 行情回顾',h('small',null,`${data.tradeDate} · 最近完整常规交易日`)),
    h('div',{className:'market-kpis'},(data.snapshot || []).map(x=>h('div',{className:'market-kpi',key:x.label},h('span',null,x.label),h('strong',null,x.displayValue),h('b',{className:tone(x.change)},x.displayChange),x.note&&h('small',null,x.note)))),
    h('p',{className:'market-sub'},data.snapshotNote),
    h('h3',null,'02 市场强弱',h('small',null,'涨跌幅 % · 同一交易日，非资金净流入')),
    h('div',{className:'market-daily-bars'},perf.map(x=>h('div',{className:'market-bar-row',key:x.name},h('span',null,x.name),h('div',{className:'market-bar-track'},h('i',{className:'market-bar-fill',style:{left:x.changePct>=0?'50%':`${50-Math.abs(x.changePct)/max*48}%`,width:`${Math.abs(x.changePct)/max*48}%`,background:x.changePct>=0?'#c55e59':'#2b9587'}})),h('b',{className:tone(x.changePct)},fmt(x.changePct))))),
    h('h3',null,'03 科技异动精选',h('small',null,'每日筛选 · 不固定公司')),
    h('table',{className:'market-movers'},h('thead',null,h('tr',null,['公司／时段','涨跌幅','量能','催化与分歧'].map((v,i)=>h('th',{key:v,className:i===3?'market-catalyst':''},v)))),h('tbody',null,(data.movers||[]).map(x=>h('tr',{key:x.symbol},h('td',null,h('a',{href:safeUrl(x.url),target:'_blank',rel:'noreferrer'},h('b',null,x.name),` · ${x.symbol}`),h('small',null,`${x.session} · ${x.asOf}`)),h('td',{className:tone(x.changePct)},h('b',null,fmt(x.changePct))),h('td',null,x.relativeVolume20d!=null?`${x.relativeVolume20d.toFixed(2)}×20日均量`:'20日量比未核验',h('small',null,x.volumeNote||'不能据此认定放量')),h('td',{className:'market-catalyst'},x.catalyst))))),
    h('p',{className:'market-sub'},data.selectionNote),
    data.trend?.series?.length === 4 && data.trend.series.every(s => s.points?.length > 1 && s.points.length === data.trend.series[0].points.length && s.points.every((p,i) => Number.isFinite(p.value) && p.date === data.trend.series[0].points[i].date)) && h(R.Fragment,null,
      h('h3',null,'04 重点趋势',h('small',null,'SOX · 四大CSP等权 · IGV · 10年美债')),
      h(Trend,{chart:data.trend})),
    h('div',{className:'market-source-list'},'数据来源：',(data.sources||[]).map(x=>h('a',{key:x.url,href:safeUrl(x.url),target:'_blank',rel:'noreferrer'},x.name,' ↗'))));
}
