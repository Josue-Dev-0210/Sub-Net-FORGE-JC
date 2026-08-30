function ipAEntero(ip) {
  return ip.split('.').reduce((acc, oct) => (acc << 8) + parseInt(oct), 0) >>> 0;
}

function enteroAIp(n) {
  return [24, 16, 8, 0].map(s => (n >> s) & 0xff).join('.');
}

function cidrAMascara(cidr) {
  return cidr === 0 ? 0 : (0xffffffff << (32 - cidr)) >>> 0;
}

function aBinario(ip) {
  return ip.split('.').map(o => parseInt(o).toString(2).padStart(8, '0')).join('.');
}

function formatearCantidad(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}

function obtenerClase(ip) {
  const primero = parseInt(ip.split('.')[0]);
  if (primero < 128) return 'A';
  if (primero < 192) return 'B';
  if (primero < 224) return 'C';
  if (primero < 240) return 'D';
  return 'E';
}

function obtenerTipo(ip) {
  const [a, b] = ip.split('.').map(Number);
  if (a === 10)                        return 'Privada (RFC1918)';
  if (a === 172 && b >= 16 && b <= 31) return 'Privada (RFC1918)';
  if (a === 192 && b === 168)          return 'Privada (RFC1918)';
  if (a === 127)                       return 'Loopback';
  if (a === 169 && b === 254)          return 'Link-local (APIPA)';
  if (a >= 224 && a <= 239)            return 'Multicast';
  return 'Pública';
}

function validar(ip, cidr) {
  const octetos = ip.split('.');
  if (octetos.length !== 4) return 'La IP debe tener 4 octetos.';
  for (const o of octetos) {
    const n = parseInt(o);
    if (isNaN(n) || n < 0 || n > 255) return `Octeto inválido: "${o}". Rango 0-255.`;
  }
  const c = parseInt(cidr);
  if (isNaN(c) || c < 0 || c > 32) return 'El prefijo CIDR debe estar entre 0 y 32.';
  return null;
}

function calcular(ip, cidr) {
  const mascara    = cidrAMascara(cidr);
  const ipEntero   = ipAEntero(ip);
  const red        = (ipEntero & mascara) >>> 0;
  const difusion   = (red | ~mascara) >>> 0;
  const comodin    = (~mascara) >>> 0;
  const primerHost = cidr < 31 ? red + 1 : red;
  const ultimoHost = cidr < 31 ? difusion - 1 : difusion;
  const cantHosts  = cidr >= 31
    ? Math.pow(2, 32 - cidr)
    : Math.pow(2, 32 - cidr) - 2;

  return {
    red:        enteroAIp(red),
    mascara:    enteroAIp(mascara),
    comodin:    enteroAIp(comodin),
    difusion:   enteroAIp(difusion),
    primerHost: enteroAIp(primerHost),
    ultimoHost: enteroAIp(ultimoHost),
    cantHosts:  Math.max(0, cantHosts),
    cidr,
    clase:      obtenerClase(ip),
    tipo:       obtenerTipo(ip),
  };
}

function renderizar(r) {
  document.getElementById('resultados-de-red').textContent     = r.red + '/' + r.cidr;
  document.getElementById('red-binaria').textContent           = aBinario(r.red);
  document.getElementById('resultados-de-mascara').textContent = r.mascara;
  document.getElementById('mascara-binaria').textContent       = aBinario(r.mascara);
  document.getElementById('resultados-de-comodin').textContent = r.comodin;
  document.getElementById('comodin-binaria').textContent       = aBinario(r.comodin);
  document.getElementById('resultados-de-difusion').textContent = r.difusion;
  document.getElementById('difusion-binaria').textContent      = aBinario(r.difusion);
  document.getElementById('resultados-de-rango').textContent   = r.primerHost + ' — ' + r.ultimoHost;
  document.getElementById('rango-subred').textContent          = formatearCantidad(r.cantHosts) + ' hosts disponibles';
  document.getElementById('resultados-de-clase').textContent   = 'Clase ' + r.clase;
  document.getElementById('tipo-subred').textContent           = r.tipo;

  renderizarBits(r.cidr);
  renderizarBarra(r);
  renderizarSaltoRed(r);
  renderizarTopologiaV4(r);

  document.getElementById('resultados').classList.remove('hidden');

  ultimoResultadoV4 = r;
}

