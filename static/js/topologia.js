const COLORES_TOPO = {
    cyan: '#00cfff',
    green: '#00ff88',
    red: '#ff4f4f',
    yellow: '#ffd600',
    gray: '#888888',
    white: '#e8e8e8',
    surface: '#141414',
    border: '#2a2a2a',
};

function svgRouter(x, y, etiqueta, color = COLORES_TOPO.cyan) {
return `
    <g transform="translate(${x},${y})">
        <rect x="-24" y="-18" width="48" height="36" rx="6" fill="${COLORES_TOPO.surface}" stroke="${color}" stroke-width="1.5"/>
        <path d="M-14,-2 a14,14 0 0 1 28,0" fill="none" stroke="${color}" stroke-width="1.5"/>
        <circle cx="0" cy="7" r="2.2" fill="${color}"/>
        <line x1="-14" y1="-2" x2="-14" y2="7" stroke="${color}" stroke-width="1.5"/>
        <line x1="14" y1="-2" x2="14" y2="7" stroke="${color}" stroke-width="1.5"/>
        <text font-family="Courier New, monospace" font-size="9" x="0" y="34" text-anchor="middle" class="topo-label" fill="${color}">${etiqueta}</text>
    </g>`;
}

function svgSwitch(x, y, etiqueta, color = COLORES_TOPO.green) {
return `
    <g transform="translate(${x},${y})">
        <rect x="-28" y="-13" width="56" height="26" rx="4" fill="${COLORES_TOPO.surface}" stroke="${color}" stroke-width="1.5"/>
        <line x1="-19" y1="0" x2="-10" y2="0" stroke="${color}" stroke-width="1"/>
        <line x1="-4" y1="0" x2="4" y2="0" stroke="${color}" stroke-width="1"/>
        <line x1="10" y1="0" x2="19" y2="0" stroke="${color}" stroke-width="1"/>
        <text font-family="Courier New, monospace" font-size="9" x="0" y="30" text-anchor="middle" class="topo-label" fill="${color}">${etiqueta}</text>
    </g>`;
}

function svgHost(x, y, etiqueta, color = COLORES_TOPO.white) {
return `
    <g transform="translate(${x},${y})">
        <rect x="-15" y="-11" width="30" height="19" rx="2" fill="${COLORES_TOPO.surface}" stroke="${color}" stroke-width="1.5"/>
        <line x1="-15" y1="4" x2="15" y2="4" stroke="${color}" stroke-width="1"/>
        <line x1="-6" y1="9" x2="6" y2="9" stroke="${color}" stroke-width="1.5"/>
        <text font-family="Courier New, monospace" font-size="9" x="0" y="24" text-anchor="middle" class="topo-label" fill="${color}">${etiqueta}</text>
    </g>`;
}

function svgNube(x, y, etiqueta) {
return `
    <g transform="translate(${x},${y})">
        <path d="M-30,6 a14,14 0 0 1 3,-27 a18,18 0 0 1 34,-4 a15,15 0 0 1 15,29 a10,10 0 0 1 -2,20 h-48 a12,12 0 0 1 -2,-18z"
            fill="${COLORES_TOPO.surface}" stroke="${COLORES_TOPO.gray}" stroke-width="1.3"/>
        <text font-family="Courier New, monospace" font-size="9" x="0" y="4" text-anchor="middle" class="topo-label" fill="${COLORES_TOPO.gray}">${etiqueta}</text>
    </g>`;
}

function svgLinea(x1, y1, x2, y2, punteada = false) {
const dash = punteada ? ' stroke-dasharray="4 3"' : '';
return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${COLORES_TOPO.gray}" stroke-width="1.5"${dash}/>`;
}

function svgCaption(texto, x = 200, y = 20) {
    return `<text font-family="Courier New, monospace" font-size="12" x="${x}" y="${y}" text-anchor="middle" class="topo-caption" fill="${COLORES_TOPO.white}">${texto}</text>`;
}

function topologiaPuntoAPunto(ipA, ipB, redLabel) {
const w = 400, h = 170;
return `
    <svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
        ${svgCaption('Enlace punto a punto (WAN)')}
        ${svgLinea(85, 85, 165, 85)}
        ${svgLinea(235, 85, 315, 85)}
        ${svgNube(200, 85, redLabel)}
        ${svgRouter(65, 85, 'R1')}
        ${svgRouter(335, 85, 'R2')}
        <text font-family="Courier New, monospace" font-size="8" x="65" y="130" text-anchor="middle" class="topo-sub-label" fill="${COLORES_TOPO.cyan}">${ipA}</text>
        <text font-family="Courier New, monospace" font-size="8" x="335" y="130" text-anchor="middle" class="topo-sub-label" fill="${COLORES_TOPO.cyan}">${ipB}</text>
        <text font-family="Courier New, monospace" font-size="9" x="200" y="150" text-anchor="middle" class="topo-link-label" fill="${COLORES_TOPO.gray}">2 direcciones utilizables · sin difusión</text>
    </svg>`;
}

