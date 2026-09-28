/* A sculpted, perspective-projected cortical surface. No external runtime. */
(() => {
  function createModel() {
    const nodes = [{ x: 0, y: 0, z: .34 }], faces = [], edges = [], keys = new Set();
    const rings = 20, segments = 36;
    function connect(a, b) {
      const key = `${Math.min(a, b)}:${Math.max(a, b)}`;
      if (!keys.has(key)) { keys.add(key); edges.push([a, b]); }
    }
    for (const side of [-1, 1]) {
      const start = nodes.length;
      for (let row = 0; row <= rings; row++) {
        const latitude = .025 + (Math.PI - .05) * row / rings;
        for (let col = 0; col < segments; col++) {
          const longitude = col / segments * Math.PI * 2;
          // Winding raised folds catch the light, with dark sulci between them.
          const fold = Math.sin(longitude * 7 + Math.sin(latitude * 5) * 1.7);
          const ripple = 1 + .065 * fold + .027 * Math.cos(latitude * 13 + longitude * 3);
          nodes.push({
            x: side * .225 + Math.sin(latitude) * Math.cos(longitude) * .224 * ripple,
            y: -Math.cos(latitude) * .34 * ripple,
            z: Math.sin(latitude) * Math.sin(longitude) * .29 * ripple,
            fold, rim: false,
          });
        }
      }
      for (let row = 0; row < rings; row++) for (let col = 0; col < segments; col++) {
        const a = start + row * segments + col, b = start + row * segments + (col + 1) % segments;
        const c = a + segments, d = b + segments;
        faces.push([a, c, b], [b, c, d]);
        connect(a, b); connect(a, c); connect(b, c);
      }
      connect(0, start + 8 * segments + 7);
    }
    // Bridges across the two hemispheres let signals cross the central cleft.
    const half = (rings + 1) * segments;
    for (let row = 3; row < rings - 2; row += 3) connect(1 + row * segments, 1 + half + row * segments + segments / 2);
    return { nodes, faces, edges };
  }

  function project(model, width, height, clock) {
    const yaw = -.24 + Math.sin(clock * .00018) * .23, pitch = -.26;
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cx = Math.cos(pitch), sx = Math.sin(pitch);
    const size = Math.min(width * .92, height * .79);
    return model.nodes.map(n => {
      const x = n.x * cy + n.z * sy, z = n.z * cy - n.x * sy;
      const y = n.y * cx - z * sx, depth = n.y * sx + z * cx;
      const perspective = 2.5 / (2.5 - depth);
      return { x: width * .5 + x * size * perspective, y: height * .405 + y * size * perspective, z: depth, perspective, rx: x, ry: y };
    });
  }

  function paint(ctx, model, points, width, height) {
    ctx.save(); ctx.translate(width * .5, height * .73); ctx.scale(1, .15);
    const floor = ctx.createRadialGradient(0, 0, 1, 0, 0, width * .38);
    floor.addColorStop(0, '#070302a0'); floor.addColorStop(1, '#07030200');
    ctx.fillStyle = floor; ctx.beginPath(); ctx.arc(0, 0, width * .38, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    const sorted = model.faces.map(face => ({ face, z: face.reduce((sum, i) => sum + points[i].z, 0) / 3 })).sort((a, b) => a.z - b.z);
    for (const { face } of sorted) {
      const [a, b, c] = face.map(i => points[i]);
      const ux = b.rx - a.rx, uy = b.ry - a.ry, uz = b.z - a.z;
      const vx = c.rx - a.rx, vy = c.ry - a.ry, vz = c.z - a.z;
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      const length = Math.hypot(nx, ny, nz) || 1;
      nx /= length; ny /= length; nz /= length;
      if (nz < 0) continue;
      const light = Math.max(0, nx * -.43 + ny * -.55 + nz * .72);
      const fold = face.reduce((sum, i) => sum + (model.nodes[i].fold || 0), 0) / 3;
      const shade = .22 + light * .64 + Math.max(0, fold) * .12;
      const specular = Math.pow(light, 14) * 45;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(c.x, c.y); ctx.closePath();
      ctx.fillStyle = `rgb(${Math.round(75 + shade * 139 + specular)},${Math.round(29 + shade * 78 + specular)},${Math.round(17 + shade * 43 + specular)})`;
      ctx.fill(); ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = .55; ctx.stroke();
    }
  }
  window.RoseBrain3D = { createModel, project, paint };
})();