function renderizarBits(cidr) {
  const wrap = document.getElementById('binario-visual');
  wrap.innerHTML = '';

  for (let octeto = 0; octeto < 4; octeto++) {
    const grupo = document.createElement('div');
    grupo.className = 'bit-group';

    for (let bit = 0; bit < 8; bit++) {
      const pos = octeto * 8 + bit;
      const el  = document.createElement('div');
      el.className   = 'bit ' + (pos < cidr ? 'net' : 'host');
      el.textContent = pos < cidr ? '1' : '0';
      grupo.appendChild(el);
    }

    wrap.appendChild(grupo);

    if (octeto < 3) {
      const sep = document.createElement('div');
      sep.style.cssText = 'width:6px;display:flex;align-items:center;justify-content:center;color:#444;font-size:10px;';
      sep.textContent = '·';
      wrap.appendChild(sep);
    }
  }
}

function renderizarBarra(r) {
  document.getElementById('etiqueta-red').textContent          = r.red;
  document.getElementById('etiqueta-primer-host').textContent  = r.primerHost;
  document.getElementById('etiqueta-ultimo-host').textContent  = r.ultimoHost;
  document.getElementById('etiqueta-difusion').textContent     = r.difusion;
}

function renderizarSaltoRed(r) {
  const bloqueIPs = Math.pow(2, 32 - r.cidr);
  const maskOctetos = enteroAIp(cidrAMascara(r.cidr)).split('.').map(Number);
  const octetoIndex = r.cidr === 0 ? 0 : Math.floor((r.cidr - 1) / 8);
  const salto = 256 - maskOctetos[octetoIndex];

  const difInt = ipAEntero(r.difusion);
  const proximaInt = (difInt + 1) >>> 0;
  const proximaRed = enteroAIp(proximaInt);

  document.getElementById('valor-salto').textContent = salto + ' direcciones';
  document.getElementById('desc-salto').textContent = `256 - ${maskOctetos[octetoIndex]} = ${salto}`;
  const elProx = document.getElementById('valores-proxima-red');
  if (elProx) elProx.textContent = proximaRed;
  const elDescProx = document.getElementById('desc-proxima-red');
  if (elDescProx) elDescProx.textContent = 'dirección de red de la siguiente subred';
  document.getElementById('valor-bloque-cidr').textContent = '/' + r.cidr;
  document.getElementById('desc-bloque-cidr').textContent = `${bloqueIPs} IPs por bloque · ${Math.pow(2, r.cidr)} bloques posibles`;
}

function renderizarTopologiaV4(r) {
  const cont = document.getElementById('diagrama-topologia-v4');
  if (!cont) return;
  const svg = generarTopologiaSVG({         
    cidr: r.cidr,
    gateway: r.primerHost,
    primerHost: r.primerHost,
    ultimoHost: r.ultimoHost,
    cantHosts: r.cantHosts,
    redLabel: r.red + '/' + r.cidr,
  });
  cont.innerHTML = svg;
  ultimoSvgTopologiaV4 = svg;                
}
let ultimoResultadoV4 = null;
let ultimasSubredesV4 = null;
let ultimoSvgTopologiaV4 = null;            

const ipEntrada   = document.getElementById('ip-entrada');
const cidrEntrada = document.getElementById('cidr-entrada');
const btnCalcular = document.getElementById('btn-calcular');
const mensajeError = document.getElementById('mensaje-error');

function mostrarError(msg) {
  mensajeError.textContent = msg;
  mensajeError.classList.remove('hidden');
}

function limpiarError() {
  mensajeError.classList.add('hidden');
}
btnCalcular.addEventListener('click', ejecutar);
ipEntrada.addEventListener('keydown',   e => { if (e.key === 'Enter') ejecutar(); });
cidrEntrada.addEventListener('keydown', e => { if (e.key === 'Enter') ejecutar(); });

document.querySelectorAll('.btn-rapido').forEach(btn => {
  btn.addEventListener('click', () => {
    ipEntrada.value   = btn.dataset.ip;
    cidrEntrada.value = btn.dataset.cidr;
    ejecutar();
  });
});


