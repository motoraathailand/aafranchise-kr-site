import { collectOfficial } from './api-catalog.mjs';
try { const r=await collectOfficial({cache:'tools/data/cache'}); if(process.env.DATA_GO_KR_REQUIRED==='1'&&!r)throw new Error('DATA_GO_KR_SERVICE_KEY is required'); }
catch(e){console.error(e.message);if(process.env.DATA_GO_KR_REQUIRED==='1')process.exitCode=1;}
