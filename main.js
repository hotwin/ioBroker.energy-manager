const utils = require('@iobroker/adapter-core');
class EnergyManager extends utils.Adapter {
 constructor(options={}) { super({...options,name:'energy-manager'}); this.on('ready',()=>this.start()); this.on('unload',cb=>{clearInterval(this.timer);cb();}); }
 async start(){
  await this.setObjectNotExistsAsync('snapshot',{type:'state',common:{name:'Energy snapshot',type:'string',role:'json',read:true,write:false},native:{}});
  await this.setObjectNotExistsAsync('totalPower',{type:'state',common:{name:'Measured power',type:'number',role:'value.power',unit:'W',read:true,write:false},native:{}});
  const poll=async()=>{if(this.busy)return;this.busy=true;try{await this.collect();}catch(e){this.log.warn(String(e));}finally{this.busy=false;}};
  this.timer=setInterval(poll,60000);await poll();
 }
 async collect(){
  const objects=await this.getForeignObjectsAsync('shelly.*','state');
  const devices=[];
  for(const [id,obj] of Object.entries(objects||{})){
   if(!id.endsWith('.Power')||obj.common.unit!=='W')continue;
   const base=id.slice(0,-6);
   const p=await this.getForeignStateAsync(id);
   const e=await this.getForeignStateAsync(base+'.Energy');
   const eo=objects[base+'.Energy'];
   if(!p||typeof p.val!=='number'||!Number.isFinite(p.val))continue;
   devices.push({id:base,powerW:p.val,energyKWh:e&&typeof e.val==='number'?(eo?.common?.unit==='Wh'?e.val/1000:eo?.common?.unit==='kWh'?e.val:null):null,ts:p.ts});
  }
  let prices=null;
  try{if(!this.prices||Date.now()-this.priceTime>900000){const r=await fetch('https://api.awattar.de/v1/marketdata',{signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error('HTTP '+r.status);this.prices=(await r.json()).data;this.priceTime=Date.now();}prices=this.prices;}catch(e){this.log.warn('aWATTar: '+e.message);}
  const now=Date.now(), current=prices?.find(p=>p.start_timestamp<=now&&now<p.end_timestamp);
  const marketCt=current?current.marketprice/10:null;
  const tariffCt=this.config.tariffConfigured&&marketCt!==null?(marketCt+Number(this.config.markupCt))*(1+Number(this.config.vatPercent)/100):null;
  const totalPower=devices.reduce((s,d)=>s+d.powerW,0);
  await this.setStateAsync('totalPower',totalPower,true);
  await this.setStateAsync('snapshot',JSON.stringify({ts:now,devices,totalPower,marketCt,tariffCt,prices}),true);
 }
}
if(require.main===module)new EnergyManager();else module.exports=options=>new EnergyManager(options);