ipEntrada.value   = '192.168.1.0';
cidrEntrada.value = '24';

function ejecutar() {
  const ip   = ipEntrada.value.trim();
  const cidr = cidrEntrada.value.trim();

  const error = validar(ip, cidr);
  if (error) { mostrarError(error); return; }

  limpiarError();
  const resultado = calcular(ip, parseInt(cidr));
  renderizar(resultado);

  const cant = document.getElementById('num-subredes').value;

  if (cant) dividirSubredes(); else limpiarTablaSubredes();
}

function limpiarTablaSubredes() {
  const cont = document.getElementById('tabla-subredes-contenedor');
  if (cont) cont.innerHTML = '';
  ultimasSubredesV4 = null;
}

function dividirSubredes() {
  const ip   = ipEntrada.value.trim();
  const cidr = parseInt(cidrEntrada.value.trim());
  const cant = parseInt(document.getElementById('num-subredes').value);

  const errBase = validar(ip, cidrEntrada.value.trim());
  if (errBase) { mostrarError(errBase); return; }

  if (isNaN(cant) || cant < 1) {
    mostrarError('Ingresa cuántas subredes necesitas (mínimo 1).');
    return;
  }

  const bitsNecesarios = Math.ceil(Math.log2(cant));
  const nuevoCidr      = cidr + bitsNecesarios;

  if (nuevoCidr > 30) {
    mostrarError(`No es posible crear ${cant} subredes desde /${cidr}. El CIDR resultante /${nuevoCidr} no deja hosts utilizables.`);
    return;
  }

  const mascara  = cidrAMascara(nuevoCidr);
  const tamano   = Math.pow(2, 32 - nuevoCidr);
  const redBase  = (ipAEntero(ip) & cidrAMascara(cidr)) >>> 0;

  const subredes = [];
  for (let i = 0; i < cant; i++) {
    const redInt     = (redBase + i * tamano) >>> 0;
    const difInt     = (redInt + tamano - 1) >>> 0;
    subredes.push({
      indice:     i + 1,
      red:        enteroAIp(redInt),
      mascara:    enteroAIp(mascara),
      primerHost: enteroAIp(redInt + 1),
      ultimoHost: enteroAIp(difInt - 1),
      difusion:   enteroAIp(difInt),
      hostsUtil:  tamano - 2,
      cidr:       nuevoCidr,
    });
  }

  ultimasSubredesV4 = { subredes, cant, nuevoCidr };  
  renderizarTablaSubredes(subredes, cant, nuevoCidr);
  renderizarSaltoRed({ cidr: nuevoCidr, difusion: subredes[0].difusion });
  limpiarError();
}

