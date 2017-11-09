var canvas = document.getElementById("canvas"),
  context = canvas.getContext("2d"),
  width = (canvas.width = window.innerWidth),
  height = (canvas.height = window.innerHeight);


context.lineWidth = 0.1;
canvas.onclick = function() {resetDrawing()}

//QuickSettings stuff!
var params = {};
params["Points: 10^"] = 4;
var settings = QuickSettings.create();
settings.setGlobalChangeHandler(resetDrawing);
settings.bindRange("Points: 10^", 0, 5, 4, 1, params);


// random attractor params
var a,b,c,d;
var points = [];
var renderCount = 0;
resetDrawing();
render();

function resetDrawing()
{
  renderCount = 0;
  var prevFill = context.fillStyle;
  context.fillStyle = "#000000";
  context.fillRect(0,0,width,height);
  context.fillStyle = prevFill;
  //new parameters, restart points
  a = Math.random() * 4 - 2;
  b = Math.random() * 4 - 2;
  c = Math.random() * 4 - 2;
  d = Math.random() * 4 - 2;
  points = [];
  for (var i = 0; i < Math.pow(10,params["Points: 10^"]); i++)
  {
    points.push({
      x: Math.random()*Math.PI,
      y: Math.random()*Math.PI,
    });
  }

  context.fillStyle = "#FFFFFF";
  context.strokeStyle = "#FFFFFF";
}

function render() {
  var drawX,drawY,vel;
  var p, newCoords;
  for (var i = 0; i < points.length; i++) {
    // get each point and do what we did before with a single point
    p = points[i];
    // Get new coordinates from the attractor
    newCoords = getValue(p.x, p.y);

    //context.strokeStyle = "rgb(" + Math.floor(p.vx * 50) + "," + Math.floor(p.vy * 50) + "," + Math.floor(Math.abs(p.vx - p.vy)*50) + ")";
    //Draw single pixel at location
    if (renderCount > 1) //Avoid drawing first random points
    {
      context.fillRect(p.x * width/4 + width/2, p.y * height/4 + height/2, .5, .5);
    }
    p.x = newCoords.x;
    p.y = newCoords.y;
  }
  renderCount++;
  // call this function again in one frame tick
  requestAnimationFrame(render);
}

function getValue(x, y) {
  // Peter de Jong attractor
  // http://paulbourke.net/fractals/peterdejong/

  // attactor gives new x, y for old one.
  var x1 = Math.sin(a * y) - Math.cos(b * x);
  var y1 = Math.sin(c * x) - Math.cos(d * y);

  return {x: x1, y: y1};
}