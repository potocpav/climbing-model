
// Maths

let l2 = (a, b) => {
  return Math.sqrt((a[0] - b[0]) * (a[0] - b[0]) + (a[1] - b[1]) * (a[1] - b[1]));
}

let project = (camera, w, h) => pt => {
  let scale = w / camera.width;
  return [(pt[0] - camera.center[0]) * scale + w / 2, h / 2 - (pt[1] - camera.center[1]) * scale];
};

let project_dir = (camera, w) => dir => {
  let scale = w / camera.width;
  return [dir[0] * scale, -dir[1] * scale];
};

let inv_project = (camera, w, h) => pt => {
  let scale = camera.width / w;
  return [(pt[0] - w / 2) * scale + camera.center[0], camera.center[1] - (pt[1] - h / 2) * scale];
};

let interpolate = (p1, p2, t) => {
  return [p1[0] * (1 - t) + p2[0] * t, p1[1] * (1 - t) + p2[1] * t];
}

/// See `maths.py` for the derivation of the below equations.
let calc_forces = climber => {
  let r_1x = climber.hands[0] - climber.center[0];
  let r_1y = climber.hands[1] - climber.center[1];
  let r_2x = climber.legs[0] - climber.center[0];
  let r_2y = climber.legs[1] - climber.center[1];
  let g = 1;
  let k = g / (Math.pow(r_1x - r_2x, 2) + Math.pow(r_1y - r_2y, 2));

  let f_1xa = k * (r_2x * (r_2y - r_1y));
  let f_1xb = k * (r_1x * (r_2y - r_1y));
  let f_1ya = k * (r_2x * (r_1x - r_2x));
  let f_1yb = k * (r_1x * r_2x - r_2x * r_2x - Math.pow(r_1y - r_2y, 2));

  let f_2xa = k * (r_2x * (r_1y - r_2y));
  let f_2xb = k * (r_1x * (r_1y - r_2y));
  let f_2ya = k * (r_1x * r_2x - r_1x * r_1x - Math.pow(r_1y - r_2y, 2));
  let f_2yb = k * (r_1x * (r_2x - r_1x));

  return {
    "min_hands": {"hands": [f_1xa, f_1ya], "legs": [f_2xa, f_2ya]},
    "min_legs": {"hands": [f_1xb, f_1yb], "legs": [f_2xb, f_2yb]}
  };
}

// Draw

