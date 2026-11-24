'use strict';
function localDay(now, zone = 'Europe/Berlin') {
 return new Intl.DateTimeFormat('sv-SE', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}
const hourMs = 3600000;

function accumulate(previous, devices, now, tariffCt, zone='Europe/Berlin', priceSlot = null){
 const day = localDay(now, zone);
 const old=previous||{}, days={...old.days}, meters=Object.create(null);
 const entry={kWh:0,costEUR:0,pricedKWh:0,...days[day]};
 const deviceDays = { ...old.deviceDays };
 const dailyDevices = new Map(Object.entries(deviceDays[day] || {}));
 const hourly = { ...old.hourly };
 const hour = Math.floor(now / hourMs) * hourMs;
 for(const d of devices){
  if(!Number.isFinite(d.energyKWh)||d.energyKWh<0)continue;
  const prior=Object.hasOwn(old.meters||{},d.id)?old.meters[d.id]:null;
  meters[d.id]={value:d.energyKWh,ts:now,day,meterId:d.meterId,exclude:d.exclude};
  if(!prior||d.exclude||prior.exclude||prior.meterId!==d.meterId||prior.day!==day||now-prior.ts>180000||now<=prior.ts||d.energyKWh<prior.value)continue;
  const delta=d.energyKWh-prior.value;
  entry.kWh+=delta;
  const key = d.aliasKey || d.id;
  const existing = dailyDevices.get(key);
  dailyDevices.set(key, { name: d.name || d.id, room: d.room || '', kWh: (existing?.kWh || 0) + delta });
  if (Math.floor(prior.ts / hourMs) * hourMs === hour) {
      hourly[hour] = (hourly[hour] || 0) + delta;
  }
  if(Number.isFinite(tariffCt)&&Number.isFinite(old.tariffCt)&&old.tariffCt===tariffCt&&old.priceSlot===priceSlot){entry.costEUR+=delta*tariffCt/100;entry.pricedKWh+=delta;}
 }
 days[day]=entry;
 const keys=Object.keys(days).sort();while(keys.length>400)delete days[keys.shift()];
 if (dailyDevices.size) deviceDays[day] = Object.fromEntries(dailyDevices);
 for (const key of Object.keys(deviceDays)) {
     if (!Object.hasOwn(days, key)) delete deviceDays[key];
 }
 for (const key of Object.keys(hourly)) {
     if (Number(key) < hour - 7 * 24 * hourMs) delete hourly[key];
 }
 return {meters,days,tariffCt,day,priceSlot,deviceDays,hourly};
}
module.exports=accumulate;
module.exports.localDay = localDay;