function renderizarTablaSubredes(subredes, solicitadas, cidr) {
  const contenedor = document.getElementById('tabla-subredes-contenedor');
  contenedor.innerHTML = '';

  const wrap = document.createElement('div');
  wrap.id = 'tabla-subredes-wrap';

  wrap.innerHTML = `
    <div id="mapa-subredes"></div>
    <div id="tabla-subredes-header">
      <h3>subredes generadas</h3>
      <span id="tabla-subredes-meta">
        solicitadas: <b>${solicitadas}</b> &nbsp;·&nbsp;
        bloque: <b>/${cidr}</b> &nbsp;·&nbsp;
        hosts/subred: <b>${subredes[0].hostsUtil}</b>
      </span>
    </div>
    <div id="tabla-subredes-scroll">
      <table id="tabla-subredes">
        <thead>
          <tr>
            <th>#</th>
            <th>Red</th>
            <th>Máscara</th>
            <th>Primer Host</th>
            <th>Último Host</th>
            <th>Difusión</th>
            <th>Hosts</th>
            <th></th>
          </tr>
        </thead>
        <tbody id="tabla-subredes-body"></tbody>
      </table>
    </div>
  `;

  contenedor.appendChild(wrap);
  renderizarMapaSubredes(subredes, 'mapa-subredes');

  const tbody = document.getElementById('tabla-subredes-body');
  subredes.forEach(s => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="td-indice">${s.indice}</td>
      <td class="td-red">${s.red}/${s.cidr}</td>
      <td class="td-mask">${s.mascara}</td>
      <td class="td-host">${s.primerHost}</td>
      <td class="td-host">${s.ultimoHost}</td>
      <td class="td-bcast">${s.difusion}</td>
      <td class="td-count">${s.hostsUtil}</td>
      <td><button class="btn-ver-topo" data-indice="${s.indice - 1}">topología</button></td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('.btn-ver-topo').forEach(btn => {
    btn.addEventListener('click', () => {
      const s = subredes[parseInt(btn.dataset.indice)];
      const cont = document.getElementById('diagrama-topologia-v4');
      const svg = generarTopologiaSVG({     
        cidr: s.cidr,
        gateway: s.primerHost,
        primerHost: s.primerHost,
        ultimoHost: s.ultimoHost,
        cantHosts: s.hostsUtil,
        redLabel: s.red + '/' + s.cidr,
      });
      cont.innerHTML = svg;
      ultimoSvgTopologiaV4 = svg;            
      document.getElementById('seccion-topologia').scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  });
}


document.getElementById('num-subredes').addEventListener('keydown', e => {
  if (e.key === 'Enter') ejecutar();
});


document.getElementById('btn-exportar-pdf-v4').addEventListener('click', async (e) => { 
  if (!ultimoResultadoV4) { mostrarError('Primero calcula una subred para poder exportarla.'); return; }
  const r = ultimoResultadoV4;
  const btn = e.currentTarget;             

  const campos = [
    ['Dirección de red', r.red + '/' + r.cidr],
    ['Máscara de subred', r.mascara],
    ['Máscara comodín', r.comodin],
    ['Dirección de difusión', r.difusion],
    ['Rango utilizable', `${r.primerHost} — ${r.ultimoHost}`],
    ['Hosts disponibles', r.cantHosts],
    ['Clase / Tipo', `Clase ${r.clase} · ${r.tipo}`],
  ];

  const datos = {
    campos,
    nombreArchivo: `subred-${r.red.replace(/\./g, '-')}-${r.cidr}.pdf`,
    topologiaSVG: ultimoSvgTopologiaV4,      
  };

  if (ultimasSubredesV4) {
    datos.tabla = {
      titulo: `Subredes generadas (/${ultimasSubredesV4.nuevoCidr})`,
      encabezados: ['#', 'Red', 'Máscara', 'Rango', 'Hosts'],
      filas: ultimasSubredesV4.subredes.map(s => [
        s.indice, s.red + '/' + s.cidr, s.mascara, `${s.primerHost}-${s.ultimoHost}`, s.hostsUtil,
      ]),
    };
  }


  btn.disabled = true;
  btn.classList.add('exportando');
  try {
    await exportarPDF(datos);
  } finally {
    btn.disabled = false;
    btn.classList.remove('exportando');
  }
});


document.querySelectorAll('.btn-modo').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.btn-modo').forEach(b => b.classList.remove('activo'));
    btn.classList.add('activo');
    const modo = btn.dataset.modo;
    document.getElementById('seccion-v4').classList.toggle('hidden', modo !== 'v4');
    document.getElementById('seccion-v6').classList.toggle('hidden', modo !== 'v6');
  });
});

let ultimoResultadoV6 = null;
let ultimasSubredesV6 = null;
let ultimoSvgTopologiaV6 = null;    

const ipEntradaV6     = document.getElementById('ip-entrada-v6');
const prefijoEntradaV6 = document.getElementById('prefijo-entrada-v6');
const btnCalcularV6   = document.getElementById('btn-calcular-v6');
const mensajeErrorV6  = document.getElementById('mensaje-error-v6');

function mostrarErrorV6(msg) {
  mensajeErrorV6.textContent = msg;
  mensajeErrorV6.classList.remove('hidden');
}
function limpiarErrorV6() {
  mensajeErrorV6.classList.add('hidden');
}

btnCalcularV6.addEventListener('click', ejecutarV6);
ipEntradaV6.addEventListener('keydown', e => { if (e.key === 'Enter') ejecutarV6(); });
prefijoEntradaV6.addEventListener('keydown', e => { if (e.key === 'Enter') ejecutarV6(); });
document.getElementById('num-subredes-v6').addEventListener('keydown', e => { if (e.key === 'Enter') ejecutarV6(); });

