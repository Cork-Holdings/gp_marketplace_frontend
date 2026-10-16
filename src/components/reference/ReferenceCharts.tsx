import { useId, useState } from 'react';

export type ChartPoint = { label: string; value: number; count?: number };
const COLORS = ['#257DC1','#30C5F4','#f5b82e','#ef486d','#8e9bb5'];

export function TrendChart({ points, valueLabel, countLabel, money = true, area = false }: { points: ChartPoint[]; valueLabel: string; countLabel?: string; money?: boolean; area?: boolean }) {
  const id = useId();
  const [showValue,setShowValue] = useState(true);
  const [showCount,setShowCount] = useState(true);
  const values = points.map(point=>Number.isFinite(point.value) ? point.value : 0);
  const min = Math.min(0,...values), max = Math.max(1,...values);
  const countMax = area ? max : Math.max(1,...points.map(point=>point.count??0));
  const left = 43, right = countLabel ? 525 : 560, top = 15, bottom = 155;
  const x = (index:number)=>left+(index+.5)*(right-left)/Math.max(1,points.length);
  const y = (value:number)=>bottom-(value-min)/(max-min)*(bottom-top);
  const yc = (count:number)=>bottom-count/countMax*(bottom-top);
  const seriesPath = points.map((point,index)=>`${index ? 'L' : 'M'}${x(index)},${y(point.value)}`).join(' ');
  const countPath = points.map((point,index)=>`${index ? 'L' : 'M'}${x(index)},${yc(point.count??0)}`).join(' ');
  const format = (value:number)=>`${money ? 'K' : ''}${Math.abs(value)>=1000000?(value/1000000).toFixed(1)+'M':Math.abs(value)>=1000?(value/1000).toFixed(1)+'K':value.toFixed(money?2:0)}`;
  return <div className="reference-chart-body">
    <p id={`${id}-summary`} className="sr-only">{valueLabel} across {points.length} dates. Exact amounts are available in the data table.</p>
    <div className="reference-chart-legend">
      <button type="button" aria-pressed={showValue} onClick={()=>setShowValue(!showValue)}><span className="reference-chart-dot" style={{background:COLORS[0]}}/>{valueLabel}</button>
      {countLabel&&<button type="button" aria-pressed={showCount} onClick={()=>setShowCount(!showCount)}><span className="reference-chart-dot" style={{background:COLORS[1]}}/>{countLabel}</button>}
    </div>
    <svg className="reference-chart" viewBox="0 0 585 182" role="img" aria-describedby={`${id}-summary`} aria-label={`${valueLabel}${countLabel ? ` and ${countLabel}` : ''}`}>
      {[0,.25,.5,.75,1].map(step=><g key={step}><line x1={left} x2={right} y1={y(min+(max-min)*step)} y2={y(min+(max-min)*step)} stroke="#e9edf5"/><text x={left-8} y={y(min+(max-min)*step)+3} textAnchor="end">{format(min+(max-min)*step)}</text>{countLabel&&<text x={right+9} y={bottom-step*(bottom-top)+3}>{Math.round(step*countMax).toLocaleString('en-ZM')}</text>}</g>)}
      {showValue&&(area?<><path d={`${seriesPath}L${x(points.length-1)},${bottom}L${x(0)},${bottom}Z`} fill="#30C5F4" opacity=".24"/><path d={seriesPath} stroke={COLORS[0]} strokeWidth="3" fill="none"/></>:points.map((point,index)=><rect key={point.label} x={x(index)-(right-left)/points.length*.32} width={(right-left)/points.length*.64} y={Math.min(y(point.value),y(0))} height={Math.abs(y(point.value)-y(0))} rx="2" fill={COLORS[0]} tabIndex={0}><title>{point.label}: {valueLabel} {format(point.value)}</title></rect>))}
      {countLabel&&showCount&&<><path d={countPath} stroke={COLORS[1]} strokeWidth="2.2" fill="none"/>{points.map((point,index)=><circle key={point.label} cx={x(index)} cy={yc(point.count??0)} r="2.7" fill={COLORS[1]} tabIndex={0}><title>{point.label}: {countLabel} {point.count??0}</title></circle>)}</>}
      {points.filter((_,index)=>index===0||index===points.length-1||index%Math.max(1,Math.ceil(points.length/6))===0).map(point=><text key={point.label} x={x(points.indexOf(point))} y="176" textAnchor="middle">{point.label}</text>)}
      {countLabel&&<text x="581" y="80" transform="rotate(-90 581 80)" textAnchor="middle">{countLabel}</text>}
    </svg>
    <details className="reference-chart-data"><summary>View exact values</summary><table><caption className="sr-only">Values underlying {valueLabel}</caption><thead><tr><th scope="col">Date</th><th scope="col">{valueLabel}</th>{countLabel&&<th scope="col">{countLabel}</th>}</tr></thead><tbody>{points.map(point=><tr key={point.label}><th scope="row">{point.label}</th><td>{money ? 'K ' : ''}{point.value.toLocaleString('en-ZM',{maximumFractionDigits:2})}</td>{countLabel&&<td>{point.count??0}</td>}</tr>)}</tbody></table></details>
  </div>;
}

