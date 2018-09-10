
let SimWorld = null;
(function() {
  let canvasX =document.getElementById("SIM_CANVAS");
  console.log(canvasX);
  SimWorld = new NNWorld(canvasX);
})()

function NormalSpeed(){
  SimWorld.skipF = 1;
}
function SpeedDown(){
  SimWorld.skipF /=4;
  if(SimWorld.skipF<1)SimWorld.skipF=1;
}
function SpeedUp(){
  SimWorld.skipF *= 4;
}
function printINFO(){
  SimWorld.printINFO();
}
