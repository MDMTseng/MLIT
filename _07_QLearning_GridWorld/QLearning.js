
var canvas = document.getElementById("myGridWorld");
var ctx = canvas.getContext("2d");

ctx.width = canvas.width=800;
ctx.height = canvas.height=600;
let gw = new GridWorld([
    [0,0,-1000,0,0,0,0,0],
    [0,0,-10,  0,0,0,0,0],
    [0,0,-10,  0,-1,0,0,0],
    [0,0,-1,   0,-1,0,0,0],
    [0,0,-1,   0,-1,0,0,0],
    [0,0,-1,   0,-1,0,0,0],
    [0,0,-1,   0,-1,0,0,0],
    [0,0,-1,   0,-1,0,0,0],
    [0,0,-1,   0, 0,0,0,0],
    [0,0,-1,   0,-1,0,0,0],
    [0,0,-1,   0,-1,0,0,0],
    [0,0, 0 ,  0,-1,0,0,10],
]);
let heatMap=[
    [0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0],
];

function saturation(num,max=1,min=-1)
{
    if(num>max)return max;
    if(num<min)return min;
    return num;
}

function policyTorgb(policyValue)
{

    s_policy = (saturation(policyValue)+1)/2/3;
    rgb = hslToRgb(s_policy, 1, 0.4);
    //console.log(s_policy);
    ctx.fillStyle ='rgba(' + rgb[0] + ','+rgb[1]+','+rgb[2]+',0.2)';

}

function drawPolicy(ctx,policy=[0,0,0,0],W=10,H=10)
{
    let rgb;
    let s_policy;

    ctx.fillStyle =policyTorgb(policy[0]);
    ctx.beginPath();
    ctx.moveTo(0,0);//UP
    ctx.lineTo(W,0);
    ctx.lineTo(W/2,H/2);
    ctx.closePath();
    ctx.fill();

    
    ctx.fillStyle =policyTorgb(policy[1]);
    ctx.beginPath();
    ctx.moveTo(W,H);//DOWN
    ctx.lineTo(0,H);
    ctx.lineTo(W/2,H/2);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle =policyTorgb(policy[2]);
    ctx.beginPath();
    ctx.moveTo(0,0);//LEFT
    ctx.lineTo(0,H);
    ctx.lineTo(W/2,H/2);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle =policyTorgb(policy[3]);
    ctx.beginPath();
    ctx.moveTo(W,H);//RIGHT
    ctx.lineTo(W,0);
    ctx.lineTo(W/2,H/2);
    ctx.closePath();
    ctx.fill();
}

function drawPlot(env,policy)
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

    for(let i=0;i<gridYC;i++)
    {
        for(let j=0;j<gridXC;j++)
        {
            let decesion = gw.decision( j, i, policy,0);
            ctx.save();
            ctx.translate(cellW*j, cellH*i);

            ctx.strokeRect(0,0,cellW,cellH);

            let reward=gw.reward(j,i);
            //console.log(decesion);
            reward=reward*10+128;

            ctx.fillStyle =
            'rgb(' + reward + ','+reward+','+reward+')';
            
            ctx.fillRect(0,0,cellW,cellH);

            drawPolicy(ctx,policy[i][j],cellW,cellH);
            ctx.restore();
        }
    }
}

function policyTrain(policy,expirence)
{
    let discount_factor = 0.7;
    //console.log(policy,expirence);

    if(expirence.r!=0)
    {
        policy[expirence.s.y][expirence.s.x][expirence.a]=expirence.r;
    }
    else
    {
        let next_exp = policy[expirence.s_next.y][expirence.s_next.x];
        let max_exp = next_exp.reduce((maxV,v)=>(maxV<v)?v:maxV,0);
        policy[expirence.s.y][expirence.s.x][expirence.a]=max_exp*discount_factor;
    }
}


function getEnvFeedBack(policy,stepLimit=300)
{
    let score=0;
    let location={x:0,y:0};
    let i;
    for(i=0;i<stepLimit;i++)
    {
        let decesion = gw.decision( location.x, location.y, policy,1);
        let action = decesion.reduce((iMax, x, i, arr) => x > arr[iMax] ? i : iMax, 0);
        //console.log(location,decesion,action)
        if(Math.random()>0.9)
        {
            action=Math.floor(Math.random()*4);
            if(action==4)action=3;
        }
        let location_BK = Object.assign({},location);
        switch(action)
        {
            case 0://up
            location.y-=1;
            break;
            case 1://down
            location.y+=1;
            break;
            case 2://left
            location.x-=1;
            break;
            case 3://right
            location.x+=1;
            break;
            default:

            break;
        }
        
        let reward = gw.reward(location.x, location.y);
        //if(reward==0 && i==stepLimit-1)reward=100;
        let experience = {
            s:location_BK,
            a:action,
            r:reward,
            s_next:location
        };
        policyTrain(policy,experience);
        if(reward==-10000)break;
        //if(reward!=0)break;
    }
    //console.log(location);
    return score;
}


let policy = gw.RandomPolicy_Init(0);

console.log(policy);
setInterval(()=>{
    
    getEnvFeedBack(policy);
    getEnvFeedBack(policy);
    getEnvFeedBack(policy);
    getEnvFeedBack(policy);
    getEnvFeedBack(policy);
    getEnvFeedBack(policy);
    getEnvFeedBack(policy);
    getEnvFeedBack(policy);
    drawPlot(gw,policy);
},100);

