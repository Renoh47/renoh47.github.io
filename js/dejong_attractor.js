var canvas = document.getElementById("canvas"),
  context = canvas.getContext("2d"),
  width = (canvas.width = window.innerWidth),
  height = (canvas.height = window.innerHeight);
context.font = '12px Arial';
context.lineWidth = 0.05;
var renderPercent = 0;
var preRenderWorker;

if (window.Worker) {
  console.log("Browser supports web workers, yay!");
  preRenderWorker = new Worker('js/dejong_worker.js');
}
else {
  alert("Your browser does not support Web Workers, the GUI will freeze while rendering.")
}

//QuickSettings stuff!
var params = {};
params["Points: 10^"] = 5;
params["Iterations: 10^"] = 2;
params["Draw FPS"] = false;
params["Draw Lines"] = false;
params["Show debug info"] = false;
params["Width"] = width;
params["Height"] = height;
params["Background Color"] = "#000000"
params["Clean background on render"] = false;

var settings = QuickSettings.create();
settings.bindNumber("Width", 0, 10000, Math.floor(width), 1, params);
settings.bindNumber("Height", 0, 10000, Math.floor(height), 1, params);
settings.bindRange("Points: 10^", 0, 6, 5, 1, params);
settings.bindRange("Iterations: 10^", 0, 6, 2, 1, params);
settings.bindColor("Background Color", "#000000", params);
settings.addButton("Save Image", saveImage);
settings.addButton("Generate New", manualReset);
settings.bindBoolean("Clean background on render", false, params); 
settings.addProgressBar("Render Progess", 100, renderPercent, "percent");
settings.bindBoolean("Draw FPS", false, params);
settings.saveInLocalStorage("dejong_render");




// Generator param globals
var a,b,c,d;
a = Math.random() * 4 - 2;
b = Math.random() * 4 - 2;
c = Math.random() * 4 - 2;
d = Math.random() * 4 - 2;
var shift = 0;
var points = [];
var imageData;
var pixelDataArray;
var minRenderCount = 2;
var maxRenderCount = Math.pow(10, params["Iterations: 10^"]);
var doneRendering = false;
var numPoints = Math.pow(10,params["Points: 10^"]);
var manualClear = false;
var firstTime = true;
var fps, lastTime, delta;
resetDrawing(firstTime = true);
render();

var deJongAttractor = function(x, y, vals) {
  // Peter de Jong attractor
  // http://paulbourke.net/fractals/peterdejong/

  // attractor gives new x, y for old one.
  var x1 = Math.sin(vals[0] * y) - Math.cos(vals[1] * x) + Math.cos(x * y);
  var y1 = Math.sin(vals[2] * x) - Math.cos(vals[3] * y) - Math.cos(x * y);

  return {
    x: x1,
    y: y1
  };
}


//Manual drawing reset, triggered by button
function manualReset(){
  resetDrawing(firstTime = true);
  manualClear = true;
}

//Reset the drawing
function resetDrawing(firstTime = false)
{
  // Disable the render button so that we don't accidentally create multiple workers
  //settings.disableControl("Generate New");
  // Update variables from quicksettings
  //width = (canvas.width = params["Width"]);
  //height = (canvas.height = params["Height"]);
  numPoints = Math.pow(10,params["Points: 10^"]);
  maxRenderCount = Math.pow(10, params["Iterations: 10^"]);
  
  doneRendering = false;
  // Get new random params, points
  // a = Math.random() * 4 - 2;
  // b = Math.random() * 4 - 2;
  // c = Math.random() * 4 - 2;
   d = Math.random() * 4 - 2;
  a += .01;// Math.random()/100.0;
  b += .01; //Math.random()/100.0;
  c += .01; //Math.random()/100.0;
  //d += .01; //Math.random()/100.0; 
  shift += .5; 
  points = [];
  
  // Use a web worker to do the rendering so that we still have responsive interfaces!
  // Build a message object to send

  renderCount = 0;
  if (params["Clean background on render"] || firstTime) {
    width = (canvas.width = params["Width"]);
    height = (canvas.height = params["Height"]);
    var prevFill = context.fillStyle;
    context.fillStyle = params["Background Color"];
    context.fillRect(0,0,width,height);
    context.fillStyle = prevFill;
    imageData = context.getImageData(0, 0, width, height);
    firstTime = false;
    shift = Math.floor(Math.random()*360);
  }
  else {
    imageData = null;
  }

  var messageObj = {
    width: width,
    height: height,
    minRenderCount: minRenderCount,
    maxRenderCount: maxRenderCount,
    imageData: imageData,
    numPoints: numPoints,
    deJongParams: [a, b, c, d],
    shift: shift,
  };
  // Fire in the hole! 
  preRenderWorker.postMessage(messageObj);
}

function render() {
  if (!lastTime) {
    lastTime = performance.now();
  }
  if (doneRendering == true) {
    // If we triggered a manual clear, wipe out the existing render. 
    if (manualClear == true) {
      manualClear = false;
      doneRendering = false;
      resetDrawing();
    }
    else {
      context.putImageData(imageData, 0, 0);
      resetDrawing();
      doneRendering = false;
    }
  }
  settings.setValue("Render Progess", renderPercent);
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

// Receive messages from worker
preRenderWorker.onmessage = function(e){
  var name = e.data[0];
  switch(name) {
    case "renderProgress":
      renderPercent = e.data[1]; // Update prerendering progress bar
      break;
    case "imageData": // We've received imageData! Yay!
      imageData = e.data[1];
      doneRendering = true;
      settings.enableControl("Generate New"); // Allow the user to request a new rendering again
      break;
    default: // Something's messed up
      console.log("Received bork message: " + e);
  }
}

function saveImage()
{
  var img = canvas.toDataURL("image/png");
  var w=window.open('about:blank','image from canvas');
  w.document.write("<img src='"+img+"' alt='from canvas'/>");
}
