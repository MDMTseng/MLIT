


function GridWorld(theWorld)
{
    this.theWorld=theWorld;
    
    

    this.reward = function( x, y){
        if(x<0 || y<0)return -10000;
        if(x>=this.theWorld[0].length || 
           y>=this.theWorld.length)return -10000;
        return  this.theWorld[y][x];
    };



    this.decision = function( x, y, policy, exploration_factor=0 ){
        return  [
            policy[y][x][0]+this.rand(exploration_factor),
            policy[y][x][1]+this.rand(exploration_factor)];
    };


    this.rand=function(scale=1)
    {
        return (Math.random()-0.5)*2*scale;
    };

    this.RandomPolicy_Init = function(scale){
        let policy=[];
        for(let i=0;i<this.theWorld.length;i++)
        {
            let sub_policy=[];
            for(let j=0;j<this.theWorld[i].length;j++)
            {
                sub_policy.push([this.rand(scale),this.rand(scale)]);
            }
            policy.push(sub_policy);
        }
        return  policy;
    };


    this.Policy_Mix = function(outPolicy ,policies){

        for(let i=0;i<this.theWorld.length;i++)
        {
            for(let j=0;j<this.theWorld[i].length;j++)
            {
                let policySum=[0,0];
                let WCount=0;

                for(let k=0;k<policies.length;k++)
                {
                    let W = Math.random();
                    policySum[0] += W*policies[k][i][j][0];
                    policySum[1] += W*policies[k][i][j][1];
                    WCount +=W;
                }
                outPolicy[i][j][0]=policySum[0]/WCount;
                outPolicy[i][j][1]=policySum[1]/WCount;
            }
        }
        return  outPolicy;
    };

    this.Policy_Mutate = function(outPolicy,inPolicy,scale=0.1,xratio=0.01,xscale=1){
        
        for(let i=0;i<this.theWorld.length;i++)
        {
            for(let j=0;j<this.theWorld[i].length;j++)
            {
                outPolicy[i][j][0]=inPolicy[i][j][0]+this.rand(scale);
                outPolicy[i][j][1]=inPolicy[i][j][1]+this.rand(scale);
                if(Math.random()<xratio)
                {
                    outPolicy[i][j][0]+=this.rand(xscale);
                    outPolicy[i][j][1]+=this.rand(xscale);
                }
                outPolicy[i][j][0]*=0.999;
                outPolicy[i][j][1]*=0.999;
            }
        }
        return  outPolicy;
    };
}

let test=false;

if(test){
    let gw = new GridWorld([
        [0,0,0,-1],
        [0,0,0,-1],
        [0,0,0,-1],
        [0,0,100,-1]
    ]);



    let policy = gw.RandomPolicy_Init();
    console.log(JSON.stringify(policy[2]));
    policy = gw.Policy_Mutate(policy,policy);
    console.log(JSON.stringify(policy[2]));

    for(let life=0;life<100;life++)
    {
        let score=0;
        let location={x:0,y:0};
        for(let i=0;i<100;i++)
        {
            let decesion = gw.decision( location.x, location.y, policy);
            location.y+=(decesion[0]<0)?-1:1;
            location.x+=(decesion[1]<0)?-1:1;
        
            let reward = gw.reward(location.x, location.y);
            score+=reward+1;
            if(reward<-0)break;

        }

        console.log(score);

        policy = gw.Policy_Mutate(policy,policy);
    }
}