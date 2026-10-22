/* =====================================================================
   Strike Details · Regras de telefone / WhatsApp
   Usado pelo cadastro (index.html) e pelo painel (admin.html).

   Como o número é gravado em leads.whatsapp (só dígitos):
   - Brasil:      DDD + número, sem o 55 (10 ou 11 dígitos), como sempre foi.
   - Outro país:  "00" + código do país + número (ex.: 00595981123456).
                  O 00 é o prefixo internacional: separa esses números
                  dos brasileiros sem precisar mexer no banco.
   ===================================================================== */
(() => {

const DDDS = new Set(('11 12 13 14 15 16 17 18 19 21 22 24 27 28 31 32 33 34 35 37 38 ' +
  '41 42 43 44 45 46 47 48 49 51 53 54 55 61 62 63 64 65 66 67 68 69 71 73 74 75 77 79 ' +
  '81 82 83 84 85 86 87 88 89 91 92 93 94 95 96 97 98 99').split(' '));

/* código do país (E.164) → sigla ISO da bandeira. Os códigos não se sobrepõem,
   então dá pra achar o país lendo 1, 2 ou 3 dígitos do começo. */
const PAISES = Object.fromEntries((
  '1:us 7:ru 20:eg 27:za 30:gr 31:nl 32:be 33:fr 34:es 36:hu 39:it 40:ro 41:ch 43:at 44:gb ' +
  '45:dk 46:se 47:no 48:pl 49:de 51:pe 52:mx 53:cu 54:ar 55:br 56:cl 57:co 58:ve 60:my 61:au ' +
  '62:id 63:ph 64:nz 65:sg 66:th 81:jp 82:kr 84:vn 86:cn 90:tr 91:in 92:pk 93:af 94:lk 95:mm ' +
  '98:ir 211:ss 212:ma 213:dz 216:tn 218:ly 220:gm 221:sn 222:mr 223:ml 224:gn 225:ci 226:bf ' +
  '227:ne 228:tg 229:bj 230:mu 231:lr 232:sl 233:gh 234:ng 235:td 236:cf 237:cm 238:cv 239:st ' +
  '240:gq 241:ga 242:cg 243:cd 244:ao 245:gw 248:sc 249:sd 250:rw 251:et 252:so 253:dj 254:ke ' +
  '255:tz 256:ug 257:bi 258:mz 260:zm 261:mg 262:re 263:zw 264:na 265:mw 266:ls 267:bw 268:sz ' +
  '269:km 291:er 297:aw 298:fo 299:gl 350:gi 351:pt 352:lu 353:ie 354:is 355:al 356:mt 357:cy ' +
  '358:fi 359:bg 370:lt 371:lv 372:ee 373:md 374:am 375:by 376:ad 377:mc 378:sm 380:ua 381:rs ' +
  '382:me 383:xk 385:hr 386:si 387:ba 389:mk 420:cz 421:sk 423:li 500:fk 501:bz 502:gt 503:sv ' +
  '504:hn 505:ni 506:cr 507:pa 508:pm 509:ht 590:gp 591:bo 592:gy 593:ec 594:gf 595:py 596:mq ' +
  '597:sr 598:uy 599:cw 670:tl 673:bn 675:pg 676:to 677:sb 678:vu 679:fj 685:ws 852:hk 853:mo ' +
  '855:kh 856:la 880:bd 886:tw 960:mv 961:lb 962:jo 963:sy 964:iq 965:kw 966:sa 967:ye 968:om ' +
  '970:ps 971:ae 972:il 973:bh 974:qa 975:bt 976:mn 977:np 992:tj 993:tm 994:az 995:ge 996:kg 998:uz'
).split(' ').map(p => p.split(':')));

const NOMES = (() => { try { return new Intl.DisplayNames(['pt-BR'], { type: 'region' }); } catch { return null; } })();
const nomeIso = iso => { try { return NOMES?.of(iso.toUpperCase()) || iso.toUpperCase(); } catch { return iso.toUpperCase(); } };

/* { cc, iso, nome } do código, ou null se não existe */
function pais(cc) {
  const iso = PAISES[cc];
  return iso ? { cc, iso, nome: nomeIso(iso) } : null;
}
/* separa "595981123456" em país + resto */
function separaPais(digitos) {
  for (const n of [1, 2, 3]) {
    const p = pais(digitos.slice(0, n));
    if (p) return { ...p, resto: digitos.slice(n) };
  }
  return null;
}

/* ---------- Brasil ---------- */
function br(v) {
  let d = String(v ?? '').replace(/\D/g, '').replace(/^0+/, '');
  if (d.length > 11 && d.startsWith('55')) d = d.slice(2);   // +55 digitado ou preenchido pelo navegador
  d = d.slice(0, 11);
  let erro = '';
  if (d.length < 10)                        erro = 'Número incompleto. Coloque DDD + número, ex.: (69) 99999-9999.';
  else if (!DDDS.has(d.slice(0, 2)))        erro = 'DDD inválido. Confira os dois primeiros números.';
  else if (d.length === 11 && d[2] !== '9') erro = d.startsWith('55')
    ? 'Parece que o número começou com 55 (código do Brasil). Digite só DDD + número.'
    : 'Confira o número: celular tem 9 dígitos depois do DDD, começando com 9.';
  else if (d.length === 10 && !/[2-5]/.test(d[2])) erro = 'Faltou um número. Celular tem 9 dígitos depois do DDD.';
  return { d, erro };
}
const fmtBR = d => d.length > 10 ? `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
                 : d.length > 6  ? `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`
                 : d.length > 2  ? `(${d.slice(0,2)}) ${d.slice(2)}`
                 : d.length      ? `(${d}` : '';

/* ---------- outro país ---------- */
/* gravado como 00 + código + número, e o banco aceita até 15 dígitos:
   código + número ficam entre 8 e 13 dígitos. */
function intl(cc, v) {
  const d = String(v ?? '').replace(/\D/g, '').slice(0, 13 - cc.length);
  let erro = '';
  if (!PAISES[cc]) erro = 'Código do país não reconhecido. Toque na bandeira e confira.';
  else if (cc === '1' ? d.length !== 10 : d.length < Math.max(6, 8 - cc.length))
    erro = 'Número incompleto. Coloque o número completo, com o código de área.';
  return { d, erro };
}
function fmtIntl(cc, d) {
  if (cc === '1') return d.length > 6 ? `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`
                       : d.length > 3 ? `(${d.slice(0,3)}) ${d.slice(3)}` : d;
  return d.replace(/(\d{3})(?=\d)/g, '$1 ');
}

/* ---------- valor gravado no banco ---------- */
function paraSalvar(cc, d) { return cc === '55' ? d : '00' + cc + d; }

/* lê o que está no banco: { ok, texto, wa (dígitos pro wa.me), pais } */
function lerSalvo(v) {
  const raw = String(v ?? '').replace(/\D/g, '');
  if (raw.startsWith('00')) {
    const p = separaPais(raw.slice(2));
    if (!p) return { ok: false, texto: '+' + raw.slice(2), wa: raw.slice(2), pais: null, digitos: raw.length };
    const r = intl(p.cc, p.resto);
    return { ok: !r.erro, texto: `+${p.cc} ${fmtIntl(p.cc, r.d)}`, wa: p.cc + r.d, pais: p, digitos: r.d.length };
  }
  const b = br(raw);
  return {
    ok: !b.erro,
    texto: b.d.length >= 10 ? fmtBR(b.d) : String(v ?? ''),
    wa: '55' + b.d, pais: pais('55'), digitos: b.d.length, comeca55: b.d.startsWith('55')
  };
}

/* ---------- bandeira ---------- */
const FLAG_BR = '<svg viewBox="0 0 28 20" aria-hidden="true"><rect width="28" height="20" rx="2.5" fill="#009c3b"/>' +
  '<path d="M14 2.4 25.6 10 14 17.6 2.4 10z" fill="#fedf00"/><circle cx="14" cy="10" r="4.7" fill="#002776"/>' +
  '<path d="M9.5 8.9c3-.7 6.3-.1 8.9 1.6" stroke="#fff" stroke-width=".95" fill="none"/></svg>';
const FLAG_NADA = '<svg viewBox="0 0 28 20" aria-hidden="true"><rect x=".5" y=".5" width="27" height="19" rx="2.5" ' +
  'fill="#1d1d20" stroke="#66696e"/><circle cx="14" cy="10" r="5.2" fill="none" stroke="#9a9da2" stroke-width="1.2"/>' +
  '<path d="M8.8 10h10.4M14 4.8c-2.6 3-2.6 7.4 0 10.4M14 4.8c2.6 3 2.6 7.4 0 10.4" stroke="#9a9da2" stroke-width="1.1" fill="none"/></svg>';
function bandeira(iso) {
  if (iso === 'br') return FLAG_BR;
  if (!iso) return FLAG_NADA;
  return `<img src="https://flagcdn.com/${iso}.svg" alt="" width="28" height="20" loading="lazy">`;
}

window.STRIKE_TEL = { DDDS, PAISES, pais, separaPais, br, fmtBR, intl, fmtIntl, paraSalvar, lerSalvo, bandeira };
})();
