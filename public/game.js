//var socket = io('http://localhost:3000')

const canvas = document.getElementById("game");
const context = canvas.getContext("2d");
var frame = 0;
var FPS = 120;

var shadow = document.createElement('canvas'),
sctx = shadow.getContext('2d');

canvas.width = window.innerWidth
canvas.height = window.innerHeight
shadow.width = canvas.width
shadow.height = canvas.height

var player = { x: null, y: null };
var moveDelta = { left: 0, right: 0, up: 0, down: 0 };
var realDelta = { x: 0, y: 0 };
var focus = { x: null, y: null };
var dir = { ax: null, ay: null, x: null, y: null };

var bullets = [];
var enemy = [];
var items = [];

var options = {
  scatter: 0.58,
  gravity: 0,
  consistency: 0.2,
  pollock: false,
  burst: true,
  shade: true,
};

function normVector(vec) {
  var distance = Math.sqrt(vec.x * vec.x + vec.y * vec.y);
  if (distance == 0) {
    return vec;
  }
  return {
    x: vec.x / distance,
    y: vec.y / distance,
  };
}

window.onload = function () {
  canvas.addEventListener("mousemove", hover, false);
  canvas.addEventListener("mousedown", click, false);

  player.x = canvas.width / 2;
  player.y = canvas.height / 2;

  focus.x = player.x;
  focus.y = player.y + 100;

  dir.x = dir.ax = 0.0;
  dir.y = dir.ay = 1.0;

  window.onkeydown = function (event) {
    if (event.keyCode == 37 || event.keyCode == 65) {
      moveDelta.right = 1;
    } else if (event.keyCode == 38 || event.keyCode == 87) {
      moveDelta.down = 1;
    } else if (event.keyCode == 39 || event.keyCode == 68) {
      moveDelta.left = 1;
    } else if (event.keyCode == 40 || event.keyCode == 83) {
      moveDelta.up = 1;
    }
    return true;
  };

  window.onkeyup = function (event) {
    if (event.keyCode == 37 || event.keyCode == 65) {
      moveDelta.right = 0;
    } else if (event.keyCode == 38 || event.keyCode == 87) {
      moveDelta.down = 0;
    } else if (event.keyCode == 39 || event.keyCode == 68) {
      moveDelta.left = 0;
    } else if (event.keyCode == 40 || event.keyCode == 83) {
      moveDelta.up = 0;
    }
    return true;
  };

  var interval_ms = (1 / FPS) * 1000;
  setInterval(function () {
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);

    frame += 1;
    update();
    render();
  }, interval_ms);

  setInterval(function () {
    if (enemy.length < 25) {
      var e = {
        x: -32,
        y: -32,
      };
      if (Math.random() < 0.5) {
        e.x = Math.random() * canvas.width;
        if (Math.random() < 0.5) {
          e.y = canvas.height + 32;
        }
      } else {
        e.y = Math.random() * canvas.height;
        if (Math.random() < 0.5) {
          e.x = canvas.width + 32;
        }
      }
      enemy.push(e);
    }
  }, 25);
};

function hover(event) {
  focus.x = event.pageX - canvas.offsetLeft;
  focus.y = event.pageY - canvas.offsetTop;

  dir.x = focus.x - player.x;
  dir.y = focus.y - player.y;
  var distance = Math.sqrt(dir.x * dir.x + dir.y * dir.y);
  dir.x /= distance;
  dir.y /= distance;
}

function click(event) {
  if (bullets.length < 8) {
    var speed = 800;
    var b = {
      until: frame + FPS * 2,
      x: player.x + dir.x * 10,
      y: player.y + dir.y * 10,
      dx: (dir.x * speed) / (FPS / 60),
      dy: (dir.y * speed) / (FPS / 60),
    };
    bullets.push(b);
  }
}

function drawEntity(x, y, size, color, alpha) {
  alpha = alpha || 0.5;
  context.save();

  context.beginPath();
  context.arc(x, y, size, 0, Math.PI * 2, false);
  context.closePath();
  context.fillStyle = color;
  context.globalAlpha = alpha;
  context.fill();

  context.restore();
}

function drawFocus(playerSize) {
  context.save();

  var grad = context.createRadialGradient(
    player.x,
    player.y,
    playerSize,
    player.x,
    player.y,
    400
  );
  grad.addColorStop(0, "#0f0");
  grad.addColorStop(1, "rgba(255,255,255,0)");

  context.beginPath();
  context.moveTo(player.x, player.y);

  context.globalAlpha = 0.25;

  var dx = dir.ax * 400;
  var dy = dir.ay * 400;
  var angle = (25 * Math.PI) / 180;

  var ptLeft = {
    x: player.x + (Math.cos(angle) * dx - Math.sin(angle) * dy),
    y: player.y + (Math.sin(angle) * dx + Math.cos(angle) * dy),
  };
  var ptRight = {
    x: player.x + (Math.cos(-angle) * dx - Math.sin(-angle) * dy),
    y: player.y + (Math.sin(-angle) * dx + Math.cos(-angle) * dy),
  };

  context.lineTo(ptLeft.x, ptLeft.y);
  context.lineTo(ptRight.x, ptRight.y);
  context.lineTo(player.x, player.y);
  context.fillStyle = grad;
  context.fill();

  context.restore();
}

