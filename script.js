"use strict";

// Maths

let l2 = ([ax, ay], [bx, by]) => {
  return Math.sqrt((ax - bx) * (ax - bx) + (ay - by) * (ay - by));
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

let norm = ([px, py]) => {
  return Math.sqrt(px * px + py * py)
};

/// See `maths.py` for the derivation of the equations below.
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
    "min_legs": {"hands": [f_1xb, f_1yb], "legs": [f_2xb, f_2yb]},
  };
}

let calc_torque = ([r_x, r_y], [f_x, f_y]) => {
  return Math.abs(r_x * f_y - r_y * f_x);
}

let minus = ([ax, ay], [bx, by]) => [ax - bx, ay - by];

let dot = ([ax, ay], [bx, by]) => ax * bx + ay * by;

// Draw

let draw_force_range = (ctx, pos, f1, f2, fac, color) => {
  let scale = 1.0;
  let f = interpolate(f1, f2, fac);

  // value range
  ctx.beginPath();
  ctx.globalAlpha = 0.2
  ctx.fillStyle = color
  ctx.moveTo(pos[0], pos[1]);
  ctx.lineTo(pos[0] + f1[0] * scale, pos[1] + f1[1] * scale);
  ctx.lineTo(pos[0] + f2[0] * scale, pos[1] + f2[1] * scale);
  ctx.fill();

  // force arrow
  let width = 3;
  let head_size = width * 2;
  let dx = f[0] / norm(f);
  let dy = f[1] / norm(f);
  let tip = [pos[0] + f[0] * scale, pos[1] + f[1] * scale];

  ctx.beginPath();
  ctx.lineWidth = width;
  ctx.globalAlpha = 1.0
  ctx.strokeStyle = color
  ctx.moveTo(pos[0], pos[1]);
  ctx.lineTo(tip[0], tip[1]);
  ctx.moveTo(tip[0] + (dy - dx) * head_size, tip[1] + (-dy - dx) * head_size);
  ctx.lineTo(tip[0], tip[1]);
  ctx.lineTo(tip[0] + (-dy - dx) * head_size, tip[1] + (-dy + dx) * head_size);
  ctx.stroke();
};

let draw = (canvas, state) => {
  var ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  let project_ap = project(state.camera, canvas.width, canvas.height);
  let project_dir_ap = project_dir(state.camera, canvas.width);

  let center_px = project_ap(state.climber.center);
  let legs_px = project_ap(state.climber.legs);
  let hands_px = project_ap(state.climber.hands);

  ctx.lineWidth = 3;

  // Draw the wall
  let [dx, dy] = minus(hands_px, legs_px);
  let invert = dot([dy, -dx], minus(center_px, legs_px)) > 0 ? 1 : -1;
  [dx, dy] = [dx / norm([dx, dy]) * invert, dy / norm([dx, dy]) * invert];

  var my_gradient = ctx.createLinearGradient(legs_px[0], legs_px[1], legs_px[0] - dy, legs_px[1] + dx);
  my_gradient.addColorStop(0, "white");
  my_gradient.addColorStop(1, "lightgray");
  ctx.fillStyle = my_gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw the climber
  ctx.beginPath();
  ctx.strokeStyle = "lightgray";
  ctx.moveTo(hands_px[0], hands_px[1]);
  ctx.lineTo(center_px[0], center_px[1]);
  ctx.lineTo(legs_px[0], legs_px[1]);
  ctx.stroke();

  ctx.beginPath();
  ctx.strokeStyle = "gray";
  ctx.arc(center_px[0], center_px[1], 20, 0, 2 * Math.PI);
  ctx.stroke();

  ctx.beginPath();
  ctx.strokeStyle = "blue";
  ctx.arc(legs_px[0], legs_px[1], 10, 0, 2 * Math.PI);
  ctx.stroke();

  ctx.beginPath();
  ctx.strokeStyle = "green";
  ctx.arc(hands_px[0], hands_px[1], 10, 0, 2 * Math.PI);
  ctx.stroke();

  // Draw forces
  let forces = calc_forces(state.climber);
  let f_h1_px = project_dir_ap(forces.min_hands.hands);
  let f_h2_px = project_dir_ap(forces.min_legs.hands);
  let f_l1_px = project_dir_ap(forces.min_hands.legs);
  let f_l2_px = project_dir_ap(forces.min_legs.legs);

  draw_force_range(ctx, hands_px, f_h1_px, f_h2_px, state.force_distribution, "green");
  draw_force_range(ctx, legs_px, f_l1_px, f_l2_px, state.force_distribution, "blue");

  // Draw text
  let f_hands = interpolate(forces.min_hands.hands, forces.min_legs.hands, state.force_distribution);
  let f_legs = interpolate(forces.min_hands.legs, forces.min_legs.legs, state.force_distribution);
  let r = [
    state.climber.hands[0] - state.climber.center[0],
    state.climber.hands[1] - state.climber.center[1]];
  let torque = calc_torque(r, f_hands);

  ctx.font = "100% Arial";
  ctx.fillStyle = "green";
  ctx.fillText("Hand force:", 5, 20);
  ctx.fillStyle = "blue";
  ctx.fillText("Leg force:", 5, 40);
  ctx.fillStyle = "#444";
  ctx.fillText("Body tension:", 5, 60);
  ctx.fillStyle = "#000";
  ctx.fillText(`${(norm(f_hands) * 100).toFixed(0)} %`, 135, 20);
  ctx.fillText(`${(norm(f_legs) * 100).toFixed(0)} %`, 135, 40);
  ctx.fillText(`${(torque * 100).toFixed(0)} %·m`, 135, 60);

};

