
function drawPlot(p1,p2)
{
    setPlot(WorldPlot,1,p1);
    setPlot(WorldPlot,0,p2);
    setPlotYLimit(WorldPlot,0,{min:0,max:100});
    setPlotYLimit(WorldPlot,1,{min:0,max:100});
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
    for(let i=0;i<InputCount+1;i++)
    {
        arr.push(random(1));
    }
    return {w:arr}
}
function CreateNeuralNetLayer(previousNodeCount,NodeCount)
{
    //Create single layer

    //NodeCount =3
    //[{Node} {Node} {Node}]

    let arr = [];
    let node_value = [];
    for(let i=0;i<NodeCount;i++)
    {
        arr.push(CreateNeuralNode(previousNodeCount));
        node_value.push(0);
    }
    return {nodes:arr,node_value:node_value}
}
function CreateNeuralNet(network_shape)
{
    //Create complete network
    //network_shape = [1,4,4,4,1] to create a network that has one input, 
    //one output and has three hidden layers with 4 nodes within it.

    let layers=[];

    for(let i=1;i<network_shape.length;i++)
    {
        layers.push(CreateNeuralNetLayer(network_shape[i-1],network_shape[i]));
    }

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




function EVOLVE_NEURAL()
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

    //drawPlot(creatures);
    let topScore = topN_List[0].y;

    console.log("top:"+topScore, "mid:"+leastAcceptedScore);
    //MaxScoreField.innerText = topScore;
    //MidScoreField.innerText = leastAcceptedScore;
    for(let idx=0;idx<creatures.length;idx++)
    {

        let body = creatures[idx];
        let network = body.x;
        {
            let parent1=topN_List[Math.floor(Math.random()*topN)].x;
            let parent2=topN_List[Math.floor(Math.random()*topN)].x;
            for(let i=0;i<network.layers.length;i++)
            {
                let layer = network.layers[i];
                for(let j=0;j<layer.nodes.length;j++)
                {
                    let node = layer.nodes[j];
                    for(let k=0;k<node.w.length;k++)
                    {
                        let w = node.w[k];
                        
                        if(idx>topN)
                        {
                            node.w[k] = (
                                parent1.layers[i].nodes[j].w[k] + 
                                parent2.layers[i].nodes[j].w[k])/2;
                            node.w[k]+=random(1);
                        }

                        node.w[k]+=random(0.04);
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
    return (tmp*tmp)*100;
}
function getEnvFeedBack(network)
{
    let error=0;

    for(let i=0;i<100;i++)
    {
        let input=i/10.0;
        let targetOutput = targetFunction(input);
        let output = NeuralNetForwardPass([input],network);
        output = output[0];
        error += (output-targetOutput)*(output-targetOutput);
    }
    return -error;
}


function generate_creatures(count,scale=0.1)
{
    let creatures=[];
    for(let i=0;i<count;i++)
    {
        creatures.push({x:CreateNeuralNet([1,5,6,7,1]),y:0});
    }
    return creatures;
}


let creatures = generate_creatures(100);



function testBestFit()
{
    let data=[];
    let pred=[];

    for(let i=0;i<100;i++)
    {
        let input=i/10.0;
        let targetOutput = targetFunction(input);
        let output = NeuralNetForwardPass([input],creatures[0].x);
        output = output[0];
        data.push({x:input,y:targetOutput});
        pred.push({x:input,y:output});
    }

    drawPlot(data,pred);
}


setInterval(()=>{
    for(let i=0;i<1;i++)
        EVOLVE_NEURAL();   
    testBestFit();
},100)

console.log(creatures);