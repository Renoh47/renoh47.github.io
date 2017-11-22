// Web worker for pre-rendering peter de jong attractor


onmessage = function(e){
  console.log("Message received from main script.");
  console.log("Starting prerender.");
  params = e.data;
  for (var i = 0; i < params.numPoints; i++) {
    params.points.push({
      x: Math.random()*4 - 2, 
      y: Math.random()*4 - 2,
    });
  }
  imageData = prerender(params.width, params.height, params.minRenderCount, params.maxRenderCount, 
    params.imageData, params.pixelCountArray, params.points, params.deJongParams, params.shift);
  console.log("Posting message back to main.");
  postMessage(["imageData", imageData]);
}

function prerender(width, height, minRenderCount, maxRenderCount, imageData, pixelCountArray, points, deJongParams, shift) {
  for (renderCount = 0; renderCount <= maxRenderCount; renderCount++) {
    var donePercentage = Math.floor((renderCount / maxRenderCount) * 100);
    console.log("Rendering: " + donePercentage);
    //settings.setValue("Render Progess", renderCount);
    postMessage(["renderProgress", donePercentage]);
    var drawX,drawY;
    var p, newPoint;
    for (var i = 0; i < points.length; i++) {
      // get each point and do what we did before with a single point
      p = points[i];
      // Get new point from the attractor
      newPoint = attractorFn(p.x, p.y, deJongParams);
      if (renderCount >= minRenderCount) { //Avoid drawing first random points
        // Convert from algorithm coords to drawing coords
        drawX = Math.floor(p.x * width/4 + width/2);
        drawY = Math.floor(p.y * height/4 + height/2);
        nextDrawX = Math.floor(newPoint.x * width/4 + width/2);
        nextDrawY = Math.floor(newPoint.y * height/4 + height/2);
        deltaX = Math.abs(drawX - nextDrawX);
        deltaY = Math.abs(drawY - nextDrawY);
        index = (drawX + drawY * imageData.width) * 4;

        if (pixelCountArray[index/4] != 1) {
          var rgb,hsl;
          hsl = getHSLColor(Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2))/(width/100) + shift);
          rgb = hslToRgb(hsl.h, hsl.s, hsl.l);
          imageData.data[index + 0] = rgb[0];
          imageData.data[index + 1] = rgb[1];
          imageData.data[index + 2] = rgb[2];
          pixelCountArray[index/4] = 1;
        }
        imageData.data[index + 3] += 1;

      }
      // Update the coords
      p.x = newPoint.x;
      p.y = newPoint.y;
    }
  }
  console.log("Done Rendering.");
  doneRendering = true;
  return imageData;
}

// Maybe these should be pulled out and put in the main file and passed. IDK

function getHSLColorString(val) {
  hue = (val) %360;
  return "hsl(" + hue + ", 50%, 50%)"
}

function getHSLColor(val){
  hue = 1.00 * (val % 360) / 360;
  sat = .75;
  light = .5;
  return {h: hue, s: sat, l: light};
}

function attractorFn(x, y, vals) {
  // Peter de Jong attractor
  // http://paulbourke.net/fractals/peterdejong/

  // attractor gives new x, y for old one.
  var x1 = Math.sin(vals[0] * y) - Math.cos(vals[1] * x);
  var y1 = Math.sin(vals[2] * x) - Math.cos(vals[3] * y);

  return {x: x1, y: y1};
}

//Not sure why, but it couldn't find this function from color-conversion-algorithms.js, even though that is imported first. idk.
/**
 * Converts an HSL color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes h, s, and l are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   Number  h       The hue
 * @param   Number  s       The saturation
 * @param   Number  l       The lightness
 * @return  Array           The RGB representation
 */
function hslToRgb(h, s, l) {
  var r, g, b;

  if (s == 0) {
    r = g = b = l; // achromatic
  } else {
    function hue2rgb(p, q, t) {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    }

    var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    var p = 2 * l - q;

    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return [ r * 255, g * 255, b * 255 ];
}