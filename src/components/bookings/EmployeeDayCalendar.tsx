import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { bookingScheduleApi, type CalendarEvent, type EmployeeCalendar } from '@/lib/api/services/bookingSchedule';
import { BOOKING_TIMEZONE, bookingDate, bookingTime, visitWindow } from '@/lib/bookingTime';
import { userMessage } from '@/lib/userMessage';
import { calendarLanes, calendarWeek } from '@/lib/visitScheduling';
import { WorkflowIcon } from '@/components/common/WorkflowIcon';
import './employee-calendar.css';

const path=(event:CalendarEvent)=>event.kind==='leave'?'/portal/owner/bookings':`/portal/owner/${event.kind==='booking'?'bookings':event.kind==='quote'?'quotes':'jobs'}?detail=${encodeURIComponent(event.id)}`;
const kindLabel=(event:CalendarEvent)=>event.kind==='leave'?'Unavailable':event.kind==='booking'?'Appointment':event.kind==='quote'?'Accepted estimate':'Service visit';
const initials=(name:string)=>name.split(/\s+/).filter(Boolean).slice(0,2).map(part=>part[0]).join('');
function minute(value:string,day:string) {return (Date.parse(value)-Date.parse(`${day}T00:00:00+02:00`))/60000;}
function dayLabel(date:string,options:Intl.DateTimeFormatOptions) {return new Intl.DateTimeFormat('en-ZM',{timeZone:BOOKING_TIMEZONE,...options}).format(new Date(`${date}T12:00:00+02:00`));}

