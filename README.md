# PHI Mask 本地脱敏

Chrome MV3 扩展 MVP：粘贴文本，按类型启发式替换姓名、出生日期、SSN、病历号 / ID、邮箱、电话、美国街道地址、ZIP 邮编和日期，显示各类计数并复制结果。支持中文姓名、出生日期、病历号与大陆手机号。可分别开关每种类型。

全部在本地处理，不上传，无网络调用、依赖、主机权限或页面脚本。只处理手动粘贴内容；原文与结果仅保留在弹窗内存，关闭即清除。存储仅用于每日配额和本地许可演示。每天免费 3 次，按本机日期重置；弹窗可启用无限次数演示解锁，无付款、无真实授权服务。

加载：打开 `chrome://extensions` → **开发者模式** → **加载已解压** → 选择本目录。点击扩展图标即可使用。

测试：Node 20+，运行 `npm test`，无需安装依赖。

**不构成合规或医疗建议，脱敏可能遗漏，请人工复核。尚未在真实网站上进行实测验证。** 规则可能误报普通数字或漏掉无标签姓名、复杂地址等；出生日期优先于普通日期，关闭出生日期后仍可能被日期规则处理。不是 HIPAA 或其他标准的合规认证工具。

## English

An original, local-only Chrome MV3 redaction MVP. Paste text, toggle PHI types, redact into placeholders, review counts and copy the result. Uses bounded heuristics, not a medical or compliance service. No network, dependencies, host permissions or page access. Text is never persisted; only local daily usage and a demo license are stored. Three free runs per local day; the offline demo unlock is a stub, not secure licensing.

Load unpacked: `chrome://extensions` → Developer mode (开发者模式) → Load unpacked (加载已解压) → select this directory. Test with Node 20+: `npm test`.

**NOT live-verified on real sites. Redaction may miss identifiers or produce false positives; manually review every result. Not compliance or medical advice.** Icons are copied placeholders from the reference project.
