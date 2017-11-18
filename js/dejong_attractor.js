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
params["Show debug info"] = false;
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

// Generator params
var a,b,c,d;
var points = [];
var renderCount = 0;
var imageData;
var pixelCountArray;

var fps, lastTime, delta;
resetDrawing();

//Reset the drawing
function resetDrawing()
{
  shift = Math.floor(Math.random()*360);
  renderCount = 0;
  var prevFill = context.fillStyle;
  context.fillStyle = "#FFFFFF";
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
      x: Math.random()*2*Math.PI - Math.PI, // Why Pi? Because magic, that's why.
      y: Math.random()*2*Math.PI - Math.PI
    });
  }
  imageData = context.getImageData(0, 0, width, height);
  pixelCountArray = Array(width*height).fill(0);
  context.fillStyle = "#FFFFFF";
  context.strokeStyle = "#999999";
  render();
}

function render() {
  if (renderCount > Math.pow(10, params["Iterations: 10^"])){
    context.putImageData(imageData, 0, 0);
    console.log("Done Rendering!");
    return;
  }

  if (!lastTime) {
    lastTime = performance.now();
  }
  var drawX,drawY,vel;
  var p, newPoint;
  for (var i = 0; i < points.length; i++) {
    // get each point and do what we did before with a single point
    p = points[i];
    // Get new point from the attractor
    newPoint = getValue(p.x, p.y);
    var minRenderCount = 2
    if (renderCount >= minRenderCount) { //Avoid drawing first random points
      // Convert from algorithm coords to drawing coords
      drawX = Math.floor(p.x * width/4 + width/2);
      drawY = Math.floor(p.y * height/4 + height/2);
      nextDrawX = newPoint.x * width/4 + width/2;
      nextDrawY = newPoint.y * height/4 + height/2;
      deltaX = Math.abs(drawX - nextDrawX);
      deltaY = Math.abs(drawY - nextDrawY);
      //Set random color
      //context.fillStyle = getHSLColorString(Math.floor(Math.pow(deltaX, 2) + Math.pow(deltaY, 2))/(10 * width) + shift);
      //Draw points 
      //context.fillRect(drawX, drawY, .5, .5);

      index = (drawX + drawY * imageData.width) * 4;
      var rgb,hsl;
      if (renderCount == minRenderCount){
        hsl = getHSLColor(Math.floor(Math.pow(deltaX, 2) + Math.pow(deltaY, 2))/(10 * width) + shift);
        rgb = hslToRgb(hsl.h, hsl.s, hsl.l);
        imageData.data[index + 0] = rgb[0];
        imageData.data[index + 1] = rgb[1];
        imageData.data[index + 2] = rgb[2];
        imageData.data[index + 3] = 0;
      }
      //console.log("Drawing point at " + drawX + "," + drawY);
      imageData.data[index + 3] += 1;

      // Line drawing stuff
      if (params["Draw Lines"]) {
        context.strokeStyle = getHSLColorString(p.hsl);
        context.beginPath();
        context.moveTo(drawX, drawY);
        context.lineTo(nextDrawX, nextDrawY);
        context.stroke();
      }
    }
    // Update the coords
    p.x = newPoint.x;
    p.y = newPoint.y;
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

function getHSLColor(val){
  hue = 1.00 * (val % 360) / 360;
  sat = .5;
  light = .5;
  return {h: hue, s: sat, l: light};
}


function getValue(x, y) {
  // Peter de Jong attractor
  // http://paulbourke.net/fractals/peterdejong/

  // attactor gives new x, y for old one.
  var x1 = Math.sin(a * y) - Math.cos(b * x);
  var y1 = Math.sin(c * x) - Math.cos(d * y);

  return {x: x1, y: y1};
}