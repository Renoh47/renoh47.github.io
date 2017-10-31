import java.util.Random;

double timeStep;
double x,y;
double time;
double[] A; //amplitudes
double[] f; //frequencies
double[] d;//damping values
double[] p;//phases
double prevX, prevY;
double printX, printY; //in mm
PrintWriter writer = null;
Boolean emitGCode;
PGraphics gfx;
long iter;
Random rand;

void startGCode(){
  writer = createWriter("composition.gcode");
  writer.println("M92 X80 \n M92 Y80");
  writer.println("G28");
  writer.println("G1 Z5 F5000");
  writer.println("G21 ; set units to millimeters");
  writer.println("G90 ; use absolute coordinates");
}

void stopGCode(){
  writer.println("G1 Z5");
  writer.println("G28 X0");
  writer.println("M84");
  writer.flush();
  writer.close();
}

void setup() {
  rand = new Random();
  emitGCode = false;
  smooth(8);
  background(255);
  size(1024, 1024);
  gfx = createGraphics(width, height);
  iter = 0;
  timeStep = .005;
  time = 0;
  boolean useRandom = false;
  A = new double[]{width/4, width/4, height/4, height/4, width/4, width/4};
  f = new double[]{4, 5, 3.95, 5, 4, 3.95};
  d = new double[]{.001, .001, .001, .001, 0.001, 0.001};
  p = new double[]{0.5, 0, 0, 0.5, 0, 0};
  for (double d : p){
    d *= Math.PI;
  }
  if (useRandom){
    p = new double[]{rand.nextInt(300), rand.nextInt(20), rand.nextInt(300), rand.nextInt(20)};
  }
  
  //GCODE generation stuff
  printX = 95;
  printY = 95;
  if (emitGCode) {
    startGCode();
  }
  stroke(0, 0, 128,64);
}

double pendulum_motion_y(int index){
  return A[index] * Math.sin(f[index] * time + p[index]) * Math.exp(-1 * d[index] * time);
}

double pendulum_motion_x(int index){
  return A[index] * Math.cos(f[index] * time + p[index]) * Math.exp(-1 * d[index] * time);
}

void draw() 
{
  
  x = pendulum_motion_x(0) + pendulum_motion_x(2) + pendulum_motion_x(4) + width/2;
  y = pendulum_motion_y(1) + pendulum_motion_y(3) + pendulum_motion_y(5) + height/2;
  if (time != 0.0)
  
  {
    //if (iter % 1000 == 0){
    //  System.out.println("drawing buffer to screen");
    //  gfx.endDraw();
    //  image(gfx, 0, 0); 
    //  gfx.beginDraw();
    //}
    //ellipse((float)x, (float)y, 4*rand.nextFloat(), 4*rand.nextFloat());
    line((float)x, (float)y, (float)prevX, (float)prevY);
    //sandLine(x,y,prevX,prevY);
    if (emitGCode){
      writer.println("G1 X" + (x/width) * printX + " Y" + (y/height) * printY);
    }
    
  }
  else{
    gfx.beginDraw();
    if (emitGCode){
      writer.println("G1 X" + (x/width) * printX + " Y" + (y/height) * printY);
      writer.println("G1 Z0.010 F2000");
    }
  }
  time += timeStep;
  //iter++;
  prevX = x;
  prevY = y;
}

double addRandomness(double x, double range)
{
  return x + rand.nextDouble() * range * 2 - range;
}


void sandLine(double x1, double y1, double x2, double y2)
{
  for (int num = 0; num < 5; num++)
  {
    double x1_m = addRandomness(x1, 2.0);
    double x2_m = addRandomness(x2, 2.0);
    double y1_m = addRandomness(y1, 2.0);
    double y2_m = addRandomness(y2, 2.0);
    int red = 79 + rand.nextInt(50) - 25;
    int green = 151 + rand.nextInt(50) - 25;
    int blue = 79 + rand.nextInt(50) - 25;
    // Generate random points along the line, with different alpha to simulate sand drawing
    float deltaX = (float)(x1_m - x2_m);
    float deltaY = (float)(y1_m - y2_m);
    // We need to determine how many points to put down - this depends on the length of the line
    int dist = floor(dist((float)x1_m, (float)y1_m, (float)x2_m, (float)y2_m));
    // Seems reasonable to have about 1 grain per pixel.
  
    for (int i = 0; i < 20; i++)
    {
      float x0 = (float)(deltaX * rand.nextFloat() + x1_m);
      float y0 = (float)(deltaY/deltaX * (x0 - x1_m) + y1_m);
      stroke(red, green, blue, 25);
      point((float)x0, (float)y0);
    }
  }
  
}

void mouseClicked() {
  if (!emitGCode) {
      startGCode();
      
      emitGCode = true;
    }
    else {
      stopGCode();
      save("harmonograph" + A[0] + f[0] + time +".png");
      noLoop();
      exit();
    }
}