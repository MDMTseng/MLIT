
function drawPlot(p1,p2)
{
    setPlot(WorldPlot,1,p1);
    setPlot(WorldPlot,0,p2);
    setPlotYLimit(WorldPlot,0,{min:0,max:10});
    setPlotYLimit(WorldPlot,1,{min:0,max:10});
    WorldPlot.update();
}


function random(scale=1)
{
    return scale*2*(Math.random()-0.5);
}

function CreateNeuralNode(InputCount)
{
    //Create single node
    //Example:
    //InputCount =3
    //[0.23423, 0.56,  0.7,  0.3 ]

    let arr = [];
    //@ 1, create a single node with for loop

    return {w:arr}
}
function CreateNeuralNetLayer(previousNodeCount,NodeCount)
{
    //Create single layer

    //NodeCount =3
    //[{Node} {Node} {Node}]

    let arr = [];
    let node_value = [];
    //@ 2, create a single layer with for loop
    return {nodes:arr,node_value:node_value}
}
function CreateNeuralNet(network_shape)
{
    //Create complete network
    //network_shape = [1,4,4,4,1] to create a network that has one input, 
    //one output and has three hidden layers with 4 nodes within it.

    let layers=[];

    //@ 3, create a single network with for loop
    //

    return {layers:layers};
}



function NeuralNetNodeForwardPass(preLayer,currentNode)
{
    let valueSum=0;
    let i=0;
    for(i=0;i<preLayer.node_value.length;i++)
    {
        valueSum+=preLayer.node_value[i]*currentNode.w[i];
    }
    valueSum+=currentNode.w[currentNode.w.length-1];
    if(valueSum<0)valueSum=0;//ReLu
    return valueSum;
}


function NeuralNetLayerForwardPass(preLayer,currentLayer)
{

    for(i=0;i<currentLayer.nodes.length;i++)
    {
        currentLayer.node_value[i]=
            NeuralNetNodeForwardPass(preLayer,currentLayer.nodes[i]);
    }
    return currentLayer.node_value;
}

function NeuralNetForwardPass(input,network)
{
    //Create complete network
    let inputLayer = {node_value:input};
    NeuralNetLayerForwardPass(inputLayer,network.layers[0]);
    for(let i=1;i<network.layers.length;i++)
    {
        NeuralNetLayerForwardPass(network.layers[i-1],network.layers[i]);
    }
    return network.layers[network.layers.length-1].node_value;
}




function EVOLVE_NEURAL(doprint=false)
{
    for(let i=0;i<creatures.length;i++)
    {
        let body = creatures[i];
        body.y=getEnvFeedBack(body.x);

    }
    //drawPlot(worldEnv,creatures);

    creatures.sort(function(a, b){return b.y-a.y});
    let topN=Math.floor(creatures.length*0.1);
    let leastAcceptedScore = creatures[topN].y;
    let topN_List=creatures.slice(0, topN);

    //drawPlot(creatures);
    let topScore = topN_List[0].y;
    if(doprint)
        console.log("top:"+topScore, "mid:"+leastAcceptedScore);
    //MaxScoreField.innerText = topScore;
    //MidScoreField.innerText = leastAcceptedScore;
    for(let idx=0;idx<creatures.length;idx++)
    {

        let body = creatures[idx];
        let network = body.x;
        {
            let parent1=topN_List[Math.floor(Math.random()*topN)];
            let parent2=topN_List[Math.floor(Math.random()*topN)];
            //@ 4, complete the forloop (the ... part)
            for(...)
            {
                let layer = network.layers[i];
                for(...)
                {
                    let node = layer.nodes[j];
                    for(...)
                    {
                        let w = node.w[k];
                        
                        if(idx>topN)
                        {
                            //@ 5, produce decendent 
                        }

                    }
                    
                    

                }

            }

        }
        

        //body.y=0;
    }
}

function targetFunction(input)
{
    let tmp = (input/10.0-0.5);
    let output1 =Math.sin(tmp*10)*2+4;
    let output2 =tmp*10+10;

    return [output1,output2];
}
function getEnvFeedBack(network)
{
    let error=0;

    for(let i=0;i<100;i++)
    {
        let input=(i-50)/10.0;
        let targetOutput = targetFunction(input);
        let output = NeuralNetForwardPass([input],network);
        error += Math.pow(output[0]-targetOutput[0],2)*4+
                 Math.pow(output[1]-targetOutput[1],2);
    }
    return -error;
}


function generate_creatures(count,scale=0.1)
{
    let creatures=[];
    for(let i=0;i<count;i++)
    {
        creatures.push({x:CreateNeuralNet([1,6,6,6,6,2]),y:0});
    }
    return creatures;
}


let creatures = generate_creatures(70);


let tmpC =0;
function ChangePlot()
{
    
    tmpC+=1;
    if(tmpC>1)tmpC=0;
}
function PrintBest()
{
    console.log(JSON.parse(JSON.stringify(creatures[0])));

    EVOLVE_NEURAL(true);   

}
function testBestFit()
{
    let data=[];
    let pred=[];
    for(let i=0;i<100;i++)
    {
        let input=(i-50)/10.0;
        let targetOutput = targetFunction(input);
        let output = NeuralNetForwardPass([input],creatures[0].x);
        data.push({x:input,y:targetOutput[tmpC]});
        pred.push({x:input,y:output[tmpC]});
    }

    drawPlot(data,pred);
}


setInterval(()=>{
    for(let i=0;i<10;i++)
        EVOLVE_NEURAL();   
    testBestFit();
},100)

console.log(creatures);