export function EmployeeDayCalendar({storeId}:{storeId:string}) {
  const [date,setDate]=useState(bookingDate);
  const [employee,setEmployee]=useState('all');
  const [view,setView]=useState<'responsive'|'timeline'|'agenda'>('responsive');
  const [narrow,setNarrow]=useState(()=>window.matchMedia('(max-width:640px)').matches);
  useEffect(()=>{const query=window.matchMedia('(max-width:640px)');const changed=()=>setNarrow(query.matches);query.addEventListener('change',changed);return()=>query.removeEventListener('change',changed);},[]);
  const activeView=view==='responsive' ? narrow?'agenda':'timeline' : view;
  const [revision,setRevision]=useState(0);
  const [result,setResult]=useState<{key:string;data:EmployeeCalendar}|null>(null);
  const [error,setError]=useState('');
  const dateInput=useRef<HTMLInputElement>(null);
  const key=`${storeId}:${date}:${revision}`;
  useEffect(()=>{const refresh=()=>setRevision(n=>n+1);window.addEventListener('geepay:activity-changed',refresh);return()=>window.removeEventListener('geepay:activity-changed',refresh);},[]);
  useEffect(()=>{
    const controller=new AbortController();setError('');
    bookingScheduleApi.calendar(storeId,date,controller.signal).then(data=>{if(!controller.signal.aborted)setResult({key,data});})
      .catch(cause=>{if(!controller.signal.aborted)setError(userMessage(cause,'Could not load the calendar. Try again.'));});
    return()=>controller.abort();
  },[storeId,date,key]);
  const data=result?.key===key ? result.data : null;
  const loading=!data && !error;
  const known=new Set(data?.employees.map(e=>e.id));
  const unassigned=data?.events.some(e=>!e.employee_id || !known.has(e.employee_id));
  const employees=[...(data?.employees ?? []),...(unassigned?[{id:'unassigned',name:'Unassigned'}]:[])];
  const columns=employees.filter(e=>employee==='all' || employee===e.id);
  const eventsFor=(id:string)=>(data?.events ?? []).filter(e=>id==='unassigned' ? !e.employee_id || !known.has(e.employee_id) : e.employee_id===id);
  const relevant=columns.flatMap(e=>eventsFor(e.id));
  const booked=columns.filter(e=>eventsFor(e.id).length>0);
  const fromHour=Math.max(0,Math.min(8,...relevant.map(e=>Math.floor(minute(e.starts_at,date)/60))));
  const toHour=Math.min(24,Math.max(18,...relevant.map(e=>Math.ceil(minute(e.ends_at,date)/60))));
  const today=bookingDate();
  function move(days:number) {setDate(bookingDate(new Date(Date.parse(`${date}T12:00:00+02:00`)+days*86400000)));}
  return <section className="employee-calendar" data-calendar-view={activeView} aria-label="Team day calendar">
    <header className="employee-calendar-heading">
      <div><h2>Team calendar</h2><p>Appointments &amp; service visits</p></div>
      <button className="calendar-icon-button" type="button" aria-label="Refresh calendar" title="Refresh calendar" onClick={()=>setRevision(n=>n+1)} disabled={loading}><WorkflowIcon name="refresh" size={18} /></button>
    </header>
    <div className="calendar-date-bar">
      <label className="calendar-date-picker"><span className="sr-only">Day</span><span className="calendar-month">{dayLabel(date,{month:'long',year:'numeric'})}</span><span className="calendar-selected-day">{dayLabel(date,{weekday:narrow?'short':'long',day:'numeric'})}<WorkflowIcon name="calendar" size={16} /></span>
        <input ref={dateInput} name="calendar_day" aria-label="Day" type="date" autoComplete="off" value={date} onChange={e=>{if(e.target.value)setDate(e.target.value);}} />
      </label>
      <div className="calendar-date-actions"><button type="button" className="calendar-today" onClick={()=>setDate(today)} disabled={date===today}>Today</button><div className="calendar-day-arrows"><button type="button" className="calendar-icon-button" aria-label="Previous day" onClick={()=>move(-1)}><Chevron previous /></button><button type="button" className="calendar-icon-button" aria-label="Next day" onClick={()=>move(1)}><Chevron /></button></div></div>
    </div>
    <div className="calendar-week-strip" role="group" aria-label="Week dates">{calendarWeek(date).map(day=><button type="button" key={day} aria-label={dayLabel(day,{weekday:'long',day:'numeric',month:'long',year:'numeric'})} aria-pressed={day===date} aria-current={day===today?'date':undefined} onClick={()=>setDate(day)}><span>{dayLabel(day,{weekday:'short'})}</span><strong>{dayLabel(day,{day:'numeric'})}</strong><i aria-hidden="true" /></button>)}</div>
    <div className="calendar-team-toolbar">
      <label><span className="sr-only">Team member</span><WorkflowIcon name="briefcase" size={16} /><select name="calendar_employee" aria-label="Team member" value={employee} onChange={e=>setEmployee(e.target.value)}><option value="all">All team members</option>{employees.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select></label>
      <div className="calendar-view-switch" role="group" aria-label="Calendar layout"><button type="button" aria-label="Timeline view" aria-pressed={activeView==='timeline'} onClick={()=>setView('timeline')}><WorkflowIcon name="calendar" size={16} /><span>Timeline</span></button><button type="button" aria-label="Agenda view" aria-pressed={activeView==='agenda'} onClick={()=>setView('agenda')}><WorkflowIcon name="document" size={16} /><span>Agenda</span></button></div>
    </div>
    {error ? <div className="calendar-load-state" role="alert"><strong>Calendar couldn’t load</strong><p>{error}</p><button type="button" className="workflow-text-action" onClick={()=>setRevision(n=>n+1)}>Try again</button></div> : !data ? <div className="calendar-loading" role="status" aria-label="Loading team schedule"><span /><span /><span /><span className="sr-only">Loading team schedule…</span></div> : <>
      <div className="calendar-day-summary"><h3>{date===today?'Today’s schedule':dayLabel(date,{weekday:'long'})}</h3><span role="status">{relevant.length} {relevant.length===1?'booking':'bookings'}</span></div>
      {data.unscheduled>0 && <p className="calendar-unscheduled"><WorkflowIcon name="clock" /><span>{data.unscheduled} service {data.unscheduled===1?'job needs':'jobs need'} a visit time. <Link to="/portal/owner/jobs">Review jobs</Link></span></p>}
      {!relevant.length ? <div className="calendar-empty"><span className="calendar-empty-icon"><WorkflowIcon name="calendar" size={24} /></span><h4>{!columns.length ? 'No team members to show' : 'No bookings for this day'}</h4><p>{!columns.length ? 'Add an employee resource to start organising your team’s schedule.' : `${employee==='all'?'Your team has':'This team member has'} no scheduled appointments or service visits on ${dayLabel(date,{day:'numeric',month:'long'})}.`}</p>{!columns.length ? <Link className="calendar-empty-action" to="/portal/owner/bookings?view=setup&section=resources">Set up your team<WorkflowIcon name="arrowRight" /></Link> : <button type="button" className="calendar-empty-action" onClick={()=>{dateInput.current?.focus();dateInput.current?.showPicker?.();}}>Choose another day<WorkflowIcon name="arrowRight" /></button>}</div> : <>
        <div className="employee-calendar-grid-wrap" tabIndex={0} role="region" aria-label="Time grid; use arrow keys to scroll between employees">
          <div className="employee-calendar-grid" style={{gridTemplateColumns:`64px repeat(${columns.length},minmax(190px,1fr))`}}>
            <div className="employee-calendar-axis-title">Time</div>{columns.map(e=><div key={e.id} className="employee-calendar-column-title"><span className="calendar-avatar" aria-hidden="true">{initials(e.name)}</span><span><strong>{e.name}</strong><small>{eventsFor(e.id).length} scheduled</small></span></div>)}
            <div className="employee-calendar-axis" style={{height:(toHour-fromHour)*72}}>{Array.from({length:toHour-fromHour},(_,i)=><span key={i} style={{top:i*72}}>{String(fromHour+i).padStart(2,'0')}:00</span>)}</div>
            {columns.map(e=><div key={e.id} className="employee-calendar-column" style={{height:(toHour-fromHour)*72}}>{calendarLanes(eventsFor(e.id)).map(({event,lane,lanes})=>{
              const top=Math.max(0,(minute(event.starts_at,date)-fromHour*60)*1.2);
              const bottom=Math.min((toHour-fromHour)*72,(minute(event.ends_at,date)-fromHour*60)*1.2);
              return <Link key={`${event.kind}:${event.id}`} to={path(event)} className={`employee-calendar-event is-${event.kind}`} style={{top,height:Math.max(16,bottom-top),left:`calc(${lane*100/lanes}% + 4px)`,right:`calc(${(lanes-lane-1)*100/lanes}% + 4px)`}} title={`${event.title} · ${visitWindow(event.starts_at,event.ends_at)} · ${event.status.replaceAll('_',' ')}`} aria-label={`${event.title}, ${kindLabel(event)}, ${visitWindow(event.starts_at,event.ends_at)}, ${event.status.replaceAll('_',' ')}`}><strong>{event.title}</strong><small>{bookingTime(event.starts_at)}–{bookingTime(event.ends_at)}</small></Link>;
            })}</div>)}
          </div>
        </div>
        <div className="employee-calendar-agenda">{booked.map(e=><section key={e.id}><div className="calendar-agenda-employee"><span className="calendar-avatar" aria-hidden="true">{initials(e.name)}</span><h4>{e.name}</h4><span>{eventsFor(e.id).length}</span></div><ul>{eventsFor(e.id).map(event=><li key={`${event.kind}:${event.id}`}><Link to={path(event)}><time><b>{bookingTime(event.starts_at)}</b><span>{bookingTime(event.ends_at)}</span></time><div><span className={`calendar-event-kind is-${event.kind}`}>{kindLabel(event)}</span><strong>{event.title}</strong><small>{event.status.replaceAll('_',' ')}</small></div><Chevron /></Link></li>)}</ul></section>)}</div>
      </>}
      {columns.length>0 && <footer className="calendar-team-summary"><span>Team included</span><div>{columns.map(e=><span key={e.id} className="calendar-team-chip"><i aria-hidden="true">{initials(e.name)}</i>{e.name}</span>)}</div></footer>}
      <div className="calendar-footer"><WorkflowIcon name="clock" size={14} /><span>All times are Zambia time (UTC+2)</span></div>
    </>}
  </section>;
}

function Chevron({previous=false}:{previous?:boolean}) {return <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={previous?'m14 6-6 6 6 6':'m10 6 6 6-6 6'} /></svg>;}
