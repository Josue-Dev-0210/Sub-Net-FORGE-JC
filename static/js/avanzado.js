const PALETA_MAPA = ['#00cfff', '#00ff88', '#ffd600', '#ff4f4f', '#c17aff', '#ff9f43'];

function renderizarMapaSubredes(subredes, contenedorId) {
    const cont = document.getElementById(contenedorId);
    if (!cont) return;
    cont.innerHTML = '';

subredes.forEach((s, i) => {
    const color = PALETA_MAPA[i % PALETA_MAPA.length];
    const bloque = document.createElement('div');
    bloque.className = 'bloque-mapa';
    bloque.style.borderColor = color;
    bloque.style.background = color + '1a';
    bloque.innerHTML = `<span class="bloque-indice" style="color:${color}">#${s.indice}</span>`;
    bloque.title = s.red !== undefined
        ? `${s.red}/${s.cidr}\nMáscara: ${s.mascara || ''}\n${s.primerHost || s.red} — ${s.ultimoHost || s.ultima}\n${s.hostsUtil !== undefined ? s.hostsUtil + ' hosts' : s.totalFormateado + ' direcciones'}`
        : '';
    cont.appendChild(bloque);
});
}

function renderizarMapaVLSM(resultados, contenedorId) {
    const cont = document.getElementById(contenedorId);
    if (!cont) return;
    cont.innerHTML = '';

const totalDirecciones = resultados.reduce((acc, r) => acc + r.tamano, 0);

resultados.forEach((r, i) => {
    const color = PALETA_MAPA[i % PALETA_MAPA.length];
    const proporcion = Math.max(6, (r.tamano / totalDirecciones) * 100);
    const bloque = document.createElement('div');
    bloque.className = 'bloque-mapa bloque-mapa-vlsm';
    bloque.style.flexGrow = proporcion;     // así se logra el ancho proporcional
    bloque.style.borderColor = color;
    bloque.style.background = color + '1a';
    bloque.innerHTML = `<span class="bloque-indice" style="color:${color}">${r.nombre}</span>`;
    bloque.title = `${r.red}/${r.prefijo}\n${r.primerHost} — ${r.ultimoHost}\n${r.hostsDisponibles} hosts disponibles`;
    cont.appendChild(bloque);
});
}

function svgMarkupAPng(svgMarkup, escala = 3) {
return new Promise((resolve, reject) => {
    if (!svgMarkup) { resolve(null); return; }

    const match = svgMarkup.match(/viewBox="0 0 (\d+(?:\.\d+)?) (\d+(?:\.\d+)?)"/);
    const ancho = match ? parseFloat(match[1]) : 400;
    const alto  = match ? parseFloat(match[2]) : 240;

    const blob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();

    img.onload = () => {
    const canvas = document.createElement('canvas');
      canvas.width = ancho * escala;
      canvas.height = alto * escala;
    const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#0d0d0d';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve({ dataUrl: canvas.toDataURL('image/png'), ancho, alto });
    };
    img.onerror = (e) => {
        URL.revokeObjectURL(url);
        reject(new Error('No se pudo rasterizar el diagrama de topología.'));
    };
    img.src = url;
});
}

async function exportarPDF(datos) {
const { jsPDF } = window.jspdf;
const doc = new jsPDF({ unit: 'pt', format: 'a4' });
const margenX = 48;
const anchoUtil = 500;
let y = 56;

doc.setFont('courier', 'bold');
doc.setFontSize(16);
doc.setTextColor(20, 20, 20);
doc.text('Reporte de Cálculo de Subred', margenX, y);
y += 14;
doc.setFont('courier', 'normal');
doc.setFontSize(9);
doc.setTextColor(120, 120, 120);
doc.text(new Date().toLocaleString('es-CO'), margenX, y);
y += 24;

doc.setDrawColor(220, 220, 220);
doc.line(margenX, y, 548, y);
y += 24;

const asegurarEspacio = (necesario) => {
    if (y + necesario > 780) { doc.addPage(); y = 56; }
};

const escribirFila = (etiqueta, valor) => {
    asegurarEspacio(32);
    doc.setFont('courier', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(0, 150, 170);
    doc.text(etiqueta.toUpperCase(), margenX, y);
    doc.setFont('courier', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(30, 30, 30);
    doc.text(String(valor), margenX, y + 14);
    y += 32;
};

datos.campos.forEach(([etiqueta, valor]) => escribirFila(etiqueta, valor));

if (datos.tabla && datos.tabla.filas.length) {
    y += 8;
    asegurarEspacio(28);
    doc.setFont('courier', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(20, 20, 20);
    doc.text(datos.tabla.titulo, margenX, y);
    y += 16;

    const colX = [margenX, margenX + 40, margenX + 190, margenX + 320, margenX + 430];
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    datos.tabla.encabezados.forEach((h, i) => doc.text(h, colX[i], y));
    y += 12;
    doc.setDrawColor(230, 230, 230);
    doc.line(margenX, y, 548, y);
    y += 12;

    doc.setFont('courier', 'normal');
    doc.setTextColor(40, 40, 40);
    datos.tabla.filas.forEach(fila => {
        asegurarEspacio(16);
        fila.forEach((celda, i) => doc.text(String(celda), colX[i], y));
        y += 16;
    });
}

if (datos.topologiaSVG) {
    try {
    const img = await svgMarkupAPng(datos.topologiaSVG, 3);
    if (img) {
        y += 20;
        const altoImg = anchoUtil * (img.alto / img.ancho);
        asegurarEspacio(altoImg + 40);
        doc.setFont('courier', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(20, 20, 20);
        doc.text('Topología de Red', margenX, y);
        y += 12;
        doc.addImage(img.dataUrl, 'PNG', margenX, y, anchoUtil, altoImg);
        y += altoImg + 10;
        }
    } catch (e) {
    console.warn('No se pudo incluir la topología en el PDF:', e.message);
    }
}

doc.setFontSize(8);
doc.setTextColor(160, 160, 160);
doc.text('Generado con Sub-Net FORGE · josue-dev-02.tech', margenX, 815);

doc.save(datos.nombreArchivo || 'reporte-subred.pdf');
}