function topologiaLanPequena(gatewayIp, ultimoHostIp, cantHosts, redLabel) {
const w = 400, h = 280;
const maxMostrar = Math.min(cantHosts, 6);
const inicioX = 75;
    const anchoUtil = w - 2 * inicioX;
const espacio = maxMostrar > 1 ? anchoUtil / (maxMostrar - 1) : 0;

let hosts = '';
let lineas = '';
for (let i = 0; i < maxMostrar; i++) {
    const x = maxMostrar === 1 ? w / 2 : inicioX + i * espacio;
    const esGateway = i === 0;
    const etiqueta = esGateway ? 'Gateway' : `Host ${i + 1}`;
    lineas += svgLinea(200, 132, x, 187, !esGateway);
    hosts += svgHost(x, 212, etiqueta, esGateway ? COLORES_TOPO.green : COLORES_TOPO.white);
}
const extra = cantHosts > maxMostrar
    ? `<text font-family="Courier New, monospace" font-size="9" x="200" y="260" text-anchor="middle" class="topo-link-label" fill="${COLORES_TOPO.gray}">+${cantHosts - maxMostrar} hosts adicionales hasta ${ultimoHostIp}</text>`
    : `<text font-family="Courier New, monospace" font-size="9" x="200" y="260" text-anchor="middle" class="topo-link-label" fill="${COLORES_TOPO.gray}">gateway: ${gatewayIp}</text>`;

return `
    <svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
        ${svgCaption('Red de área local (LAN pequeña) · ' + redLabel)}
        ${svgLinea(200, 70, 200, 109)}
        ${svgRouter(200, 55, 'Router')}
        ${svgSwitch(200, 132, '')}
        ${lineas}
        ${hosts}
        ${extra}
    </svg>`;
}

function topologiaLanGrande(gatewayIp, primerHostIp, ultimoHostIp, etiquetaCantidad, redLabel) {
const w = 400, h = 280;
return `
    <svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
        ${svgCaption('Red de área local · ' + redLabel)}
        ${svgLinea(200, 70, 200, 109)}
        ${svgRouter(200, 55, 'Gateway')}
        ${svgSwitch(200, 132, '')}
        ${svgLinea(200, 145, 200, 180)}
        <g transform="translate(120,182)">
            <rect x="0" y="0" width="160" height="66" rx="6" fill="${COLORES_TOPO.surface}" stroke="${COLORES_TOPO.yellow}" stroke-width="1.5" stroke-dasharray="5 3"/>
            <text font-family="Courier New, monospace" font-size="11" x="80" y="26" text-anchor="middle" class="topo-label" fill="${COLORES_TOPO.yellow}">${etiquetaCantidad}</text>
            <text font-family="Courier New, monospace" font-size="8" x="80" y="44" text-anchor="middle" class="topo-sub-label" fill="${COLORES_TOPO.gray}">${primerHostIp} — ${ultimoHostIp}</text>
        </g>
        <text font-family="Courier New, monospace" font-size="9" x="200" y="267" text-anchor="middle" class="topo-link-label" fill="${COLORES_TOPO.gray}">gateway: ${gatewayIp}</text>
    </svg>`;
}

function generarTopologiaSVG({ tipo, cidr, gateway, primerHost, ultimoHost, cantHosts, redLabel, esIpv6 = false }) {
const esCero = typeof cantHosts === 'bigint' ? cantHosts <= 0n : cantHosts <= 0;
if (esCero) {
    return `<svg viewBox="0 0 400 110" width="400" height="110" xmlns="http://www.w3.org/2000/svg">
            ${svgCaption('Bloque /' + cidr)}
            <text font-family="Courier New, monospace" font-size="9" x="200" y="60" text-anchor="middle" class="topo-link-label" fill="${COLORES_TOPO.gray}">Sin hosts utilizables (identificador o dirección única)</text>
        </svg>`;
    }
const esDos = typeof cantHosts === 'bigint' ? cantHosts === 2n : cantHosts === 2;
if (esDos) {
    return topologiaPuntoAPunto(primerHost, ultimoHost, redLabel);
    }
const esGrande = typeof cantHosts === 'bigint' ? cantHosts > 6n : cantHosts > 6;
if (esGrande) {
    const etiqueta = typeof cantHosts === 'bigint'
        ? formatearCantidadV6(cantHosts) + ' direcciones'
        : formatearCantidad(cantHosts) + ' hosts';
        return topologiaLanGrande(gateway, primerHost, ultimoHost, etiqueta, redLabel);
    }
    return topologiaLanPequena(gateway, ultimoHost, Number(cantHosts), redLabel);
}