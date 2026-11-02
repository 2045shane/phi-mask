const test = require('node:test');
const assert = require('node:assert/strict');
const {redact, TYPES} = require('../src/lib/redact');
const {issueLicense, verifyLicense} = require('../src/lib/license');
const {createQuotaStore, localDateKey} = require('../src/lib/quota');
const samples = {
 NAME: ['Dr. Jane Smith','Mr. John Doe','Mrs. Jane Doe','Patient: Jane Smith','Name: John Doe','姓名：张三'],
 DOB: ['DOB: 03/12/1980','出生日期：1980年3月12日'],
 SSN: ['123-45-6789'], MRN: ['MRN: AB123456','病历号：12345678','Patient ID: 987654'],
 EMAIL: ['jane@example.com'], PHONE: ['(212) 555-1234','+1 212-555-1234','13800138000','+86 13800138000'],
 ADDRESS: ['123 Main Street','42 West Oak Ave, Boston, MA 02110'], ZIP: ['ZIP: 02110','90210-1234'],
 DATE: ['2026-11-02','11/02/2026','2026年11月2日','November 2, 2026']
};
for (const [type, values] of Object.entries(samples)) test(`redacts ${type}`, () => {
 for (const value of values) {
  const result=redact(value); assert.ok(result.text.includes(`[${type}]`),value);
  assert.equal(result.counts[type],1,value);
 }
});
test('clinical prose stays unchanged',()=>{
 const text='Patient reports mild headache, BP stable';
 assert.equal(redact(text).text,text); assert.equal(redact(text).total,0);
});
test('counts distinct matches, honors every toggle, preserves placeholders',()=>{
 const result=redact('Name: Jane Smith; DOB: 1980-03-12; SSN 123-45-6789; a@b.com b@c.org; 13800138000');
 assert.equal(result.total,6); assert.equal(result.counts.EMAIL,2); assert.equal(result.counts.DATE,0);
 for(const type of TYPES) for(const value of samples[type]) assert.equal(redact(value,Object.fromEntries(TYPES.map(t=>[t,false]))).text,value);
 assert.equal(redact('[NAME] [DOB] [SSN]').total,0);
 assert.equal(redact('DOB: 1980-03-12',{DOB:false}).counts.DATE,1);
});
function memory(){const data={};return {data,async get(){return {...data};},async set(v){Object.assign(data,v);}};}
test('daily quota serializes, rejects fourth use, resets next local day',async()=>{
 const s=memory();let now=new Date(2026,10,1,23,59); const q=createQuotaStore(s,()=>now);
 assert.deepEqual((await Promise.all(Array.from({length:4},()=>q.consume()))).map(x=>x.recorded),[true,true,true,false]);
 now=new Date(2026,10,2);assert.equal((await q.status()).remaining,3);
 s.data.phiQuota={date:localDateKey(now),count:-5};assert.equal((await q.status()).remaining,3);
});
test('local license rejects tampering and unlocks quota',async()=>{
 const token=await issueLicense();assert.equal(await verifyLicense(token),true);
 for(const invalid of [null,'',token+'a',{}]) assert.equal(await verifyLicense(invalid),false);
 const s=memory();s.data.phiLicense=token;const q=createQuotaStore(s);
 for(let i=0;i<5;i++) assert.equal((await q.consume()).recorded,true);
 assert.equal((await q.status()).remaining,null);
});
test('each type toggle independently disables its own matcher', () => {
 for (const type of TYPES) {
  for (const value of samples[type]) {
   const result = redact(value, {[type]: false});
   assert.equal(result.counts[type], 0, `${type}: ${value}`);
  }
 }
});
test('browser globals work without CommonJS', () => {
 const fs = require('node:fs');
 const vm = require('node:vm');
 const context = vm.createContext({TextEncoder, crypto: globalThis.crypto});
 for (const name of ['redact', 'license', 'quota']) {
  vm.runInContext(fs.readFileSync(require.resolve(`../src/lib/${name}.js`), 'utf8'), context);
 }
 assert.equal(context.PhiMask.redact('姓名：张三').text, '姓名：[NAME]');
 assert.equal(context.PhiMask.readQuota(null).remaining, 3);
});
