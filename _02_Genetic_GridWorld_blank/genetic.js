
var canvas = document.getElementById("myGridWorld");
var ctx = canvas.getContext("2d");

let GridWorld = [
    [0,0,-1000,0,  0,0,0,1],
    [0,0,-100,0, 0,0,0,10],
    [0,0,-10,0,0,0,0,1],
    [0,0,-1,0,0,0,0,1],
    [0,0, 0 ,0,0,0,0,1],
];
let heatMap=[
    [0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0],
];
function drawPlot(env,creature)
{
    let heatmapMax=0;
    for(let i=0;i<heatMap.length;i++)
    {
        for(let j=0;j<heatMap[i].length;j++)
        {
            if(heatmapMax<heatMap[i][j])
                heatmapMax=heatMap[i][j];
        }
    }
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

            if(heatMap[i][j]>0)
            {
                let RGB=hsvToRgb(0.7*(1-(heatMap[i][j]/heatmapMax)), 1, 1);
    
                ctx.fillStyle =
                'rgba(' + RGB[0] + ','+RGB[1]+','+RGB[2]+',0.3)';
                ctx.fillRect(cellW*j,cellH*i,cellW,cellH);
            }

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


function getEnvFeedBack(policy,stepLimit=300)
{
    return score;
}


function generate_creatures(count,scale=0.1)
{

    let creatures=[];
    for(let i=0;i<count;i++)
    {
        let policy = JSON.parse(JSON.stringify(GridWorld));
        //TODO: generate policy
        creatures.push({x:policy,y:0});
    }
    return creatures
}

let creatures=generate_creatures(230);



function EVOLVE()
{
    for(let i=0;i<heatMap.length;i++)
    {
        for(let j=0;j<heatMap[i].length;j++)
        {
            heatMap[i][j]=0;
        }
    }
    for(let i=0;i<creatures.length;i++)
    {
        let body = creatures[i];
        body.y=getEnvFeedBack(body.x);

    }
    //drawPlot(worldEnv,creatures);

    creatures.sort(function(a, b){return b.y-a.y});
    let topN=Math.floor(creatures.length*0.5);
    let leastAcceptedScore = creatures[topN].y;
    let topN_List=creatures.slice(0, topN);

    drawPlot(gw,creatures);
    let topScore = topN_List[0].y;

    console.log("top:"+topScore, "mid:"+leastAcceptedScore);
    
    for(let idx=0;idx<creatures.length;idx++)
    {

        let body = creatures[idx];
        if(idx>topN)
        {
            let parent1=topN_List[Math.floor(Math.random()*topN)].x;
            let parent2=topN_List[Math.floor(Math.random()*topN)].x;
            body.x = gw.Policy_Mix(body.x,[parent1,parent2]);
            body.x = gw.Policy_Mutate(body.x,body.x,0.2,0.01,0.5);
        }
        body.y=0;
    }
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