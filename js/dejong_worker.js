// Web worker for pre-rendering peter de jong attractor
var pixelDataArray;
var bufferPx = 10;
var imageData;

onmessage = function(e) {
  console.log("Message received from main script.");
  console.log("Starting prerender.");
  params = e.data;
  var points = [];
  for (var i = 0; i < params.numPoints; i++) {
    points.push({
      x: Math.random() * 4 - 2,
      y: Math.random() * 4 - 2,
      life: 10 // Used to keep track of stuck points. We want to stop iterating the point if it gets stuck
    });
  }
  if (params.imageData != null){
    imageData = params.imageData;
  }
  if (!pixelDataArray || pixelDataArray.length != params.width * params.height * 4) {
    pixelDataArray = Array(params.width * params.height * 4).fill(0);
  }
  else {
    pixelDataArray.fill(0);
  }
  var newImageData = prerender(params.width, params.height, params.minRenderCount, params.maxRenderCount, pixelDataArray, points, params.deJongParams, params.shift);
  console.log("Posting message back to main.");
  postMessage(["imageData", newImageData]);
}

function attractorFn(x, y, vals) {
  // Peter de Jong attractor
  // http://paulbourke.net/fractals/peterdejong/

  // attractor gives new x, y for old one.
  var x1 = Math.sin(vals[0] * y) - Math.cos(vals[1] * x);// + Math.cos(x * y);
  var y1 = Math.sin(vals[2] * x) - Math.cos(vals[3] * y);// - Math.cos(x * y);

  return {
    x: x1,
    y: y1
  };
}

function henonPhaseAttractor(x, y, vals) {
  // Henon phase attractor
  // http://paulbourke.net/fractals/henonphase/
  var x1 = x * Math.cos(vals[0]) - (y - Math.pow(x, 2)) * Math.sin(vals[0]);
  var y1 = x * Math.sin(vals[0]) + (y - Math.pow(x, 2)) * Math.cos(vals[0]);

  return {
    x: x1,
    y: y1
  };
}

function prerender(width, height, minRenderCount, maxRenderCount, pixelDataArray, points, deJongParams, shift) {
  var lastPercentage = 0;
  var scaleX = (width/4 - bufferPx);
  var centerX = width/2;
  var scaleY = (height/4 - bufferPx);
  var centerY = height/2;
  var theta = Math.PI / 4.0;
  var cosTheta = Math.cos(theta);
  var sinTheta = Math.sin(theta);
  for (renderCount = 0; renderCount <= maxRenderCount; renderCount++) {
    var donePercentage = Math.floor((renderCount / maxRenderCount) * 100);
    // We don't want to spam the same percentage message, so only update when the percentage changes.
    if (donePercentage > lastPercentage) {
      //console.log("Rendering: " + donePercentage);
      //settings.setValue("Render Progess", renderCount);
      postMessage(["renderProgress", donePercentage]);
      lastPercentage = donePercentage;
    }
    var activePoints = false; // Are we still rendering any points? 
    var drawX, drawY;
    var rotX, rotY;
    var p, newPoint;
    var pointsLength = points.length // This isn't changing, so cache it to avoid accessing every time
    for (var i = 0; i < pointsLength; i++) {
      // get each point and do what we did before with a single point
      p = points[i];
      if (p.life <= 0) {
        // We don't want to iterate on this point because it's most likely stuck. 
        continue;
      } else {
        // If this is false after this for loop exits, we never touched any pixels. Stop rendering.
        activePoints = true;
      }
      // Get new point from the attractor
      newPoint = attractorFn(p.x, p.y, deJongParams);
      if (renderCount >= minRenderCount) { //Avoid drawing first random points
        // Convert from algorithm coords to drawing coords
        rotX = p.x * cosTheta - p.y * sinTheta;
        rotY = p.x * sinTheta + p.y * cosTheta;
        drawX = Math.floor(p.x * scaleX + centerX);
        drawY = Math.floor(p.y * scaleY + centerY);

        nextDrawX = Math.floor(newPoint.x * scaleX + centerX);
        nextDrawY = Math.floor(newPoint.y * scaleY + centerY);

        deltaX = Math.abs(drawX - nextDrawX);
        deltaY = Math.abs(drawY - nextDrawY);
        index = (drawX + drawY * imageData.width) * 4;
        // If we haven't set a color at this location, set it.  
        if (pixelDataArray[index + 3] == 0) {
          var rgb, hsl;
          hsl = getHSLColor(Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2)) / (width / 100) + shift);
          rgb = hslToRgb(hsl.h, hsl.s, hsl.l);
          pixelDataArray[index + 0] = rgb[0];
          pixelDataArray[index + 1] = rgb[1];
          pixelDataArray[index + 2] = rgb[2];
          pixelDataArray[index + 3] = 1;
        }
        if (pixelDataArray[index + 3] >= 128) {
          p.life -= 1; // If we hit a maxed out pixel, decrease the point's life
        } else {
          pixelDataArray[index + 3] += .5; //Increase seen count
        }
      }
      // Update the coords
      p.x = newPoint.x;
      p.y = newPoint.y;
    }
    if (activePoints == false) {
      // We didn't touch any points, they are all stuck. We're done rendering.
      postMessage(["renderProgress", 100]);
      break;
    }
  }

  var newImageData = convertDataToImage(pixelDataArray, imageData);
  console.log("Done Rendering.");
  return newImageData;
}