function update() {
  dir.ax += (dir.x - dir.ax) / 4;
  dir.ay += (dir.y - dir.ay) / 4;

  var distance = Math.sqrt(dir.ax * dir.ax + dir.ay * dir.ay);
  dir.ax /= distance;
  dir.ay /= distance;

  var decayRate = (1.25 * 120) / FPS;
  var maxSpeed = (1.25 * 120) / FPS;

  realDelta.x /= decayRate;
  realDelta.y /= decayRate;
  if (Math.abs(realDelta.x) < 0.5) {
    realDelta.x = 0;
  }
  if (Math.abs(realDelta.y) < 0.5) {
    realDelta.y = 0;
  }
  realDelta.x += moveDelta.left - moveDelta.right;
  realDelta.y += moveDelta.up - moveDelta.down;

  var distance = Math.sqrt(
    realDelta.x * realDelta.x + realDelta.y * realDelta.y
  );
  if (distance > maxSpeed) {
    realDelta.x *= maxSpeed / distance;
    realDelta.y *= maxSpeed / distance;
  }

  player.x += realDelta.x;
  player.y += realDelta.y;

  player.x = Math.max(Math.min(player.x, canvas.width - 8), 8);
  player.y = Math.max(Math.min(player.y, canvas.height - 8), 8);

  for (var i = 0; i < bullets.length; ++i) {
    var b = bullets[i];
    b.x += b.dx * (1 / FPS);
    b.y += b.dy * (1 / FPS);

    for (var j = 0; j < enemy.length; ++j) {
      var diff = {
        x: b.x - enemy[j].x,
        y: b.y - enemy[j].y,
      };
      if (Math.sqrt(diff.x * diff.x + diff.y * diff.y) < 12) {
        //if(bloodshed.length < 360){
        // for (var a = 0; a < 16; a++) {
        //   for (var b = 0; b < 16; b++) {
        //     if (Math.random() < 0.1) {
        //       bloodshed.push({
        //         x: enemy[j].x + a * 4 - 16,
        //         y: enemy[j].y + b * 4 - 16,
        //         w: 2,
        //         h: 2,
        //       });
        //     }
        //   }
        // }
        var redtone = (options.shade) ? 'rgb(' + (130 + (Math.random() * 105 | 0)) + ',0,0)' : '#aa0707';
        var randomtone = '#' + Math.floor(Math.random() * 16777215).toString(16)
        sctx.fillStyle = context.fillStyle =  '#aa0707';

        splat(enemy[j].x, enemy[j].y, items)
        //}else{
        //	for(var a = 0; a < 16; a++){
        //		bloodshed.splice(a, 1);
        //	}
        //	for(var a = 0; a < 16; a++){
        //		for(var b = 0; b < 16; b++){
        //			if(Math.random() < 0.1){
        //				bloodshed.push({x: (enemy[j].x + (a * 4)) - 16, y: (enemy[j].y + (b * 4)) - 16, w: 2, h: 2})
        //			}
        //		}
        //	}
        //}
        enemy.splice(j, 1);
        break;
      }
    }
  }
  for (var i = 0; i < enemy.length; ++i) {
    var e = enemy[i];
    var vec = normVector({
      x: e.x - player.x + (Math.random() - 0.5) * 100,
      y: e.y - player.y + (Math.random() - 0.5) * 100,
    });
    const speed = 80
    e.x -= vec.x * (speed / FPS);
    e.y -= vec.y * (speed / FPS);
  }
}

function render() {
  // bloodshed.forEach((blood) => {
  //   context.fillStyle = "red";
  //   context.fillRect(blood.x, blood.y, blood.w, blood.h);
  //   context.globalCompositeOperation = "source-over";
  // });

  drawSplat(items)
  var dx = player.x - focus.ax;
  var dy = player.y - focus.ay;
  var distance = Math.sqrt(dx * dx + dy * dy);

  var size = 8;
  var flashRate = FPS * 1;
  var part = Math.ceil(frame % flashRate) / flashRate;
  if (part > 0.95) {
    size += (part - 0.95) * 10 * 4;
  } else if (part < 0.05) {
    size += (0.05 - part) * 10 * 4;
  }
  drawFocus(size);
  //sombra
  drawEntity(player.x + 2, player.y + 2, size * 1.1, "#000");
  drawEntity(player.x, player.y, size, "#c00", 1);

  for (var i = 0; i < bullets.length; ++i) {
    var b = bullets[i];
    drawEntity(b.x, b.y, 2, "#000");
  }
  while (bullets.length > 0 && bullets[0].until == frame) {
    bullets.shift();
  }

  for (var i = 0; i < enemy.length; ++i) {
    var e = enemy[i];
    drawEntity(e.x, e.y, 6, "#0f0", 1);
  }
}

function splat(x, y, arr) {
  for (var i = 0; i < 30; i++) {
    var s = Math.random() * Math.PI;
    var dirx =
      (Math.random() < 0.5 ? 3 : -3) * (Math.random() * 3) * options.scatter;
    var diry =
      (Math.random() < 0.5 ? 3 : -3) * (Math.random() * 3) * options.scatter;

    arr.push({
      x: x,
      y: y,
      dx: dirx,// + mouse.dx,
      dy: diry,// + mouse.dy,
      size: s,
    });
  }
}

function drawSplat(arr) {
  var i = arr.length;
  while (i--) {
    var t = arr[i];
    var x = t.x,
      y = t.y,
      s = t.size;
    circle(x, y, s, context);

    t.dy -= options.gravity;
    t.x -= t.dx;
    t.y -= t.dy;
    t.size -= 0.05;

    if (arr[i].size < 0.3 || Math.random() < options.consistency) {
      circle(x, y, s, sctx);
      arr.splice(i, 1);
    }
  }

  context.drawImage(shadow, 0, 0);
  //sctx.drawImage(shadow, 0, 0.5)
}

function circle(x, y, s, c) {
  c.beginPath();
  c.arc(x, y, s * 2, 0, 2 * Math.PI, false);
  c.fill();
  c.closePath();
}
