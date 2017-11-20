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
  alert("Your browser does not support Web Workers, the GUI may freeze while rendering.")
}

//QuickSettings stuff!
var params = {};
params["Points: 10^"] = 2;
params["Iterations: 10^"] = 2;
params["Draw FPS"] = false;
params["Draw Lines"] = false;
params["Show debug info"] = false;
params["Width"] = width;
params["Height"] = height;

var settings = QuickSettings.create();
settings.bindNumber("Width", 0, 10000, Math.floor(width), 1, params);
settings.bindNumber("Height", 0, 10000, Math.floor(height), 1, params);
settings.bindRange("Points: 10^", 0, 6, 2, 1, params);
settings.bindRange("Iterations: 10^", 0, 6, 2, 1, params);
settings.addButton("Save Image", saveImage);
settings.addButton("Generate New", resetDrawing);
settings.addProgressBar("Render Progess", 100, renderPercent, "percent");
settings.bindBoolean("Draw FPS", false, params);
settings.saveInLocalStorage("dejong_render");




// Generator param globals
var a,b,c,d;
var points = [];
var imageData;
var pixelCountArray;
var minRenderCount = 1;
var maxRenderCount = Math.pow(10, params["Iterations: 10^"]);
var doneRendering = false;
var numPoints = Math.pow(10,params["Points: 10^"]);

var fps, lastTime, delta;
resetDrawing();
render();

//Reset the drawing
function resetDrawing()
{
  //apply new settings
  width = (canvas.width = params["Width"]);
  height = (canvas.height = params["Height"]);
  numPoints = Math.pow(10,params["Points: 10^"]);
  shift = Math.floor(Math.random()*360);
  renderCount = 0;
  var prevFill = context.fillStyle;
  context.fillStyle = "#FFFFFF";
  context.fillRect(0,0,width,height);
  context.fillStyle = prevFill;
  doneRendering = false;
  // Get new random params, points
  a = Math.random() * 4 - 2;
  b = Math.random() * 4 - 2;
  c = Math.random() * 4 - 2;
  d = Math.random() * 4 - 2;
  points = [];
  imageData = context.getImageData(0, 0, width, height);
  imageData.data.fill(0);
  pixelCountArray = Array(width*height).fill(0);

  // Use a web worker to do the rendering so that we still have responsive interfaces!
  // Build a message object to send
  var messageObj = {
    width: width,
    height: height,
    minRenderCount: minRenderCount,
    maxRenderCount: maxRenderCount,
    imageData: imageData,
    pixelCountArray: pixelCountArray,
    points: points,
    numPoints: numPoints,
    deJongParams: [a, b, c, d],
    shift: shift
  };
  // Fire in the hole!
  preRenderWorker.postMessage(messageObj);
}

function render() {
  if (!lastTime) {
    lastTime = performance.now();
  }
  if (doneRendering == true) {
    context.putImageData(imageData, 0, 0);
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

preRenderWorker.onmessage = function(e){
  var name = e.data[0];
  switch(name) {
    case "renderProgress":
      renderPercent = e.data[1]; // Update prerendering progress
      break;
    case "imageData": // We've received imageData! Yay!
      imageData = e.data[1];
      doneRendering = true;      
      break;
    default:
      console.log("Received bork message: " + e);
  }
}

function saveImage()
{
  var img = canvas.toDataURL("image/png");
  var w=window.open('about:blank','image from canvas');
  w.document.write("<img src='"+img+"' alt='from canvas'/>");
}