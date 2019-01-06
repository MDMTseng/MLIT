
var Engine = Matter.Engine,
Render = Matter.Render,
Composites = Matter.Composites,
Composite = Matter.Composite,
Mouse = Matter.Mouse,
World = Matter.World,
Constraint = Matter.Constraint,
Bodies = Matter.Bodies,
Body = Matter.Body;


// create engine
var engine = Engine.create(), world = engine.world;

let worldSize={width:800,height:400};
// create renderer
var render = Render.create({
  element: document.getElementById('canvas-container'),
  engine: engine,
  options: {
    width: worldSize.width,
    height: worldSize.height,
    wireframes: false
  }
});

Engine.run(engine);

Render.run(render);

var boxes = Composites.stack(500, 80, 3, 1, 10, 0, function(x, y) {
        return Bodies.rectangle(x, y, 10, 10);
    });

var chain = Composites.chain(boxes, 0.5, 0, -0.5, 0, { stiffness: 0.1});

Composite.add(boxes, Constraint.create({ 
        bodyA: boxes.bodies[0],
        pointB: { x: 500, y: 15 },
        stiffness: 0.8
    }));

let BOX2 = Bodies.rectangle(130, 41, 110, 10);


var defaultCategory = 0x0001,
bodyCategory = 0x0002,
tentacleCategory = 0x0004;

let showWallPix=40;
var ground = Matter.Bodies.rectangle(render.canvas.width/2, render.canvas.height, render.canvas.width, showWallPix, { isStatic: true });
var ceiling = Matter.Bodies.rectangle(render.canvas.width/2,           0, render.canvas.width, showWallPix, { isStatic: true });
var lwall = Matter.Bodies.rectangle(0, render.canvas.height/2, showWallPix, render.canvas.height, { isStatic: true });
var rwall = Matter.Bodies.rectangle(render.canvas.width, render.canvas.height/2, showWallPix, render.canvas.height, { isStatic: true });



World.add(world, [ground,ceiling,lwall,rwall]);

function randInt(MaxNum)
{
  return Math.floor((MaxNum+1)*Math.random());
}
function rand(range)
{
  return Math.random()*(range*2)-range;
}

let blocks = new Array(20).fill(0).map(()=>
  Bodies.rectangle(Math.random()*render.canvas.width, Math.random()*render.canvas.height, 20,20, { isStatic: true }));
World.add(world, blocks);





