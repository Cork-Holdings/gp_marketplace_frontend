import { useEffect, useState } from 'react';
import { platformApi, type Feature, type PlatformDocument } from '@/lib/platform';
export function usePlatformDocuments<T>(kind:string,admin=false) {
 const [revision,setRevision]=useState(0);
 const [state,setState]=useState<{key:string;items?:PlatformDocument<T>[];features:Feature[];error?:unknown}>({key:'',features:[]});
 const key=`${kind}:${admin}:${revision}`;
 useEffect(()=>{let cancelled=false;setState({key,features:[]});void platformApi.list<T>(kind,admin).then(data=>{if(!cancelled)setState({key,...data})},error=>{if(!cancelled)setState({key,features:[],error})});return()=>{cancelled=true}},[key,kind,admin]);
 return {...(state.key===key?state:{key,features:[]}),refresh:()=>setRevision(v=>v+1)};
}
