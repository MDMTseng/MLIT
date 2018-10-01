
function drawPlot(env,creature)
{
    setPlot(WorldPlot,1,env);
    setPlot(WorldPlot,0,creature);
    setPlotYLimit(WorldPlot,0,{min:-2,max:5});
    setPlotYLimit(WorldPlot,1,{min:-2,max:5});
    WorldPlot.update();
}




let ExpRange={min:-2*2*Math.PI,max:2*2*Math.PI}

function getEnvFeedBack(param)
{
    //let x = 0.5*(-param*param/30+3)*Math.sin(param);
    //let x = Math.sin(param*param/10)+param/20;
    let x =Math.sin(param);
    return x;
    //return Math.sin(param*param/10)+param/20;
}

function GenerateEnvArr(ExpRange,samples=100)
{
    let arr = [];


    for(let i=0;i<samples;i++)
    {
        let alpha = 1.0*i/(samples-1);
        let x = (1-alpha)*ExpRange.min+(alpha)*ExpRange.max;
        arr.push({x:x,y:getEnvFeedBack(x)});
    }
    return arr;
}

let worldEnv = GenerateEnvArr(ExpRange);



function generate_creatures(ExpRange,count)
{
    let creatures=[];
    for(let i=0;i<count;i++)
    {
        let x=Math.random()*(ExpRange.max-ExpRange.min)+ExpRange.min;
        creatures.push({x:x,y:0});
    }
    return creatures
}

function SpownNewPopulation(expRange=ExpRange,count=10)
{
    return generate_creatures(expRange,count);
}
let creatures=SpownNewPopulation({min:0,max:1});




drawPlot(worldEnv,creatures);


function EVOLVE()
{

    creatures=creatures.map(
        (body)=>{
            if(body.x>ExpRange.min && body.x<ExpRange.max)
                body.y=getEnvFeedBack(body.x);
            else
            {
                body.y=-1000;
                body.x=ExpRange.min;
            }
            return body;
        }
    );
    drawPlot(worldEnv,creatures);


    creatures.sort(function(a, b){return b.y-a.y});
    let topN=Math.floor(creatures.length*0.5);
    let leastAcceptedScore = creatures[topN].y;
    let topN_List=creatures.slice(0, topN);

    let topScore = topN_List[0].y;

    console.log("top:"+topScore, "mid:"+leastAcceptedScore);
    
    creatures=creatures.map(
        (body)=>{
            if(body.y<leastAcceptedScore)
            {
                let parent1=topN_List[Math.floor(Math.random()*topN)].x;
                let parent2=topN_List[Math.floor(Math.random()*topN)].x;
                body.x = 
                    (parent1)+
                    (Math.random()-0.5);

                if(Math.random()<0.1)
                    body.x+=20*(Math.random()-0.5);
            }
            body.y=0;
            return body;
        }
    );
}


function ResetCreature()
{
    creatures=SpownNewPopulation({min:-6,max:-4});

    drawPlot(worldEnv,creatures);
}
function NextStep()
{
    EVOLVE();
}

var AutoHdl=null;
function ToggleAuto()
{
    if(AutoHdl == null)
        AutoHdl= setInterval(EVOLVE, 100);
    else
    {
        clearInterval(AutoHdl);
        AutoHdl=null;
    }
}

/*
let creatures=[];
for(let i=0;i<20;i++)
{
    creatures.push(Math.random()*2*Math.PI);
}
setCreaturePlot(myScatter,creatures,()=>0);

myScatter.update();



*/