(function () {
  'use strict';
  const U = window.Utils;

  function polar(cx, cy, r, angle) {
    return {
      x: U.round2(cx + r * Math.cos(angle)),
      y: U.round2(cy + r * Math.sin(angle))
    };
  }

  function donutPath(cx, cy, outer, inner, a0, a1) {
    const gap = Math.min(0.045, Math.max(0.008, (a1 - a0) * 0.03));
    const p0 = polar(cx, cy, outer, a0 + gap);
    const p1 = polar(cx, cy, outer, a1 - gap);
    const p2 = polar(cx, cy, inner, a1 - gap);
    const p3 = polar(cx, cy, inner, a0 + gap);
    const large = (a1 - a0) > Math.PI ? 1 : 0;
    return 'M' + p0.x + ' ' + p0.y +
      ' A' + outer + ' ' + outer + ' 0 ' + large + ' 1 ' + p1.x + ' ' + p1.y +
      ' L' + p2.x + ' ' + p2.y +
      ' A' + inner + ' ' + inner + ' 0 ' + large + ' 0 ' + p3.x + ' ' + p3.y + ' Z';
  }

  function donut(segments, opts) {
    opts = opts || {};
    const size = opts.size || 200;
    const thickness = opts.thickness || 28;
    const cx = size / 2, cy = size / 2;
    const outer = (size - thickness) / 2;
    const inner = outer - thickness;
    const total = segments.reduce(function (a, s) { return a + (Number(s.value) || 0); }, 0);
    let html = '<svg class="donut-svg" viewBox="0 0 ' + size + ' ' + size + '" width="' + (opts.width || size) + '" height="' + (opts.width || size) + '" role="img" aria-label="饼图">';
    if (total <= 0) {
      html += '<circle cx="' + cx + '" cy="' + cy + '" r="' + ((outer + inner) / 2) + '" fill="none" stroke="#e8ddd3" stroke-width="' + thickness + '"/>';
    } else {
      let start = -Math.PI / 2;
      segments.forEach(function (seg, i) {
        const val = Math.max(0, Number(seg.value) || 0);
        const frac = val / total;
        const end = start + frac * Math.PI * 2;
        const segAttrs = (seg.action && seg.key ? ' data-action="' + seg.action + '" data-key="' + seg.key + '"' : '') + ' data-seg="' + i + '"';
        if (frac >= 0.999) {
          html += '<circle cx="' + cx + '" cy="' + cy + '" r="' + ((outer + inner) / 2) + '" fill="none" stroke="' + (seg.color || '#ccc') + '" stroke-width="' + thickness + '"' + segAttrs + '/>';
        } else {
          html += '<path d="' + donutPath(cx, cy, outer, inner, start, end) + '" fill="' + (seg.color || '#ccc') + '"' + segAttrs + ' stroke="white" stroke-width="1.2"/>';
        }
        if (seg.label) html += '<title>' + U.escapeHtml(seg.label + ' ' + U.money(val)) + '</title>';
        start = end;
      });
    }
    const center = opts.centerHtml || '';
    if (center) {
      html += '<foreignObject x="0" y="0" width="' + size + '" height="' + size + '" style="pointer-events:none"><div xmlns="http://www.w3.org/1999/xhtml" class="donut-center">' + center + '</div></foreignObject>';
    }
    html += '</svg>';
    return html;
  }

  function bars(labels, series, opts) {
    opts = opts || {};
    const height = opts.height || 190;
    const padL = 46, padR = 10, padT = 12, padB = 30;
    const innerW = Math.max(280, labels.length * (series.length > 1 ? 58 : 46));
    const width = innerW + padL + padR;
    const plotH = height - padT - padB;
    const allVals = series.reduce(function (acc, s) { return acc.concat(s.values); }, []);
    const max = Math.max(1, Math.max.apply(null, allVals) * 1.12);
    const step = niceStep(max / 4);
    const yMax = step * 4;
    const x = function (i) { return padL + i * (innerW / labels.length) + (innerW / labels.length) / 2; };
    const y = function (v) { return padT + plotH - (v / yMax) * plotH; };
    let html = '<svg class="bars-svg" viewBox="0 0 ' + width + ' ' + height + '" width="100%" height="' + height + '" role="img" aria-label="柱状图">';
    for (let g = 0; g <= 4; g++) {
      const gy = padT + plotH - (g / 4) * plotH;
      const val = step * g;
      html += '<line x1="' + padL + '" y1="' + gy + '" x2="' + (width - padR) + '" y2="' + gy + '" stroke="#eee2d8" stroke-width="1"/>';
      html += '<text x="' + (padL - 6) + '" y="' + (gy + 4) + '" text-anchor="end" font-size="10" fill="#a08a7c">' + fmtAxis(val) + '</text>';
    }
    const groupW = (innerW / labels.length) * 0.56;
    const barW = series.length > 1 ? groupW / series.length * 0.72 : groupW * 0.58;
    labels.forEach(function (label, i) {
      const cx = x(i);
      html += '<rect class="period-hit" x="' + U.round2(cx - groupW / 2) + '" y="' + padT + '" width="' + U.round2(groupW) + '" height="' + plotH + '" data-action="period-jump" data-index="' + i + '"><title>' + U.escapeHtml('查看 ' + label) + '</title></rect>';
      html += '<text x="' + cx + '" y="' + (height - 10) + '" text-anchor="middle" font-size="11" fill="#8a7063">' + U.escapeHtml(label) + '</text>';
      series.forEach(function (s, si) {
        const v = Number(s.values[i]) || 0;
        const bx = cx - groupW / 2 + si * (groupW / series.length) + (groupW / series.length - barW) / 2;
        const by = y(v);
        const bh = Math.max(2, padT + plotH - by);
        html += '<rect class="period-bar" x="' + U.round2(bx) + '" y="' + U.round2(by) + '" width="' + U.round2(barW) + '" height="' + U.round2(bh) + '" rx="3" fill="' + (s.color || '#f26b1d') + '" data-action="period-jump" data-index="' + i + '" data-series="' + si + '"><title>' + U.escapeHtml(s.name + ' ' + label + '：' + U.money(v)) + '</title></rect>';
        if (v > 0 && bh > 16) {
          html += '<text x="' + U.round2(bx + barW / 2) + '" y="' + U.round2(by + 12) + '" text-anchor="middle" font-size="9" fill="#fff" font-weight="700">' + compactNum(v) + '</text>';
        }
      });
    });
    if (series.length > 1) {
      let lx = padL;
      series.forEach(function (s) {
        html += '<rect x="' + lx + '" y="' + (height - 20) + '" width="9" height="9" rx="2" fill="' + s.color + '"/>';
        html += '<text x="' + (lx + 13) + '" y="' + (height - 12) + '" font-size="10" fill="#8a7063">' + U.escapeHtml(s.name) + '</text>';
        lx += 13 + s.name.length * 12 + 14;
      });
    }
    html += '</svg>';
    return html;
  }

  function lineChart(points, opts) {
    opts = opts || {};
    const height = opts.height || 180;
    const padL = 40, padR = 10, padT = 14, padB = 24;
    const width = opts.width || Math.max(360, points.length * 30 + padL + padR);
    const plotH = height - padT - padB;
    const vals = points.map(function (p) { return Number(p.value) || 0; });
    const max = Math.max(1, Math.max.apply(null, vals) * 1.15);
    const x = function (i) { return padL + (points.length <= 1 ? 0 : i / (points.length - 1)) * (width - padL - padR); };
    const y = function (v) { return padT + plotH - (v / max) * plotH; };
    let path = '', area = '';
    points.forEach(function (p, i) {
      const px = U.round2(x(i)), py = U.round2(y(p.value));
      path += (i === 0 ? 'M' : ' L') + px + ' ' + py;
      area += (i === 0 ? 'M' : ' L') + px + ' ' + py;
    });
    area += ' L' + U.round2(x(points.length - 1)) + ' ' + U.round2(padT + plotH) + ' L' + U.round2(x(0)) + ' ' + U.round2(padT + plotH) + ' Z';
    const color = opts.color || '#f26b1d';
    let html = '<svg class="line-svg" viewBox="0 0 ' + width + ' ' + height + '" width="100%" height="' + height + '" role="img" aria-label="趋势图">';
    for (let g = 0; g <= 4; g++) {
      const gy = padT + plotH - (g / 4) * plotH;
      html += '<line x1="' + padL + '" y1="' + gy + '" x2="' + (width - padR) + '" y2="' + gy + '" stroke="#eee2d8" stroke-width="1"/>';
      html += '<text x="' + (padL - 6) + '" y="' + (gy + 4) + '" text-anchor="end" font-size="10" fill="#a08a7c">' + fmtAxis(max * g / 4) + '</text>';
    }
    html += '<path d="' + area + '" fill="' + color + '" opacity="0.12"/>';
    html += '<path d="' + path + '" fill="none" stroke="' + color + '" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>';
    points.forEach(function (p, i) {
      const px = U.round2(x(i)), py = U.round2(y(p.value));
      html += '<circle cx="' + px + '" cy="' + py + '" r="3" fill="' + color + '"><title>' + U.escapeHtml(p.label + ' ' + U.money(p.value)) + '</title></circle>';
      if (points.length <= 16 && p.label) {
        html += '<text x="' + px + '" y="' + (height - 8) + '" text-anchor="middle" font-size="10" fill="#8a7063">' + U.escapeHtml(p.label) + '</text>';
      }
    });
    html += '</svg>';
    return html;
  }

  function niceStep(raw) {
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const norm = raw / mag;
    let step;
    if (norm <= 1) step = 1;
    else if (norm <= 2) step = 2;
    else if (norm <= 5) step = 5;
    else step = 10;
    return step * mag;
  }

  function fmtAxis(v) {
    if (v >= 10000) return (v / 10000).toFixed(v % 10000 === 0 ? 0 : 1) + '万';
    if (v >= 1000) return (v / 1000).toFixed(v % 1000 === 0 ? 0 : 1) + 'k';
    return Math.round(v);
  }

  function compactNum(v) {
    if (v >= 10000) return (v / 10000).toFixed(1) + '万';
    if (v >= 1000) return (v / 1000).toFixed(1) + 'k';
    return Math.round(v);
  }

  window.Charts = {
    donut: donut,
    bars: bars,
    line: lineChart,
    compactNum: compactNum
  };
})();
