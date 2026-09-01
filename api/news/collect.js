const {collect,enrich}=require('./engine');
module.exports=async(req,res)=>{
 if(!['GET','POST'].includes(req.method))return res.status(405).json({ok:false,error:'Méthode non autorisée'});
 const key=process.env.SIRA_CRON_SECRET;
 if(key&&req.headers['x-sira-cron']!==key)return res.status(401).json({ok:false,error:'Accès refusé'});
 try{const items=enrich(await collect());const publishable=items.filter(x=>!x.reviewRequired&&x.reliabilityScore>=82).slice(0,30);const reviewQueue=items.filter(x=>x.reviewRequired||x.reliabilityScore<82).slice(0,50);return res.status(200).json({ok:true,collected:items.length,publishable:publishable.length,review:reviewQueue.length,items:publishable,reviewQueue,generatedAt:new Date().toISOString()});}catch(e){console.error('SIRA collector error',e);return res.status(500).json({ok:false,error:'Collecte impossible'});}
};