document.querySelectorAll('.btn-rapido-v6').forEach(btn => {
  btn.addEventListener('click', () => {
    ipEntradaV6.value = btn.dataset.ip;
    prefijoEntradaV6.value = btn.dataset.prefijo;
    ejecutarV6();
  });
});

ipEntradaV6.value = '2001:db8:acad::';
prefijoEntradaV6.value = '64';

function ejecutarV6() {
  const ip = ipEntradaV6.value.trim();
  const prefijo = prefijoEntradaV6.value.trim();

  const error = validarV6(ip, prefijo);
  if (error) { mostrarErrorV6(error); return; }

  limpiarErrorV6();
  let resultado;
  try {
    resultado = calcularV6(ip, parseInt(prefijo));
  } catch (e) {
    mostrarErrorV6(e.message);
    return;
  }
  renderizarV6(resultado);

  const cant = document.getElementById('num-subredes-v6').value;
  if (cant) dividirSubredesV6UI(); else limpiarTablaSubredesV6();
}

function colorTipoV6(tipo) {
  if (tipo.includes('global'))     return 'var(--cyan)';
  if (tipo.includes('único local')) return 'var(--green)';
  if (tipo.includes('Link-local')) return '#ffd600';
  if (tipo.includes('Multicast'))  return 'var(--red)';
  if (tipo.includes('Loopback') || tipo.includes('No especificada')) return 'var(--gray)';
  return 'var(--border)';
}


function renderizarV6(r) {
  document.getElementById('v6-red').textContent          = r.red + '/' + r.prefijo;
  document.getElementById('v6-red-completa').textContent = r.redCompleta;
  document.getElementById('v6-rango').textContent        = r.red + ' — ' + r.ultimaDir;
  document.getElementById('v6-total').textContent        = r.totalFormateado + ' direcciones';
  document.getElementById('v6-tipo').textContent          = r.tipo;
  document.getElementById('v6-prefijo').textContent       = 'prefijo /' + r.prefijo;
  document.getElementById('v6-interfaz').textContent      = r.idInterfaz ? r.idInterfaz : 'N/A (prefijo > 64)';


  const tarjetaTipo = document.getElementById('v6-tipo').closest('.tarjeta-resultados');
  if (tarjetaTipo) tarjetaTipo.style.borderLeft = `3px solid ${colorTipoV6(r.tipo)}`;


  renderizarBitsV6(r.prefijo, r.redCompleta);  
  renderizarTopologiaV6(r);

  document.getElementById('resultados-v6').classList.remove('hidden');
  ultimoResultadoV6 = r;
}

function renderizarBitsV6(prefijo, redCompleta) {  
  const wrap = document.getElementById('binario-visual-v6');
  wrap.innerHTML = '';

  
  const hexdigitos = redCompleta.replace(/:/g, '').split('');

  for (let hexteto = 0; hexteto < 8; hexteto++) {
    const grupo = document.createElement('div');
    grupo.className = 'bit-group';

    for (let nib = 0; nib < 4; nib++) {
      const idx = hexteto * 4 + nib;            
      const posBit = idx * 4;                     
      const el = document.createElement('div');
      const esRed = posBit < prefijo;             
      el.className = 'nibble ' + (esRed ? 'net' : 'host');
      el.textContent = esRed ? hexdigitos[idx] : '0';   
      grupo.appendChild(el);
    }
    wrap.appendChild(grupo);

    if (hexteto < 7) {
      const sep = document.createElement('div');
      sep.style.cssText = 'width:6px;display:flex;align-items:center;justify-content:center;color:#444;font-size:10px;';
      sep.textContent = ':';
      wrap.appendChild(sep);
    }
  }
}


function copiarAlPortapapeles(texto, btn) {
  navigator.clipboard.writeText(texto).then(() => {
    const original = btn.textContent;
    btn.textContent = '✓';
    btn.classList.add('copiado');
    setTimeout(() => { btn.textContent = original; btn.classList.remove('copiado'); }, 1200);
  });
}

const btnCopiarV6 = document.getElementById('btn-copiar-v6');
if (btnCopiarV6) {
  btnCopiarV6.addEventListener('click', () => {
    if (!ultimoResultadoV6) return;
    copiarAlPortapapeles(ultimoResultadoV6.red + '/' + ultimoResultadoV6.prefijo, btnCopiarV6);
  });
}

