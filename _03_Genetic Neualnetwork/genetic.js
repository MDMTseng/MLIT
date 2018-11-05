
var canvas = document.getElementById("myGridWorld");
var ctx = canvas.getContext("2d");
let DECISION_LEFT_IDX = 2;
let GridWorld = [
        [0,0,-1000, 0,  0,0,    0,1],
        [0,0,-100,  0,-1000,0,    0,10000],
        [0,0,-10,  10,-1000,0,    0,1],
        [0,0,-1,    0,-1000,0,    0,1],
        [0,0, 0 ,   0,-1000,0,    0,1],
    ];
let heatMap=[
    [0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0],
];
function drawPlot(creature)
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
    let gridXC = GridWorld[0].length;
    let gridYC = GridWorld.length;
    let cellH = canvas.height/gridYC;
    let cellW = canvas.width/gridXC;
    let bestCreature = creature[0];

    for(let i=0;i<gridYC;i++)
    {
        for(let j=0;j<gridXC;j++)
        {
            
            ctx.strokeRect(cellW*j,cellH*i,cellW,cellH);
            //Get direction from position
            let decision = bestCreature.x[i][j];
            //decision=[-0.019644285973126507, -0.044486217439891854, -0.08396816632098161, -0.05991581325603];
            
            let reward = GridWorld[i][j]/1.0;
            reward+=128;


            ctx.fillStyle =
            'rgb(' + reward + ','+reward+','+reward+')';
        
            ctx.fillRect(cellW*j,cellH*i,cellW,cellH);


            ctx.beginPath();
            let normalVal=Math.hypot(Math.hypot(decision[1],decision[0]),Math.hypot(decision[2],decision[3]));
            //let dcenter=(decesion[1]+decesion[0]+decesion[2]+decesion[3])/4;
            
            let up_val = decision[0]/normalVal+0.5;
            let down_val = decision[1]/normalVal+0.5;
            let left_val = decision[2]/normalVal+0.5;
            let right_val = decision[3]/normalVal+0.5;
            ctx.moveTo(cellW*(j+0.5),cellH*(i+0.5));
            ctx.lineTo(
                cellW*(j+0.5)-left_val*10,
                cellH*(i+0.5)+0*10);
            ctx.moveTo(cellW*(j+0.5),cellH*(i+0.5));
            ctx.lineTo(
                cellW*(j+0.5)+right_val*10,
                cellH*(i+0.5)+0*10);
            ctx.moveTo(cellW*(j+0.5),cellH*(i+0.5));
            ctx.lineTo(
                cellW*(j+0.5)-     0*10,
                cellH*(i+0.5)-up_val*10);
            ctx.moveTo(cellW*(j+0.5),cellH*(i+0.5));
            ctx.lineTo(
                cellW*(j+0.5)-     0*10,
                cellH*(i+0.5)+down_val*10);
            ctx.stroke();
        }
    }
}
function indexOfTheMaximumValue(arr)
{
    let maxVal=arr[0];
    let maxVal_index=0;
    for(let i=1;i<arr.length;i++)
    {
       
    }
    return maxVal_index;
}

function getEnvFeedBack(policy,stepLimit=300)
{
    let position={x:0,y:0};
    let score=0;
    for(let i=0;i<stepLimit;i++)
    {
        //Get direction from position
        let decision = policy[position.y][position.x];
        //decision=[-0.019644285973126507, -0.044486217439891854, -0.08396816632098161, -0.05991581325603];
        let maxConfidence=decision[0];
        let maxConfidence_index=0;
        if(maxConfidence<decision[1])
        {
            maxConfidence_index=1;
            maxConfidence=decision[1];
        }
        if(maxConfidence<decision[2])
        {
            maxConfidence_index=2;
            maxConfidence=decision[2];
        }
        if(maxConfidence<decision[3])
        {
            maxConfidence_index=3;
            maxConfidence=decision[3];
        }

        //console.log(decision,maxConfidence_index);


        //maxConfidence_index = indexOfTheMaximumValue(decision);
        

        //Update to new position

        if(maxConfidence_index==0)//Up
        {
            position.y = position.y-1;
        }
        else if(maxConfidence_index==1)//Down
        {

            position.y = position.y+1;
        }
        else if(maxConfidence_index==DECISION_LEFT_IDX)//Left
        {

            position.x = position.x-1;
        }
        else if(maxConfidence_index==3)//right
        {

            position.x = position.x+1;
        }

        if(position.x<0 || position.y<0 || position.y>=GridWorld.length || position.x>=GridWorld[0].length )
        {
            score-=10000000000;
            break;
        }
        score+=0.01;

        //Get reward from new position
        score+=GridWorld[position.y][position.x];
    }
    return score;
}


function generate_creatures(count,scale=0.1)
{

    let creatures=[];
    for(let i=0;i<count;i++)
    {
        let policy = JSON.parse(JSON.stringify(GridWorld));
        //TODO: generate policy
        for(let j=0;j<policy.length;j++)
        {
            for(let k=0;k<policy[j].length;k++)
            {
                policy[j][k]=[
                    scale*2*(Math.random()-0.5),
                    scale*2*(Math.random()-0.5),
                    scale*2*(Math.random()-0.5),
                    scale*2*(Math.random()-0.5)
                ];
            }
        }

        creatures.push({x:policy,y:0});
    }
    return creatures
}

let testC = generate_creatures(1)[0];
console.log(testC);
console.log(getEnvFeedBack(testC.x));

let creatures=generate_creatures(230);

var MaxScoreField = document.getElementById("MaxScore");
var MidScoreField = document.getElementById("MidScore");


function EVOLVE()
{
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

    drawPlot(creatures);
    let topScore = topN_List[0].y;

    console.log("top:"+topScore, "mid:"+leastAcceptedScore);
    MaxScoreField.innerText = topScore;
    MidScoreField.innerText = leastAcceptedScore;
    for(let idx=0;idx<creatures.length;idx++)
    {

        let body = creatures[idx];
        let policy = body.x;
        if(idx>topN)
        {
            let parent1=topN_List[Math.floor(Math.random()*topN)].x;
            let parent2=topN_List[Math.floor(Math.random()*topN)].x;

            //body.x = gw.Policy_Mix(body.x,[parent1,parent2]);


            for(let j=0;j<policy.length;j++)
            {
                for(let k=0;k<policy[j].length;k++)
                {
                    policy[j][k][0]=(parent1[j][k][0]+parent2[j][k][0])/2;
                    policy[j][k][1]=(parent1[j][k][0]+parent2[j][k][1])/2;
                    policy[j][k][2]=(parent1[j][k][0]+parent2[j][k][2])/2;
                    policy[j][k][3]=(parent1[j][k][0]+parent2[j][k][3])/2;
                }
            }



            //body.x = gw.Policy_Mutate(body.x,body.x,0.2,0.01,0.5);
        }
        
        if(idx>topN/2)
        {
            for(let j=0;j<policy.length;j++)
            {
                for(let k=0;k<policy[j].length;k++)
                {
                    policy[j][k][0]+=random(0.3);
                    policy[j][k][1]+=random(0.3);
                    policy[j][k][2]+=random(0.3);
                    policy[j][k][3]+=random(0.3);
                }
            }

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