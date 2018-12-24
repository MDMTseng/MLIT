
class QPolicy
{
    constructor()
    {
        
        this.netWork = CreateNeuralNet([2,6,6,6,6,4]);
        this.experiances={
            pos:[],
            neutral:[],
            neg:[],
        };
        this.totalR=0;
    }

    fetchPolicy(input)
    {
        return NeuralNetForwardPass(input,this.netWork);
    }


    add_experience(experience)
    {
        if(experience.r>0)
        {

            this.experiances.pos.push(experience);
            if(this.experiances.pos.length>100)
                this.experiances.pos.shift();
            return;
        }
        if(experience.r<0)
        {

            this.experiances.neg.push(experience);
            if(this.experiances.neg.length>100)
                this.experiances.neg.shift();
            return;
        }

        {

            this.experiances.neutral.push(experience);
            if(this.experiances.neutral.length>100)
                this.experiances.neutral.shift();
            return;
        }
    }


    trainExp(experience)
    {
        let Q_next = this.fetchPolicy(experience.s_next).slice();
        let Q = this.fetchPolicy(experience.s).slice();

        if(experience.r!=0)Q[experience.a]=experience.r;
        else
        {
            let Q_next_max = Q_next.reduce((maxV,v)=>(maxV<v)?v:maxV,0);
            Q[experience.a]=Q_next_max*0.7;  
        }  
        //console.log(experience,Q);
        backProp(experience.s,this.netWork,Q);

    }
    
    train()
    {
        dwReset(this.netWork);

        //console.log(this.experiances.pos.length,this.experiances.neutral.length,this.experiances.neg.length);

        this.experiances.pos.forEach(this.trainExp.bind(this));
        this.experiances.neutral.forEach(this.trainExp.bind(this));
        this.experiances.neg.forEach(this.trainExp.bind(this));
        
        dwUpdate(this.netWork,0.0001);
    }

}






var canvas = document.getElementById("myGridWorld");
var ctx = canvas.getContext("2d");

ctx.width = canvas.width=800;
ctx.height = canvas.height=600;
let gw = new GridWorld([
    [0,0,0,-1,0,0,0,0,0.2],
    [0,0,0, 0,0,0,0,0,0],
    [0,0,0, 0,0,-1,0,0,1],
]);

function saturation(num,max=1,min=-1)
{
    if(num>max)return max;
    if(num<min)return min;
    return num;
}

function policyTorgb(policyValue)
{

    s_policy = (saturation(policyValue*4)+1)/2/3;
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

function drawPlot(env,policy,ENVState)
{
    /*let heatmapMax=0;
    for(let i=0;i<heatMap.length;i++)
    {
        for(let j=0;j<heatMap[i].length;j++)
        {
            if(heatmapMax<heatMap[i][j])
                heatmapMax=heatMap[i][j];
        }
    }*/
    ctx.fillStyle = "#FF0000";
    let gridXC = env.theWorld[0].length;
    let gridYC = env.theWorld.length;
    let cellH = canvas.height/gridYC;
    let cellW = canvas.width/gridXC;

    for(let i=0;i<gridYC;i++)
    {
        for(let j=0;j<gridXC;j++)
        {
            //
            ctx.save();
            ctx.translate(cellW*j, cellH*i);

            ctx.strokeRect(0,0,cellW,cellH);

            let reward=gw.reward(j,i);
            //console.log(decesion);
            reward=reward*200+128;

            ctx.fillStyle =
            'rgb(' + reward + ','+reward+','+reward+')';
            
            ctx.fillRect(0,0,cellW,cellH);
            let decesion = policy.fetchPolicy([j,i]);//gw.decision( j, i, policy,0);
            //console.log(decesion);
            drawPolicy(ctx,decesion,cellW,cellH);
            ctx.restore();
        }
    }

    ctx.save();
    ctx.translate(cellW*ENVState.location.x, cellH*ENVState.location.y);
    ctx.strokeRect(0,0,cellW,cellH);
    ctx.restore();
}

function ENVState_Init()
{
    return {
        location:{x:0,y:0},
        steps:0,
        reward:0
    }
}

function getEnvFeedBack(ENVState,policy,explorFactor=1,stepLimit=100)
{
    let location=ENVState.location;
    ENVState.steps++;

    {
        let state = [location.x,location.y];
        let decesion = policy.fetchPolicy(state);

        //decesion = decesion.map((dec)=>dec+Math.random()-0.5)
        let action = decesion.reduce((iMax, x, i, arr) => x > arr[iMax] ? i : iMax, 0);
        //console.log(location,decesion,action)
        if(Math.random()>1/(explorFactor+1))
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
        let state_next = [location.x,location.y];
        
        let reward = gw.reward(location.x, location.y);
        let saturated_r = reward;
        if(saturated_r>1)saturated_r=1;
        else if(saturated_r<-1)saturated_r=-1;
        ENVState.reward+=saturated_r;
        //if(reward==0 && i==stepLimit-1)reward=100;
        let experience = {
            s:state,
            a:action,
            r:saturated_r,
            s_next:state_next
        };
        //policyTrain(policy,experience);
        
        policy.add_experience(experience);
        if(reward!=0000|| ENVState.steps == stepLimit)
        {
            return false;
        }
        //if(reward!=0)break;
    }
    return true;
}

let ENVState=ENVState_Init();

let policy = new QPolicy();



let explorFactor=1;

function Explor()
{
    explorFactor=1;
}
function DoBest()
{
    explorFactor=0;
}


let Disp_skip_N=1;
function Disp_Play()
{
    Disp_skip_N=1;
}
function Disp_Pause()
{
    Disp_skip_N=0;
}

function Disp_FastForward()
{
    Disp_skip_N=Disp_skip_N*2+1;
}



setInterval(()=>{
    if(Disp_skip_N==0)return;
    for(let i=0;i<Disp_skip_N;i++)
    {
        if(getEnvFeedBack(ENVState,policy,explorFactor) == false)
        {
            console.log(ENVState.reward);
            ENVState = ENVState_Init();
            policy.train();
            
        }
    }
    drawPlot(gw,policy,ENVState);
},100);

