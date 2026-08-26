function expandirIPv6(ip) {
ip = ip.trim();
if (!/^[0-9a-fA-F:]+$/.test(ip)) throw new Error(`Carácter inválido en "${ip}".`);

let partes = ip.split('::');
if (partes.length > 2) throw new Error('No puede haber más de un "::" en la dirección.');

const parseGrupo = s => s === '' ? [] : s.split(':');
let izq = parseGrupo(partes[0]);
let der = partes.length === 2 ? parseGrupo(partes[1]) : [];

let hextetos;
if (partes.length === 2) {
    const faltantes = 8 - (izq.length + der.length);
    if (faltantes < 0) throw new Error('Demasiados grupos hexadecimales (máximo 8).');
    hextetos = [...izq, ...Array(faltantes).fill('0'), ...der];
} else {
    hextetos = izq;
    if (hextetos.length !== 8) throw new Error(`Se esperaban 8 grupos, se encontraron ${hextetos.length}. ¿Falta "::"?`);
}

return hextetos.map(h => {
    if (h.length > 4) throw new Error(`Grupo inválido: "${h}" (máximo 4 dígitos hex).`);
    const n = parseInt(h || '0', 16);
    if (isNaN(n)) throw new Error(`Grupo inválido: "${h}".`);
    return n;
});
}

function hextetosABigInt(hextetos) {
return hextetos.reduce((acc, h) => (acc << 16n) + BigInt(h), 0n);
}

function bigIntAHextetos(n) {
const hextetos = [];
for (let i = 7; i >= 0; i--) {
    hextetos.push(Number((n >> BigInt(i * 16)) & 0xffffn));
}
return hextetos;
}

function comprimirIPv6(hextetos) {
    let mejorInicio = -1, mejorLargo = 0;
    let actualInicio = -1, actualLargo = 0;

for (let i = 0; i < 8; i++) {
    if (hextetos[i] === 0) {
    if (actualInicio === -1) actualInicio = i;
    actualLargo++;
    if (actualLargo > mejorLargo) { mejorLargo = actualLargo; mejorInicio = actualInicio; }
    } else {
    actualInicio = -1; actualLargo = 0;
    }
}

const hex = hextetos.map(h => h.toString(16));

    if (mejorLargo < 2) return hex.join(':');

const antes = hex.slice(0, mejorInicio);
const despues = hex.slice(mejorInicio + mejorLargo);
    return antes.join(':') + '::' + despues.join(':');
}

function ipv6AEntero(ip) { return hextetosABigInt(expandirIPv6(ip)); }
function enteroAIpv6(n) { return comprimirIPv6(bigIntAHextetos(n)); }
function enteroAIpv6Completa(n) { return bigIntAHextetos(n).map(h => h.toString(16).padStart(4, '0')).join(':'); }

function cidrAMascaraV6(prefijo) {
    if (prefijo === 0) return 0n;
    return ((1n << 128n) - 1n) ^ ((1n << BigInt(128 - prefijo)) - 1n);
}

function validarV6(ip, prefijo) {
    try { expandirIPv6(ip); } catch (e) { return e.message; }
    const p = parseInt(prefijo);
    if (isNaN(p) || p < 0 || p > 128) return 'El prefijo debe estar entre 0 y 128.';
    return null;
}

function obtenerTipoV6(entero, hextetos) {
    if (entero === 0n) return 'No especificada (::)';
    if (entero === 1n) return 'Loopback (::1)';
    if (hextetos[0] === 0xfe80 >> 0 && (hextetos[0] & 0xffc0) === 0xfe80) return 'Link-local (fe80::/10)';
    const primerOcteto = hextetos[0];
    if ((primerOcteto & 0xfe00) === 0xfc00) return 'Unicast único local (fc00::/7)';
    if ((primerOcteto & 0xff00) === 0xff00) return 'Multicast (ff00::/8)';
    if ((primerOcteto & 0xe000) === 0x2000) return 'Unicast global (2000::/3)';
    return 'Reservada / Otra';
}

function formatearCantidadV6(n) {
    if (n < 100000n) return n.toString();
    const str = n.toString();
    const exp = str.length - 1;
    const mantisa = (str[0] + '.' + str.slice(1, 4)).replace(/\.?0+$/, '');
    return `${mantisa}×10^${exp}`;
}

function calcularV6(ip, prefijo) {
    const mascara   = cidrAMascaraV6(prefijo);
    const ipEntero  = ipv6AEntero(ip);
    const red       = ipEntero & mascara;
    const inverso   = ((1n << 128n) - 1n) ^ mascara;
    const ultima    = red | inverso;
    const totalDirs = 1n << BigInt(128 - prefijo);

const hextetosRed = bigIntAHextetos(red);
const idInterfaz = prefijo <= 64
    ? enteroAIpv6Completa(red & ((1n << 64n) - 1n))
    : null;

return {
    red:            enteroAIpv6(red),
    redCompleta:    enteroAIpv6Completa(red),
    primeraDir:     enteroAIpv6(red === 0n ? red : red + 1n),
    ultimaDir:      enteroAIpv6(ultima),
    ultimaDirEnt:   ultima,
    redEnt:         red,
    totalDirecciones: totalDirs,
    totalFormateado: formatearCantidadV6(totalDirs),
    prefijo,
    tipo:           obtenerTipoV6(red, hextetosRed),
    idInterfaz,
};
}

function dividirSubredesV6(ip, prefijo, cantidad) {
    const bitsNecesarios = Math.ceil(Math.log2(cantidad));
    const nuevoPrefijo = prefijo + bitsNecesarios;
    if (nuevoPrefijo > 128) {
    throw new Error(`No es posible crear ${cantidad} subredes desde /${prefijo}. El prefijo resultante /${nuevoPrefijo} excede 128 bits.`);
    }

const redBase = ipv6AEntero(ip) & cidrAMascaraV6(prefijo);
const tamano  = 1n << BigInt(128 - nuevoPrefijo);

const subredes = [];
for (let i = 0; i < cantidad; i++) {
    const redInt = redBase + BigInt(i) * tamano;
    const ultima = redInt + tamano - 1n;
    subredes.push({
        indice: i + 1,
        red: enteroAIpv6(redInt),
        ultima: enteroAIpv6(ultima),
        prefijo: nuevoPrefijo,
        totalFormateado: formatearCantidadV6(tamano),
    });
    }
    return { subredes, nuevoPrefijo, tamano };
}