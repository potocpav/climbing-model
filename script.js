'use strict';

// Maths

const l2 = ([ax, ay], [bx, by]) => {
  return Math.sqrt((ax - bx) * (ax - bx) + (ay - by) * (ay - by));
}

const project = (camera, w, h) => pt => {
  const scale = w / camera.width;
  return [(pt[0] - camera.center[0]) * scale + w / 2, h / 2 - (pt[1] - camera.center[1]) * scale];
};

const project_dir = (camera, w) => dir => {
  const scale = w / camera.width;
  return [dir[0] * scale, -dir[1] * scale];
};

const inv_project = (camera, w, h) => pt => {
  const scale = camera.width / w;
  return [(pt[0] - w / 2) * scale + camera.center[0], camera.center[1] - (pt[1] - h / 2) * scale];
};

const interpolate = (p1, p2, t) => {
  return [p1[0] * (1 - t) + p2[0] * t, p1[1] * (1 - t) + p2[1] * t];
}

const norm = ([px, py]) => {
  return Math.sqrt(px * px + py * py)
};

/// See `maths.py` for the derivation of the equations below.
const calc_forces = climber => {
  const r_1x = climber.hands[0] - climber.center[0];
  const r_1y = climber.hands[1] - climber.center[1];
  const r_2x = climber.feet[0] - climber.center[0];
  const r_2y = climber.feet[1] - climber.center[1];
  const g = 1;

  const fac = 1 / (r_1x * r_2y - r_1y * r_2x);
  const dist = Math.pow(r_1x - r_2x, 2) + Math.pow(r_1y - r_2y, 2);

  // Forces, depending on torque `t`
  const f1 = t => [
    fac * (g * r_1x * r_2x - t * (r_1x - r_2x)),
    fac * (g * r_1y * r_2x - t * (r_1y - r_2y))];

  const f2 = t => [
    fac * (-g * r_1x * r_2x + t * (r_1x - r_2x)),
    fac * (-g * r_1x * r_2y + t * (r_1y - r_2y))];

  // Minimum force parameters
  const min_hands_t = g * r_2x / dist *
    (r_1x * (r_1x - r_2x) + r_1y * (r_1y - r_2y));
  const min_feet_t = g * r_1x / dist *
    (r_2x * (r_1x - r_2x) + r_2y * (r_1y - r_2y));

    return {f1, f2, min_hands_t, min_feet_t};
};

const calc_torque = ([r_x, r_y], [f_x, f_y]) => {
  return Math.abs(r_x * f_y - r_y * f_x);
}

const minus = ([ax, ay], [bx, by]) => [ax - bx, ay - by];

const plus = ([ax, ay], [bx, by]) => [ax + bx, ay + by];

const dot = ([ax, ay], [bx, by]) => ax * bx + ay * by;

// Draw

const draw_force_range = (ctx, pos, f1, f2, color) => {
  const scale = 1.0;

  ctx.beginPath();
  ctx.globalAlpha = 0.2
  ctx.fillStyle = color
  ctx.moveTo(pos[0], pos[1]);
  ctx.lineTo(pos[0] + f1[0] * scale, pos[1] + f1[1] * scale);
  ctx.lineTo(pos[0] + f2[0] * scale, pos[1] + f2[1] * scale);
  ctx.fill();
};

