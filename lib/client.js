// DSH 余额插件 browser half（手工构建的 web bundle，仅依赖基线外部模块 react）。
// 注册到 sidebar.footer.action（侧边栏底部「设置」旁的操作区），显示 DeepSeek API 余额。
// 该槽的 ownerProps 提供 wide：true = 侧边栏展开，false = 56px 折叠轨道。
window.__ModuleLoader__.load({
	id: '@etony668/dsh-balance',
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		var React = require('react');
		var el = React.createElement;

		var TB_LANG = (((typeof navigator !== 'undefined' && navigator.language) || (typeof document !== 'undefined' && document.documentElement && document.documentElement.lang) || 'en') + '').toLowerCase().indexOf('zh') === 0 ? 'zh' : 'en';
		var I18N = {
			zh: {
				label: '余额',
				loading: '余额 …',
				unavailable: '余额不可用',
				noKey: '未找到 API Key',
				low: '余额不足，请及时充值',
				detail: '可用余额 {total}（赠送 {granted} · 充值 {toppedUp}）',
				updated: '更新于 {time} · 点击刷新',
				stale: '显示的是上次成功获取的余额 · 点击重试',
			},
			en: {
				label: 'Balance',
				loading: 'Balance …',
				unavailable: 'Balance unavailable',
				noKey: 'API key not found',
				low: 'Low balance — please top up',
				detail: 'Available {total} (granted {granted} · topped up {toppedUp})',
				updated: 'Updated {time} · click to refresh',
				stale: 'Showing the last successful value · click to retry',
			},
		};
		function t(key) {
			var value = I18N[TB_LANG][key];
			return value === undefined ? I18N.en[key] : value;
		}
		function fmt(key, values) {
			var text = String(t(key));
			for (var name in values) {
				if (Object.prototype.hasOwnProperty.call(values, name)) text = text.replace('{' + name + '}', values[name]);
			}
			return text;
		}
		function money(amount, currency) {
			if (amount === null || amount === undefined || isNaN(amount)) return '—';
			var symbol = currency === 'CNY' ? '¥' : (currency === 'USD' ? '$' : (currency ? currency + ' ' : ''));
			return symbol + Number(amount).toFixed(2);
		}
		function clockOf(ms) {
			try {
				var date = new Date(ms);
				var pad = function (n) { return (n < 10 ? '0' : '') + n; };
				return pad(date.getHours()) + ':' + pad(date.getMinutes());
			} catch (e) { return ''; }
		}

		var CSS = [
			'.dsh-bal { display:inline-flex; align-items:center; gap:6px; max-width:100%; padding:4px 8px; border-radius:8px; border:none; background:transparent !important; box-shadow:none; color:var(--dsw-alias-label-secondary); font:inherit; font-size:12px; line-height:16px; font-variant-numeric:tabular-nums; cursor:pointer; user-select:none; white-space:nowrap; overflow:hidden; transition:background-color 120ms ease, color 120ms ease; }',
			'.dsh-bal:hover { background:color-mix(in srgb, var(--dsw-alias-bg-layer-1) 92%, transparent); color:var(--dsw-alias-label-primary); }',
			'.dsh-bal-rail { justify-content:center; padding:4px 0; gap:0; }',
			'.dsh-bal-low { color:var(--dsw-alias-state-error-primary); font-weight:600; }',
			'.dsh-bal-error { color:var(--dsw-alias-label-tertiary); }',
			'.dsh-bal-dot { flex:none; width:7px; height:7px; border-radius:50%; background:var(--dsw-alias-state-success-primary); }',
			'.dsh-bal-low .dsh-bal-dot { background:var(--dsw-alias-state-error-primary); }',
			'.dsh-bal-error .dsh-bal-dot { background:var(--dsw-alias-label-tertiary); }',
			'.dsh-bal-text { overflow:hidden; text-overflow:ellipsis; }',
		].join('\n');

		function BalanceBadge(props) {
			var state = React.useState(null), data = state[0], setData = state[1];
			var state2 = React.useState(false), busy = state2[0], setBusy = state2[1];
			var state3 = React.useState(null), pos = state3[0], setPos = state3[1];
			var hostRef = React.useRef(null);
			var wide = props.wide !== false;

			async function load(op, manual) {
				if (manual) setBusy(true);
				try {
					var response = await fetch('/api/dsh-balance', {
						method: 'POST',
						headers: { 'content-type': 'application/json' },
						body: JSON.stringify({ op: op || 'get' }),
					});
					var json = await response.json();
					setData(json);
				} catch (error) {
					setData({ ok: false, error: String((error && error.message) || error) });
				} finally {
					if (manual) setBusy(false);
				}
			}

			// 固定坐标定位：把徽标贴到「设置」行右侧（fixed 脱离文档流，布局零影响）。
			// 坐标每 600ms 只读测量一次，误差 <=1px 时不更新（无重渲染抖动）。
			React.useEffect(function () {
				if (!wide) { setPos(null); return; }
				function measure() {
					try {
						var node = hostRef.current;
						if (!node) return;
						var row = node.parentElement;
						var settingsRow = null;
						for (var i = 0; i < 5 && row; i += 1) {
							if (row.nextElementSibling) { settingsRow = row.nextElementSibling; break; }
							row = row.parentElement;
						}
						if (!settingsRow) return;
						var rect = settingsRow.getBoundingClientRect();
						var height = node.offsetHeight || 24;
						var width = node.offsetWidth || 120;
						var top = Math.round(rect.top + (rect.height - height) / 2);
						// 右对齐到侧边栏内部：元素右端距设置行右缘 8px，绝不越界。
						var left = Math.round(rect.right - width - 8);
						if (left < rect.left) left = Math.round(rect.left);
						setPos(function (current) {
							if (current && Math.abs(current.top - top) <= 1 && Math.abs(current.left - left) <= 1) return current;
							return { top: top, left: left };
						});
					} catch (error) { /* ignore */ }
				}
				measure();
				var tctx = props.tctx;
				var timer = null;
				try { timer = window.setTimeout(measure, 300); } catch (error) { /* ignore */ }
				var stop = null;
				if (tctx && tctx.timer && typeof tctx.timer.interval === 'function') {
					stop = tctx.timer.interval(measure, 600);
				}
				function onResize() { measure(); }
				try { window.addEventListener('resize', onResize); } catch (error) { /* ignore */ }
				return function () {
					if (timer) { try { window.clearTimeout(timer); } catch (e) { /* ignore */ } }
					if (typeof stop === 'function') { try { stop(); } catch (e) { /* ignore */ } }
					try { window.removeEventListener('resize', onResize); } catch (e) { /* ignore */ }
				};
			}, [wide]);

			React.useEffect(function () { load('get', false); }, []);
			React.useEffect(function () {
				var tctx = props.tctx;
				if (!tctx || !tctx.timer || typeof tctx.timer.interval !== 'function') return;
				return tctx.timer.interval(function () { load('get', false); }, 60000);
			}, []);

			var threshold = data && typeof data.threshold === 'number' ? data.threshold : 2;
			var isLow = !!(data && data.ok && typeof data.total === 'number' && data.total < threshold);
			var className = 'dsh-bal' + (wide ? '' : ' dsh-bal-rail') + (isLow ? ' dsh-bal-low' : '') + (data && data.ok === false ? ' dsh-bal-error' : '');
			var text;
			var title;

			if (data === null) {
				text = t('loading');
				title = '';
			} else if (data.ok === false) {
				var reason = String(data.error || '');
				text = /DEEPSEEK_API_KEY/.test(reason) ? t('noKey') : t('unavailable');
				title = reason;
			} else {
				text = t('label') + ' ' + money(data.total, data.currency);
				var lines = [
					fmt('detail', { total: money(data.total, data.currency), granted: money(data.granted, data.currency), toppedUp: money(data.toppedUp, data.currency) }),
					fmt('updated', { time: clockOf(data.fetchedAt || Date.now()) }),
				];
				if (data.stale) lines.push(t('stale'));
				if (isLow) lines.unshift(t('low'));
				title = lines.join('\n');
			}

			var style = wide && pos
				? { position: 'fixed', zIndex: 60, top: pos.top, left: pos.left }
				: undefined;

			return el('span', {
				ref: hostRef,
				role: 'button',
				tabIndex: 0,
				className: className,
				style: style,
				title: title,
				'aria-label': title || text,
				onClick: function () { load('refresh', true); },
			},
				el('span', { className: 'dsh-bal-dot' }),
				wide ? el('span', { className: 'dsh-bal-text' }, isLow ? '⚠ ' + text : text) : null);
		}

		function apply(ctx) {
			var slots = ctx.get('slots');
			if (slots === undefined) return;

			// 幂等注入：先清掉本插件此前注入的两条通道，避免热重载反复累积旧规则
			// （构造式样式表没有 ownerNode，只能靠自定义标记识别归属）。
			try {
				var stale = document.querySelectorAll('style[data-plugin-css="@etony668/dsh-balance/balance.css"]');
				for (var i = 0; i < stale.length; i += 1) {
					if (stale[i].parentNode) stale[i].parentNode.removeChild(stale[i]);
				}
			} catch (error) { /* ignore */ }
			try {
				if (document.adoptedStyleSheets && document.adoptedStyleSheets.length) {
					document.adoptedStyleSheets = document.adoptedStyleSheets.filter(function (item) {
						return !(item && item.__dshBalanceOwned === true);
					});
				}
			} catch (error) { /* ignore */ }

			var styleElement = document.createElement('style');
			styleElement.setAttribute('data-plugin-css', '@etony668/dsh-balance/balance.css');
			styleElement.textContent = CSS;
			document.head.appendChild(styleElement);
			var ownedSheet = null;
			try {
				ownedSheet = new CSSStyleSheet();
				ownedSheet.replaceSync(CSS);
				ownedSheet.__dshBalanceOwned = true;
				if (document.adoptedStyleSheets) {
					document.adoptedStyleSheets = document.adoptedStyleSheets.concat([ownedSheet]);
				}
			} catch (error) { ownedSheet = null; }
			ctx.effect(function () {
				if (styleElement.parentNode) styleElement.parentNode.removeChild(styleElement);
				try {
					if (ownedSheet && document.adoptedStyleSheets && document.adoptedStyleSheets.length) {
						document.adoptedStyleSheets = document.adoptedStyleSheets.filter(function (item) {
							return item !== ownedSheet;
						});
					}
				} catch (error) { /* ignore */ }
			}, 'dsh-balance: styles');

			slots.inject('sidebar.footer.action', function () {
				return slots.register({
					name: 'sidebar.footer.action',
					id: 'dsh-balance',
					order: 10,
				}, function (props) {
					return el(BalanceBadge, { tctx: ctx, wide: !(props && props.wide === false) });
				});
			});
		}

		exports.inject = ['slots', 'timer'];
		exports.apply = apply;
		return module.exports;
	}
});
