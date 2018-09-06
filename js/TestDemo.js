
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
  engine.world.gravity.y = 1;
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

  ballA.onCollide((pair)=>
  {
    console.log('...xs',pair);
  });

})()