const draw_force = (ctx, pos, f, color) => {
  const scale = 1.0;

  // force arrow head computation
  const width = 3;
  const head_size = width * 2;
  const dx = f[0] / norm(f);
  const dy = f[1] / norm(f);
  const tip = [pos[0] + f[0] * scale, pos[1] + f[1] * scale];

  // draw the arrow
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

const draw = (canvas, image, state) => {
  const draw_circle = ([x, y], r, color) => {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.globalAlpha = 0.2;
    ctx.fill();
    ctx.globalAlpha = 1.0;
    ctx.stroke();
  };

  var ctx = canvas.getContext('2d');

  const project_ap = project(state.camera, canvas.width, canvas.height);
  const project_dir_ap = project_dir(state.camera, canvas.width);

  const center_px = project_ap(state.climber.center);
  const feet_px = project_ap(state.climber.feet);
  const hands_px = project_ap(state.climber.hands);

  ctx.lineWidth = 3;

  const [bg_w, bg_h] = [image.naturalWidth, image.naturalHeight];
  if (bg_w == 0) {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    const s = Math.min(bg_w, bg_h);
    const [mx, my] = [(bg_w - s) / 2, (bg_h - s) / 2];
    ctx.drawImage(image, mx, my, s, s, 0, 0, canvas.width, canvas.height);
  }

  // Draw the wall
  ctx.globalAlpha = 0.7;
  let [dx, dy] = minus(hands_px, feet_px);
  const invert = dot([dy, -dx], minus(center_px, feet_px)) > 0 ? 1 : -1;
  [dx, dy] = [dx / norm([dx, dy]) * invert, dy / norm([dx, dy]) * invert];

  var my_gradient = ctx.createLinearGradient(feet_px[0], feet_px[1], feet_px[0] - dy, feet_px[1] + dx);
  my_gradient.addColorStop(0, 'white');
  my_gradient.addColorStop(1, 'lightgray');
  ctx.fillStyle = my_gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw the climber
  ctx.globalAlpha = 1.0;
  ctx.beginPath();
  ctx.strokeStyle = 'gray';
  ctx.moveTo(hands_px[0], hands_px[1]);
  ctx.lineTo(center_px[0], center_px[1]);
  ctx.lineTo(feet_px[0], feet_px[1]);
  ctx.stroke();

  draw_circle(center_px, 20, 'gray');
  draw_circle(feet_px, 10, 'blue');
  draw_circle(hands_px, 10, 'green');

  // Draw forces
  const forces = calc_forces(state.climber);
  const t = forces.min_hands_t * (1 - state.force) + forces.min_feet_t * state.force;
  const f_hands = forces.f1(t);
  const f_feet = forces.f2(t);

  draw_force_range(ctx, hands_px,
    project_dir_ap(forces.f1(forces.min_hands_t)),
    project_dir_ap(forces.f1(forces.min_feet_t)),
    'green');
  draw_force_range(ctx, feet_px,
    project_dir_ap(forces.f2(forces.min_hands_t)),
    project_dir_ap(forces.f2(forces.min_feet_t)),
    'blue');
  draw_force(ctx, hands_px,
    project_dir_ap(forces.f1(t)), 'green');
  draw_force(ctx, feet_px,
    project_dir_ap(forces.f2(t)), 'blue');

  // Draw text
  ctx.font = '100% Arial';
  ctx.fillStyle = 'green';
  ctx.fillText('Hand force:', 5, 20);
  ctx.fillStyle = 'blue';
  ctx.fillText('Foot force:', 5, 40);
  ctx.fillStyle = '#444';
  ctx.fillText('Body tension:', 5, 60);
  ctx.fillStyle = '#000';
  ctx.fillText(`${(norm(f_hands) * 100).toFixed(0)} %`, 135, 20);
  ctx.fillText(`${(norm(f_feet) * 100).toFixed(0)} %`, 135, 40);
  ctx.fillText(`${(Math.abs(t) * 100).toFixed(0)} %??m`, 135, 60);

};

const update_ui = state => {
  const canvas = document.getElementById('canvas');
  const slider = document.getElementById('force_slider');
  const bg_img = document.getElementById('bg_image');
  draw(canvas, bg_img, state);
  slider.value = Math.round(state.force * 100);
};

const default_state = () => {
  const climber = {
    center: [-0.5, -0.5],
    feet: [1, -1],
    hands: [-0.5, 1]
  };

  const camera = {'center': [0, 0], 'width': 5};

  const state = {
    climber: climber,
    camera: camera,
    dragging_center: false,
    dragging_feet: false,
    dragging_hands: false,
    force: 0.0,
  };

  return state;
}

const serialize = state => {
  const [c, f] = [state.climber, state.force];
  const json = [c.center[0], c.center[1], c.feet[0], c.feet[1], c.hands[0], c.hands[1], f]
    .map(i => Math.round(i * 100) / 100);
  return JSON.stringify(json);
};

const from_list = ([a, b, c, d, e, f, g]) => {
  const state = default_state();
  state.climber.center = [a, b];
  state.climber.feet = [c, d];
  state.climber.hands = [e, f];
  state.force = Math.max(0, Math.min(1, g));
  return state;
}

const deserialize = s => {
  const state = default_state();
  const l = JSON.parse(s).map(s => Number(s));
  return from_list(l);
};

let state = default_state();

// This function is global, so that it can be used in HTML links directly
const set_state = l => {
  state = from_list(l);
  update_ui(state);
}

window.onload = (event) => {
  // Events

  const canvas = document.getElementById('canvas');
  const slider = document.getElementById('force_slider');
  const bg_image = document.getElementById('bg_image');


  let mouseIsDown = false;

  const mouseDown = (state, x, y) => {
    const project_ap = project(state.camera, canvas.width, canvas.height);

    if (l2([x, y], project_ap(state.climber.center)) < 20) {
      state.dragging_center = true;
    }

    if (l2([x, y], project_ap(state.climber.feet)) < 15) {
      state.dragging_feet = true;
    }

    if (l2([x, y], project_ap(state.climber.hands)) < 15) {
      state.dragging_hands = true;
    }
    return state;
  };

  const mouseDrag = (state, x, y) => {
    const inv_project_ap = inv_project(state.camera, canvas.width, canvas.height);
    const new_pos = inv_project_ap([x, y]);

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

  const mouseUp = (state) => {
    state.dragging_center = false;
    state.dragging_feet = false;
    state.dragging_hands = false;
    return state;
  }

  canvas.addEventListener('mousedown', e => {
    var rect = canvas.getBoundingClientRect();
    state = mouseDown(state, e.clientX - rect.left, e.clientY - rect.top);
    mouseIsDown = true;
  });

  document.addEventListener('mousemove', e => {
    if (mouseIsDown) {
      var rect = canvas.getBoundingClientRect();
      state = mouseDrag(state, e.clientX - rect.left, e.clientY - rect.top);
      update_ui(state);
    }
  });

  document.addEventListener('mouseup', e => {
    state = mouseUp(state);
    mouseIsDown = false;
  });

  canvas.addEventListener('touchstart', e => {
    state = mouseDown(state, e.touches[0].pageX - canvas.offsetLeft, e.touches[0].pageY - canvas.offsetTop);
    e.preventDefault();
  });

  canvas.addEventListener('touchmove', e => {
    state = mouseDrag(state, e.touches[0].pageX - canvas.offsetLeft, e.touches[0].pageY - canvas.offsetTop);
    update_ui(state);
    e.preventDefault();
  });

  canvas.addEventListener('touchend', e => {
    state = mouseUp(state);
    e.preventDefault();
  });

  slider.addEventListener('input', e => {
    state.force = parseInt(e.target.value) / 100;
    update_ui(state);
  });

  // Link generatrion

  document.getElementById('permalink').onclick = () => {
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
        console.log('Invalid permalink');
      }
    } else {
      state = default_state();
    }
    update_ui(state);
  };

  window.onresize = () => {
    const max_width = window.innerHeight * 0.8;
    canvas.width = Math.min(max_width, slider.getBoundingClientRect().width);
    canvas.height = canvas.width;
    update_ui(state);
  };

  // Background image selector & file drag & drop

  bg_image.onload = () => {
    update_ui(state);;
  };

  const readImage = file => {
    // Check if the file is an image.
    if (file.type && file.type.indexOf('image') === -1) {
      console.log('File is not an image.', file.type, file);
      return;
    }

    const reader = new FileReader();
    reader.addEventListener('load', (event) => {
      bg_image.src = event.target.result;
    });
    reader.readAsDataURL(file);
  };

  const fileSelector = document.getElementById('file-selector');
  fileSelector.addEventListener('change', (event) => {
    const fileList = event.target.files;
    readImage(fileList[0]);
  });

  window.addEventListener('dragover', (event) => {
    event.stopPropagation();
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  });

  window.addEventListener('drop', (event) => {
    event.stopPropagation();
    event.preventDefault();
    const fileList = event.dataTransfer.files;
    readImage(fileList[0]);
  });

  window.onhashchange();
  window.onresize();
};

