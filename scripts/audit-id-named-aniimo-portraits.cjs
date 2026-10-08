const fs=require('node:fs'),assert=require('node:assert/strict');
const m=JSON.parse(fs.readFileSync('data/homebuilder-aniimo-portraits.json','utf8'));
const rows=Object.entries(m.byFormId||{});
assert.equal(rows.length,208,'Expected 208 verified Aniimo form ID portraits');
for(const [id,path] of rows){
 assert(/^\d+$/.test(id),'Non-numeric form ID '+id);
 assert(path.startsWith('assets/homebuilder-aniimo-portraits/by-form-id/'+id+'_'),'Mismatched form file '+id);
 assert(path.endsWith('.png'),'Expected PNG '+id);
 const buf=fs.readFileSync(path);
 assert(buf.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),'Invalid PNG '+id);
}
assert.equal(Object.keys(m.intentionallyExcludedFormIds||{}).length,2,'Unexpected missing form IDs');
for(const id of Object.keys(m.intentionallyExcludedFormIds))assert(!m.byFormId[id],'An excluded ID must never map to another Aniimo');
const s=fs.readFileSync('js/homebuilder-portraits.js','utf8');
assert(s.includes('manifest.byFormId[formId]'),'Must prefer verified ID lookup');
console.log('PASS: 208 ID-named PNGs mapped, 2 missing forms flagged, no guessed mapping');
