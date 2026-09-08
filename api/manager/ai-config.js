import crypto from 'node:crypto';

const REPO='afiss859-eng/sira-website';
const PATH='data/manager-ai.json';
const DEFAULT_MODEL='dev-x';
const EMAIL=process.env.ADMIN_EMAIL||'sawadogoafis125@gmail.com';

function adminAuthorized(req){const h=String(req.headers?.authorization||'');if(!h.startsWith('Basic ')||!process.env.ADMIN_PASSWORD)return false;try{const d=Buffer.from(h.slice(6),'base64').toString('utf8');const i=d.indexOf(':');return i>0&&d.slice(0,i)===EMAIL&&d.slice(i+1)===process.env.ADMIN_PASSWORD}catch{return false}}
function headers(){if(!process.env.GITHUB_TOKEN)throw new Error('GITHUB_TOKEN manquant.');return{Authorization:`Bearer ${process.env.GITHUB_TOKEN}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'}}
function url(){return`https://api.github.com/repos/${REPO}/contents/${PATH}`}
async function read(){const r=await fetch(url(),{headers:headers(),cache:'no-store'});if(r.status===404)return{data:{version:1,selectedModel:DEFAULT_MODEL,updatedAt:null},sha:null};if(!r.ok)throw new Error(`GitHub GET ${r.status}`);const f=await r.json();return{data:JSON.parse(Buffer.from(f.content,'base64').toString('utf8')),sha:f.sha}}
async function write(data,sha){const body={message:`manager: set AI model ${data.selectedModel}`,content:Buffer.from(JSON.stringify(data,null,2)+'\n').toString('base64'),branch:'main'};if(sha)body.sha=sha;const r=await fetch(url(),{method:'PUT',headers:{...headers(),'Content-Type':'application/json'},body:JSON.stringify(body)});if(!r.ok)throw new Error(`GitHub PUT ${r.status}`)}
export default async function handler(req,res){try{if(!adminAuthorized(req))return res.status(401).json({ok:false,error:'Authentification administrateur requise.'});const current=await read();if(req.method==='GET')return res.status(200).json({ok:true,selectedModel:current.data.selectedModel||DEFAULT_MODEL,updatedAt:current.data.updatedAt||null});if(req.method==='POST'){const model=String(req.body?.model||'').trim();if(!model||model.length>120)return res.status(400).json({ok:false,error:'Modèle invalide.'});const data={version:1,selectedModel:model,updatedAt:new Date().toISOString(),nonce:crypto.randomBytes(4).toString('hex')};await write(data,current.sha);return res.status(200).json({ok:true,selectedModel:model,updatedAt:data.updatedAt})}return res.status(405).json({ok:false,error:'Méthode non autorisée.'})}catch(e){console.error('SIRA ai config error',e);return res.status(500).json({ok:false,error:'Erreur de configuration IA.'})}}
