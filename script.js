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
  let r_2x = climber.feet[0] - climber.center[0];
  let r_2y = climber.feet[1] - climber.center[1];
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
    "min_hands": {"hands": [f_1xa, f_1ya], "feet": [f_2xa, f_2ya]},
    "min_feet": {"hands": [f_1xb, f_1yb], "feet": [f_2xb, f_2yb]},
  };
}

let calc_torque = ([r_x, r_y], [f_x, f_y]) => {
  return Math.abs(r_x * f_y - r_y * f_x);
}

let minus = ([ax, ay], [bx, by]) => [ax - bx, ay - by];

let plus = ([ax, ay], [bx, by]) => [ax + bx, ay + by];

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
  let feet_px = project_ap(state.climber.feet);
  let hands_px = project_ap(state.climber.hands);

  ctx.lineWidth = 3;

  // Draw the wall
  let [dx, dy] = minus(hands_px, feet_px);
  let invert = dot([dy, -dx], minus(center_px, feet_px)) > 0 ? 1 : -1;
  [dx, dy] = [dx / norm([dx, dy]) * invert, dy / norm([dx, dy]) * invert];

  var my_gradient = ctx.createLinearGradient(feet_px[0], feet_px[1], feet_px[0] - dy, feet_px[1] + dx);
  my_gradient.addColorStop(0, "white");
  my_gradient.addColorStop(1, "lightgray");
  ctx.fillStyle = my_gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw the climber
  ctx.beginPath();
  ctx.strokeStyle = "lightgray";

  ctx.moveTo(hands_px[0], hands_px[1]);
  ctx.lineTo(center_px[0], center_px[1]);
  ctx.lineTo(feet_px[0], feet_px[1]);

  ctx.stroke();

  ctx.beginPath();
  ctx.strokeStyle = "gray";
  ctx.fillStyle = "gray";
  ctx.arc(center_px[0], center_px[1], 20, 0, 2 * Math.PI);
  ctx.globalAlpha = 0.2;
  ctx.fill();
  ctx.globalAlpha = 1.0;
  ctx.stroke();

  ctx.beginPath();
  ctx.strokeStyle = "blue";
  ctx.fillStyle = "blue";
  ctx.arc(feet_px[0], feet_px[1], 10, 0, 2 * Math.PI);
  ctx.globalAlpha = 0.2;
  ctx.fill();
  ctx.globalAlpha = 1.0;
  ctx.stroke();

  ctx.beginPath();
  ctx.strokeStyle = "green";
  ctx.fillStyle = "green";
  ctx.arc(hands_px[0], hands_px[1], 10, 0, 2 * Math.PI);
  ctx.globalAlpha = 0.2;
  ctx.fill();
  ctx.globalAlpha = 1.0;
  ctx.stroke();

  // Draw forces
  let forces = calc_forces(state.climber);
  let f_h1_px = project_dir_ap(forces.min_hands.hands);
  let f_h2_px = project_dir_ap(forces.min_feet.hands);
  let f_l1_px = project_dir_ap(forces.min_hands.feet);
  let f_l2_px = project_dir_ap(forces.min_feet.feet);

  draw_force_range(ctx, hands_px, f_h1_px, f_h2_px, state.force_distribution, "green");
  draw_force_range(ctx, feet_px, f_l1_px, f_l2_px, state.force_distribution, "blue");

  // Draw text
  let f_hands = interpolate(forces.min_hands.hands, forces.min_feet.hands, state.force_distribution);
  let f_feet = interpolate(forces.min_hands.feet, forces.min_feet.feet, state.force_distribution);
  let r_hands = [
    state.climber.hands[0] - state.climber.center[0],
    state.climber.hands[1] - state.climber.center[1]];
  let r_feet = [
    state.climber.feet[0] - state.climber.center[0],
    state.climber.feet[1] - state.climber.center[1]];
  let torque = calc_torque(r_hands, f_hands);
  let body_tension = torque / (norm(r_hands) + norm(r_feet));

  ctx.font = "100% Arial";
  ctx.fillStyle = "green";
  ctx.fillText("Hand force:", 5, 20);
  ctx.fillStyle = "blue";
  ctx.fillText("Leg force:", 5, 40);
  ctx.fillStyle = "#444";
  ctx.fillText("Body tension:", 5, 60);
  ctx.fillStyle = "#000";
  ctx.fillText(`${(norm(f_hands) * 100).toFixed(0)} %`, 135, 20);
  ctx.fillText(`${(norm(f_feet) * 100).toFixed(0)} %`, 135, 40);
  ctx.fillText(`${(body_tension * 100).toFixed(0)} %`, 135, 60);

};

