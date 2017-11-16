var canvas = document.getElementById("canvas"),
  context = canvas.getContext("2d"),
  width = (canvas.width = window.innerWidth),
  height = (canvas.height = window.innerHeight);
context.font = '12px Arial';
context.lineWidth = 0.05;

//QuickSettings stuff!
var params = {};
params["Points: 10^"] = 2;
params["Iterations: 10^"] = 2;
params["Draw FPS"] = false;
params["Draw Lines"] = false;
var settings = QuickSettings.create();
settings.bindRange("Points: 10^", 0, 6, 2, 1, params);
settings.bindRange("Iterations: 10^", 0, 6, 2, 1, params);
settings.addButton("Save Image", saveImage);
settings.addButton("Generate New", resetDrawing);
settings.bindBoolean("Draw FPS", false, params);
settings.bindBoolean("Draw Lines", false, params);

function saveImage()
{
  var img = canvas.toDataURL("image/png");
  var w=window.open('about:blank','image from canvas');
  w.document.write("<img src='"+img+"' alt='from canvas'/>");
}

// random attractor params
var a,b,c,d;
var points = [];
var renderCount = 0;
var fps, lastTime, delta;
resetDrawing();
render();

//Reset the drawing
function resetDrawing()
{
  shift = Math.floor(Math.random()*360);
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
      hsl: (Math.random()*100 % 6) * 60
    });
  }

  context.fillStyle = "#FFFFFF";
  context.strokeStyle = "#999999";
  render();
}

function render() {
  if (renderCount > Math.pow(10, params["Iterations: 10^"])){
    return;
  }

  if (!lastTime) {
    lastTime = performance.now();
  }
  var drawX,drawY,vel;
  var p, newCoords;
  for (var i = 0; i < points.length; i++) {
    // get each point and do what we did before with a single point
    p = points[i];
    // Get new coordinates from the attractor
    newCoords = getValue(p.x, p.y);

    if (renderCount > 5) { //Avoid drawing first random points
      drawX = p.x * width/4 + width/2;
      drawY = p.y * height/4 + height/2;
      nextDrawX = newCoords.x * width/4 + width/2;
      nextDrawY = newCoords.y * height/4 + height/2;
      deltaX = Math.abs(drawX - nextDrawX);
      deltaY = Math.abs(drawY - nextDrawY);
      //Set random color
      context.fillStyle = getHSLColorString(Math.floor(Math.pow(deltaX, 2) + Math.pow(deltaY, 2))/10000 + shift);
      //Draw points 
      context.fillRect(drawX, drawY, .5, .5);

      // Line drawing stuff
      if (params["Draw Lines"]){
        context.strokeStyle = getHSLColorString(p.hsl);
        context.beginPath();
        context.moveTo(drawX, drawY);
        context.lineTo(nextDrawX, nextDrawY);
        context.stroke();
      }


    }
    // Update the coords
    p.x = newCoords.x;
    p.y = newCoords.y;
  }
  renderCount++;
  if (params["Draw FPS"]){
    delta = (performance.now() - lastTime)/1000;
    lastTime = performance.now(); 
    fps = 1/delta;
    var prevFill = context.fillStyle;
    context.fillStyle = "#000000";
    context.fillRect(width-60, 0, width, 10);
    context.fillStyle = "#FFFFFF";
    context.fillText("FPS: " + fps, width - 60, 10);
    context.fillStyle = prevFill;

  }
  // call this function again in one frame tick
  requestAnimationFrame(render);
}

function getHSLColorString(val) {
  hue = (val) %360;
  return "hsl(" + hue + ", 50%, 50%)"
}


function getValue(x, y) {
  // Peter de Jong attractor
  // http://paulbourke.net/fractals/peterdejong/

  // attactor gives new x, y for old one.
  var x1 = Math.sin(a * y) - Math.cos(b * x);
  var y1 = Math.sin(c * x) - Math.cos(d * y);

  return {x: x1, y: y1};
}