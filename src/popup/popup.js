'use strict';
const api = globalThis.PhiMask;
const el = id => document.getElementById(id);
const labels = {NAME:'姓名', DOB:'出生日期', SSN:'社会安全号', MRN:'病历 / ID', EMAIL:'邮箱', PHONE:'电话', ADDRESS:'街道地址', ZIP:'邮编', DATE:'日期'};
const quota = api.createQuotaStore(chrome.storage.local);
for (const type of api.TYPES) {
  const label = document.createElement('label');
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox'; checkbox.checked = true; checkbox.value = type;
  label.append(checkbox, document.createTextNode(labels[type]));
  el('types').append(label);
}
function showQuota(state) {
  el('quota').textContent = state.unlocked ? '本地演示已解锁' : `今日免费剩余 ${state.remaining} / 3 次`;
}
function invalidate() {
  el('output').value = ''; el('copy').disabled = true;
  el('summary').textContent = '输入或选项已改变，请重新脱敏';
}
el('input').addEventListener('input', invalidate);
el('types').addEventListener('change', invalidate);
el('redact').addEventListener('click', async () => {
  if (!el('input').value.trim()) { el('status').textContent = '请先粘贴文本'; return; }
  if (!el('types').querySelector('input:checked')) { el('status').textContent = '请至少选择一种脱敏类型'; return; }
  el('redact').disabled = true;
  el('status').textContent = '';
  invalidate();
  try {
    const options = Object.fromEntries([...el('types').querySelectorAll('input')].map(input => [input.value, input.checked]));
    const result = api.redact(el('input').value, options);
    const state = await quota.consume(); showQuota(state);
    if (!state.recorded) { el('status').textContent = api.CTA; return; }
    el('output').value = result.text; el('copy').disabled = false;
    el('summary').textContent = `共脱敏 ${result.total} 处：` + api.TYPES.map(type => `${labels[type]} ${result.counts[type]}`).join(' · ');
  } catch { el('status').textContent = '无法读取或保存本地配额，请重试'; }
  finally { el('redact').disabled = false; }
});
el('copy').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(el('output').value); el('status').textContent = '已复制，请人工复核后使用'; }
  catch { el('status').textContent = '复制失败，请手动选择结果复制'; }
});
async function setLicense(unlocked) {
  el('unlock').disabled = el('reset').disabled = true;
  try {
    await chrome.storage.local.set({[api.STORAGE_KEYS.license]: unlocked ? await api.issueLicense() : ''});
    showQuota(await quota.status()); el('status').textContent = unlocked ? '已启用本地演示解锁' : '已恢复免费模式，保留今日用量';
  } catch { el('status').textContent = '保存本地许可失败，请重试'; }
  finally { el('unlock').disabled = el('reset').disabled = false; }
}
el('unlock').addEventListener('click', () => setLicense(true));
el('reset').addEventListener('click', () => setLicense(false));
quota.status().then(state => {
  showQuota(state); el('redact').disabled = el('unlock').disabled = el('reset').disabled = false;
}).catch(() => { el('status').textContent = '本地存储不可用，请重新打开弹窗'; });