export type DonutSlice = { label:string; value:number; color?:string };
export function DonutChart({ slices, label, center, unit }: { slices:DonutSlice[]; label:string; center?:string; unit?:string }) {
  const total=slices.reduce((sum,slice)=>sum+Math.max(0,slice.value),0);
  const circumference=2*Math.PI*46;
  let offset=0;
  return <div className="reference-donut-layout">
    <svg className="reference-donut" viewBox="0 0 120 120" role="img" aria-label={`${label}: ${total.toLocaleString('en-ZM')}`}>
      <circle cx="60" cy="60" r="46" fill="none" stroke="#edf1f7" strokeWidth="17"/>
      {total>0&&slices.map((slice,index)=>{const length=Math.max(0,slice.value)/total*circumference;const start=offset;offset+=length;return <circle key={slice.label} cx="60" cy="60" r="46" fill="none" stroke={slice.color??COLORS[index%COLORS.length]} strokeWidth="17" strokeDasharray={`${length} ${circumference-length}`} strokeDashoffset={-start} transform="rotate(-90 60 60)"><title>{slice.label}: {slice.value} ({Math.round(slice.value/total*100)}%)</title></circle>;})}
      <text x="60" y="61" textAnchor="middle" fill="#10182B" fontSize="16" fontWeight="700">{center??total.toLocaleString('en-ZM')}</text><text x="60" y="73" textAnchor="middle" fill="#65718e" fontSize="8">{unit??label}</text>
    </svg>
    <ul className="reference-donut-legend" aria-label={`${label} breakdown`}>{slices.map((slice,index)=><li key={slice.label}><span className="reference-chart-dot" style={{background:slice.color??COLORS[index%COLORS.length]}}/><div>{slice.label}<strong>{slice.value.toLocaleString('en-ZM')} {total>0?`(${Math.round(slice.value/total*100)}%)`:''}</strong></div></li>)}</ul>
  </div>;
}

export function HealthGauge({ score }: { score:number }) {
  const value=Math.max(0,Math.min(100,score));
  return <svg className="reference-health-gauge" viewBox="0 0 120 120" role="img" aria-label={`Sample business health score ${value} out of 100`}><circle cx="60" cy="60" r="46" fill="none" stroke="#d9eaf8" strokeWidth="9"/><circle cx="60" cy="60" r="46" fill="none" stroke="#257DC1" strokeWidth="9" strokeLinecap="round" strokeDasharray={`${value/100*289} 289`} transform="rotate(-90 60 60)"/><text x="60" y="61" textAnchor="middle" fontSize="26" fontWeight="700" fill="#10182B">{value}</text><text x="60" y="80" textAnchor="middle" fontSize="11" fill="#65718e">/ 100</text></svg>;
}
