/**
 * Converts an HSV color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSV_color_space.
 * Assumes h, s, and v are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   Number  h       The hue
 * @param   Number  s       The saturation
 * @param   Number  v       The value
 * @return  Array           The RGB representation
 */
function hsvToRgb(h, s, v) {
    var r, g, b;
  
    var i = Math.floor(h * 6);
    var f = h * 6 - i;
    var p = v * (1 - s);
    var q = v * (1 - f * s);
    var t = v * (1 - (1 - f) * s);
  
    switch (i % 6) {
      case 0: r = v, g = t, b = p; break;
      case 1: r = q, g = v, b = p; break;
      case 2: r = p, g = v, b = t; break;
      case 3: r = p, g = q, b = v; break;
      case 4: r = t, g = p, b = v; break;
      case 5: r = v, g = p, b = q; break;
    }
  
    return [ r * 255, g * 255, b * 255 ];
  }

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
                //outPolicy[i][j][0]*=0.999;
                //outPolicy[i][j][1]*=0.999;
                let mg = Math.hypot(outPolicy[i][j][0],outPolicy[i][j][1]);
                outPolicy[i][j][0]/=mg;
                outPolicy[i][j][1]/=mg;

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