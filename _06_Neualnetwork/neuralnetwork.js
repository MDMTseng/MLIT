
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

function CreateNeuralNode(InputCount,mult=1)
{
    //Create single node
    //Example:
    //InputCount =3
    //[0.23423, 0.56,  0.7,  0.3 ]

    let arr = [];
    let dw = [];
    for(let i=0;i<InputCount+1;i++)
    {
        arr.push(random(mult));
        dw.push(0);
    }
    return {w:arr,dw:dw};
}
function CreateNeuralNetLayer(previousNodeCount,NodeCount)
{
    //Create single layer

    //NodeCount =3
    //[{Node} {Node} {Node}]

    let arr = [];
    let node_value = [];
    let node_gradient = [];
    for(let i=0;i<NodeCount;i++)
    {
        arr.push(CreateNeuralNode(previousNodeCount));
        node_value.push(0);
        node_gradient.push(0);
    }
    return {nodes:arr,node_value:node_value,node_gradient:node_gradient}
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





function nodeBackProp(preLayer,node,nodeGradient)
{
    let i=0;
    for(i=0;i<node.w.length-1;i++)
    {
        node.dw[i]=preLayer.node_value[i]*nodeGradient;
    }
    node.dw[i]=1*nodeGradient;
}


function layerBackProp(preLayer,currentLayer)
{
    for(i=0;i<currentLayer.nodes.length;i++)
    {
        nodeBackProp(preLayer,currentLayer.nodes[i],currentLayer.node_gradient[i]);
    }

    return ;
}


function nodeGradientBackProp(curNodeIdx,nextLayer)
{
    let i=0;
    let totalGradient=0;
    for(i=0;i<nextLayer.nodes.length;i++)
    {
        totalGradient+=
            nextLayer.nodes[i].w[curNodeIdx]*
            nextLayer.node_gradient[i];
    }
    return totalGradient;
}

function backProp(input,network,target_output,alpha)
{
    //Create complete network
    let pred_output = NeuralNetForwardPass(input,network);
    let gradient =[];
    let error=0;
    for(let i=0;i<pred_output.length;i++)
    {
        let diff = pred_output[i]-target_output[i] ;
        gradient.push(diff);
        error+=diff*diff;
    }
    
    for(let i=network.layers.length-1;i>=1;i--)
    {
        let layer = network.layers[i];
        let prelayer = network.layers[i-1];
        for(let j=0;j<layer.node_gradient.length;j++)
        {
            if( i<network.layers.length-1)
            {
                layer.node_gradient[j]=nodeGradientBackProp(j,network.layers[i+1]);
            }
            else
            {
                layer.node_gradient[j]=gradient[j];
            }
            if(layer.node_value[j]<=0)
            {
                layer.node_gradient[j]*=0.1;
            }
        }
        layerBackProp(prelayer,layer);
    }

    for(let i=0;i<network.layers.length;i++)
    {
        let layer = network.layers[i];
        for(let j=0;j<layer.nodes.length;j++)
        {
            let node = layer.nodes[j];
            for(let k=0;k<node.w.length;k++)
            {
                node.w[k]-=node.dw[k]*alpha;
            }
        }
    }


    return error ;
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
                                parent1.x.layers[i].nodes[j].w[k]*parent1.y + 
                                parent2.x.layers[i].nodes[j].w[k]*parent2.y)/(parent1.y+parent2.y);

                            if(Math.random()>0.99)
                                node.w[k]+=random(1);
                            node.w[k]+=random(0.06);
                            node.w[k] *=0.999;
                            let L1_p=0.005;
                            if(Math.abs(node.w[k])>L1_p)
                                node.w[k] -=Math.sign(node.w[k])*L1_p;
                            else
                            {
                                node.w[k] =0;
                            }
                        }
                        if(idx!=0)
                            node.w[k]+=random(0.001);

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
    downloadObjectAsJson(JSON.stringify(creatures[0]),"xxxx.json");
    EVOLVE_NEURAL(true);   

}
function downloadObjectAsJson(exportObj, exportName){
    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj));
    var downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", exportName + ".json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
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
    for(let i=0;i<1;i++)
        EVOLVE_NEURAL();   
    testBestFit();
},10000)


let netWork = CreateNeuralNet([1,6,6,6,6,2]);

for(let j=0;j<1000;j++)
{
    let error=0;
    for(let i=0;i<100;i++)
    {
        let input = [i/100.0-0.5];
        let targetOutput = targetFunction(input[0]);
        error+=backProp(input,netWork,targetOutput,0.1);
    }
    console.log(error);
}


console.log(creatures);