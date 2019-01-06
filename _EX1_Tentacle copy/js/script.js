
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

let showWallPix=40;
var ground = Matter.Bodies.rectangle(render.canvas.width/2, render.canvas.height, render.canvas.width, showWallPix, { isStatic: true });
var ceiling = Matter.Bodies.rectangle(render.canvas.width/2,           0, render.canvas.width, showWallPix, { isStatic: true });
var lwall = Matter.Bodies.rectangle(0, render.canvas.height/2, showWallPix, render.canvas.height, { isStatic: true });
var rwall = Matter.Bodies.rectangle(render.canvas.width, render.canvas.height/2, showWallPix, render.canvas.height, { isStatic: true });


World.add(world, [ground,ceiling,lwall,rwall]);



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
  
  this.view = new Array(20*20).fill(0);//the 20x20 view window of the world
  let tentacleCount = 4;
  let tentacleLength = 100;
  
  this.body={
    body:undefined,
    tentacles:new Array(tentacleCount).fill(undefined)
  };


  function randInt(MaxNum)
  {
    return Math.floor((MaxNum+1)*Math.random());
  }
  function rand(range)
  {
    return Math.random()*(range*2)-range;
  }
  {
    let location={x:100,y:100};
    this.body.body=Bodies.rectangle(location.x, location.y, 50, 50);
    console.log(this.body.tentacles);
    this.body.tentacles = this.body.tentacles.map(()=>Bodies.rectangle(location.x+rand(50), location.y+rand(50), 10, 10));

    console.log(this.body.tentacles);
    World.add(world, this.body.tentacles);
    World.add(world, [this.body.body]);
  }
  console.log(this.body);



  this.tentaclesState = new Array(3*tentacleCount).fill(0);//x,y,touchstate X {tentacleCount} tentacles in real world

  this.localMotion = new Array(4).fill(0);// speed xy and target xy

  this.in_dim=this.localMotion.length + this.view.length + this.tentaclesState.length;
  //Eye beams, health, energy, rotationSum, speed, angularVelocity

  this.tentaclesPlanState = new Array(4*tentacleCount).fill(0);//x,y,touchstate,push/pull X {tentacleCount} tentacles in mind
  this.out_dim=this.tentaclesPlanState.length;//For acceleration, turn,


  this.core =generate_net(this.in_dim,this.out_dim);
  


  this.inputTranslate=(convNetFormat,intput)=>{

    for(var i=0;i<intput.localMotion.length;i++) {
       convNetFormat.w[i] = intput.localMotion[i];
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
  this.interact=()=>{

    this.inputTranslate=(this.tmp_in_buff,this);
    let retOutput = this.core.net.forward(this.tmp_in_buff);
    this.outputTranslate=(this,retOutput);
  }

  this.updateInput=(world)=>{
    for(let i=0;i<this.view.length;i++)
    {
      this.view[i]=0;
    }
    for(let i=0;i<this.tentaclesState.length;i++)
    {
      this.tentaclesState[i]=0;
    }
    for(let i=0;i<this.localMotion.length;i++)
    {
      this.localMotion[i]=0;
    }

  }
}




function convJS()
{
  let creature = new NNCreature(world);
  console.log(creature);
  creature.interact();
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

Matter.Events.on(engine, 'afterUpdate', function() {
  //console.log("...");


});


convJS();