function renderizarTopologiaV6(r) {
  const cont = document.getElementById('diagrama-topologia-v6');
  if (!cont) return;
  let cantHosts;
  if (r.prefijo === 128) cantHosts = 0n;
  else if (r.prefijo === 127) cantHosts = 2n;
  else cantHosts = r.totalDirecciones;

  const svg = generarTopologiaSVG({      
    cidr: r.prefijo,
    gateway: r.primeraDir,
    primerHost: r.primeraDir,
    ultimoHost: r.ultimaDir,
    cantHosts,
    redLabel: r.red + '/' + r.prefijo,
    esIpv6: true,
  });
  cont.innerHTML = svg;
  ultimoSvgTopologiaV6 = svg;            
}

function limpiarTablaSubredesV6() {
  const cont = document.getElementById('tabla-subredes-contenedor-v6');
  if (cont) cont.innerHTML = '';
  ultimasSubredesV6 = null;
}

function dividirSubredesV6UI() {
  const ip = ipEntradaV6.value.trim();
  const prefijo = parseInt(prefijoEntradaV6.value.trim());
  const cant = parseInt(document.getElementById('num-subredes-v6').value);

  const errBase = validarV6(ip, prefijo);
  if (errBase) { mostrarErrorV6(errBase); return; }
  if (isNaN(cant) || cant < 1) { mostrarErrorV6('Ingresa cuántas subredes necesitas (mínimo 1).'); return; }

  let resultado;
  try {
    resultado = dividirSubredesV6(ip, prefijo, cant);
  } catch (e) {
    mostrarErrorV6(e.message);
    return;
  }

  ultimasSubredesV6 = { ...resultado, cant };
  renderizarTablaSubredesV6(resultado.subredes, cant, resultado.nuevoPrefijo);
  limpiarErrorV6();
}

