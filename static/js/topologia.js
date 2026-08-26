function svgRouter(x, y, etiqueta) {
    return `
        <g transform="translate(${x},${y})">
            <rect x="-22" y="-16" width="44" height="32" rx="5" fill="#141414" stroke="var(--cyan)" stroke-width="1.5"/>
            <path d="M-13,-2 a13,13 0 0 1 26,0" fill="none" stroke="var(--cyan)" stroke-width="1.5"/>
            <circle cx="0" cy="6" r="2" fill="var(--cyan)"/>
            <line x1="-13" y1="-2" x2="-13" y2="6" stroke="var(--cyan)" stroke-width="1.5"/>
            <line x1="13" y1="-2" x2="13" y2="6" stroke="var(--cyan)" stroke-width="1.5"/>
            <text x="0" y="32" text-anchor="middle" class="topo-label">${etiqueta}</text>
        </g>`;
    }

function svgSwitch(x, y, etiqueta) {
    return `
        <g transform="translate(${x},${y})">
            <rect x="-26" y="-12" width="52" height="24" rx="4" fill="#141414" stroke="var(--green)" stroke-width="1.5"/>
            <line x1="-18" y1="0" x2="-10" y2="0" stroke="var(--green)" stroke-width="1"/>
            <line x1="-4" y1="0" x2="4" y2="0" stroke="var(--green)" stroke-width="1"/>
            <line x1="10" y1="0" x2="18" y2="0" stroke="var(--green)" stroke-width="1"/>
            <text x="0" y="28" text-anchor="middle" class="topo-label">${etiqueta}</text>
        </g>`;
    }

function svgHost(x, y, etiqueta, color = 'var(--white)') {
    return `
        <g transform="translate(${x},${y})">
            <rect x="-14" y="-10" width="28" height="18" rx="2" fill="#141414" stroke="${color}" stroke-width="1.5"/>
            <line x1="-6" y1="8" x2="6" y2="8" stroke="${color}" stroke-width="1.5"/>
            <text x="0" y="24" text-anchor="middle" class="topo-label" fill="${color}">${etiqueta}</text>
        </g>`;
    }

function svgLinea(x1, y1, x2, y2) {
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="var(--gray)" stroke-width="1.5"/>`;
    }

function topologiaPuntoAPunto(ipA, ipB, redLabel) {
    return `
        <svg viewBox="0 0 400 140" xmlns="http://www.w3.org/2000/svg">
            ${svgLinea(90, 60, 310, 60)}
            <text x="200" y="52" text-anchor="middle" class="topo-link-label">enlace WAN — ${redLabel}</text>
            ${svgRouter(70, 60, 'R1 · ' + ipA)}
            ${svgRouter(330, 60, 'R2 · ' + ipB)}
        </svg>`;
    }

function topologiaLanPequena(gatewayIp, ultimoHostIp, cantHosts, redLabel) {
    const maxMostrar = Math.min(cantHosts, 6);
    const anchoTotal = 400;
    const inicioX = 70;
  const espacio = (anchoTotal - 2 * inicioX) / Math.max(1, maxMostrar - 1);

let hosts = '';
let lineas = '';
    for (let i = 0; i < maxMostrar; i++) {
    const x = maxMostrar === 1 ? anchoTotal / 2 : inicioX + i * espacio;
    const esGateway = i === 0;
    const etiqueta = esGateway ? 'GW · ' + gatewayIp : (i === maxMostrar - 1 && cantHosts > maxMostrar ? '···' : `Host ${i + 1}`);
    lineas += svgLinea(200, 100, x, 150);
    hosts += svgHost(x, 175, etiqueta, esGateway ? 'var(--green)' : 'var(--white)');
}
const extra = cantHosts > maxMostrar ? `<text x="200" y="215" text-anchor="middle" class="topo-link-label">+${cantHosts - maxMostrar} hosts adicionales hasta ${ultimoHostIp}</text>` : '';

    return `
        <svg viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg">
            ${svgLinea(200, 40, 200, 76)}
            ${svgRouter(200, 25, 'Gateway / Router')}
            ${svgSwitch(200, 100, redLabel)}
            ${lineas}
            ${hosts}
            ${extra}
        </svg>`;
    }

function topologiaLanGrande(gatewayIp, primerHostIp, ultimoHostIp, etiquetaCantidad, redLabel) {
    return `
        <svg viewBox="0 0 400 220" xmlns="http://www.w3.org/2000/svg">
            ${svgLinea(200, 40, 200, 76)}
            ${svgRouter(200, 25, 'Gateway · ' + gatewayIp)}
            ${svgSwitch(200, 100, redLabel)}
            ${svgLinea(200, 112, 200, 145)}
            <g transform="translate(140,150)">
                <rect x="0" y="0" width="120" height="55" rx="5" fill="#141414" stroke="var(--yellow, #ffd600)" stroke-width="1.5" stroke-dasharray="4 3"/>
                <text x="60" y="24" text-anchor="middle" class="topo-label" fill="#ffd600">${etiquetaCantidad}</text>
                <text x="60" y="40" text-anchor="middle" class="topo-sub-label">${primerHostIp} — ${ultimoHostIp}</text>
            </g>
        </svg>`;
    }

function generarTopologiaSVG({ tipo, cidr, gateway, primerHost, ultimoHost, cantHosts, redLabel, esIpv6 = false }) {
const esCero = typeof cantHosts === 'bigint' ? cantHosts <= 0n : cantHosts <= 0;
if (esCero) {
    return `<svg viewBox="0 0 400 100" xmlns="http://www.w3.org/2000/svg">
    <text x="200" y="55" text-anchor="middle" class="topo-link-label">Bloque /${cidr} — sin hosts utilizables (identificador o dirección única)</text>
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