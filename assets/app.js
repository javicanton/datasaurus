// assets/app.js
const els = {
    select: document.getElementById("datasetSelect"),
    showReg: document.getElementById("showRegression"),
    chart: document.getElementById("chart"),
    stats: document.getElementById("statsTable")
  };
  
  const fmt = (x, d = 2) =>
    (Number.isFinite(x) ? x.toLocaleString("es-ES", { maximumFractionDigits: d, minimumFractionDigits: d }) : "—");
  
  async function loadJSON(path) {
    const r = await fetch(path);
    if (!r.ok) throw new Error(`No se pudo cargar ${path}`);
    return r.json();
  }
  
  function mean(arr) {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }
  
  function sd(arr) {
    const m = mean(arr);
    const v = arr.reduce((s, x) => s + (x - m) ** 2, 0) / (arr.length - 1);
    return Math.sqrt(v);
  }
  
  function pearson(x, y) {
    const mx = mean(x), my = mean(y);
    let num = 0, dx = 0, dy = 0;
    for (let i = 0; i < x.length; i++) {
      const a = x[i] - mx;
      const b = y[i] - my;
      num += a * b;
      dx += a * a;
      dy += b * b;
    }
    return num / Math.sqrt(dx * dy);
  }
  
  function regression(x, y) {
    const mx = mean(x), my = mean(y);
    let num = 0, den = 0;
    for (let i = 0; i < x.length; i++) {
      const a = x[i] - mx;
      num += a * (y[i] - my);
      den += a * a;
    }
    const b = num / den;
    const a = my - b * mx;
    return { a, b };
  }
  
  function statsFor(points) {
    const x = points.map(d => d.x);
    const y = points.map(d => d.y);
    const { a, b } = regression(x, y);
    return {
      n: points.length,
      meanX: mean(x),
      meanY: mean(y),
      sdX: sd(x),
      sdY: sd(y),
      r: pearson(x, y),
      a, b
    };
  }
  
  function renderStats(name, s) {
    els.stats.innerHTML = `
      <table>
        <tbody>
          <tr><th>Conjunto</th><td>${name}</td></tr>
          <tr><th>n</th><td>${s.n}</td></tr>
          <tr><th>media(x)</th><td>${fmt(s.meanX)}</td></tr>
          <tr><th>media(y)</th><td>${fmt(s.meanY)}</td></tr>
          <tr><th>sd(x)</th><td>${fmt(s.sdX)}</td></tr>
          <tr><th>sd(y)</th><td>${fmt(s.sdY)}</td></tr>
          <tr><th>r (Pearson)</th><td>${fmt(s.r)}</td></tr>
          <tr><th>Regresión</th><td>y = ${fmt(s.a)} + ${fmt(s.b)}·x</td></tr>
        </tbody>
      </table>
    `;
  }
  
  function renderChart(points, s) {
    els.chart.innerHTML = "";
  
    const xs = points.map(d => d.x);
    const xMin = Math.min(...xs);
    const xMax = Math.max(...xs);
  
    const line = [
      { x: xMin, y: s.a + s.b * xMin },
      { x: xMax, y: s.a + s.b * xMax }
    ];
  
    const marks = [
      Plot.dot(points, { x: "x", y: "y", r: 3 })
    ];
  
    if (els.showReg.checked) {
      marks.push(Plot.line(line, { x: "x", y: "y" }));
    }
  
    const fig = Plot.plot({
      height: 420,
      marginLeft: 50,
      marginBottom: 45,
      x: { label: "x" },
      y: { label: "y" },
      marks
    });
  
    els.chart.appendChild(fig);
  }
  
  function setOptions(names) {
    els.select.innerHTML = "";
    for (const n of names) {
      const opt = document.createElement("option");
      opt.value = n;
      opt.textContent = n;
      els.select.appendChild(opt);
    }
  }
  
  async function main() {
    const datasets = {};
  
    // 1) Anscombe (siempre)
    const anscombe = await loadJSON("data/anscombe.json");
    Object.assign(datasets, anscombe);
  
    // 2) Datasaurus (opcional si lo añades)
    try {
      const datasaurus = await loadJSON("data/datasaurus.json");
      Object.assign(datasets, datasaurus);
    } catch (e) {
      // ok: aún no existe
    }
  
    const names = Object.keys(datasets);
    setOptions(names);
  
    function update() {
      const name = els.select.value;
      const points = datasets[name];
      const s = statsFor(points);
      renderStats(name, s);
      renderChart(points, s);
    }
  
    els.select.addEventListener("change", update);
    els.showReg.addEventListener("change", update);
  
    els.select.value = names[0];
    update();
  }
  
  main();