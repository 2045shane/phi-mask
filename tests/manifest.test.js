const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
test('MV3 popup uses only local files and minimal permissions', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json')));
  assert.equal(manifest.manifest_version, 3);
  assert.deepEqual(manifest.permissions, ['storage', 'clipboardWrite']);
  assert.ok(!manifest.host_permissions);
  assert.ok(!manifest.content_scripts);
  for (const file of [manifest.action.default_popup, ...Object.values(manifest.icons)]) {
    assert.ok(fs.existsSync(path.join(root, file)), file);
  }
  const html = fs.readFileSync(path.join(root, manifest.action.default_popup), 'utf8');
  for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    assert.ok(fs.existsSync(path.resolve(root, path.dirname(manifest.action.default_popup), match[1])));
  }
  assert.match(html, /全部在本地处理，不上传/);
  assert.match(html, /不构成合规或医疗建议，脱敏可能遗漏，请人工复核/);
});
