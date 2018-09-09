/*
(function() {
  Matter.use('matter-collision-events');
  var Engine = Matter.Engine,
      Render = Matter.Render,
      World = Matter.World,
      Bodies = Matter.Bodies;

  var engine = Engine.create();

  var render = Render.create({
                  element: document.body,
                  engine: engine,
                  options: {
                      width: 800,
                      height: 800,
                      wireframes: false
                  }
               });
  console.log(render);
  engine.world.gravity.y = 0.1;
  var boxA = Bodies.rectangle(400, 200, 40, 40);

  boxA.restitution=0.5;
  Matter.Body.setAngle(boxA, 30 / 180 * Math.PI)
  Matter.Body.setMass(boxA, 0.4);
  Matter.Body.setAngularVelocity( boxA, Math.PI/16);
  Matter.Body.setVelocity( boxA, {x:0, y: -1});



  var ballA = Bodies.circle(380, 100, 40, 10);
  var ballB = Bodies.circle(460, 10, 40, 10);

  ballA.restitution=0.5;
  ballB.restitution=0.5;
  let showWallPix=20;
  var ground = Bodies.rectangle(render.canvas.width/2, render.canvas.height, render.canvas.width, showWallPix, { isStatic: true });
  var ceiling = Bodies.rectangle(render.canvas.width/2,           0, render.canvas.width, showWallPix, { isStatic: true });
  var lwall = Bodies.rectangle(0, render.canvas.height/2, showWallPix, render.canvas.height, { isStatic: true });
  var rwall = Bodies.rectangle(render.canvas.width, render.canvas.height/2, showWallPix, render.canvas.height, { isStatic: true });
  var AllPlayers = [boxA, ballA, ballB];
  World.add(engine.world, [boxA, ballA, ballB, ground,ceiling,lwall,rwall]);
  Engine.run(engine);
  Render.run(render);

  ballA.onCollide((pair)=>
  {
    console.log('...xs',pair);
  });

  function raycast_naive(bodies, start, r, dist, stepSize=10){
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
        return {point: ray, body: bod};
      }
    }
    return {point: {x:start.x+normRay.x*dist,y:start.y+normRay.y*dist}};
  }


  console.log(ballB);
  Matter.Events.on(render, "afterRender", (evt)=>{
    //console.log(mainOBj);
    var allPlayers = AllPlayers;

    let ctx = evt.source.canvas.getContext("2d");

    //let time = evt.timestamp;
    let range = 200;
    var beams = 10;
    let angle_int=180*Math.PI/beams/180;

    allPlayers.forEach(function(player) {

      var bs = Matter.Composite.allBodies(engine.world);
      const index = bs.findIndex(body => body.id === player.id);
      bs.splice(index, 1);

      var fromVec = {x:player.position.x, y:player.position.y};
      let init_angle=-player.angle-angle_int*(beams-1)/2;

      let Addforce = {x:0,y:0};
      for(var i=0; i < beams; i++){
        let angle = init_angle+angle_int*i;
        var toVec = {x:Math.sin(angle), y:Math.cos(angle)};
        var  ret = raycast_naive(bs,fromVec,toVec,range,10);

        ctx.beginPath();

        if(typeof ret.body == 'undefined')
        {
            ctx.strokeStyle="green";
        }
        else
        {
            ctx.strokeStyle="red";
        }

        ctx.moveTo(fromVec.x,fromVec.y);
        ctx.lineTo(ret.point.x,ret.point.y);
        ctx.stroke();

        let dist = Math.hypot(ret.point.x-fromVec.x,ret.point.y-fromVec.y);
        if(dist<range*0.8)
        {
          let forceMag = -(1-dist)*0.000003*player.mass;
          let force = {x:fromVec.x-ret.point.x,y:fromVec.y-ret.point.y};
          force = Matter.Vector.normalise(force);
          force = Matter.Vector.mult(force, forceMag);
          Addforce = Matter.Vector.add(Addforce, force);
        }
      }
      Matter.Body.applyForce(player, player.position, Addforce);
    });
  });

  NNTest();

})()


function NNTest()
{

    let dataSet = [];

    {
      let arrL=100;
      for(let i = 0 ;i<arrL; i++)
      {
        let t = 2*Math.PI*(i-arrL/2)/arrL;
        dataSet.push({input: [t], output: [Math.sin(t),Math.sin(t-1)]});
      }
    }

    shuffle_array(dataSet);

    {
      let in_dim=1,out_dim=2;
      let netSet=generate_net(in_dim,out_dim);

      var x = new convnetjs.Vol(1,1,in_dim,0.0); // a 1x1x2 volume initialized to 0's.
      for(var tt=0;tt<10001;tt++)
      {
        let avloss = 0;
        for(var i=0;i<dataSet.length;i++) {
          x.w[0] = dataSet[i].input; // Vol.w is just a list, it holds your data
          var stats = netSet.trainer.train(x, dataSet[i].output);
          avloss += stats.loss;
        }
        if(tt%1000==0)
        {
          console.log("Loss::",avloss);
          console.log(netSet.net);
        }
      }

      for(var i=0;i<dataSet.length;i++) {
        x.w[0] = dataSet[i].input; // Vol.w is just a list, it holds your data
        var scores = netSet.net.forward(x); // pass forward through network
        console.log(scores);
      }
    }
}


*/
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
