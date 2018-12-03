function Bird(){
  this.y = height / 2
  this.x = 64
  this.gravity = 0.6
  this.lift = -16
  this.velocity = 0
  
  this.brain = {x:CreateNeuralNet([2,6,6,2]),y:0};
  this.show = function(){
    fill(255)
    ellipse(this.x, this.y, 32, 32 )
  }
  
  this.goUp = function(){
    this.velocity += this.lift
    console.log(this.velocity)
  }
  
  this.update = function(){
    this.velocity += this.gravity
    this.velocity *= 0.9
    this.y += this.velocity
    
    if (this.y > height) {
      this.y = height
      this.velocity = 0
    }
    
    if (this.y < 0) {
      this.y = 0
      this.velocity = 0
    }
    
  }
  
  this.neuralInput=null;
  this.checkObstacle = function(obstacles){
    let minDist = 100000000;
    let hit =false;
    obstacles.forEach((obstacle)=>{
      let opos = obstacle.holePosition();
      let dist = Math.hypot(opos.x - this.x ,opos.y - this.y );
      
      if(minDist>dist)minDist = dist;
      if(obstacle.hits(this))
      {
        hit =  true;
      }
    });
    this.neuralInput = [this.y,minDist];
    //console.log(this.y,minDist);
    return hit;
  }
  this.decision = function(){
    
    return hit;
  }


}

function Obstacle(){
    this.x = width
    this.w = 30
    this.topMin = 50
    this.botMin = height - 50
    this.gapStart = random(this.topMin, this.botMin)
    this.gapLength = 70
    this.speed = 3
    
    
    this.show = function(){
        fill(0)
        if (this.highlight){
            fill('#FF0863')
        }        
        rect(this.x, 0, this.w, this.gapStart)
        rect(this.x, this.gapStart + this.gapLength, this.w, height)
    }
    this.update = function(){
        this.x -= this.speed        
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

var obstacles = []
var birds=[]
var pipesCleared
var obstaclesHit
var playQuality

function setup(){
  var canvas = createCanvas(800, 400)
  canvas.parent('jumbo-canvas')
  pipesCleared = 0
  obstaclesHit = 0
  playQuality = 10
  obstacles.push(new Obstacle())

  for(let i=0;i<10;i++)
  {
    let bird =new Bird();
    //bird.gravity=Math.random()*0.5+0.1;
    birds.push(bird);
  }
}

function draw(){
  clear()
  fill(0, 0, 255)
  textSize(20)
  textFont("Helvetica")
  text('Obstacles Cleared: ' + pipesCleared, 20, 20)
  text('Obstacle Damage: ' + obstaclesHit, 20, 40)
  text('Play Quality: ' + String(1 + (pipesCleared / obstaclesHit) || 4).substring(0, 4) + '/5', 20, 60)
  birds.forEach((bird)=>{
    bird.show()
    bird.update()
  });
  // background('#FF0000')
  
  if (frameCount % 50 == 0) {
      obstacles.push(new Obstacle())
  }  
  
  for (var i = obstacles.length - 1; i >= 0; i--){
      obstacles[i].show()
      obstacles[i].update()
      

      if (obstacles[i].offscreen()){
          obstacles.splice(i, 1)
          pipesCleared++   
      }     
  }


  
  birds.forEach((bird)=>{
    if (bird.checkObstacle(obstacles)){
      obstaclesHit++
    }
    //console.log("...");
  });
}

function keyPressed(){
  if (key === " ") {
    birds.forEach((bird)=>{
      
      bird.goUp() 
    });
  }
}
