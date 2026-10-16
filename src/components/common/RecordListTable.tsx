import { Fragment, cloneElement, isValidElement, useId, useState, type ReactElement, type ReactNode, type TableHTMLAttributes } from 'react';
import { recordElements as elements } from '@/lib/recordElements';
import { useWorkflowView } from '@/hooks/useWorkflowView';
import { WORKFLOW_VIEWS, workflowGroup } from '@/lib/workflowView';
import './record-list-table.css';

type Element = ReactElement<Record<string, unknown>>;
function recordText(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(recordText).join(' ');
  if (!isValidElement(node)) return '';
  const props = node.props as {children?:ReactNode;status?:string};
  return props.status ?? recordText(props.children);
}

/** Enhances existing semantic record tables without replacing their actions or API calls. */
export function RecordListTable({children, ...props}: TableHTMLAttributes<HTMLTableElement>) {
  const {view,setView} = useWorkflowView();
  const prefix = useId();
  const [selected,setSelected] = useState<string>();
  const [expanded,setExpanded] = useState<Set<string>>(()=>new Set());
  const sections = elements(children);
  const head = sections.find(node=>node.type==='thead');
  const body = sections.find(node=>node.type==='tbody');
  const headers = elements(elements(head?.props.children as ReactNode)[0]?.props.children as ReactNode);
  const rows = elements(body?.props.children as ReactNode);
  const regular = rows.filter(row=>elements(row.props.children as ReactNode).length===headers.length && !elements(row.props.children as ReactNode).some(cell=>Number(cell.props.colSpan)>1));
  // Complex editor/subtotal rows retain their exact original DOM and behaviour.
  if (!headers.length || !regular.length || regular.length!==rows.length) return <table {...props}>{children}</table>;
  const keys = rows.map((row,index)=>String(row.key ?? index));
  const selectedIndex = Math.max(0,keys.indexOf(selected ?? keys[0]));
  const labels = headers.map((header,index)=>recordText(header.props.children as ReactNode).trim() || (index===headers.length-1?'Actions':`Field ${index+1}`));
  const title = props['aria-label'] ?? 'Records';
  const split = view==='table_detail', expandable = !split;
  const toggle = (key:string) => setExpanded(previous=>{const next=new Set(previous);if(next.has(key))next.delete(key);else next.add(key);return next;});
  const preview = (row:Element) => <dl className="record-list-facts">{elements(row.props.children as ReactNode).map((cell,index)=><div key={index}><dt>{labels[index]}</dt><dd>{cell.props.children as ReactNode}</dd></div>)}</dl>;
  const table = (subset:Element[]) => <table {...props} className={`${props.className ?? ''} record-list-table${view==='business_ledger'?' is-ledger':''}`}>
    {sections.filter(node=>node.type!=='thead' && node.type!=='tbody')}
    {head && cloneElement(head,{},elements(head.props.children as ReactNode).map(row=>cloneElement(row,{},<><th scope="col" className="record-list-control"><span className="sr-only">Preview</span></th>{row.props.children as ReactNode}</>)))}
    <tbody>{subset.map(row=>{
      const index=rows.indexOf(row), key=keys[index], open=expanded.has(key), detailId=`${prefix}-${index}`;
      const rowLabel=recordText(elements(row.props.children as ReactNode)[0]?.props.children as ReactNode) || `Record ${index+1}`;
      return <Fragment key={key}>{cloneElement(row,{className:`${row.props.className ?? ''}${split&&index===selectedIndex?' record-list-selected':''}`},<><td className="record-list-control"><button type="button" aria-label={`${expandable&&open?'Collapse':'Preview'} ${rowLabel}`} aria-expanded={expandable?open:undefined} aria-pressed={split?index===selectedIndex:undefined} aria-controls={expandable?detailId:split?`${prefix}-pane`:undefined} onClick={()=>expandable?toggle(key):setSelected(key)}>{expandable&&open?'⌄':'›'}</button></td>{row.props.children as ReactNode}</>)}
        {expandable&&open&&<tr className="record-list-expanded"><td colSpan={headers.length+1}><div id={detailId}>{preview(row)}</div></td></tr>}
      </Fragment>;
    })}</tbody>
  </table>;
  return <div className={`record-list is-${view}`}>
    <div className="customer-list-view-picker"><label htmlFor={`${prefix}-view`}>List view</label><select id={`${prefix}-view`} value={view} onChange={event=>setView(event.target.value as typeof view)} aria-describedby={`${prefix}-hint`}>{WORKFLOW_VIEWS.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}</select><p id={`${prefix}-hint`}>{WORKFLOW_VIEWS.find(option=>option.value===view)?.description}</p></div>
    {view==='action_queue'?<>{(['attention','ongoing','history'] as const).map(group=>{
      const records=rows.filter(row=>{const cells=elements(row.props.children as ReactNode);const index=labels.findIndex(label=>/status|availability/i.test(label));const status=index>=0?recordText(cells[index]?.props.children as ReactNode).toLowerCase().replaceAll(' ','_'):'';return workflowGroup(status,/pending|requested|draft|low_stock|out_of_stock|unpriced/.test(status))===group;});
      return records.length?<section key={group}><h3 className="record-list-group">{group==='attention'?'Needs attention':group==='history'?'History':'Ongoing'} · {records.length} on this page</h3><div className="record-list-scroll">{table(records)}</div></section>:null;
    })}</>:<div className={split?'record-list-split':''}><div className="record-list-scroll">{table(rows)}</div>{split&&<aside id={`${prefix}-pane`} aria-label={`Selected ${title} overview`}>{preview(rows[selectedIndex])}</aside>}</div>}
  </div>;
}
