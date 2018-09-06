
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
                      height: 400,
                      wireframes: false
                  }
               });
  engine.world.gravity.y = 0;
  var boxA = Bodies.rectangle(400, 200, 80, 40);

  boxA.restitution=0.5;
  Matter.Body.setAngle(boxA, 30 / 180 * Math.PI)
  Matter.Body.setMass(boxA, 0.4);
  Matter.Body.setAngularVelocity( boxA, Math.PI/16);
  Matter.Body.setVelocity( boxA, {x:0, y: -1});



  var ballA = Bodies.circle(380, 100, 40, 10);
  var ballB = Bodies.circle(460, 10, 40, 10);

  ballA.restitution=0.5;
  ballB.restitution=0.5;
  var ground = Bodies.rectangle(400, 380, 810, 60, { isStatic: true });

  World.add(engine.world, [boxA, ballA, ballB, ground]);
  Engine.run(engine);
  Render.run(render);
  console.log(Render);

  ballA.onCollide((pair)=>
  {
    console.log('...xs',pair);
  });

  function raycast_naive(bodies, start, r, dist, stepSize=10){
    var normRay = Matter.Vector.normalise(r);
    var ray = normRay;
    var point = Matter.Vector.add(ray, start);
    var advL = dist/2;

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
    return;
  }
  function raycast_naive_X(bodies, start, r, dist, stepSize=10){
    let cast_ret = raycast_naive(bodies, start, r, dist, stepSize);

    var normRay = Matter.Vector.normalise(r);
    if(typeof cast_ret == 'undefined')
    {
      return {point: {x:start.x+normRay.x*dist,y:start.y+normRay.y*dist}};
    }
    return cast_ret;
  }

  Matter.Events.on(render, "afterRender", (evt)=>{
    //console.log(evt);


    let ctx = evt.source.canvas.getContext("2d");
    let time = evt.timestamp;
    var bs = Matter.Composite.allBodies(engine.world);

    var fromVec = {x:200, y:200};
    let range = 500;
    var beams = 40;
    let angle_int=30*Math.PI/beams/180;
    let init_angle=time/500-angle_int*beams/2;
    for(var i=0; i < beams; i++){
      let angle = init_angle+angle_int*i;
      var toVec = {x:Math.sin(angle), y:Math.cos(angle)};
      var  ret = raycast_naive_X(bs,fromVec,toVec,range,10);

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
    }

    /*
    var cast = Matter.Query.ray(bs, fromVec, toVec);
    console.log(cast);

    if(cast.length>0)
    {
      ctx.moveTo(fromVec.x,fromVec.y);
      ctx.lineTo(cast[0].body.position.x,cast[0].body.position.y);
      ctx.stroke();
    }
    ctx.stroke();*/

  });



})()