let update_ui = state => {
  let canvas = document.getElementById("canvas");
  let slider = document.getElementById("force_slider");
  draw(canvas, state);
  slider.value = Math.round(state.force_distribution * 100);
};

let default_state = () => {
  let climber = {
    center: [-0.5, -0.5],
    feet: [1, -1],
    hands: [-0.5, 1]
  };

  let camera = {"center": [0, 0], "width": 5};

  let state = {
    climber: climber,
    camera: camera,
    dragging_center: false,
    dragging_feet: false,
    dragging_hands: false,
    force_distribution: 0.0,
  };

  return state;
}

let serialize = state => {
  let [c, f] = [state.climber, state.force_distribution];
  let json = [c.center[0], c.center[1], c.feet[0], c.feet[1], c.hands[0], c.hands[1], f]
    .map(i => Math.round(i * 100) / 100);
  return JSON.stringify(json);
};

let from_list = ([a, b, c, d, e, f, g]) => {
  let state = default_state();
  state.climber.center = [a, b];
  state.climber.feet = [c, d];
  state.climber.hands = [e, f];
  state.force_distribution = Math.max(0, Math.min(1, g));
  return state;
}

let deserialize = s => {
  let state = default_state();
  let l = JSON.parse(s).map(s => Number(s));
  return from_list(l);
};

let state = default_state();

// This function is global, so that it can be used in HTML links directly
let set_state = l => {
  state = from_list(l);
  update_ui(state);
}

window.onload = (event) => {
  // Events

  let canvas = document.getElementById("canvas");
  let slider = document.getElementById("force_slider");

  let mouseIsDown = false;

  let mouseDown = (state, x, y) => {
    let project_ap = project(state.camera, canvas.width, canvas.height);

    if (l2([x, y], project_ap(state.climber.center)) < 20) {
      state.dragging_center = true;
    }

    if (l2([x, y], project_ap(state.climber.feet)) < 10) {
      state.dragging_feet = true;
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

    if (state.dragging_feet) {
      state.climber.feet = new_pos;
    }

    if (state.dragging_hands) {
      state.climber.hands = new_pos;
    }
    return state;
  }

  let mouseUp = (state) => {
    state.dragging_center = false;
    state.dragging_feet = false;
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
      update_ui(state);
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
    update_ui(state);
    e.preventDefault();
  });

  canvas.addEventListener("touchend", e => {
    state = mouseUp(state);
    e.preventDefault();
  });

  slider.addEventListener("input", e => {
    state.force_distribution = parseInt(e.target.value) / 100;
    update_ui(state);
  });

  // Link generatrion

  document.getElementById("permalink").onclick = () => {
    window.location.hash = serialize(state);
    update_ui(state);
    return false;
  };

  // Hash loading and window resize

  window.onhashchange = () => {
    if (window.location.hash.length > 1) {
      try {
        state = deserialize(window.location.hash.substring(1));
      } catch (err) {
        console.log("Invalid permalink");
      }
    } else {
      state = default_state();
    }
    update_ui(state);
  };

  window.onresize = () => {
    let max_width = window.innerHeight * 0.8;
    canvas.width = Math.min(max_width, slider.getBoundingClientRect().width);
    canvas.height = canvas.width;
    update_ui(state);
  };

  window.onhashchange();
  window.onresize();
};