let draw = (canvas, state) => {
  var ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  let project_ap = project(state.camera, canvas.width, canvas.height);

  let center_px = project_ap(climber.center);
  let legs_px = project_ap(climber.legs);
  let hands_px = project_ap(climber.hands);

  // Draw the climber

  ctx.beginPath();
  ctx.strokeStyle = "gray";
  ctx.arc(center_px[0], center_px[1], 20, 0, 2 * Math.PI);
  ctx.stroke();

  ctx.beginPath();
  ctx.strokeStyle = "red";
  ctx.arc(legs_px[0], legs_px[1], 10, 0, 2 * Math.PI);
  ctx.stroke();

  ctx.beginPath();
  ctx.strokeStyle = "blue";
  ctx.arc(hands_px[0], hands_px[1], 10, 0, 2 * Math.PI);
  ctx.stroke();

  ctx.beginPath();
  ctx.strokeStyle = "lightgray";
  ctx.moveTo(hands_px[0], hands_px[1]);
  ctx.lineTo(center_px[0], center_px[1]);
  ctx.lineTo(legs_px[0], legs_px[1]);
  ctx.stroke();

  // Draw forces
  let forces = calc_forces(climber);
  let f_h1_px = project_dir(state.camera, canvas.width)(forces.min_hands.hands);
  let f_h2_px = project_dir(state.camera, canvas.width)(forces.min_legs.hands);
  let f_h_px = interpolate(f_h1_px, f_h2_px, state.force_distribution);
  let f_l1_px = project_dir(state.camera, canvas.width)(forces.min_hands.legs);
  let f_l2_px = project_dir(state.camera, canvas.width)(forces.min_legs.legs);
  let f_l_px = interpolate(f_l1_px, f_l2_px, state.force_distribution);
  let fs = 0.5; // force visual scale

  // hands
  ctx.beginPath();
  ctx.fillStyle = '#fcc'
  ctx.moveTo(hands_px[0], hands_px[1]);
  ctx.lineTo(hands_px[0] + f_h1_px[0] * fs, hands_px[1] + f_h1_px[1] * fs);
  ctx.lineTo(hands_px[0] + f_h2_px[0] * fs, hands_px[1] + f_h2_px[1] * fs);
  ctx.fill();

  ctx.beginPath();
  ctx.strokeStyle = '#f00'
  ctx.moveTo(hands_px[0], hands_px[1]);
  ctx.lineTo(hands_px[0] + f_h_px[0] * fs, hands_px[1] + f_h_px[1] * fs);
  ctx.stroke();

  // legs
  ctx.beginPath();
  ctx.fillStyle = '#ccf'
  // ctx.strokeStyle = '#00f'
  ctx.moveTo(legs_px[0], legs_px[1]);
  ctx.lineTo(legs_px[0] + f_l1_px[0] * fs, legs_px[1] + f_l1_px[1] * fs);
  ctx.lineTo(legs_px[0] + f_l2_px[0] * fs, legs_px[1] + f_l2_px[1] * fs);
  ctx.fill();

  ctx.beginPath();
  ctx.strokeStyle = '#f00'
  ctx.moveTo(legs_px[0], legs_px[1]);
  ctx.lineTo(legs_px[0] + f_l_px[0] * fs, legs_px[1] + f_l_px[1] * fs);
  ctx.stroke();

};

// Initial State

var climber = {
  "center": [0, 0],
  "legs": [1, -1],
  "hands": [-1, 1]
};

var camera = {"center": [0, 0], "width": 5};

var state = {
  "climber": climber,
  "camera": camera,
  "dragging_center": false,
  "dragging_legs": false,
  "dragging_hands": false,
  "force_distribution": 0.0,
};

// Events

var canvas = document.getElementById("canvas");
var slider = document.getElementById("force_slider");

var mouseIsDown = false;

let mouseDown = (state, x, y) => {
  let project_ap = project(state.camera, canvas.width, canvas.height);

  if (l2([x, y], project_ap(state.climber.center)) < 20) {
    state.dragging_center = true;
  }

  if (l2([x, y], project_ap(state.climber.legs)) < 10) {
    state.dragging_legs = true;
  }

  if (l2([x, y], project_ap(state.climber.hands)) < 10) {
    state.dragging_hands = true;
  }
  return state;
};

let mouseUp = (state) => {
  state.dragging_center = false;
  state.dragging_legs = false;
  state.dragging_hands = false;
  return state;
}

let mouseDrag = (state, x, y) => {
  let inv_project_ap = inv_project(state.camera, canvas.width, canvas.height);
  let new_pos = inv_project_ap([x, y]);

  if (state.dragging_center) {
    state.climber.center = new_pos;
  }

  if (state.dragging_legs) {
    state.climber.legs = new_pos;
  }

  if (state.dragging_hands) {
    state.climber.hands = new_pos;
  }
  return state;
}

canvas.addEventListener("mousedown", e => {
  state = mouseDown(state, e.x - canvas.offsetLeft, e.y - canvas.offsetTop);
  mouseIsDown = true;
  draw(canvas, state);
});

document.addEventListener("mousemove", e => {
  if (mouseIsDown) {
    state = mouseDrag(state, e.x - canvas.offsetLeft, e.y - canvas.offsetTop);
    draw(canvas, state);
  }
});

document.addEventListener("mouseup", e => {
  state = mouseUp(state);
  mouseIsDown = false;
  // draw(canvas, state);
});

slider.addEventListener("input", e => {
  state.force_distribution = parseInt(e.srcElement.value) / 100;
  draw(canvas, state);
});

draw(canvas, state);