'use strict';
function localDay(now, zone = 'Europe/Berlin') {
 return new Intl.DateTimeFormat('sv-SE', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}
function accumulate(previous, devices, now, tariffCt, zone='Europe/Berlin', priceSlot = null){
 const day = localDay(now, zone);
 const old=previous||{}, days={...old.days}, meters=Object.create(null);
 const entry={kWh:0,costEUR:0,pricedKWh:0,...days[day]};
 for(const d of devices){
  if(!Number.isFinite(d.energyKWh)||d.energyKWh<0)continue;
  const prior=Object.hasOwn(old.meters||{},d.id)?old.meters[d.id]:null;
  meters[d.id]={value:d.energyKWh,ts:now,day,meterId:d.meterId,exclude:d.exclude};
  if(!prior||d.exclude||prior.exclude||prior.meterId!==d.meterId||prior.day!==day||now-prior.ts>180000||now<=prior.ts||d.energyKWh<prior.value)continue;
  const delta=d.energyKWh-prior.value;
  entry.kWh+=delta;
  if(Number.isFinite(tariffCt)&&Number.isFinite(old.tariffCt)&&old.tariffCt===tariffCt&&old.priceSlot===priceSlot){entry.costEUR+=delta*tariffCt/100;entry.pricedKWh+=delta;}
 }
 days[day]=entry;
 const keys=Object.keys(days).sort();while(keys.length>400)delete days[keys.shift()];
 return {meters,days,tariffCt,day,priceSlot};
}
module.exports=accumulate;
module.exports.localDay = localDay;
