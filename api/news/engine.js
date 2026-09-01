// SIRA automatic news engine: fetch, normalize, deduplicate, score and route items.
const SOURCES = require('./sources');
const RULES={
 'Burkina Faso':['burkina','ouagadougou','bobo-dioulasso','koudougou','fada','dori','banfora','kaya'],
 'Afrique':['afrique','niger','mali','ghana','cote d ivoire','côte d’ivoire','senegal','togo','benin','nigeria','aes'],
 'International':['international','usa','états-unis','europe','asie','ukraine','russie','chine','onu','gaza','iran'],
 'Économie':['économie','entreprise','commerce','finance','banque','inflation','emploi','investissement','budget','fiscal'],
 'Sport':['sport','football','basket','athlétisme','fifa','caf','championnat','match','joueur'],
 'Culture':['culture','musique','cinéma','festival','artiste','livre','fespaco','patrimoine'],
 'Technologie':['technologie','numérique','ia','intelligence artificielle','cybersécurité','internet','logiciel'],
 'Société':['société','éducation','formation','santé','université','école','jeunesse','social'],
 'Environnement':['climat','environnement','pluie','inondation','sécheresse','agriculture','eau'],
 'Politique':['président','gouvernement','ministre','assemblée','élection','politique','parlement','loi']
};
const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9 ]+/g,' ').replace(/\s+/g,' ').trim();
const clean=s=>String(s||'').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/\s+/g,' ').trim();
function tag(xml,n){const m=xml.match(new RegExp(`<${n}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${n}>`,'i'));return m?clean(m[1]):'';}
function parse(xml,src){const blocks=[...xml.matchAll(/<item(?:\s[^>]*)?>[\s\S]*?<\/item>/gi),...xml.matchAll(/<entry(?:\s[^>]*)?>[\s\S]*?<\/entry>/gi)].map(x=>x[0]).slice(0,40);return blocks.map((b,i)=>{let url=tag(b,'link');if(!url){const m=b.match(/<link[^>]+href=["']([^"']+)["']/i);url=m?m[1]:'';}const title=tag(b,'title'),description=tag(b,'description')||tag(b,'summary')||tag(b,'content'),published=tag(b,'pubDate')||tag(b,'published')||tag(b,'updated');return {id:`${src.id}-${i}-${hash(title+'|'+url)}`,sourceId:src.id,source:src.name,title,excerpt:description.slice(0,320),url,publishedAt:date(published),baseTrust:src.baseTrust,country:src.country,region:src.region};}).filter(x=>x.title&&x.url);}
function date(v){const d=new Date(v);return Number.isNaN(d.getTime())?new Date().toISOString():d.toISOString();}
function hash(s){let h=0;for(let i=0;i<s.length;i++)h=((h<<5)-h)+s.charCodeAt(i)|0;return Math.abs(h).toString(36);}
function category(x){const t=norm(x.title+' '+x.excerpt);let best=x.region==='national'?'Burkina Faso':'International',max=0;for(const [k,terms] of Object.entries(RULES)){const n=terms.filter(v=>t.includes(norm(v))).length;if(n>max){max=n;best=k;}}return best;}
function dedupe(items){const seen=new Set();return items.filter(x=>{const k=norm(x.title).replace(/[^a-z0-9]/g,'').slice(0,90);if(!k||seen.has(k))return false;seen.add(k);return true;});}
function enrich(items){return items.map(x=>{const age=Math.max(0,Date.now()-new Date(x.publishedAt).getTime())/3600000;const freshness=Math.max(0,40-age*2.2);const corroborated=items.filter(y=>y!==x&&norm(y.title).split(' ').slice(0,5).join(' ')===norm(x.title).split(' ').slice(0,5).join(' ')).length;let reliability=(x.baseTrust||60)+Math.min(8,corroborated*4);if(/rumeur|non confirme|non confirmé|probablement/.test(norm(x.title+' '+x.excerpt)))reliability-=18;reliability=Math.max(0,Math.min(100,Math.round(reliability)));const hot=Math.round(Math.max(0,Math.min(100,freshness+Math.min(30,corroborated*10)+(x.country==='BF'?15:0))));const sensitive=/election|président|ministre|guerre|attaque|terror|mort|deces|décès|santé|accusation|justice/.test(norm(x.title+' '+x.excerpt));return {...x,category:category(x),reliabilityScore:reliability,hotScore:hot,priority:hot>=78?'breaking':hot>=58?'hot':hot>=35?'normal':'low',reviewRequired:sensitive||reliability<70};}).sort((a,b)=>(b.hotScore+b.reliabilityScore)-(a.hotScore+a.reliabilityScore));}
async function collect(){const out=[];for(const s of SOURCES){try{const r=await fetch(s.url,{headers:{'User-Agent':'SIRA-NewsBot/1.0'},signal:AbortSignal.timeout(8000)});if(r.ok)out.push(...parse(await r.text(),s));}catch{}}return dedupe(out);}
module.exports={collect,enrich};