function convertDataToImage(pixelDataArray, imageData) {
  var newImageData = imageData;
  // var maxCount = 0;
  // console.log("Attempting to find largest alpha value");
  // for (var i = 3; i < pixelDataArray.length; i += 4) {
  //   if (pixelDataArray[i] > maxCount)
  //   {
  //     maxCount = pixelDataArray[i];
  //   }
  // }
  // console.log("Max count: " + maxCount);
  // //logarithmic scaling of alpha values
  // // output: alpha = a exp (bx)
  // //b = log (y1/y2) / (x1-x2)
  // //a = y1 / exp bx1
  // // x2,y2 = (1,1), x1,y1 = (maxCount, 255)
  // var b = Math.log(255/1) / (maxCount - 1);
  // var a = 255 / (Math.exp(b*maxCount));
  for (var index = 0; index < pixelDataArray.length; index += 4) {
    if (pixelDataArray[index + 3] > 0) { //there's data here! Let's composite the pixel with the background
      alpha = Math.min(255, pixelDataArray[index + 3]); //a * Math.exp(b * pixelDataArray[index + 3]); // // Map linear to log scale 
      var src = [pixelDataArray[index], pixelDataArray[index + 1], pixelDataArray[index + 2], alpha];
      var dst = [newImageData.data[index], newImageData.data[index + 1], newImageData.data[index + 2], newImageData.data[index + 3]];
      // Get blended color
      var blend = alphaBlend(src, dst);
      // Then set the newImageData with the new blended color. 
      newImageData.data[index + 0] = blend[0]; //r
      newImageData.data[index + 1] = blend[1]; //b
      newImageData.data[index + 2] = blend[2]; //g
      newImageData.data[index + 3] = blend[3]; //a
    }
  }
  return newImageData;
}

function alphaBlend(src, dst) {
  colorIntToFloat(src);
  colorIntToFloat(dst);
  var out = [0, 0, 0, 0]; //r,g,b,a
  out[3] = 1.0;
  out[0] = src[0] * src[3] + dst[0] * (1 - src[3]);
  out[1] = src[1] * src[3] + dst[1] * (1 - src[3]);
  out[2] = src[2] * src[3] + dst[2] * (1 - src[3]);
  colorFloatToInt(out);
  return out;
}

// Maps 0-255 to 0-1 (float)
function colorIntToFloat(color) {
  for (var index = 0; index < color.length; index++) {
    color[index] /= 255.0;
  }
}

function colorFloatToInt(color) {
  for (var index = 0; index < color.length; index++) {
    color[index] = Math.floor(color[index] * 255);
  }
}

// Maybe these should be pulled out and put in the main file and passed. IDK

function getHSLColorString(val) {
  hue = (val) % 360;
  return "hsl(" + hue + ", 50%, 50%)"
}

function getHSLColor(val) {
  hue = 1.00 * (val % 360) / 360;
  sat = .75;
  light = .5;
  return {
    h: hue,
    s: sat,
    l: light
  };
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
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    }

    var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    var p = 2 * l - q;

    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [r * 255, g * 255, b * 255];
}