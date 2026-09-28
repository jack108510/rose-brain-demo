/* A sculpted, perspective-projected cortical surface. No external runtime. */
(() => {
  function createModel() {
    const nodes = [{ x: 0, y: 0, z: .34 }], faces = [], edges = [], keys = new Set();
    const rings = 24, segments = 48;
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
          // Both hemispheres meet along a medial wall, so the outline is one
          // broad cerebrum rather than two separate ellipsoids.
          const sin = Math.sin(latitude), cos = Math.cos(latitude);
          const fold = Math.sin(latitude * 19 + Math.sin(longitude * 3) * 1.9);
          const ripple = 1 + .023 * fold + .012 * Math.sin(longitude * 11 + latitude * 5);
          const taper = 1 - .10 * (1 - cos) / 2;
          nodes.push({
            x: side * (.012 + Math.pow(sin, .72) * (.232 + .225 * Math.cos(longitude)) * ripple * taper),
            y: -cos * .34 * (1 + .012 * fold),
            z: Math.pow(sin, .8) * Math.sin(longitude) * .285 * ripple,
            fold, side, latitude, longitude, rim: false,
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
      const vx = c.rx - a.rx, vy = c.ry - a.ry;
      if ((ux * vy - uy * vx) * model.nodes[face[0]].side < 0) continue;
      const latitude = face.reduce((sum, i) => sum + model.nodes[i].latitude, 0) / 3;
      const longitude = face.reduce((sum, i) => sum + model.nodes[i].longitude, 0) / 3;
      const fold = face.reduce((sum, i) => sum + model.nodes[i].fold, 0) / 3;
      const side = model.nodes[face[0]].side;
      const light = Math.max(0, side * Math.sin(latitude) * Math.cos(longitude) * -.32 + Math.cos(latitude) * .52 + Math.sin(latitude) * Math.sin(longitude) * .75);
      const shade = .24 + light * .52 + fold * .075;
      const specular = Math.pow(light, 12) * 12;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(c.x, c.y); ctx.closePath();
      ctx.fillStyle = `rgb(${Math.round(89 + shade * 135 + specular)},${Math.round(36 + shade * 79 + specular)},${Math.round(24 + shade * 47 + specular)})`;
      ctx.fill(); ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = .55; ctx.stroke();
    }
    // Continuous winding sulci describe the cortex over the lit surface.
    const rings = 24, segments = 48, half = (rings + 1) * segments;
    for (let lobe = 0; lobe < 2; lobe++) for (let row = 3; row < rings - 2; row += 2) {
      const path = [];
      for (let col = 1; col < segments / 2; col++) {
        const winding = Math.round(Math.sin(col * .43 + row * .65));
        const i = 1 + lobe * half + (row + winding) * segments + col;
        if (points[i].z > .025) path.push(points[i]);
      }
      if (path.length < 3) continue;
      ctx.beginPath(); ctx.moveTo(path[0].x, path[0].y);
      for (let i = 1; i < path.length - 1; i++) {
        const p = path[i], q = path[i + 1];
        ctx.quadraticCurveTo(p.x, p.y, (p.x + q.x) / 2, (p.y + q.y) / 2);
      }
      ctx.strokeStyle = '#3a180fcc'; ctx.lineWidth = Math.max(1, width / 240);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
      ctx.save(); ctx.translate(0, -1.4); ctx.strokeStyle = '#ffd0a33b'; ctx.lineWidth = .8; ctx.stroke(); ctx.restore();
    }

  }
  window.RoseBrain3D = { createModel, project, paint };
})();
