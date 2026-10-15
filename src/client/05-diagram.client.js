function renderClientDiagram(diagram) {
  if (!diagram) return '';
  if (diagram.engine === 'raw_svg' || diagram.svg) return diagram.svg || '';

  if (diagram.engine === 'wireframe_3d') {
    var w = 160, h = 130;
    var rx = ((diagram.rotation && diagram.rotation.rx) || 15) * Math.PI / 180;
    var ry = ((diagram.rotation && diagram.rotation.ry) || -30) * Math.PI / 180;
    var scale = diagram.scale || 0.95;

    function rotatePoint(c) {
      var x = c[0], y = c[1], z = c[2];
      var cosY = Math.cos(ry), sinY = Math.sin(ry);
      var cosX = Math.cos(rx), sinX = Math.sin(rx);
      var x1 = x * cosY + z * sinY;
      var z1 = -x * sinY + z * cosY;
      var y2 = y * cosX - z1 * sinX;
      var z2 = y * sinX + z1 * cosX;
      return { x: x1, y: y2, z: z2 };
    }
    function project(c) {
      var p = rotatePoint(c);
      return [w/2 + p.x*scale, h/2 - p.y*scale];
    }

    var nodes = diagram.nodes || {};
    var pts2d = {}, pts3d = {};
    for (var k in nodes) {
      pts3d[k] = rotatePoint(nodes[k]);
      pts2d[k] = project(nodes[k]);
    }

    var solidLines = [], dashedLines = [];

    if (Array.isArray(diagram.faces) && diagram.faces.length > 0) {
      var visibleEdgeSet = new Set();
      var allEdgeSet = new Set();

      diagram.faces.forEach(function(face) {
        if (!Array.isArray(face) || face.length < 3) return;
        for (var i = 0; i < face.length; i++) {
          var a = face[i], b = face[(i+1)%face.length];
          if (!pts3d[a] || !pts3d[b]) continue;
          allEdgeSet.add([a,b].sort().join('--'));
        }
        var p0 = pts3d[face[0]], p1 = pts3d[face[1]], p2 = pts3d[face[2]];
        if (!p0 || !p1 || !p2) return;
        var ux = p1.x-p0.x, uy = p1.y-p0.y, uz = p1.z-p0.z;
        var vx = p2.x-p0.x, vy = p2.y-p0.y, vz = p2.z-p0.z;
        var nz = ux*vy - uy*vx;
        if (nz > 0) {
          for (var j = 0; j < face.length; j++) {
            var pa = face[j], pb = face[(j+1)%face.length];
            if (pts3d[pa] && pts3d[pb]) visibleEdgeSet.add([pa,pb].sort().join('--'));
          }
        }
      });

      allEdgeSet.forEach(function(key) {
        var parts = key.split('--');
        if (visibleEdgeSet.has(key)) solidLines.push(parts);
        else dashedLines.push(parts);
      });
    } else {
      solidLines = Array.isArray(diagram.solid_lines) ? diagram.solid_lines : [];
      dashedLines = Array.isArray(diagram.dashed_lines) ? diagram.dashed_lines : [];
    }

    var linesSvg = solidLines.map(function(p){
      if (!pts2d[p[0]] || !pts2d[p[1]]) return '';
      return '<line x1="'+pts2d[p[0]][0]+'" y1="'+pts2d[p[0]][1]+'" x2="'+pts2d[p[1]][0]+'" y2="'+pts2d[p[1]][1]+'" stroke="#000" stroke-width="1.25"/>';
    }).join('');
    var dLinesSvg = dashedLines.map(function(p){
      if (!pts2d[p[0]] || !pts2d[p[1]]) return '';
      return '<line x1="'+pts2d[p[0]][0]+'" y1="'+pts2d[p[0]][1]+'" x2="'+pts2d[p[1]][0]+'" y2="'+pts2d[p[1]][1]+'" stroke="#000" stroke-width="1.1" stroke-dasharray="4,3"/>';
    }).join('');
    var texts = Object.keys(pts2d).map(function(k){
      return '<text x="'+(pts2d[k][0]+3)+'" y="'+(pts2d[k][1]-2)+'" font-family="Times New Roman,serif" font-style="italic" font-size="10">'+k+'</text>';
    }).join('');

    return '<svg width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'">'+dLinesSvg+linesSvg+texts+'</svg>';
  }
  return '';
}
