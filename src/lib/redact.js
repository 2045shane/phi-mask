(function(root) {
'use strict';
const TYPES = ['NAME','DOB','SSN','MRN','EMAIL','PHONE','ADDRESS','ZIP','DATE'];
const date = String.raw`(?:\d{4}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}|\d{4}年\d{1,2}月\d{1,2}日|(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+\d{1,2},?\s+\d{4})`;
// Specific labelled values win before general dates/numbers. Match original spans,
// so replacement text never becomes input to another rule.
const rules = [
 ['DOB',new RegExp(String.raw`(?:\bDOB\b|\bDate of birth\b|出生日期)\s*[:：]?\s*(${date})`,'gi'),true],
 ['NAME',/(?:\b(?:Patient|Name)\s*[:：]\s*|\b(?:Mr|Mrs|Ms|Dr)\.\s+)([A-Z][a-z]+(?:[ \t]+[A-Z][a-z]+){0,3})\b/g,true],
 ['NAME',/姓名\s*[:：]\s*([\u3400-\u9fff·]{2,8})/g,true],
 ['MRN',/(?:\b(?:MRN|Medical record(?: number)?|Patient ID|ID)\b|病历号)\s*[:：#]?\s*([A-Z0-9]*\d[A-Z0-9-]*)/gi,true],
 ['EMAIL',/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi],
 ['SSN',/\b\d{3}-\d{2}-\d{4}\b/g],
 ['DATE',new RegExp(date,'gi')],
 ['PHONE',/(?<!\w)(?:(?:\+?1[ .-]?)?(?:\(\d{3}\)[ .-]?|\d{3}[ .-])\d{3}[ .-]?\d{4}|\d{10}|(?:\+?86[ -]?)?1[3-9]\d{9})(?!\w)/g],
 ['ADDRESS',/\b\d{1,6}[ \t]+(?:[A-Z0-9.'-]+[ \t]+){1,6}(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Way)\b\.?/gi],
 ['ZIP',/\b\d{5}(?:-\d{4})?\b/g]
];
// Keep street matching deliberately bounded to avoid swallowing clinical prose.
function redact(text, options = {}) {
 text=String(text ?? '');
 const counts=Object.fromEntries(TYPES.map(type=>[type,0]));
 const spans=[];
 for(const [type,regex,labelled] of rules){
  if(options[type]===false) continue;
  regex.lastIndex=0;
  for(const match of text.matchAll(regex)){
   const value=labelled?match[1]:match[0];
   const start=match.index+(labelled?match[0].lastIndexOf(value):0), end=start+value.length;
   if(spans.some(span=>start<span.end && end>span.start)) continue;
   spans.push({start,end,type});counts[type]++;
  }
 }
 spans.sort((a,b)=>a.start-b.start);
 let output='',cursor=0;
 for(const span of spans){output+=text.slice(cursor,span.start)+`[${span.type}]`;cursor=span.end;}
 return {text:output+text.slice(cursor),counts,total:spans.length};
}
const api={TYPES,redact}; Object.assign(root.PhiMask ||= {},api);
if(typeof module!=='undefined' && module.exports) module.exports=api;
})(globalThis);
