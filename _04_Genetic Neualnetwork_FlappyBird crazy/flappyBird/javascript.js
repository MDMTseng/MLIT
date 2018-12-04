function Bird(){
  this.y = height / 2
  this.x = 64
  this.gravity = 1
  this.lift = -10
  this.velocity = 0
  
  this.brain = {x:CreateNeuralNet([6*3,10,2]),y:0};
  this.show = function(){
    fill(255)
    ellipse(this.x, this.y, 32, 32 )
  }
  
  this.goUp = function(){
    this.velocity += this.lift
  }
  
  this.hitBound=false;
  this.update = function(timeScale = 1){
    this.hitBound=false;
    this.velocity += this.gravity*timeScale
    this.velocity *= Math.pow(0.9,timeScale)
    this.y += this.velocity*timeScale
    
    if (this.y > height) {
      this.y = height
      this.velocity = 0
      this.hitBound=true;
    }
    
    if (this.y < 0) {
      this.y = 0
      this.velocity = 0
      this.hitBound=true;
    }
    
  }
  
  this.neuralInput=null;
  this.histInfo=[0,0,0,0,0,0]
  this.histInfo2=[0,0,0,0,0,0]
  this.checkObstacle = function(obstacles){
    let minDist = 100000000;
    let minOpos = {};
    let min2ndDist = 100000000;
    let min2ndOpos = {};
    let hit =false;
    obstacles.forEach((obstacle)=>{
      let opos = obstacle.holePosition();
      let dist = Math.hypot(opos.x - this.x ,opos.y - this.y );
      
      if(minDist>dist)
      {
        minOpos = opos;
        minDist = dist;

      }
      else
      {
        if(min2ndDist>dist)
        {
          min2ndOpos = opos;
          min2ndDist = dist;
  
        }
      }

      if(obstacle.hits(this))
      {
        hit =  true;
      }
    });
    let cur_info = [
      this.y,
      minDist,
      minOpos.x - this.x ,
      minOpos.y - this.y,
      min2ndOpos.x - this.x ,
      min2ndOpos.y - this.y,
    ];
    this.neuralInput=cur_info.map((x)=>x).concat(this.histInfo).concat(this.histInfo2);

    this.histInfo2 = this.histInfo;
    this.histInfo = cur_info;
    //console.log(this.y,minDist);
    return hit;
  }
  this.decision = function(){
    let output = NeuralNetForwardPass(this.neuralInput,this.brain.x);
    if(output[0]>output[1])
    {
      this.goUp();
    }
  }


}

function Obstacle(){
    this.x = width
    this.w = 50
    this.topMin = 50
    this.botMin = height - 100
    this.gapStart = random(this.topMin, this.botMin)
    this.gapLength = 120
    this.speed = 6
    
    this.loopT = random(0, 100000)
    
    
    this.show = function(){
        fill(0)
        if (this.highlight){
            fill('#FF0863')
        }        
        rect(this.x, 0, this.w, this.gapStart)
        rect(this.x, this.gapStart + this.gapLength, this.w, height)
    }
    this.update = function(timeScale =1){
      let speed = this.speed+3*Math.sin(this.loopT/10);
        this.x -= speed *timeScale       
        this.loopT+=1;
    }
    this.offscreen = function(){
        return this.x < -this.w
    }
    
    this.holePosition = function(){
      return {x:this.x + this.w/2,y: this.gapStart + this.gapLength/2};
    }  
    this.hits = function(bird){
        if (bird.y < this.gapStart || bird.y > this.gapStart + this.gapLength) {
            if (bird.x > this.x && bird.x < this.x + this.w) {
                this.highlight = true
                return true
            }
        } 
        this.highlight = false
        return false
    }    
}

function arrayShallowClone(array)
{
  let arr_out = [];
  for(let i=0;i<array.length;i++)
  {
    arr_out.push(array[i]);
  }
  return arr_out;
}

var obstacles = []
var birds=[]
var birdsInGame=[]
var pipesCleared
var bestScore
var preScore
var playQuality

var generation = 0 ;
function setup(){
  var canvas = createCanvas(800, 400)
  canvas.parent('jumbo-canvas')
  pipesCleared = 0
  generation = 0 
  bestScore = 0
  preScore = 0
  obstacles.push(new Obstacle())

  for(let i=0;i<100;i++)
  {
    let bird =new Bird();
    //bird.gravity=Math.random()*0.5+0.1;
    birds.push(bird);
  }
  birdsInGame =arrayShallowClone(birds);
}
let gameFrameCount=0;

function gameUpdate(timeScale=1)
{
  birdsInGame.forEach((bird)=>{
    bird.update(timeScale)
  });
  // background('#FF0000')
  
  if (gameFrameCount % 40 == 0) {
      obstacles.push(new Obstacle())
  }  
  
  for (var i = obstacles.length - 1; i >= 0; i--){
      obstacles[i].update(timeScale)
      
      if (obstacles[i].offscreen()){
          obstacles.splice(i, 1)
          pipesCleared++;
      }     
  }
  
  for (let i = birdsInGame.length - 1; i >= 0; i--){
    let bird = birdsInGame[i];
    if (bird.checkObstacle(obstacles)){
      
      //console.log("remove :"+i);
      //obstaclesHit++
      bird.brain.y=gameFrameCount;
      if(bird.hitBound)
      {

        bird.brain.y-=100;
      }
      else
      {
        bird.brain.y-=bird.neuralInput[1]/10;
      }
      
      birdsInGame.splice(i,1);
      continue;
    }
    bird.decision();
    
  }

  if(birdsInGame.length == 0)//Game over
  {
    birdsInGame =arrayShallowClone(birds);

    EVOLVE_NEURAL( birdsInGame.map((bird)=>bird.brain) , true);
    console.log(birdsInGame.map(
      (bird)=>bird.brain.y
    ));

    obstacles=[];
    gameFrameCount=0;
    if(bestScore<pipesCleared)
    {
      bestScore = pipesCleared;
    }
    preScore = pipesCleared;
    pipesCleared=0;
    generation++;
  }
  gameFrameCount++;
}

let gameSpeed=1

function draw(){
  clear()
  fill(0, 0, 255)
  textSize(20)
  textFont("Helvetica")
  text('Birds alive: ' + birdsInGame.length, 20, 20)
  text('pipesCleared: ' + pipesCleared, 20, 40)
  text('generation: ' + generation, 20, 60)
  text('bestScore: ' +bestScore+ " pre:"+preScore, 20, 80)
  
  birdsInGame.forEach((bird)=>{
    bird.show()
  });
  for (var i = obstacles.length - 1; i >= 0; i--){
      obstacles[i].show()
  }
  for(let i=0;i<gameSpeed;i++)
    gameUpdate();
}

function HightSpeed()
{
  gameSpeed+=40;
}

function NormalSpeed()
{
  gameSpeed=1;
}

function keyPressed(){
  if (key === " ") {
    birds.forEach((bird)=>{
      
      bird.goUp() 
    });
  }
}