function NNCreature(world)//body is the pysical(matter.js engine) body in env
{
  function generate_net(in_dim,out_dim)
  {
    var layer_defs = [];
    // minimal network: a simple binary SVM classifer in 2-dimensional space
    layer_defs.push({type:'input', out_sx:1, out_sy:1, out_depth:in_dim});
    layer_defs.push({type:'fc', num_neurons:30, activation:'relu'});
    layer_defs.push({type:'fc', num_neurons:10, activation:'relu'});
    layer_defs.push({type:'fc', num_neurons:30, activation:'relu'});
    layer_defs.push({type:'regression', num_neurons:out_dim});

    // create a net
    var net = new convnetjs.Net();
    console.log(net);
    net.makeLayers(layer_defs);

    var trainer = new convnetjs.Trainer(net, {method: 'adadelta', learning_rate: 0.04,
                                        l2_decay: 0.002, momentum: 0.0, batch_size: 10,
                                        l1_decay: 0.002});

    return {net:net,trainer:trainer};
  }
  let gridScale=40;
  let viewGridXY = 20;
  this.view = new Array(viewGridXY*viewGridXY).fill(0);//the 20x20 view window of the world
  let tentacleCount = 2;
  let tentacleGridXY = 10;
  
  this.targetLocation={x:500,y:300};
  this.body={
    body:undefined,
    tentacles:new Array(tentacleCount).fill(undefined)
  };

  {
    this.body.body=Bodies.rectangle(0,0, 50, 50,
      {
        frictionAir: 0.2,
        collisionFilter: {
          mask: defaultCategory | bodyCategory
        }
      });
    console.log(this.body.tentacles);
    this.body.tentacles = this.body.tentacles.map(()=>Bodies.rectangle(0,0, 10, 10),
    {
      frictionAir: 0.9,
      collisionFilter: {
        mask: defaultCategory | tentacleCategory
      }
    });

    console.log(this.body.tentacles);
    World.add(world, this.body.tentacles);
    World.add(world, [this.body.body]);
  }
  console.log(this.body);

  this.tentaclesState = new Array(3*tentacleCount).fill(0);//x,y,touchstate X {tentacleCount} tentacles in real world

  this.localMotion = new Array(4).fill(0);// speed xy and target xy

  this.in_dim=this.localMotion.length + this.view.length + this.tentaclesState.length;

  let tentaclePlanSize = (2+tentacleGridXY*tentacleGridXY);
  this.tentaclesPlanState = new Array(tentaclePlanSize*tentacleCount).fill(0);
  let pushForceScale=0.01;
  //grapstate(grap/release),push/pull,(targetXY(10*10) grid) X {tentacleCount} tentacles in mind
  this.out_dim=this.tentaclesPlanState.length;//For acceleration, turn,


  this.core =generate_net(this.in_dim,this.out_dim);
  

  this.reset=(initLocation)=>{
    console.log(initLocation);
    
    Matter.Body.setPosition(this.body.body,initLocation);
    
    Matter.Body.setVelocity(this.body.body, {x:0,y:0});
    Matter.Body.setAngularVelocity(this.body.body,0);

    
    this.body.tentacles.forEach((tentacle)=>{
      
      Matter.Body.setPosition(tentacle,{x:initLocation.x+rand(50),y:initLocation.y+rand(50)});
    
      Matter.Body.setVelocity(tentacle, {x:0,y:0});
      Matter.Body.setAngularVelocity(tentacle,0);

    });
  }

  this.inputTranslate=(convNetFormat,intput)=>{
    let offset = 0;
    for(var i=0;i<intput.localMotion.length;i++) {
       convNetFormat.w[offset+i] = intput.localMotion[i];
    }
    offset +=intput.localMotion.length;
    for(var i=0;i<intput.view.length;i++) {
       convNetFormat.w[offset+i] = intput.view[i];
    }
    offset +=intput.view.length;
    for(var i=0;i<intput.tentaclesState.length;i++) {
       convNetFormat.w[offset+i] = intput.tentaclesState[i];
    }

  }

  this.outputTranslate=(output,convNetFormat)=>{
    let offset = 0;
    for(var i=0;i<output.tentaclesPlanState.length;i++) {
      output.tentaclesPlanState[i] = convNetFormat.w[offset+i];
    }
  }


  this.tmp_in_buff = new convnetjs.Vol(1,1,this.in_dim,0.0);
  this.pre_action=undefined;
  this.interact=()=>{

    this.inputTranslate(this.tmp_in_buff,this);
    let retOutput = this.core.net.forward(this.tmp_in_buff);
    this.outputTranslate(this,retOutput);
    //console.log(retOutput);
    //console.log(this.pre_action);
    this.pre_action={taction:new Array(tentacleCount).fill({})};
    for(let i=0;this.tentacleStateAction(i)!=undefined;i++);
  }

  this.tentacleStateAction=(t_id)=>{
    
    if(t_id<0||t_id>=tentacleCount)return undefined;
    
    let offset = tentaclePlanSize*t_id;

    let tentacle = this.body.tentacles[t_id];
    let action_obj= this.pre_action.taction[t_id];
    let offset_t_input = 3*t_id;

    
    if(this.tentaclesState[offset_t_input+2]>0)//sense Touch to a block
    {
      //this.tentaclesPlanState[offset + 0]  grapstate(grap/release)
      //this.tentaclesPlanState[offset + 1]  push/pull

      
      action_obj.grip = this.tentaclesPlanState[offset + 0];
      if(this.tentaclesPlanState[offset + 0]>0)//Grip the block
      {
        console.log("grip...");
        let push_pull =this.tentaclesPlanState[offset + 1];
        
        action_obj.push_pull = push_pull;
        push_pull=push_pull>0?1:-1;
        push_pull*=pushForceScale;
        let body=this.body.body;
        let vec = {x:tentacle.position.x - body.position.x,y:tentacle.position.y - body.position.y};
        let mag = Math.hypot(vec.x,vec.y);
        vec.x/=mag;
        vec.y/=mag;
        Body.applyForce( body, {x: body.position.x, y: body.position.y}, 
          {x:-push_pull* vec.x, 
          y:-push_pull* vec.y});

        

        console.log(mag,tentacleGridXY*gridScale);
        if(mag<tentacleGridXY*gridScale)
        {
          Matter.Body.setVelocity(tentacle, {x:0,y:0});
          Matter.Body.setAngularVelocity(tentacle,0);
  
          return true;
        }
      }


    }



    offset+=2;
    let arrayPiece = this.tentaclesPlanState.slice(offset,offset+tentacleGridXY*tentacleGridXY);




    let maxIdInfo = arrayPiece.reduce((maxInfo,ele,id)=>
      (maxInfo.max<ele)?{id:id,max:ele}:maxInfo,{id:-1,max:-Number.MAX_VALUE});
      
    action_obj.planLocation = maxIdInfo;
    let t_plan_target = {x:(maxIdInfo.id%tentacleGridXY)-tentacleGridXY/2,y:Math.floor(maxIdInfo.id/tentacleGridXY)-tentacleGridXY/2};
    t_plan_target.x*=gridScale;
    t_plan_target.y*=gridScale;
    
    //console.log(offset, this.tentaclesPlanState.length,maxIdInfo,t_plan_target);
    t_plan_target.x+=this.body.body.position.x;
    t_plan_target.y+=this.body.body.position.y;
    offset+=tentacleGridXY*tentacleGridXY;

    let maxForce = 0.00001;
    let diff={x:t_plan_target.x-tentacle.position.x,y:t_plan_target.y-tentacle.position.y};
    //console.log(diff);
    diff.x/=100;
    diff.y/=100;
    if(diff.x>1)diff.x=1;
    if(diff.x<-1)diff.x=-1;
    if(diff.y>1)diff.y=1;
    if(diff.y<-1)diff.y=-1;


    var gravity = engine.world.gravity;
    Body.applyForce( tentacle, {x: tentacle.position.x, y: tentacle.position.y}, 
      {x: diff.x*maxForce-( gravity.x * gravity.scale * tentacle.mass), 
       y: diff.y*maxForce-( gravity.y * gravity.scale * tentacle.mass)});

    
    return true;
  };

  this.pre_S=undefined;
  this.pre_reward=0;
  this.update=()=>{
    let pre_action = this.pre_action;
    let pre_S = this.pre_S;
    let pre_reward = this.reward;
    this.updateInput();

    this.interact();
    let S = [];
    this.tmp_in_buff.w.forEach(x=>{S.push(x)});//Copy input of the network (S)
    let targetVec = {x:this.targetLocation.x-this.body.body.position.x,y:this.targetLocation.y-this.body.body.position.y};
    let targetVec_mag = Math.hypot(targetVec.x,targetVec.y);
    
    let innerP = 
      this.body.body.velocity.x*targetVec.x+
      this.body.body.velocity.y*targetVec.y;
      innerP/=targetVec_mag;
    let reward = innerP*10;
    if(reward>1)reward=1;
    if(reward<-1)reward=-1;

    let experience={
      S:pre_S,
      A:pre_action,
      S_next:S,
      reward:pre_reward
    }
    //console.log(JSON.stringify(experience));
    this.pre_S = S;
  }

  this.updateInput=()=>{
    for(let i=0;i<viewGridXY*viewGridXY;i++)
    {
      this.view[i]=0;//reset
    }
    blocks.forEach(block=>{
      let rel_pos = {x:block.position.x - this.body.body.position.x,y:block.position.y - this.body.body.position.y};
      let rel_pos_grid={x:Math.round(rel_pos.x/gridScale),y:Math.round(rel_pos.y/gridScale)}


      if(Math.abs(rel_pos_grid.x)<viewGridXY/2 && 
         Math.abs(rel_pos_grid.y)<viewGridXY/2)
      {
        rel_pos_grid.x+=viewGridXY/2;
        rel_pos_grid.y+=viewGridXY/2;
        let id = rel_pos_grid.y*viewGridXY + rel_pos_grid.x;
        this.view[id]=1;
      }


    });

    for(let i=0;i<tentacleCount;i++)
    {
      let offset = 3*i;
      let tentacle = this.body.tentacles[i];
      this.tentaclesState[offset+0]=tentacle.position.x;
      this.tentaclesState[offset+1]=tentacle.position.y;

      let touch=0;
      blocks.forEach(block=>{
        var collision = Matter.SAT.collides(tentacle, block);

        if (collision.collided) {
          let tmp_touch=1+collision.depth;
          if(touch<tmp_touch)touch=tmp_touch; 
        }
      });
      this.tentaclesState[offset+2]=touch;
    }

    this.localMotion[0] = this.body.body.velocity.x;
    this.localMotion[1] = this.body.body.velocity.y;
    this.localMotion[2] = this.targetLocation.x - this.body.body.position.x;
    this.localMotion[3] = this.targetLocation.y - this.body.body.position.y;

    //console.log(this.localMotion);

  }
}




function convJS()
{
  let creature = new NNCreature(world);
  creature.reset({x:400,y:200});
  console.log(creature);
  return creature;
}

function update(){
  // forward prop the data
  
  var netx = new convnetjs.Vol(1,1,1);
  avloss = 0.0;

  for(var iters=0;iters<50;iters++) {
    for(var ix=0;ix<N;ix++) {
      netx.w = data[ix];
      var stats = trainer.train(netx, labels[ix]);
      avloss += stats.loss;
    }
  }
  avloss /= N*iters;

}
let creature = convJS();
let testC = 100;
Matter.Events.on(engine, 'beforeUpdate', function() {
  //console.log("...");
  if(testC-->0)
  {
    creature.update();
  }
  else
  {
    creature.reset({x:400,y:200});
    testC = 100;
  }
});


