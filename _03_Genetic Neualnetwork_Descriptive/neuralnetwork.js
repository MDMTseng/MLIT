

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




//@@@@@@@@@@a.描述主要功能
function EVOLVE_NEURAL()
{
    for(let i=0;i<creatures.length;i++)
    {
        //@@@@@@@@@@b.說明功能及意義
        let body = creatures[i];
        body.y=getEnvFeedBack(body.x);
    }
    
    //@@@@@@@@@@c.說明以下程式功能及意義
    //@@@@@@@@@@d.若只想取得前10名應如何修改？
    creatures.sort(function(a, b){return b.y-a.y});//@@@@@@@@@@e.為何對個體的y做排序？
    let topN=Math.floor(creatures.length*0.5);
    let leastAcceptedScore = creatures[topN].y;
    let topN_List=creatures.slice(0, topN);
    let topScore = topN_List[0].y;

    console.log("top:"+topScore, "mid:"+leastAcceptedScore);
    for(let idx=0;idx<creatures.length;idx++)
    {
        let body = creatures[idx];
        let network = body.x;
        //@@@@@@@@@@ f.說明 if(idx>topN) 的意義    
        if(idx>topN)
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

                        node.w[k] = (
                            parent1.layers[i].nodes[j].w[k] + 
                            parent2.layers[i].nodes[j].w[k])/2;

                        node.w[k]+=random(1);
                    }

                }

            }

        }
        
    }
}

function getEnvFeedBack(network)
{
    let error=0;
    for(let i=0;i<10;i++)
    {
        let targetOutput =Math.sin(i*0.3);
        let output = NeuralNetForwardPass([i],network);
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


let creatures = generate_creatures(10);
for(let i=0;i<1000;i++)
{
    EVOLVE_NEURAL();
}
console.log(creatures);


for(let i=0;i<20;i++)
{
    let input =i*0.5;
    let targetOutput = Math.sin(input*0.3);
    let output = NeuralNetForwardPass([input],creatures[0].x);
    console.log(output,targetOutput);
}



//@@@@@@@@@@ g.請寫出讓以下-1的數字置換為０～２０的隨機數
//請不要寫死
let test_input = {
    data:[
        [
            [-1,-1],
            [-1,-1],
        ],
        [
            [123,-1],
        ],
        [
            [-1,-1],
            [123,-1],
            [-1,111],
            [123,-1],
        ]
    ]
};
console.log(test_input)