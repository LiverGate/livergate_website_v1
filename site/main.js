// mobile menu toggle
var burger = document.getElementById('burger');
var mnav = document.getElementById('mnav');
if (burger && mnav) {
  burger.addEventListener('click', function () {
    mnav.style.display = (mnav.style.display === 'block') ? 'none' : 'block';
  });
  mnav.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () { mnav.style.display = 'none'; });
  });
}

// scroll reveal
var io = new IntersectionObserver(function (entries) {
  entries.forEach(function (e) {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });

// お問い合わせ／エントリー内容をサーバーAPIへ送信する共通関数。
// 成否を Promise<boolean> で返す。一覧は管理画面(admin.html)から API 経由で参照。
function ogSaveInquiry(kind, data) {
  return fetch('/api/inquiries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind: kind, data: data })
  }).then(function (r) { return r.ok; }).catch(function () { return false; });
}
window.ogSaveInquiry = ogSaveInquiry;
var OG_SEND_FAIL = '送信に失敗しました。お手数ですが livergate0804@gmail.com までメールでご連絡ください。';

// contact form (no backend — save locally & show confirmation)
var form = document.getElementById('contactForm');
if (form) {
  // preselect inquiry type from ?type= query param
  try {
    var t = new URLSearchParams(window.location.search).get('type');
    var sel = document.getElementById('f-type');
    if (t && sel && sel.querySelector('option[value="' + t + '"]')) sel.value = t;
  } catch (err) { /* noop */ }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    var v = function (id) { var el = document.getElementById(id); return el ? el.value : ''; };
    var btn = form.querySelector('[type="submit"]');
    if (btn) { btn.disabled = true; btn.dataset.label = btn.textContent; btn.textContent = '送信中…'; }
    ogSaveInquiry('contact', {
      type: v('f-type'), name: v('f-name'), company: v('f-company'),
      email: v('f-email'), tel: v('f-tel'), message: v('f-msg')
    }).then(function (ok) {
      if (!ok) {
        alert(OG_SEND_FAIL);
        if (btn) { btn.disabled = false; btn.textContent = btn.dataset.label; }
        return;
      }
      var done = document.getElementById('formDone');
      form.style.display = 'none';
      if (done) {
        done.classList.add('show');
        done.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  });
}

// ============================================================
// Hero background: dots gather into a "pomegranate", ripen, fall — looped.
// Subtle, semi-transparent. Index page only (#heroCanvas).
// ============================================================
(function () {
  var canvas = document.getElementById('heroCanvas');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  var heroEl = canvas.closest ? canvas.closest('.hero') : null;
  var gatheredFired = false;
  var cliX = -1, cliY = -1, exciteS = 0;   // カーソル位置と「ドキドキ」度
  var sparks = [], prevMx = -1, prevMy = -1, maxParts = 0;   // カーソルから湧く点（中心へ引っ張られ、実に取り込まれる）
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DPR = Math.min(window.devicePixelRatio || 1, 2);
  var W = 0, H = 0, parts = [], order = [], cx = 0, cy = 0, R = 0;
  var AC = '199,48,60'; // ザクロ色
  var HI = '232,84,96'; // 熟したハイライト
  // ザクロ（葉つき）のシルエット＝距離グリッド（厚み情報つき／base64）。0=外, >0=内（中心ほど大）
  var SIL = { gw: 84, gh: 132, cu: 0.4897, cv: 0.5326, split: 0.345, dist: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAcKBwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABwoRCgcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABw4UEQoHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHChEYFA4HAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAcKERQbGBEKBwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAcOFBseGxQOBwAAAAAAAAAAAAAAAAAA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AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABw4UEQ4RFBsiGxQRDhEUDgcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHChERCgcKERgfGBEKBwoREQoHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHDhQOBwAHDhUcFQ4HAAcOFA4HAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHDg4KBwAHDhQbFA4HAAcKDg4HAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAcKCgcHAAAHChEYEQoHAAAHBwoKBwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAcKBwAAAAAABw4UDgcAAAAAAAcKBwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABwcHAAAAAAAABwoRCgcAAAAAAAAHBwcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHBwAAAAAAAAAAAAcOBwAAAAAAAAAAAAAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAcKBwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' };
  var silBin = null, SILW = 0, SILH = 0, SILT = 0;
  var PERIOD = 9000;    // 1ループの長さ(ms)
  var lastCycle = -1, raf = null;
  var start0 = null, GATHER_MS = 5000;                   // 集合にかける時間（5秒）
  var beatStart = 0, beatLen = null, beatIdx = 0, beatAmp = 0.12;   // 不規則な鼓動の状態
  var FREEZE = (location.hash.match(/t=([0-9.]+)/) || [])[1];
  FREEZE = (FREEZE !== undefined) ? parseFloat(FREEZE) : null;   // #t=0.52 で静止確認
  // フェーズ境界(0..1)
  var T_GATHER = 0.40, T_SOLID = 0.56, T_FALL = 0.58, T_ROT = 0.50;

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function clamp01(x) { return x < 0 ? 0 : (x > 1 ? 1 : x); }
  function easeOutCubic(x) { return 1 - Math.pow(1 - x, 3); }
  function easeInQuad(x) { return x * x; }
  function easeInOutCubic(x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
  // 拍ごとに間隔・強さをばらつかせる（決定的な擬似乱数）
  function hash(n) { var s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
  function nextBeat(idx) {
    var r1 = hash(idx + 1.0), r3 = hash(idx * 2.3 + 4.1);
    var len = 1050 + (r1 - 0.5) * 150;   // 約975〜1125ms（≈53〜62bpm／ゆったりめ）
    return { len: len, amp: 0.11 + 0.03 * r3 };  // 拍の強さはわずかにゆらぐ
  }
  // シルエット内の点を1つサンプリング。[x, y, d] を返す（d=0..1 厚み＝中心ほど大）
  function sampleSil() {
    if (silBin === null) silBin = atob(SIL.dist);
    for (var t = 0; t < 60; t++) {
      var u = Math.random(), v = Math.random();
      var gx = (u * SIL.gw) | 0, gy = (v * SIL.gh) | 0, idx = gy * SIL.gw + gx;
      var dv = silBin.charCodeAt(idx);
      if (dv > 0) {
        var yy = (v - SIL.cv) * SILH;
        if (v < SIL.split) yy -= SILH * 0.13;   // くびれより上＝葉を本体から離す
        return [(u - SIL.cu) * SILW, yy, dv / 255];
      }
    }
    return [0, 0, 0.2];
  }
  // 厚みdの位置に立体的なz（中心ほど厚い・前後に充填）
  function silZ(d) { return (Math.random() * 2 - 1) * SILT * Math.sqrt(d); }

  // ボディ（球体）＋上部に独立した3枚の葉。[x,y,z,seed] を返す
  function makeFruitPoint() {
    if (Math.random() < 0.83) {                       // ボディ（ザクロ形：表面寄りで密に）
      var th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
      var rr = Math.pow(Math.random(), 0.4) * R, sp = Math.sin(ph), cph = Math.cos(ph);
      var u = (1 - cph) * 0.5;                         // 0=底（下） … 1=上（王冠側）
      // ザクロのプロファイル：中央やや下が最も太く、上端はくびれ、底は丸く絞る
      var hS = 0.72 + 0.31 * Math.sin(Math.PI * clamp01(u * 0.92 + 0.06)) - 0.14 * Math.pow(u, 3);
      return [sp * Math.cos(th) * rr * hS, cph * rr * 0.96, sp * Math.sin(th) * rr * hS, Math.random() < 0.07];
    }
    // 王冠（がく）：上部のリング状ベース＋放射状の尖り（スパイク）でザクロの王冠を表現
    var SPIKES = 6;                  // 尖りの本数
    var crownH = 0.46 * R;           // 尖りの高さ
    var GAP = crownH / 1.618;        // 実と王冠の隙間＝王冠高さ ÷ 黄金比(φ)
    var baseY = -(R + GAP);          // 実の上端から黄金比ぶん隙間を空けて王冠ベース（yマイナス＝上）
    var baseR = 0.22 * R;            // ベースリング半径
    var tipR = 0.44 * R;             // 尖り先端の外向き半径（外へ開く＝少し開いた王冠）
    if (Math.random() < 0.30) {
      // ベースリング（短い筒）
      var ra = Math.random() * Math.PI * 2;
      var rr2 = baseR * (0.88 + Math.random() * 0.24);
      var ry = baseY + Math.random() * (0.12 * R);
      return [Math.cos(ra) * rr2, ry, Math.sin(ra) * rr2, Math.random() < 0.06];
    }
    // 尖り（スパイク）：根元→先端で外へ開きつつ上へ伸び、先細りの三角
    var si = (Math.random() * SPIKES) | 0;
    var sa = (si / SPIKES) * Math.PI * 2 + Math.PI / SPIKES;
    var st = Math.pow(Math.random(), 1.3);                 // 0=根元 1=先端（根元側を密に）
    var sRad = baseR + (tipR - baseR) * Math.pow(st, 1.6); // 先端ほど外へカーブ（反り）
    var sHalf = (0.075 * R) * (1 - st);                    // 周方向の幅（先端で0＝尖る）
    var sAcross = (Math.random() * 2 - 1) * sHalf;
    var sThick = (0.035 * R) * (1 - st * 0.5);             // 半径方向の厚み（根元厚め）
    var sRadial = (Math.random() * 2 - 1) * sThick;
    var ca = Math.cos(sa), za = Math.sin(sa);
    var sx2 = ca * (sRad + sRadial) - za * sAcross;
    var sz2 = za * (sRad + sRadial) + ca * sAcross;
    var sy2 = baseY - crownH * Math.pow(st, 0.85);         // 高さは先端側でゆるみ＝反り
    return [sx2, sy2, sz2, Math.random() < 0.06];
  }

  function build() {
    var mobile = W < 760;
    var N = mobile
      ? Math.max(3200, Math.min(5200, Math.floor((W * H) / 54)))   // モバイル密度UP
      : Math.max(10000, Math.min(21000, Math.floor((W * H) / 40)));
    parts = [];
    cx = W * 0.5; cy = H * 0.52; R = Math.max(mobile ? 68 : 50, Math.min(W, H) * (mobile ? 0.22 : 0.13));
    function add(px, py, pz, sz, seed) {
      parts.push({ x: px, y: py, z: pz, size: sz, seed: seed, delay: Math.random() * 0.3,
        sx: 0, sy: 0, _z: 0, _x: 0, _y: 0, _s: 0, _a: 0, _c: AC, _fadein: 1 });
    }
    // ボディ（球体）＋3枚の葉を生成
    for (var i = 0; i < N; i++) {
      var pt = makeFruitPoint();
      add(pt[0], pt[1], pt[2], rnd(0.5, 1.1), pt[3]);
    }
    order = parts.map(function (_, i) { return i; });
    maxParts = parts.length + (W < 760 ? 3000 : 5500);   // タッチ/カーソルで増やせる上限（密度UP）
    start0 = null;   // レイアウト変更時は集合をやり直す
    beatStart = 0; beatLen = null; beatIdx = 0;   // 鼓動もリセット
    scatter();
  }

  // カーソルの点が中心へ届いたとき、シルエットの永久パーティクルとして取り込む（密度UP）
  function addFruitPoint() {
    var pt = makeFruitPoint();
    parts.push({ x: pt[0], y: pt[1], z: pt[2], size: rnd(0.5, 1.1),
      seed: pt[3], delay: 0, sx: 0, sy: 0,
      _z: 0, _x: 0, _y: 0, _s: 0, _a: 0, _c: AC, _fadein: 0 });
    order.push(parts.length - 1);
  }

  function scatter() {
    for (var i = 0; i < parts.length; i++) {
      // 画面の外側まで含め、四方八方から飛来（距離もばらつかせる）
      var ang = Math.random() * Math.PI * 2;
      var dist = rnd(0.6, 1.6);                  // 中心からの距離（近い点〜遠い点）
      parts[i].sx = cx + Math.cos(ang) * W * dist + rnd(-W * 0.2, W * 0.2);
      parts[i].sy = cy + Math.sin(ang) * H * dist + rnd(-H * 0.2, H * 0.2);
      parts[i].swirlOff = rnd(-0.6, 0.6);
    }
  }

  function size() {
    var r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
    if (!W || !H) return false;
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    build();
    return true;
  }

  function drawDot(x, y, s, a, col) {
    if (a <= 0.01) return;
    ctx.beginPath();
    ctx.arc(x, y, Math.max(0.3, s), 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(' + (col || AC) + ',' + a.toFixed(3) + ')';
    ctx.fill();
  }

  function frame(now) {
    ctx.clearRect(0, 0, W, H);
    var tnow;
    if (FREEZE !== null) tnow = FREEZE * PERIOD;
    else { if (start0 === null) start0 = now; tnow = now - start0; }

    var gT = clamp01(tnow / GATHER_MS);                        // 0..1 集合の進み
    var beatAmt = clamp01((tnow - GATHER_MS) / 700);           // 丸くなってから鼓動を始める

    // 点が集まり切った瞬間に見出しを出す
    if (!gatheredFired && gT >= 0.7 && heroEl) { gatheredFired = true; heroEl.classList.add('gathered'); }

    // カーソルの近さで「ドキドキ」（近いほど速く・強く）
    var rect = canvas.getBoundingClientRect();
    var mx = (cliX < 0) ? -1 : (cliX - rect.left), my = (cliX < 0) ? -1 : (cliY - rect.top);
    var exTarget = 0;
    if (mx >= 0) { var dd = Math.sqrt((mx - cx) * (mx - cx) + (my - cy) * (my - cy)); exTarget = clamp01(1 - dd / (R * 3.2)); }
    exciteS += (exTarget - exciteS) * 0.07;                    // なめらかに追従
    var spd = 1 - 0.45 * exciteS;                             // 近いほどテンポUP（最大約45%速く）

    // カーソルを動かすと点が湧き出す（ヒーロー範囲内のみ）
    if (mx > -80 && mx < W + 80 && my > -80 && my < H + 80) {
      var moved = (prevMx >= 0) ? Math.sqrt((mx - prevMx) * (mx - prevMx) + (my - prevMy) * (my - prevMy)) : 0;
      if (moved > 2 && sparks.length < 500) {
        var nSpawn = Math.min(4, 1 + ((moved / 14) | 0));
        for (var k = 0; k < nSpawn; k++) {
          var f = k / nSpawn;
          sparks.push({ x: prevMx + (mx - prevMx) * f + rnd(-4, 4), y: prevMy + (my - prevMy) * f + rnd(-4, 4),
            vx: rnd(-0.5, 0.5), vy: rnd(-0.5, 0.5), life: 150 + (Math.random() * 90 | 0), seed: Math.random() < 0.4 });
        }
      }
    }
    prevMx = mx; prevMy = my;

    // カーソルが無くても点が湧いて常にザクロへ集まり続ける（アンビエント流入）
    if (gT >= 1 && sparks.length < 360 && Math.random() < 0.55) {
      var aang = Math.random() * Math.PI * 2, adist = R * rnd(1.5, 2.8);
      sparks.push({ x: cx + Math.cos(aang) * adist, y: cy + Math.sin(aang) * adist,
        vx: rnd(-0.4, 0.4), vy: rnd(-0.4, 0.4), life: 400, seed: Math.random() < 0.3 });
    }

    // 心臓の鼓動（lub-dub）— 拍ごとに間隔・強さがばらつく
    if (beatLen === null) { var b0 = nextBeat(beatIdx); beatLen = b0.len * spd; beatAmp = b0.amp; }
    while (tnow - beatStart >= beatLen) { beatStart += beatLen; beatIdx++; var nb = nextBeat(beatIdx); beatLen = nb.len * spd; beatAmp = nb.amp; }
    var bp = (tnow - beatStart) / beatLen;
    var pulse = Math.exp(-Math.pow((bp - 0.10) / 0.05, 2)) + 0.5 * Math.exp(-Math.pow((bp - 0.26) / 0.055, 2));
    // 最初に点が集まって小さなザクロを形成 → そこから現在サイズへ大きくなっていく
    var grow = 1.2;                                           // 常時120%（点は集合のみ）
    var scaleF = grow * (1 + beatAmp * pulse * beatAmt * (1 + 0.9 * exciteS));   // 近いほど大きく脈打つ

    var rotY = -tnow * 0.00025;                               // 左回り（反時計回り）にゆっくり連続回転
    var cosY = Math.cos(rotY), sinY = Math.sin(rotY);
    var tilt = 0.16, cosT = Math.cos(tilt), sinT = Math.sin(tilt);
    var by = cy;

    // 光源（左上・手前）＋ハーフベクトル（鏡面）
    var Lx = -0.42, Ly = -0.5, Lz = 0.76, Ll = Math.sqrt(Lx * Lx + Ly * Ly + Lz * Lz);
    Lx /= Ll; Ly /= Ll; Lz /= Ll;
    var Hx = Lx, Hy = Ly, Hz = Lz + 1, Hl = Math.sqrt(Hx * Hx + Hy * Hy + Hz * Hz);
    Hx /= Hl; Hy /= Hl; Hz /= Hl;

    // 鼓動に合わせた温かい発光（拍で強まる／カーソルが近いほど強い）
    var glow = (0.05 + 0.13 * pulse) * beatAmt * (1 + 0.8 * exciteS);
    if (glow > 0.01) {
      var bloomR = R * 1.7;
      var bg = ctx.createRadialGradient(cx, by, R * 0.15, cx, by, bloomR);
      bg.addColorStop(0, 'rgba(228,72,86,' + (glow * 0.7).toFixed(3) + ')');
      bg.addColorStop(1, 'rgba(228,72,86,0)');
      ctx.globalAlpha = 1; ctx.fillStyle = bg;
      ctx.fillRect(cx - bloomR, by - bloomR, bloomR * 2, bloomR * 2);
    }

    // ---- 立体ボディ＋葉：3D回転・投影・グロッシー陰影 ----
    var depthN = R;
    var beatB = 1 + 0.30 * pulse * beatAmt * (1 + 0.9 * exciteS);
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      var y1 = p.y * cosT - p.z * sinT;
      var z1 = p.y * sinT + p.z * cosT;
      var x2 = (p.x * cosY + z1 * sinY) * scaleF;
      var z2 = (-p.x * sinY + z1 * cosY) * scaleF;
      var y2 = y1 * scaleF;
      var tx = cx + x2, ty = by + y2, x, y, a;
      if (gT < 1) {
        var e = easeOutCubic(clamp01((gT - p.delay) / (1 - p.delay)));   // 集合は全体(5秒)かけて完了
        x = p.sx + (tx - p.sx) * e; y = p.sy + (ty - p.sy) * e; a = e;
      } else { x = tx; y = ty; a = 1; }
      var len = Math.sqrt(x2 * x2 + y2 * y2 + z2 * z2) || 1;
      var nx = x2 / len, ny = y2 / len, nz = z2 / len;
      var diff = nx * Lx + ny * Ly + nz * Lz; if (diff < 0) diff = 0;
      var sd = nx * Hx + ny * Hy + nz * Hz; if (sd < 0) sd = 0;
      var spec = Math.pow(sd, 22);                              // 締まったグロッシーハイライト
      var depth = clamp01((z2 / depthN + 1) * 0.5);            // 0=奥,1=手前
      var lum = (0.5 + 0.62 * diff) * beatB;
      // 鮮やかな赤：影側も赤を残し、ハイライトは柔らかい白
      var baseR = p.seed ? 240 : 224, baseG = p.seed ? 84 : 46, baseB = p.seed ? 96 : 52;
      var tc = clamp01(0.5 + 0.55 * diff);
      var r = 150 + (baseR - 150) * tc, g2 = 30 + (baseG - 30) * tc, b = 36 + (baseB - 36) * tc;
      var sw = clamp01(spec * 1.3);
      r += (255 - r) * sw; g2 += (210 - g2) * sw; b += (212 - b) * sw;
      p._x = x; p._y = y; p._z = z2;
      p._s = p.size * (0.6 + 0.55 * depth) + spec * 1.1;
      p._a = clamp01((p.seed ? 0.72 : 0.64) * lum + 0.45 * spec) * a * (p._fadein < 1 ? (p._fadein += 0.05) : 1);
      p._c = 'rgb(' + (r | 0) + ',' + (g2 | 0) + ',' + (b | 0) + ')';
    }

    // ---- 奥→手前にソートして描画 ----
    order.sort(function (i, j) { return parts[i]._z - parts[j]._z; });
    for (var o = 0; o < order.length; o++) {
      var q = parts[order[o]];
      if (q._a <= 0.012) continue;
      ctx.globalAlpha = q._a;
      ctx.fillStyle = q._c;
      var d = q._s < 0.55 ? 0.55 : q._s;
      ctx.fillRect(q._x - d * 0.5, q._y - d * 0.5, d, d);
    }
    ctx.globalAlpha = 1;

    // ---- 3) カーソルから湧いた点：中心へ引っ張られて吸い込まれる ----
    for (var si = sparks.length - 1; si >= 0; si--) {
      var s = sparks[si];
      var sdx = cx - s.x, sdy = cy - s.y;
      s.vx = (s.vx + sdx * 0.004) * 0.90;   // 中心への弱い引力＋ゆるい減衰（ゆっくり吸い込まれる）
      s.vy = (s.vy + sdy * 0.004) * 0.90;
      s.x += s.vx; s.y += s.vy; s.life--;
      var sdist = Math.sqrt(sdx * sdx + sdy * sdy);
      if (sdist < R * 0.28) { if (parts.length < maxParts) addFruitPoint(); sparks.splice(si, 1); continue; }  // 中心に届いたら実に取り込む
      if (s.life <= 0) { sparks.splice(si, 1); continue; }
      var la = clamp01(s.life / 30) * clamp01(sdist / (R * 0.9));   // 寿命末・中心付近で消える
      ctx.globalAlpha = 0.55 * la;
      ctx.fillStyle = s.seed ? 'rgb(240,120,135)' : 'rgb(206,58,72)';
      var ss = s.seed ? 1.8 : 1.3;
      ctx.fillRect(s.x - ss * 0.5, s.y - ss * 0.5, ss, ss);
    }
    ctx.globalAlpha = 1;

    if (FREEZE === null) raf = requestAnimationFrame(frame);
  }

  function staticFruit() {
    if (!size()) return;
    ctx.clearRect(0, 0, W, H);
    var tilt = 0.16, cosT = Math.cos(tilt), sinT = Math.sin(tilt);
    var Lx = -0.42, Ly = -0.5, Lz = 0.76, Ll = Math.sqrt(Lx * Lx + Ly * Ly + Lz * Lz);
    Lx /= Ll; Ly /= Ll; Lz /= Ll;
    var depthN = R;
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      var y1 = p.y * cosT - p.z * sinT, z2 = p.y * sinT + p.z * cosT, x2 = p.x, y2 = y1;
      var len = Math.sqrt(x2 * x2 + y2 * y2 + z2 * z2) || 1;
      var nx = x2 / len, ny = y2 / len, nz = z2 / len;
      var diff = nx * Lx + ny * Ly + nz * Lz; if (diff < 0) diff = 0;
      var depth = clamp01((z2 / depthN + 1) * 0.5);
      var tc = clamp01(0.5 + 0.55 * diff);
      var baseR = p.seed ? 240 : 224, baseG = p.seed ? 84 : 46, baseB = p.seed ? 96 : 52;
      var r = 150 + (baseR - 150) * tc, g2 = 30 + (baseG - 30) * tc, b = 36 + (baseB - 36) * tc;
      p._z = z2; p._x = cx + x2; p._y = cy + y2;
      p._s = p.size * (0.6 + 0.55 * depth);
      p._a = clamp01((p.seed ? 0.72 : 0.64) * (0.5 + 0.62 * diff));
      p._c = 'rgb(' + (r | 0) + ',' + (g2 | 0) + ',' + (b | 0) + ')';
    }
    order.sort(function (i, j) { return parts[i]._z - parts[j]._z; });
    for (var o = 0; o < order.length; o++) {
      var q = parts[order[o]];
      if (q._a <= 0.012) continue;
      ctx.globalAlpha = q._a; ctx.fillStyle = q._c;
      var d = q._s < 0.55 ? 0.55 : q._s;
      ctx.fillRect(q._x - d * 0.5, q._y - d * 0.5, d, d);
    }
    ctx.globalAlpha = 1;
  }

  // カーソル位置（マウス／タッチ／ペン）。離れたらリセット。
  window.addEventListener('pointermove', function (e) { cliX = e.clientX; cliY = e.clientY; });
  document.addEventListener('mouseleave', function () { cliX = -1; cliY = -1; });

  // タッチ／クリックした位置に点が湧き、ザクロへ吸い込まれる
  function spawnBurst(clientX, clientY) {
    if (!canvas || sparks.length > 600) return;
    var rect = canvas.getBoundingClientRect();
    var bx = clientX - rect.left, by = clientY - rect.top;
    if (bx < -40 || bx > W + 40 || by < -40 || by > H + 40) return;   // ヒーロー上のみ反応
    for (var i = 0; i < 26; i++) {
      var a = Math.random() * Math.PI * 2, d = rnd(0, 22);
      sparks.push({ x: bx + Math.cos(a) * d, y: by + Math.sin(a) * d,
        vx: rnd(-1.4, 1.4), vy: rnd(-1.4, 1.4), life: 320, seed: Math.random() < 0.4 });
    }
  }
  window.addEventListener('pointerdown', function (e) { cliX = e.clientX; cliY = e.clientY; spawnBurst(e.clientX, e.clientY); });
  window.addEventListener('pointerup', function (e) { if (e.pointerType === 'touch') { cliX = -1; cliY = -1; } });
  window.addEventListener('pointercancel', function () { cliX = -1; cliY = -1; });

  var rt, lastW = window.innerWidth;
  window.addEventListener('resize', function () {
    // モバイルのスクロールはURLバー開閉で高さだけ変化する → 幅が変わった時だけ作り直す（アニメの再スタート防止）
    if (Math.abs(window.innerWidth - lastW) < 2) return;
    lastW = window.innerWidth;
    clearTimeout(rt);
    rt = setTimeout(function () {
      if (reduce) staticFruit();
      else if (size() && !raf) raf = requestAnimationFrame(frame);
    }, 150);
  });

  if (reduce) {
    staticFruit();
    if (heroEl) heroEl.classList.add('gathered');   // 動きを抑える環境では即表示
  } else if (size()) {
    if (FREEZE !== null) {
      frame(FREEZE * PERIOD);                        // 任意フェーズで静止確認
      if (heroEl) heroEl.classList.add('gathered');
    } else {
      raf = requestAnimationFrame(frame);   // 文字は開いた瞬間に表示（prehold廃止）／ザクロは裏で集合→成長
    }
  }
})();

/* 採用FAB：ザクロ形状（実＋がく王冠）を点で描く。サイズ確定を確実に検知（DOM構築後） */
(function(){
  function init(){
    var cv=document.querySelector('.recruit-fab-fx');
    if(!cv||!cv.getContext)return;
    if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion:reduce)').matches)return;
    var ctx=cv.getContext('2d'),W=0,H=0,DPR=Math.min(window.devicePixelRatio||1,2),R=80,CX=0,CY=0,N=1200,parts=[],fr=0,ready=false;
    var btn=document.querySelector('.recruit-fab'),hoverT=0,hover=0;
    if(btn){btn.addEventListener('mouseenter',function(){hoverT=1;});btn.addEventListener('mouseleave',function(){hoverT=0;});btn.addEventListener('focus',function(){hoverT=1;});btn.addEventListener('blur',function(){hoverT=0;});}
    var cols=['#C7303C','#d13341','#e0454f','#b02832','#a5232c','#ef6b72'];
    function c01(x){return x<0?0:(x>1?1:x);}
    function fruitPt(){
      if(Math.random()<0.83){
        var th=Math.random()*Math.PI*2, ph=Math.acos(2*Math.random()-1), rr=Math.pow(Math.random(),0.4)*R, sp=Math.sin(ph), cph=Math.cos(ph), u=(1-cph)*0.5;
        var hS=0.72+0.31*Math.sin(Math.PI*c01(u*0.92+0.06))-0.14*Math.pow(u,3);
        return {x:sp*Math.cos(th)*rr*hS, y:cph*rr*0.96};
      }
      var SPIKES=6, crownH=0.46*R, GAP=crownH/1.618, baseY=-(R+GAP), baseR=0.22*R, tipR=0.44*R;
      if(Math.random()<0.30){ var ra=Math.random()*Math.PI*2, rr2=baseR*(0.88+Math.random()*0.24);
        return {x:Math.cos(ra)*rr2, y:baseY+Math.random()*(0.12*R)}; }
      var si=(Math.random()*SPIKES)|0, sa=(si/SPIKES)*Math.PI*2+Math.PI/SPIKES, st=Math.pow(Math.random(),1.3), sRad=baseR+(tipR-baseR)*Math.pow(st,1.6);
      var sHalf=(0.075*R)*(1-st), sAcross=(Math.random()*2-1)*sHalf, ca=Math.cos(sa), za=Math.sin(sa);
      return {x:ca*sRad-za*sAcross, y:baseY-crownH*Math.pow(st,0.85)};
    }
    function mk(){
      var tg=fruitPt(), a=Math.random()*Math.PI*2, rad=Math.max(W,H)*(0.3+Math.random()*0.3);
      return {tx:CX+tg.x, ty:CY+tg.y, x:CX+Math.cos(a)*rad, y:CY+Math.sin(a)*rad,
        t:0, inN:26+Math.random()*24, hold:220+Math.random()*320, outN:16+Math.random()*16,
        size:0.75+Math.random()*1.35, col:cols[(Math.random()*cols.length)|0], ph:0, seed:Math.random()*6.28};
    }
    function build(){ parts=[]; for(var q=0;q<N;q++){var p=mk();p.ph=1;p.t=Math.random()*p.hold;parts.push(p);} }
    function resize(){
      var r=cv.getBoundingClientRect();
      if(r.width<20||r.height<20)return;
      if(Math.abs(r.width-W)<1&&Math.abs(r.height-H)<1&&ready)return;
      W=r.width;H=r.height;cv.width=W*DPR;cv.height=H*DPR;ctx.setTransform(DPR,0,0,DPR,0,0);
      R=W*0.3;CX=W*0.5;CY=H*0.6;N=(W<300?Math.round(W*2.3):Math.min(2600,Math.round(W*7.6)));
      build();ready=true;
    }
    resize();
    window.addEventListener('resize',resize);
    if(window.ResizeObserver){try{new ResizeObserver(resize).observe(cv);}catch(e){}}
    setTimeout(resize,300);setTimeout(resize,1000);   // 保険：レイアウト確定後に再試行
    function tick(){
      requestAnimationFrame(tick);
      if(!ready){return;}
      ctx.clearRect(0,0,W,H); fr++;
      hover+=(hoverT-hover)*0.12;var hSc=1+hover*0.13,jitA=0.3+hover*2.6,jitF=0.01+hover*0.008;
      ctx.globalCompositeOperation='source-over';
      for(var i=0;i<parts.length;i++){
        var p=parts[i]; p.t++; var x,y,al;
        var stx=CX+(p.tx-CX)*hSc, sty=CY+(p.ty-CY)*hSc;
        if(p.ph===0){ var k=p.t/p.inN,e=k*k*(3-2*k); x=p.x+(stx-p.x)*e; y=p.y+(sty-p.y)*e; al=Math.min(0.72,k);
          if(p.t>=p.inN){p.ph=1;p.t=0;} }
        else if(p.ph===1){ x=stx+Math.cos(fr*jitF+p.seed)*jitA; y=sty+Math.sin(fr*jitF+p.seed)*jitA; al=0.55+0.12*Math.sin(fr*0.026+p.seed);
          if(p.t>=p.hold){p.ph=2;p.t=0;} }
        else { var k2=p.t/p.outN; x=stx; y=sty; al=(1-k2)*0.55;
          if(p.t>=p.outN){parts[i]=mk();continue;} }
        ctx.globalAlpha=Math.max(0,al);ctx.fillStyle=p.col;ctx.beginPath();ctx.arc(x,y,p.size,0,Math.PI*2);ctx.fill();
      }
      ctx.globalAlpha=1;
    }
    requestAnimationFrame(tick);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
