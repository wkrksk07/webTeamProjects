const bData = {
  'A': [
      {"x": -597.80, "z": -96.02}, {"x": -549.00, "z": 33.46}, {"x": -476.29, "z": 2.85},
      {"x": -346.46, "z": 235.49}, {"x": -392.77, "z": 307.96}, {"x": -527.59, "z": 123.12},
      {"x": -552.02, "z": 190.90}, {"x": -663.33, "z": -65.05}
  ],
  'B': [
      {"x": -534.52, "z": -213.40}, {"x": -510.03, "z": -153.97}, {"x": -1017.05, "z": 47.58},
      {"x": -958.05, "z": -28.52}, {"x": -782.13, "z": -103.60}, {"x": -819.82, "z": -203.83}
  ],
  'C': [
      {x: -183.10, z: -121.48}, {x: -74.85, z: 65.70}, {x: -194.49, z: 140.26}, 
      {x: -174.46, z: 242.52}, {x: 86.59, z: 107.44}, {x: 41.12, z: 14.34}, 
      {x: 7.33, z: 28.33}, {x: -98.69, z: -149.05}, {x: -181.65, z: -113.23}
  ],
  'D': [
      {x: 192.48, z: -64.15}, {x: 76.28, z: 8.17}, {x: 113.28, z: 90.01}, 
      {x: 354.44, z: -37.33}, {x: 317.90, z: -124.42}, {x: 292.66, z: -98.73}, 
      {x: 182.98, z: -287.74}, {x: 95.89, z: -251.20}
  ],
  'E': [
      {x: 716.82, z: -394.19}, {x: 693.68, z: -283.88}, {x: 1015.37, z: -170.34}, 
      {x: 993.46, z: -77.24}, {x: 555.88, z: -221.44}, {x: 622.27, z: -424.35}
  ],
  'F': [
      {"x": 1598.44, "z": -349.19}, {"x": 1707.76, "z": -187.30}, {"x": 1809.68, "z": -246.99},
      {"x": 1880.07, "z": -184.95}, {"x": 1602.11, "z": -1.77}, {"x": 1578.48, "z": -101.32},
      {"x": 1628.34, "z": -142.73}, {"x": 1515.39, "z": -290.22}
  ]
};

function rectify(points) {
    let maxLen = 0;
    let baseAngle = 0;
    for(let i=0; i<points.length; i++) {
        let p1 = points[i];
        let p2 = points[(i+1)%points.length];
        let dx = p2.x - p1.x;
        let dz = p2.z - p1.z;
        let len = Math.sqrt(dx*dx + dz*dz);
        if(len > maxLen) {
            maxLen = len;
            baseAngle = Math.atan2(dz, dx);
        }
    }
    
    let local = points.map(p => {
        let x = p.x * Math.cos(-baseAngle) - p.z * Math.sin(-baseAngle);
        let z = p.x * Math.sin(-baseAngle) + p.z * Math.cos(-baseAngle);
        return {x, z};
    });

    let snapped = [];
    snapped.push({...local[0]});
    for (let i = 1; i < local.length; i++) {
        let prev = snapped[snapped.length-1];
        let curr = local[i];
        let dx = Math.abs(curr.x - prev.x);
        let dz = Math.abs(curr.z - prev.z);
        if (dx > dz) snapped.push({x: curr.x, z: prev.z});
        else snapped.push({x: prev.x, z: curr.z});
    }

    let first = snapped[0];
    let last = snapped[snapped.length-1];
    if (Math.abs(first.x - last.x) > 1 && Math.abs(first.z - last.z) > 1) {
        if (Math.abs(first.x - last.x) > Math.abs(first.z - last.z)) snapped.push({x: first.x, z: last.z});
        else snapped.push({x: last.x, z: first.z});
    } else {
        if (Math.abs(first.x - last.x) <= Math.abs(first.z - last.z)) last.x = first.x;
        else last.z = first.z;
    }

    let result = snapped.map(p => {
        let x = p.x * Math.cos(baseAngle) - p.z * Math.sin(baseAngle);
        let z = p.x * Math.sin(baseAngle) + p.z * Math.cos(baseAngle);
        return {x: parseFloat(x.toFixed(2)), z: parseFloat(z.toFixed(2))};
    });
    return result;
}

let out = {};
for (let key in bData) out[key] = rectify(bData[key]);

// I동은 곡선형이므로 보정 없이 그대로 추가
out['I'] = [
    {"x": 1710.18, "z": 255.69}, {"x": 1735.07, "z": 307.50}, {"x": 1741.70, "z": 385.05},
    {"x": 1715.75, "z": 448.52}, {"x": 1669.24, "z": 479.77}, {"x": 1631.03, "z": 442.32},
    {"x": 1611.63, "z": 389.50}, {"x": 1614.50, "z": 324.45}, {"x": 1663.74, "z": 250.24}
];

console.log(JSON.stringify(out));
