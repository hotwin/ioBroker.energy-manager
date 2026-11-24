'use strict';
function accumulate(previous, devices, now, tariffCt, zone='Europe/Berlin'){
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
 const part=k=>parts.find(p=>p.type===k).value;
 const day=part('year')+'-'+part('month')+'-'+part('day');
 const old=previous||{}, days=old.days||{}, meters=Object.create(null);
 const entry=days[day]||{kWh:0,costEUR:0,pricedKWh:0};
 for(const d of devices){
  if(!Number.isFinite(d.energyKWh)||d.energyKWh<0)continue;
  const prior=Object.hasOwn(old.meters||{},d.id)?old.meters[d.id]:null;
  meters[d.id]={value:d.energyKWh,ts:now,day};
  if(!prior||d.exclude||prior.day!==day||now-prior.ts>180000||now<=prior.ts||d.energyKWh<prior.value)continue;
  const delta=d.energyKWh-prior.value;
  entry.kWh+=delta;
  if(Number.isFinite(tariffCt)&&Number.isFinite(old.tariffCt)&&old.tariffCt===tariffCt){entry.costEUR+=delta*tariffCt/100;entry.pricedKWh+=delta;}
 }
 days[day]=entry;
 const keys=Object.keys(days).sort();while(keys.length>400)delete days[keys.shift()];
 return {meters,days,tariffCt,day};
}
module.exports=accumulate;
