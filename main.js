const accumulate = require('./lib/consumption');
const utils = require('@iobroker/adapter-core');
class EnergyManager extends utils.Adapter {
 constructor(options={}) { super({...options,name:'energy-manager'}); this.on('ready',()=>this.start()); this.on('unload',cb=>{if(this.timer)this.clearInterval(this.timer);this.setState('info.connection',false,true,()=>cb());}); }
 async start(){
  await this.setObjectNotExistsAsync('info',{type:'channel',common:{name:'Adapter information'},native:{}});
  await this.setObjectNotExistsAsync('info.connection',{type:'state',common:{name:'Local source access',type:'boolean',role:'indicator.connected',read:true,write:false},native:{}});
  await this.setStateAsync('info.connection',true,true);
  await this.setObjectNotExistsAsync('snapshot',{type:'state',common:{name:'Energy snapshot',type:'string',role:'json',read:true,write:false},native:{}});
  await this.setObjectNotExistsAsync('totalPower',{type:'state',common:{name:'Measured power',type:'number',role:'value.power',unit:'W',read:true,write:false},native:{}});
  await this.setObjectNotExistsAsync('consumption',{type:'state',common:{name:'Daily consumption ledger',type:'string',role:'json',read:true,write:false},native:{}});
  try{this.ledger=JSON.parse((await this.getStateAsync('consumption'))?.val||'null');}catch{this.ledger=null;}
  const poll=async()=>{if(this.busy)return;this.busy=true;try{await this.collect();}catch(e){this.log.warn(String(e));}finally{this.busy=false;}};
  this.timer=this.setInterval(poll,60000);await poll();
 }
 async collect(){
  const objects=await this.getForeignObjectsAsync('shelly.*','state');
  const enums=await this.getForeignObjectsAsync('enum.*','enum');
  const energyMembers=Object.entries(enums||{}).filter(([id,o])=>{const n=o.common?.name;return /strommessung|energiemessung|stromverbrauch|energy measurement/i.test(id+' '+(typeof n==='string'?n:JSON.stringify(n||{})));}).flatMap(([,o])=>o.common.members||[]);
  const devices=[];
  const manual=Array.isArray(this.config.sources)?this.config.sources:[];
  const used=new Set();
  for(const source of manual){
   const id=source.powerId||source.energyId;if(!id||used.has(id))continue;
   const p=source.powerId?await this.getForeignStateAsync(source.powerId):null;
   const e=source.energyId?await this.getForeignStateAsync(source.energyId):null;
   const powerW=typeof p?.val==='number'&&Number.isFinite(p.val)?p.val:null;
   const energyKWh=typeof e?.val==='number'&&Number.isFinite(e.val)?(source.unit==='Wh'?e.val/1000:source.unit==='kWh'?e.val:null):null;
   if(powerW===null&&energyKWh===null)continue;
   used.add(id);if(source.powerId)used.add(source.powerId);if(source.energyId)used.add(source.energyId);
   devices.push({id,name:source.name||id,room:source.room||'',powerW,energyKWh,exclude:!!source.exclude,ts:p?.ts||e?.ts});
  }
  const candidates=new Map();
  for(const member of new Set(energyMembers)){
   const direct=await this.getForeignObjectAsync(member);
   const states=direct?.type==='state'?{[member]:direct}:await this.getForeignObjectsAsync(member+'.*','state');
   for(const [id,o] of Object.entries(states||{})){
    const unit=o.common?.unit,role=o.common?.role||'';
    if(!['W','kW','Wh','kWh'].includes(unit)||o.common?.type!=='number')continue;
    if(!/power|energy|consumption/i.test(role+' '+id))continue;
    const base=id.slice(0,id.lastIndexOf('.'));
    const c=candidates.get(base)||{};
    if(unit==='W'||unit==='kW'){if(!c.power)c.power={id,unit};}
    else if(!c.energy)c.energy={id,unit};
    candidates.set(base,c);
   }
  }
  for(const [base,c] of candidates){
   if([c.power?.id,c.energy?.id].some(id=>id&&used.has(id)))continue;
   const p=c.power?await this.getForeignStateAsync(c.power.id):null;
   const e=c.energy?await this.getForeignStateAsync(c.energy.id):null;
   const powerW=Number.isFinite(p?.val)?p.val*(c.power.unit==='kW'?1000:1):null;
   const energyKWh=Number.isFinite(e?.val)?e.val/(c.energy.unit==='Wh'?1000:1):null;
   if(powerW===null&&energyKWh===null)continue;
   const obj=await this.getForeignObjectAsync(base);const n=obj?.common?.name;
   devices.push({id:base,name:(typeof n==='string'?n:n?.de||n?.en)||base,powerW,energyKWh,ts:p?.ts||e?.ts,source:'enum'});
   for(const id of [c.power?.id,c.energy?.id])if(id)used.add(id);
  }
  for(const [id,obj] of Object.entries(objects||{})){
   if(this.config.autoShelly===false||used.has(id)||used.has(id.slice(0,-6)+'.Energy'))continue;
   if(!id.endsWith('.Power')||obj.common.unit!=='W')continue;
   const base=id.slice(0,-6);
   const p=await this.getForeignStateAsync(id);
   const e=await this.getForeignStateAsync(base+'.Energy');
   const eo=objects[base+'.Energy'];
   if(!p||typeof p.val!=='number'||!Number.isFinite(p.val))continue;
   const channel=await this.getForeignObjectAsync(base);
   const parent=await this.getForeignObjectAsync(base.substring(0,base.lastIndexOf('.')));
   const label=o=>typeof o?.common?.name==='string'?o.common.name:o?.common?.name?.de||o?.common?.name?.en;
   devices.push({id:base,name:[label(parent),label(channel)].filter(Boolean).join(' / ')||base,powerW:p.val,energyKWh:e&&typeof e.val==='number'?(eo?.common?.unit==='Wh'?e.val/1000:eo?.common?.unit==='kWh'?e.val:null):null,ts:p.ts});
  }
  const label=o=>typeof o.common.name==='string'?o.common.name:o.common.name?.de||o.common.name?.en||o._id;
  for(const d of devices){
   const matches=prefix=>Object.entries(enums||{}).filter(([id,o])=>id.startsWith(prefix)&&Array.isArray(o.common.members)&&o.common.members.some(member=>d.id===member||d.id.startsWith(member+'.')||d.id+'.Power'===member||d.id+'.Energy'===member)).map(([id,o])=>({id,name:label(o)}));
   const rooms=matches('enum.rooms.');
   d.room=d.room||rooms[0]?.name||'';
   d.functions=matches('enum.functions.').map(x=>x.name);
  }
  const rooms=Object.values(devices.reduce((acc,d)=>{const name=d.room||'Ohne Raum';const r=acc[name]||(acc[name]={name,powerW:0,devices:0});if(!d.exclude)r.powerW+=d.powerW||0;r.devices++;return acc;},Object.create(null)));
  let prices=null;
  try{if(!this.prices||Date.now()-this.priceTime>900000){const r=await fetch('https://api.awattar.de/v1/marketdata',{signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error('HTTP '+r.status);this.prices=(await r.json()).data;this.priceTime=Date.now();}prices=this.prices;}catch(e){this.log.warn('aWATTar: '+e.message);}
  const now=Date.now(), current=prices?.find(p=>p.start_timestamp<=now&&now<p.end_timestamp);
  const marketCt=current?current.marketprice/10:null;
  const extraCt=['markupCt','electricityTaxCt','networkCt','concessionCt','leviesCt'].reduce((sum,k)=>sum+Number(this.config[k]||0),0);
  const fixedMonthlyGross=(Number(this.config.baseMonthly||0)+Number(this.config.meterAnnual||0)/12)*(1+Number(this.config.vatPercent)/100);
  const contract={extraCt,fixedMonthlyGross,advanceMonthly:Number(this.config.advanceMonthly||0),start:this.config.contractStart||null,configured:!!this.config.tariffConfigured};
  const tariffCt=this.config.tariffConfigured&&marketCt!==null?(marketCt+extraCt)*(1+Number(this.config.vatPercent)/100):null;
  const totalPower=devices.reduce((s,d)=>s+(d.exclude?0:d.powerW||0),0);
  const ledger=accumulate(this.ledger,devices,now,tariffCt);
  await this.setStateAsync('consumption',JSON.stringify(ledger),true);
  this.ledger=ledger;
  const today=ledger.days[ledger.day];
  for(const [id,name,value] of [
   ['displayPower','Aktuelle Leistung',totalPower>=1000?(totalPower/1000).toFixed(2)+' kW':totalPower.toFixed(1)+' W'],
   ['displayToday','Verbrauch heute',today.kWh.toFixed(3)+' kWh'],
   ['displayMarket','Börsenpreis',marketCt===null?'Nicht verfügbar':marketCt.toFixed(2)+' ct/kWh'],
   ['displayTariff','Vertragstarif',tariffCt===null?'Nicht konfiguriert':tariffCt.toFixed(2)+' ct/kWh'],
   ['displayCost','Erfasste Teilkosten',today.pricedKWh>0?today.costEUR.toFixed(2)+' EUR':'Nicht verfügbar']
  ]){await this.setObjectNotExistsAsync(id,{type:'state',common:{name,type:'string',role:'text',read:true,write:false},native:{}});await this.setStateAsync(id,value,true);}
  await this.setStateAsync('totalPower',totalPower,true);
  await this.setStateAsync('snapshot',JSON.stringify({ts:now,devices,totalPower,marketCt,tariffCt,prices,daily:ledger.days,contract,rooms}),true);
 }
}
if(require.main===module)new EnergyManager();else module.exports=options=>new EnergyManager(options);
