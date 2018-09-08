
Matter.use('matter-collision-events');

function generate_net(in_dim,out_dim)
{
  var layer_defs = [];
  // minimal network: a simple binary SVM classifer in 2-dimensional space
  layer_defs.push({type:'input', out_sx:1, out_sy:1, out_depth:in_dim});
  layer_defs.push({type:'fc', num_neurons:30, activation:'relu'});
  layer_defs.push({type:'fc', num_neurons:30, activation:'relu'});
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


let raycast_naive=(bodies, start, r, dist, stepSize=10)=>{
  var normRay = Matter.Vector.normalise(r);
  var ray = normRay;
  var point = Matter.Vector.add(ray, start);

  for(var i = 0; i < dist; i+=stepSize){
    ray = Matter.Vector.mult(normRay, i);
    ray = Matter.Vector.add(start, ray);
    var bod = Matter.Query.point(bodies, ray)[0];
    if(bod){
      if(stepSize!=1)
      {
        ray = Matter.Vector.mult(normRay, i-stepSize+1);
        ray = Matter.Vector.add(start, ray);
        return raycast_naive(bodies, ray, r, stepSize, 1);
      }
      return {point: ray, dist:i, body: bod};
    }
  }
  return {point: {x:start.x+normRay.x*dist,y:start.y+normRay.y*dist}, dist:dist};
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

    this.health-=0.2;//+0.2*Matter.Vector.magnitude(relativeMomentum);
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

  this.modelNoising=(noise_alpha=0.01,mutate_chance=0.01)=>{
    let net = this.core.netSet.net;
    for(let i=1;i<net.layers.length;i+=2)//
    {
      let layer = net.layers[i];
      let biases = layer.biases;
      for(let j=0;j<biases.w.length;j++)
      {
        if(Math.random()<mutate_chance)
          biases.w[j]+=noise_alpha*(Math.random()*2-1);
      }

      let filters = layer.filters;
      for(let j=0;j<filters.length;j++)
      {
        for(let k =0;k<filters[j].w.length;k++)
        {

          if(Math.random()<mutate_chance)
            filters[j].w[k] +=noise_alpha*(Math.random()*2-1);
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
      let len=300;
      //let toVec={x:fromVec.x+angle_vec.x*len,y:fromVec.y+angle_vec.y*len};

      var  ret = raycast_naive(bs, fromVec, angle_vec, len, stepSize=5);

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
      SenseData.push(ret.dist);
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
    if(newAngVelo>20)
      newAngVelo=20;
    else if(newAngVelo<-20)
      newAngVelo=-20;
    this.rotationSum*=0.9999;
    this.rotationSum += newAngVelo;
    Matter.Body.setAngularVelocity( this.body,newAngVelo);


    //console.log(this.rotationSum);
    if(this.prePosition!=null)
    {
      var dist = Matter.Vector.sub(this.prePosition, body.position);
      if(Matter.Vector.magnitude(dist)<0.1)this.health-=0.001;
    }
    this.prePosition={x:body.position.x,y:body.position.y};
    if(this.rotationSum>10 || this.rotationSum<-10 )this.health-=0.001;


    let main_angle_vec={x:Math.cos(creature.body.angle),y:Math.sin(creature.body.angle)};
    main_angle_vec.x*=action.w[1]*0.000003*body.mass;
    main_angle_vec.y*=action.w[1]*0.000003*body.mass;

    //Matter.Vector.magnitude(main_angle_vec);
    Matter.Body.applyForce(this.body, fromVec,main_angle_vec);

  }
}

function NNWorld(renderDOM) {
  this.creatureCount = 10;
  this.pool = [];

  let engine = Matter.Engine.create();
  this.engine=engine;

  let render = Matter.Render.create({
                  element: renderDOM,
                  engine: engine,
                  options: {
                      width: 800,
                      height: 800,
                      wireframes: false
                  }
               });
   this.render = render;
   this.engine.world.gravity.y = 0;

   for( let i=0;i<this.creatureCount;i++)
   {
     var roundBody = Matter.Bodies.circle(
       Math.random()*render.canvas.width,
       Math.random()*render.canvas.height,
       10, {frictionAir: 0.02});
     this.pool.push(new NNCreature( roundBody,NNCore));
   }
   let showWallPix=40;
   var ground = Matter.Bodies.rectangle(render.canvas.width/2, render.canvas.height, render.canvas.width, showWallPix, { isStatic: true });
   var ceiling = Matter.Bodies.rectangle(render.canvas.width/2,           0, render.canvas.width, showWallPix, { isStatic: true });
   var lwall = Matter.Bodies.rectangle(0, render.canvas.height/2, showWallPix, render.canvas.height, { isStatic: true });
   var rwall = Matter.Bodies.rectangle(render.canvas.width, render.canvas.height/2, showWallPix, render.canvas.height, { isStatic: true });


   Matter.World.add(engine.world, [ground,ceiling,lwall,rwall]);


   let thisWorld=this;
   this.worldReset=()=>{
      thisWorld.pool.forEach(function(creature) {
        Matter.Composite.remove(thisWorld.engine.world, creature.body);
      });
      let scoreArr=[];
      for(let i=0;i<thisWorld.pool.length;i++)
      {
        scoreArr.push(thisWorld.pool[i].getScore());
      }
      thisWorld.pool.sort(function(a, b){return b.getScore()-a.getScore()});
      scoreArr=[];
      for(let i=0;i<thisWorld.pool.length;i++)
      {
        scoreArr.push(thisWorld.pool[i].getScore());
      }
      console.log(">>>scoreArr:",scoreArr);



     for(let i=thisWorld.pool.length/2;i<thisWorld.pool.length;i++)
     {
       thisWorld.pool[i].cross(thisWorld.pool);
     }

     thisWorld.pool.forEach(function(creature) {
        creature.modelNoising();
        creature.reset();
        Matter.Body.setPosition(creature.body,
        {
          x:Math.random()*thisWorld.render.canvas.width,
          y:Math.random()*thisWorld.render.canvas.height,
        });
        Matter.World.add(thisWorld.engine.world, [creature.body]);
     });
   }
   this.worldReset();
   Matter.Events.on(engine, 'afterUpdate', function() {
     let die_count=0;
     for( idx in thisWorld.pool){
       let creature = thisWorld.pool[idx];
       if(creature.health<=0)
       {
          die_count++;
          Matter.Composite.remove(engine.world, creature.body)
       }
       else {
          creature.survive_time++;
       }
     }
     //console.log("die_count:",die_count);

     if(die_count > thisWorld.pool.length*0.8)
     {
       thisWorld.worldReset();
       //reset the world;
     }
     else {

       thisWorld.pool.forEach(function(creature) {
         creature.update(null,thisWorld  );
       });
     }
   });

   Matter.Events.on(render, "afterRender", (evt)=>{
     let ctx = evt.source.canvas.getContext("2d");
   });


   function shuffle_array(a) {
       var j, x, i;
       for (i = a.length - 1; i > 0; i--) {
           j = Math.floor(Math.random() * (i + 1));
           x = a[i];
           a[i] = a[j];
           a[j] = x;
       }
       return a;
   }
   this.skipF=100;
   setInterval(function(){
     for(let i=0;i<this.skipF;i++)
     {
       Matter.Engine.update(this.engine);
     }
     Matter.Render.world(this.render);

   }.bind(this), 30);
    //Matter.Engine.run(engine);
  //  Matter.Render.run(render);

};
