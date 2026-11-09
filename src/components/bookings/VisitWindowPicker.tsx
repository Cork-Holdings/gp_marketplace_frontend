import { useEffect, useState } from 'react';
import { ownerApi, StorefrontService } from '@/lib/api/services';
import { bookingScheduleApi, type BookingAvailability } from '@/lib/api/services/bookingSchedule';
import { bookingDate, bookingDateLimit, bookingTime, visitInput, zambiaDateTime, visitWindow } from '@/lib/bookingTime';
import { userMessage } from '@/lib/userMessage';
import type { MerchantResource } from '@/types/serviceQuote';
import { emptyVisit, type VisitSelection } from '@/lib/visitScheduling';

export function VisitWindowPicker({storeId,value,onChange,owner=false}:{storeId:string; value:VisitSelection; onChange:(value:VisitSelection)=>void; owner?:boolean}) {
  const [resources,setResources]=useState<MerchantResource[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [reload,setReload]=useState(0);
  const [date,setDate]=useState(value.scheduled_at ? bookingDate(new Date(value.scheduled_at)) : bookingDate());
  const [minutes,setMinutes]=useState(owner && value.scheduled_at && value.scheduled_end_at ? Math.round((Date.parse(value.scheduled_end_at)-Date.parse(value.scheduled_at))/60000) : 15);
  const [availability,setAvailability]=useState<{key:string; data:BookingAvailability}|null>(null);
  const [slotError,setSlotError]=useState('');
  const [page,setPage]=useState(0);
  useEffect(()=>{
    let current=true;setLoading(true);setError('');
    (owner ? ownerApi.listResources(storeId) : StorefrontService.listResources(storeId)).then(result=>{
      if(current)setResources((result?.resources ?? []).filter((r:MerchantResource)=>r.is_active));
    }).catch(cause=>{if(current)setError(userMessage(cause,'Could not load visit availability. Try again.'));}).finally(()=>{if(current)setLoading(false);});
    return()=>{current=false;};
  },[storeId,owner,reload]);
  const resource = value.scheduling_resource_id ?? '';
  const key=`${storeId}:${resource}:${date}:${minutes}:${reload}`;
  useEffect(()=>{
    if(!resource)return;
    const controller=new AbortController();setSlotError('');
    bookingScheduleApi.visitSlots(storeId,resource,minutes,date,owner,controller.signal).then(data=>{if(!controller.signal.aborted)setAvailability({key,data});})
      .catch(cause=>{if(!controller.signal.aborted)setSlotError(userMessage(cause,'Could not load times. Try again.'));});
    return()=>controller.abort();
  },[storeId,resource,date,minutes,owner,key]);
  const slots=availability?.key===key ? availability.data : null;
  function clear(patch:Partial<VisitSelection>={}) {onChange({...emptyVisit(),scheduling_resource_id:resource || undefined,...patch});setPage(0);}
  function choose(start:string) {onChange({scheduled_at:start,scheduled_end_at:new Date(Date.parse(start)+minutes*60000).toISOString(),scheduling_resource_id:resource || undefined});}
  return <fieldset className="visit-window-picker space-y-3 rounded-xl bg-cream/50 p-4">
    <legend className="font-semibold">{owner ? 'Proposed visit window' : 'When would you like the provider to visit?'}</legend>
    <p className="text-sm text-forest-muted">{owner ? 'Use the customer’s location to allow enough time for the visit. The customer reviews this window with your quote. No travel buffer is added automatically.' : 'Choose a preferred arrival time. The provider will confirm the visit length or suggest another time with the estimate. This request does not reserve the slot.'}</p>
    {loading ? <p role="status">Loading availability…</p> : error ? <p role="alert">{error} <button type="button" className="workflow-text-action" onClick={()=>setReload(n=>n+1)}>Retry</button></p> : <>
      {resources.length>0 && <label className="block text-sm font-medium">Team member or resource<select className="field-input mt-1" value={resource} onChange={e=>clear({scheduling_resource_id:e.target.value || undefined})}><option value="">Request a preferred time only</option>{resources.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select></label>}
      {owner && <label className="block text-sm font-medium">Visit length<select className="field-input mt-1" value={minutes} onChange={e=>{setMinutes(Number(e.target.value));clear();}}>{[15,30,45,60,90,120,180,240].map(n=><option key={n} value={n}>{n} minutes</option>)}</select></label>}
      {resource ? <>
        <button type="button" className="workflow-text-action" onClick={()=>{setReload(n=>n+1);clear();}}>Refresh available times</button>
        <label className="block text-sm font-medium">Visit date (Zambia time)<input className="field-input mt-1" type="date" min={bookingDate()} max={bookingDateLimit()} value={date} onChange={e=>{setDate(e.target.value);clear();}} /></label>
        {slotError ? <p role="alert">{slotError} <button type="button" className="workflow-text-action" onClick={()=>setReload(n=>n+1)}>Retry times</button></p> : !slots ? <p role="status">Checking available times…</p> : !slots.configured ? <p>The provider has not set working hours for online slots. Choose “Request a preferred time only”; the provider must confirm availability.</p> : !slots.slots.length ? <p>No available times on this date. Choose another date or resource.</p> : <>
          <p role="status" className="text-sm text-forest-muted">{slots.slots.length} available {owner?'visit':'arrival'} times</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4" role="group" aria-label="Available visit times">{slots.slots.slice(page*12,page*12+12).map(slot=><button type="button" className={`min-h-11 rounded-lg border px-2 py-2 text-sm ${value.scheduled_at===slot.starts_at ? 'border-forest bg-forest text-white' : 'border-cream-dark bg-white'}`} key={slot.starts_at} aria-pressed={value.scheduled_at===slot.starts_at} onClick={()=>choose(slot.starts_at)}>{bookingTime(slot.starts_at)}</button>)}</div>
          {slots.slots.length>12 && <nav className="flex items-center justify-between text-sm" aria-label="Available time pages"><button type="button" className="booking-back-button" disabled={page===0} onClick={()=>setPage(n=>n-1)}>Earlier</button><span>{page+1} / {Math.ceil(slots.slots.length/12)}</span><button type="button" className="booking-back-button" disabled={(page+1)*12>=slots.slots.length} onClick={()=>setPage(n=>n+1)}>Later</button></nav>}
        </>}
      </> : <>
        <label className="block text-sm font-medium">{owner ? 'Proposed arrival' : 'Preferred date and time'} (Zambia time)<input className="field-input mt-1" type="datetime-local" min={`${bookingDate()}T00:00`} max={`${bookingDateLimit()}T23:45`} value={visitInput(value.scheduled_at)} onChange={e=>{const start=zambiaDateTime(e.target.value);if(start)choose(start);else clear();}} /></label>
        <p className="text-sm text-forest-muted">Availability is not confirmed until the provider assigns a team member. No employee time is reserved by a time-only request.</p>
      </>}
    </>}
    {owner && value.scheduled_at && <p role="status" className="text-sm font-medium">Proposed window: {visitWindow(value.scheduled_at,value.scheduled_end_at)}</p>}
  </fieldset>;
}