let update_ui = state => {
  let slider = document.getElementById("force_slider");
  slider.value = state.force_distribution;
}

window.onload = (event) => {
  // Initial State

  let climber = {
    center: [-0.5, -0.5],
    legs: [1, -1],
    hands: [-0.5, 1]
  };

  let camera = {"center": [0, 0], "width": 5};

  let state = {
    climber: climber,
    camera: camera,
    dragging_center: false,
    dragging_legs: false,
    dragging_hands: false,
    force_distribution: 0.0,
  };

  // Events


  let canvas = document.getElementById("canvas");
  let slider = document.getElementById("force_slider");

  let mouseIsDown = false;

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

  let mouseUp = (state) => {
    state.dragging_center = false;
    state.dragging_legs = false;
    state.dragging_hands = false;
    return state;
  }

  canvas.addEventListener("mousedown", e => {
    var rect = canvas.getBoundingClientRect();
    state = mouseDown(state, e.clientX - rect.left, e.clientY - rect.top);
    mouseIsDown = true;
  });

  document.addEventListener("mousemove", e => {
    if (mouseIsDown) {
      var rect = canvas.getBoundingClientRect();
      state = mouseDrag(state, e.clientX - rect.left, e.clientY - rect.top);
      draw(canvas, state);
    }
  });

  document.addEventListener("mouseup", e => {
    state = mouseUp(state);
    mouseIsDown = false;
  });

  canvas.addEventListener("touchstart", e => {
    state = mouseDown(state, e.touches[0].pageX - canvas.offsetLeft, e.touches[0].pageY - canvas.offsetTop);
    e.preventDefault();
  });

  canvas.addEventListener("touchmove", e => {
    state = mouseDrag(state, e.touches[0].pageX - canvas.offsetLeft, e.touches[0].pageY - canvas.offsetTop);
    draw(canvas, state);
    e.preventDefault();
  });

  canvas.addEventListener("touchend", e => {
    state = mouseUp(state);
    e.preventDefault();
  });

  slider.addEventListener("input", e => {
    state.force_distribution = parseInt(e.target.value) / 100;
    draw(canvas, state);
  });


  let onResize = () => {
    let max_width = window.innerHeight * 0.8;
    canvas.width = Math.min(max_width, slider.getBoundingClientRect().width);
    canvas.height = canvas.width;
    draw(canvas, state);
  };

  // Scenes

  document.getElementById("scene-default").onclick = () => {
    state.climber = {
      center: [-0.5, -0.5],
      legs: [1, -1],
      hands: [-0.5, 1]
    };
    state.force_distribution = 0;
    update_ui(state);
    draw(canvas, state);
    return false;
  };

  document.getElementById("scene-vertical").onclick = () => {
    state.climber = {
      center: [ -0.175, 0.092 ],
      hands: [ -0.05, 1.33 ],
      legs: [ -0.016, -0.99 ],
    };
    state.force_distribution = 0;
    update_ui(state);
    draw(canvas, state);
    return false;
  };

  document.getElementById("scene-slab").onclick = () => {
    state.climber = {
      center: [ -0.017, 0.392 ],
      hands: [ -0.891, 0.675 ],
      legs: [ 0.7, -0.6756 ],
    };
    state.force_distribution = 0;
    update_ui(state);
    draw(canvas, state);
    return false;
  };

  // Initialize

  window.onresize = onResize;
  onResize();
};

