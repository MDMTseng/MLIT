
function drawPlot(p1,p2)
{
    setPlot(WorldPlot,1,p1);
    setPlot(WorldPlot,0,p2);
    setPlotYLimit(WorldPlot,0,{min:0,max:10});
    setPlotYLimit(WorldPlot,1,{min:0,max:10});
    WorldPlot.update();
}

function act_ReLu()
{
    return {
        func:(val)=>(val>0)?val:val*0,
        grad:(val)=>(val>0)?1:0.1,
    }
}

function act_Linear()
{
    return {
        func:(val)=>val,
        grad:(val)=>1,
    }
}
function act_tanX()
{
    return {
        func:(val)=>{
            if(val>-1 && val<1)return val;
            if(val>1)
            {
                return 1+0.1*(val-1);
            }
            return -1+0.1*(val+1);
        },
        grad:(val)=>{
            if(val>-1 && val<1)return 1;
            return 0.1;
        },
    }
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
        if(i==network_shape.length-1)
        {//Last layer
            layers[layers.length-1].act = act_Linear();
        }
        else
            layers[layers.length-1].act = act_ReLu();
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
    //if(valueSum<0)valueSum=0;//ReLu
    return valueSum;
}


function NeuralNetLayerForwardPass(preLayer,currentLayer)
{

    for(i=0;i<currentLayer.nodes.length;i++)
    {
        currentLayer.node_value[i]=currentLayer.act.func(
            NeuralNetNodeForwardPass(preLayer,currentLayer.nodes[i]));
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
        node.dw[i]+=preLayer.node_value[i]*nodeGradient;
    }
    node.dw[i]+=1*nodeGradient;
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

function dwReset(network)
{

    for(let i=0;i<network.layers.length;i++)
    {
        let layer = network.layers[i];
        for(let j=0;j<layer.nodes.length;j++)
        {
            let node = layer.nodes[j];
            for(let k=0;k<node.w.length;k++)
            {
                node.dw[k]=0;
            }
            //console.log(node.dw)
        }
    }
}
function dwUpdate(network,alpha)
{
    for(let i=0;i<network.layers.length;i++)
    {
        let layer = network.layers[i];
        for(let j=0;j<layer.nodes.length;j++)
        {
            let node = layer.nodes[j];
            for(let k=0;k<node.w.length;k++)
            {
                node.w[k]-=node.dw[k]*alpha;
                node.w[k]*=0.9999;
            }
            //console.log(node.dw)
        }
    }
}
function backProp(input,network,target_output)
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

            layer.node_gradient[j] *=layer.act.grad(layer.node_value[j]);

        }
        layerBackProp(prelayer,layer);
    }



    return error ;
}

