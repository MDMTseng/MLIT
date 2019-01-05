

{
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

// create renderer
var render = Render.create({
  element: document.getElementById('canvas-container'),
  engine: engine,
  options: {
    width: 800,
    height: 400,
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

World.add(world, [
  chain,
  // walls
  Bodies.rectangle(400, 0, 810, 30, { isStatic: true }),
  Bodies.rectangle(400, 400, 810, 30, { isStatic: true }),
  Bodies.rectangle(800, 200, 30, 420, { isStatic: true }),
  Bodies.rectangle(0, 200, 30, 420, { isStatic: true })
]);
}



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


function NNCore(in_dim,out_dim) {
  this.in_dim = in_dim;
  this.out_dim = out_dim;
  this.netSet=generate_net(in_dim,out_dim);
  this.tmp_in_buff = new convnetjs.Vol(1,1,in_dim,0.0);

  this.dataConvert=(in_arr)=>{
    for(var i=0;i<in_arr.length;i++) {
      this.tmp_in_buff.w[i] = in_arr[i];
    }
  }
  this.interact=(in_data)=>{
    this.dataConvert(in_data);
    return this.netSet.net.forward(this.tmp_in_buff);
  }
}


function NNCreature(body, CoreFunction)//body is the pysical(matter.js engine) body in env
{
  this.eyeBeamAngles = [
    0,
    10*Math.PI/180,
    -10*Math.PI/180,
    30*Math.PI/180,
    -30*Math.PI/180,
    90*Math.PI/180,
    -90*Math.PI/180
  ];
  this.score = 0;
  this.health = 1;
  this.energy = 1;
  this.MaxSpeed = 0;
  this.in_dim=this.eyeBeamAngles.length+1+1+1+1+1;
  //Eye beams, health, energy, rotationSum, speed, angularVelocity
  this.out_dim=1+1;//For acceleration, turn,

  this.core = new CoreFunction(this.in_dim,this.out_dim);
  this.body = body;


  this.survive_time = 0;


  this.rotationSum = 0;
  this.reset =()=>
  {
    this.health = 1;
    this.energy = 1;
    this.survive_time = 0;
    this.rotationSum=0;
    this.score =0;
    this.distanceAddup = 0;
    let body = this.body;
    Matter.Body.setVelocity(body, {x:0,y:0});
    Matter.Body.setAngularVelocity(body,0);

    //console.log(this.core);

  }
  this.reset();

  this.getScore=()=>{
    score = this.energy+this.health+this.survive_time+this.MaxSpeed;
    return score;
  }

  this.body.onCollide((pair)=>
  {

    var bodyAMomentum = Matter.Vector.mult(pair.bodyA.velocity, pair.bodyA.mass);
    var bodyBMomentum = Matter.Vector.mult(pair.bodyB.velocity, pair.bodyB.mass);
    var relativeMomentum = Matter.Vector.sub(bodyAMomentum, bodyBMomentum);
    if(pair.bodyB.isStatic);
      this.health-=0.4;//+0.2*Matter.Vector.magnitude(relativeMomentum);
  });
  function randInt(MaxNum)
  {
    return Math.floor((MaxNum+1)*Math.random());
  }
  this.cross=(parents)=>
  {
    //console.log("this.cross=(parents)",parents);
    let parentsNum=parents.length;
    let net = this.core.netSet.net;
    for(let i=1;i<net.layers.length;i+=2)//
    {
      let layer = net.layers[i];
      let biases = layer.biases;
      for(let j=0;j<biases.w.length;j++)
      {
        let randParentLayerBiases =
          parents[randInt(parentsNum-1)].core.netSet.net.layers[i].biases;
        biases.w[j]=randParentLayerBiases.w[j];
      }

      let filters = layer.filters;
      for(let j=0;j<filters.length;j++)
      {
        for(let k =0;k<filters[j].w.length;k++)
        {
          let randParentLayerFilters =
            parents[randInt(parentsNum-1)].core.netSet.net.layers[i].filters;
          filters[j].w[k] =randParentLayerFilters[j].w[k];
        }
      }
    }
  };

  this.modelNoising=(noise_alpha=1,mutate_chance=0.1,l2reg=0.9)=>{
    let net = this.core.netSet.net;
    for(let i=1;i<net.layers.length;i+=2)//
    {
      let layer = net.layers[i];
      let biases = layer.biases;
      for(let j=0;j<biases.w.length;j++)
      {
        if(Math.random()<mutate_chance)
        {
          biases.w[j]+=noise_alpha*(Math.random()*2-1);
        }
        biases.w[j]*=l2reg;
      }

      let filters = layer.filters;
      for(let j=0;j<filters.length;j++)
      {
        for(let k =0;k<filters[j].w.length;k++)
        {

          if(Math.random()<mutate_chance)
          {
            filters[j].w[k] +=noise_alpha*(Math.random()*2-1);
          }

          biases.w[j]*=l2reg;
        }
      }
    }
  };
  this.prePosition=null;
  this.update=(canvas_ctx,world)=>{

    if(this.health<=0)return;


  //console.log(world);
    var bs = Matter.Composite.allBodies(world.engine.world);
    const index = bs.findIndex(body => body.id === this.body.id);
    bs.splice(index, 1);


    let creature = this;
    var fromVec =creature.body.position;

    let SenseData=[];
    for(let i=0;i<this.eyeBeamAngles.length;i++)
    {
      let angle=creature.body.angle+this.eyeBeamAngles[i];
      let angle_vec={x:Math.cos(angle),y:Math.sin(angle)};
      let visual_max_dist=200;
      //let toVec={x:fromVec.x+angle_vec.x*len,y:fromVec.y+angle_vec.y*len};

      var  ret = raycast_naive(bs, fromVec, angle_vec, visual_max_dist, stepSize=10);

      if(canvas_ctx!=null)
      {

        canvas_ctx.beginPath();
        if(typeof ret.body == 'undefined')
        {
            canvas_ctx.strokeStyle="rgba(0,165,0,0.3)";
        }
        else
        {
            canvas_ctx.strokeStyle="rgba(160,0,0,0.5)";
        }
        canvas_ctx.moveTo(fromVec.x,fromVec.y);
        canvas_ctx.lineTo(ret.point.x,ret.point.y);
        canvas_ctx.stroke();

      }
      //if(ret.dist<1)ret.dist=1;
      SenseData.push(ret.dist/visual_max_dist);
    }

    let body = this.body;

    SenseData.push(this.health);
    SenseData.push(this.energy);
    SenseData.push(this.rotationSum);
    SenseData.push(body.angularVelocity);
    SenseData.push(body.speed);

    if(this.MaxSpeed<body.speed)
      this.MaxSpeed+=body.speed;
    let action = this.core.interact(SenseData);

    if(action.w[0]>1)action.w[0]=1;
    else if(action.w[0]<-1)action.w[0]=-1;
    let newAngVelo=action.w[0]*Math.PI/16000;
    newAngVelo+=body.angularVelocity;
    if(newAngVelo>40)
      newAngVelo=40;
    else if(newAngVelo<-40)
      newAngVelo=-40;
    this.rotationSum*=0.999;
    this.rotationSum += newAngVelo;
    Matter.Body.setAngularVelocity( this.body,newAngVelo);


    //console.log(this.rotationSum);
    if(this.prePosition!=null)
    {
      var dist = Matter.Vector.sub(this.prePosition, body.position);
      if(Matter.Vector.magnitude(dist)<0.6)this.health-=0.001;
    }
    this.prePosition={x:body.position.x,y:body.position.y};
    if(this.rotationSum>10 || this.rotationSum<-10 )this.health-=0.001;


    let main_angle_vec={x:Math.cos(creature.body.angle),y:Math.sin(creature.body.angle)};
    if(action.w[1]>10)action.w[1]=10;
    if(action.w[1]<-10)action.w[1]=-10;


    main_angle_vec.x*=action.w[1]*0.0002*body.mass;
    main_angle_vec.y*=action.w[1]*0.0002*body.mass;

    //Matter.Vector.magnitude(main_angle_vec);
    Matter.Body.applyForce(this.body, fromVec,main_angle_vec);

  }
}




function convJS()
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

  layer_defs = [];
  layer_defs.push({type:'input', out_sx:1, out_sy:1, out_depth:1});
  layer_defs.push({type:'regression', num_neurons:1});

  net = new convnetjs.Net();
  net.makeLayers(layer_defs);

  trainer = new convnetjs.SGDTrainer(net, {learning_rate:0.01, momentum:0.0, batch_size:1, l2_decay:0.001});

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
convJS();