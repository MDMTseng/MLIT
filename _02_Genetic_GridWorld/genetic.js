
var canvas = document.getElementById("myGridWorld");
var ctx = canvas.getContext("2d");
function drawPlot(env,creature)
{

    ctx.fillStyle = "#FF0000";
    let gridXC = env.theWorld[0].length;
    let gridYC = env.theWorld.length;
    let cellH = canvas.height/gridYC;
    let cellW = canvas.width/gridXC;
    let bestCreature = creature[0];

    for(let i=0;i<gridYC;i++)
    {
        for(let j=0;j<gridXC;j++)
        {
            
            ctx.strokeRect(cellW*j,cellH*i,cellW,cellH);

            let decesion = gw.decision( j, i, bestCreature.x,0);

            let down_c,right_c,reward;
            if(Math.abs(decesion[0])>Math.abs(decesion[1]))
            {
                decesion[1]=0;
            }
            else
            {
                decesion[0]=0;
            }
            {
                let value = decesion[0]*400;
                value+=128;
                if(value>255)value=255;
                if(value<0)value=0;
                down_c = value;
            }
            {
                let value = decesion[1]*400;
                value+=128;
                if(value>255)value=255;
                if(value<0)value=0;
                right_c = value;
            }

            {
                let value = env.theWorld[i][j]*10;
                value+=128;
                if(value>255)value=255;
                if(value<0)value=0;
                reward = value;
            }


            
            ctx.fillStyle =
            'rgb(' + reward + ','+reward+','+reward+')';
        
            ctx.fillRect(cellW*j,cellH*i,cellW,cellH);
            ctx.beginPath();
            ctx.moveTo(cellW*(j+0.5),cellH*(i+0.5));
            let normalVal=Math.hypot(decesion[1],decesion[0]);
            ctx.lineTo(
                cellW*(j+0.5)+decesion[1]/normalVal*10,
                cellH*(i+0.5)+decesion[0]/normalVal*10);
            ctx.stroke();

        }
    }
}

let gw = new GridWorld([
    [0,0,-10,0,0,0,0,-1],
    [0,0,0,0,0,0,0,-1],
    [0,0,-10,0,-10,0,0,-1],
    [0,0,-10,0,10,0,0,-1],
    [0,0,-10,0,10,0,0,-1],
]);

function getEnvFeedBack(policy,stepLimit=300)
{
    let score=0;
    let location={x:0,y:0};
    let i;
    for(i=0;i<stepLimit;i++)
    {
        let decesion = gw.decision( location.x, location.y, policy,0.001);
        if(Math.abs(decesion[0])>Math.abs(decesion[1]))
        {
            location.y+=(decesion[0]<0)?-1:1;
        }
        else
        {
            location.x+=(decesion[1]<0)?-1:1;
        }
    
        let reward = gw.reward(location.x, location.y);
        score+=reward+0.001;
        if(reward!=0)break;

    }
    //if(i==stepLimit)reward+=-10;

    //console.log(score,i,location);

    return score;
}


function generate_creatures(count,scale=0.1)
{

    let creatures=[];
    for(let i=0;i<count;i++)
    {
        
        let policy = gw.RandomPolicy_Init(scale);
        creatures.push({x:policy,y:0});
    }
    return creatures
}

let creatures=generate_creatures(130);



function EVOLVE()
{

    creatures=creatures.map(
        (body)=>{
            body.y=getEnvFeedBack(body.x);
            return body;
        }
    );
    //drawPlot(worldEnv,creatures);

    creatures.sort(function(a, b){return b.y-a.y});
    let topN=Math.floor(creatures.length*0.5);
    let leastAcceptedScore = creatures[topN].y;
    let topN_List=creatures.slice(0, topN);

    drawPlot(gw,creatures);
    let topScore = topN_List[0].y;

    console.log("top:"+topScore, "mid:"+leastAcceptedScore);
    
    creatures=creatures.map(
        (body,idx)=>{
            if(idx>topN)
            {
                let parent1=topN_List[Math.floor(Math.random()*topN)].x;
                let parent2=topN_List[Math.floor(Math.random()*topN)].x;
                body.x = gw.Policy_Mix(body.x,[parent1,parent2]);
                body.x = gw.Policy_Mutate(body.x,body.x,0.02,0.05,0.1);
            }
            body.y=0;
            return body;
        }
    );
}


function ResetCreature()
{
    creatures=generate_creatures(150);
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