function renderizarTablaSubredesV6(subredes, solicitadas, prefijo) {
  const contenedor = document.getElementById('tabla-subredes-contenedor-v6');
  contenedor.innerHTML = '';

  const wrap = document.createElement('div');
  wrap.id = 'tabla-subredes-wrap';

  wrap.innerHTML = `
    <div id="mapa-subredes-v6"></div>
    <div id="tabla-subredes-header">
      <h3>subredes generadas</h3>
      <span id="tabla-subredes-meta">
        solicitadas: <b>${solicitadas}</b> &nbsp;·&nbsp;
        bloque: <b>/${prefijo}</b> &nbsp;·&nbsp;
        direcciones/subred: <b>${subredes[0].totalFormateado}</b>
      </span>
    </div>
    <div id="tabla-subredes-scroll">
      <table id="tabla-subredes">
        <thead>
          <tr>
            <th>#</th>
            <th>Red</th>
            <th>Última dirección</th>
            <th>Prefijo</th>
            <th></th>
          </tr>
        </thead>
        <tbody id="tabla-subredes-body-v6"></tbody>
      </table>
    </div>
  `;

  contenedor.appendChild(wrap);
  renderizarMapaSubredes(subredes, 'mapa-subredes-v6');

  const tbody = document.getElementById('tabla-subredes-body-v6');
  subredes.forEach(s => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="td-indice">${s.indice}</td>
      <td class="td-red">${s.red}/${s.prefijo}</td>
      <td class="td-bcast">${s.ultima}</td>
      <td class="td-mask">/${s.prefijo}</td>
      <td><button class="btn-ver-topo-v6" data-indice="${s.indice - 1}">topología</button></td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('.btn-ver-topo-v6').forEach(btn => {
    btn.addEventListener('click', () => {
      const s = subredes[parseInt(btn.dataset.indice)];
      const cont = document.getElementById('diagrama-topologia-v6');
      const svg = generarTopologiaSVG({      
        cidr: s.prefijo,
        gateway: s.red,
        primerHost: s.red,
        ultimoHost: s.ultima,
        cantHosts: s.prefijo === 128 ? 0n : (s.prefijo === 127 ? 2n : 8n),
        redLabel: s.red + '/' + s.prefijo,
        esIpv6: true,
      });
      cont.innerHTML = svg;
      ultimoSvgTopologiaV6 = svg;          
      document.getElementById('seccion-topologia').scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  });
}

document.getElementById('btn-exportar-pdf-v6').addEventListener('click', async (e) => { 
  if (!ultimoResultadoV6) { mostrarErrorV6('Primero calcula una subred para poder exportarla.'); return; }
  const r = ultimoResultadoV6;
  const btn = e.currentTarget; 

  const campos = [
    ['Dirección de red', r.red + '/' + r.prefijo],
    ['Forma completa', r.redCompleta],
    ['Rango de la subred', `${r.red} — ${r.ultimaDir}`],
    ['Direcciones totales', r.totalFormateado],
    ['Tipo de dirección', r.tipo],
    ['ID de interfaz (64 bits)', r.idInterfaz || 'N/A'],
  ];

  const datos = {
    campos,
    nombreArchivo: `subred-ipv6-${r.prefijo}.pdf`,
    topologiaSVG: ultimoSvgTopologiaV6,
  };

  if (ultimasSubredesV6) {
    datos.tabla = {
      titulo: `Subredes generadas (/${ultimasSubredesV6.nuevoPrefijo})`,
      encabezados: ['#', 'Red', 'Última dir.', 'Prefijo'],
      filas: ultimasSubredesV6.subredes.map(s => [s.indice, s.red, s.ultima, '/' + s.prefijo]),
    };
  }

  btn.disabled = true;
  btn.classList.add('exportando');
  try {
    await exportarPDF(datos);
  } finally {
    btn.disabled = false;
    btn.classList.remove('exportando');
  }
});

function hostsAPrefijoVLSM(hostsNecesarios) {
  const h = Math.max(2, Math.ceil(Math.log2(Math.max(1, hostsNecesarios) + 2)));
  return 32 - h;
}

function calcularVLSM(ipBase, cidrBase, solicitudes) {
  const ordenadas = solicitudes
  .map((s, i) => ({ ...s, ordenOriginal: i}))
  .sort((a, b) => b.hosts - a.hosts);

  const redBaseInt = (ipAEntero(ipBase) & cidrAMascara(cidrBase)) >>> 0;
  const totalDisponible = Math.pow(2, 32 - cidrBase);
  const limite = redBaseInt + totalDisponible;

  let cursor = redBaseInt;
  const resultados = [];

  for (const s of ordenadas) {
    const prefijo = hostsAPrefijoVLSM(s.hosts);
    if (prefijo < cidrBase) {
      throw new Error(`"${s.nombre}" necesita ${s.hosts} hosts - no caben en todo el bloque /${cidrBase}.`);
    }
    const tamano = Math.pow(2, 32 - prefijo);

    const alineado = Math.ceil(cursor / tamano) * tamano;
    if (alineado + tamano > limite) {
      throw new Error(`No hay espacio suficiente para "${s.nombre}" (necesita /${prefijo}) dentro de ${ipBase}/${cidrBase}. Prueba con un bloque mas grande.`);
    }

    const redInt = alineado;
    const difusionInt = redInt + tamano - 1;
    resultados.push({
      nombre: s.nombre,
      hostsSolicitados: s.hosts,
      prefijo,
      red: enteroAIp(cidrAMascara(prefijo)),
      primerHost: enteroAIp(prefijo < 31 ? redInt + 1 : redInt),
      ultimoHost: enteroAIp(prefijo < 31 ? difusionInt - 1 : difusionInt),
      difusion: enteroAIp(difusionInt),
      hostsDisponibles: prefijo >= 31 ? tamano : tamano - 2,
      tamano,
      ordenOriginal: s.ordenOriginal,
    });
    cursor = redInt + tamano;
  }

  resultados.sort((a, b) => a.ordenOriginal - b.ordenOriginal);
  return resultados;
}

let vlsmSolicitudes = [];   
let ultimoResultadoVLSM = null;   

const vlsmNombreInput = document.getElementById('vlsm-nombre');
const vlsmHostsInput  = document.getElementById('vlsm-hosts');
const mensajeErrorVLSM = document.getElementById('mensaje-error-vlsm');

function mostrarErrorVLSM(msg) {
  mensajeErrorVLSM.textContent = msg;
  mensajeErrorVLSM.classList.remove('hidden');
}
function limpiarErrorVLSM() {
  mensajeErrorVLSM.classList.add('hidden');
}
function renderizarListaVLSM() {
  const cont = document.getElementById('vlsm-lista');
  cont.innerHTML = '';
  vlsmSolicitudes.forEach((s, i) => {
    const fila = document.createElement('div');
    fila.className = 'vlsm-item';
    fila.innerHTML = `
      <span class="vlsm-item-nombre">${s.nombre}</span>
      <span class="vlsm-item-hosts">${s.hosts} hosts</span>
      <button class="vlsm-item-quitar" data-i="${i}" title="Quitar">×</button>
    `;
    cont.appendChild(fila);
  });
cont.querySelectorAll('.vlsm-item-quitar').forEach(btn => {
    btn.addEventListener('click', () => {
      vlsmSolicitudes.splice(parseInt(btn.dataset.i), 1);   
      renderizarListaVLSM();                                
    });
  });
}
document.getElementById('btn-vlsm-agregar').addEventListener('click', () => {
const hosts = parseInt(vlsmHostsInput.value);
  if (isNaN(hosts) || hosts < 1) { mostrarErrorVLSM('Ingresa cuántos hosts necesita esta subred (mínimo 1).'); return; }
const nombre = vlsmNombreInput.value.trim() || `Subred ${vlsmSolicitudes.length + 1}`;   

limpiarErrorVLSM();
  vlsmSolicitudes.push({ nombre, hosts });
renderizarListaVLSM();
  vlsmNombreInput.value = '';
  vlsmHostsInput.value = '';
  vlsmNombreInput.focus();   
});
[vlsmNombreInput, vlsmHostsInput].forEach(input => {
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('btn-vlsm-agregar').click();
  });
});
document.getElementById('btn-vlsm-calcular').addEventListener('click', () => {
  const ip = ipEntrada.value.trim();
  const cidr = cidrEntrada.value.trim();
  const errBase = validar(ip, cidr);  
if (errBase) { mostrarErrorVLSM('Revisa la IP/CIDR base arriba: ' + errBase); return; }

if (vlsmSolicitudes.length === 0) {
    mostrarErrorVLSM('Agrega al menos una subred con sus hosts necesarios.');
    return;
  }

let resultados;
  try {
    resultados = calcularVLSM(ip, parseInt(cidr), vlsmSolicitudes);
  } catch (e) {
    mostrarErrorVLSM(e.message);   
    return;
  }

limpiarErrorVLSM();
  ultimoResultadoVLSM = resultados;
  renderizarResultadoVLSM(resultados, ip, cidr);
});
function renderizarResultadoVLSM(resultados, ipBase, cidrBase) {
  const contenedor = document.getElementById('vlsm-resultado-contenedor');
  contenedor.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.id = 'tabla-subredes-wrap';
  wrap.innerHTML = `
    <div id="mapa-vlsm"></div>
    <div id="tabla-subredes-header">
      <h3>asignación VLSM</h3>
      <span id="tabla-subredes-meta">
        bloque base: <b>${ipBase}/${cidrBase}</b> &nbsp;·&nbsp;
        subredes: <b>${resultados.length}</b>
      </span>
    </div>
    <div id="tabla-subredes-scroll">
      <table id="tabla-subredes">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Pedidos</th>
            <th>Red</th>
            <th>Máscara</th>
            <th>Rango</th>
            <th>Difusión</th>
            <th>Hosts</th>
          </tr>
        </thead>
        <tbody id="tabla-vlsm-body"></tbody>
      </table>
    </div>
  `;
  contenedor.appendChild(wrap);
  renderizarMapaVLSM(resultados, 'mapa-vlsm');

  const tbody = document.getElementById('tabla-vlsm-body');
  resultados.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="td-red">${r.nombre}</td>
      <td class="td-indice">${r.hostsSolicitados}</td>
      <td class="td-red">${r.red}/${r.prefijo}</td>
      <td class="td-mask">${r.mascara}</td>
      <td class="td-host">${r.primerHost} — ${r.ultimoHost}</td>
      <td class="td-bcast">${r.difusion}</td>
      <td class="td-count">${r.hostsDisponibles}</td>
    `;
    tbody.appendChild(tr);
  });
}