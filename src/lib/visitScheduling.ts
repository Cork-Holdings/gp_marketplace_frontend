export type VisitSelection = { scheduled_at:string; scheduled_end_at:string; scheduling_resource_id?:string };
export const emptyVisit = ():VisitSelection => ({scheduled_at:'',scheduled_end_at:''});

export function calendarWeek(date:string):string[] {
  const day=new Date(`${date}T12:00:00+02:00`);
  if(!Number.isFinite(day.getTime()))return [];
  const monday=new Date(day.getTime()-((day.getUTCDay()+6)%7)*86400000);
  return Array.from({length:7},(_,i)=>new Date(monday.getTime()+i*86400000).toISOString().slice(0,10));
}

// Simultaneous shared-resource bookings must not conceal each other. Greedy
// interval partitioning gives every overlapping entry its own visible lane.
export function calendarLanes<T extends {starts_at:string;ends_at:string}>(events:T[]):{event:T;lane:number;lanes:number}[] {
  const ends:number[]=[];
  const placed=[...events].sort((a,b)=>Date.parse(a.starts_at)-Date.parse(b.starts_at)).map(event=>{
    const start=Date.parse(event.starts_at);
    let lane=ends.findIndex(end=>end<=start);
    if(lane<0)lane=ends.length;
    ends[lane]=Date.parse(event.ends_at);
    return {event,lane};
  });
  return placed.map(entry=>({...entry,lanes:ends.length}));
}
