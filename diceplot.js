/*
  dicePlot – generic dice‐plot renderer (JS / D3 v7)
  cfg – {
    data: array<object>,
    x: "column name for X",
    y: "column name for Y",
    z: "column name for Z categories (dot colours)",
    group: "column for group rectangles" | null,
    container: css selector | HTMLElement,
    width: number (total SVG width incl. legend),
    height: number,
    dotRadius: number (uniform radius for every dot),
    groupAlpha: number (opacity for group rectangles),
    clusterRows: boolean,
    clusterCols: boolean,
    reverseOrdering: boolean,
    zColors: Map<string,string> | null,
    groupColors: Map<string,string> | null,
    showLegend: boolean
  }
*/
export function diceplot(cfg) {
  /* --- defaults & args --------------------------------------------------- */
  const {
    data,
    x,
    y,
    z,
    group = null,
    container,
    width = 700,
    height = 450,
    dotRadius = 8,
    groupAlpha = 0.5,
    clusterRows = true,
    clusterCols = true,
    reverseOrdering = false,
    zColors = null,
    groupColors = null,
    showLegend = true
  } = cfg;
  if (!data?.length) throw new Error("data required");

  /* --- helpers ----------------------------------------------------------- */
  const uniq = a => Array.from(new Set(a));
  const byCount = arr => {
    const c = d3.rollup(arr, v => v.length, d => d);
    return Array.from(c, ([k, v]) => ({ k, v }))
      .sort((a, b) => d3.descending(a.v, b.v) || d3.ascending(a.k, b.k))
      .map(d => d.k);
  };

  /* --- variable positions (dice offsets) --------------------------------- */
  const createVarPositions = vars => {
    const off = {
      6: [[-0.2, 0.2, -0.2, 0.2, -0.2, 0.2],[ 0.2, 0.2,   0,   0, -0.2, -0.2]],
      5: [[   0,-0.2, 0.2,-0.2, 0.2],[   0, 0.2, 0.2,-0.2,-0.2]],
      4: [[-0.2, 0.2,-0.2, 0.2],[ 0.2, 0.2,-0.2,-0.2]],
      3: [[   0,-0.2, 0.2],[   0, 0.2,-0.2]],
      2: [[-0.2, 0.2],[ 0.2,-0.2]],
      1: [[0],[0]]
    };
    const [xs, ys] = off[vars.length] || [];
    return vars.map((v,i)=>({var:v,xOffset:xs[i],yOffset:ys[i]}));
  };

  /* --- factor levels ----------------------------------------------------- */
  const zLevels = uniq(data.map(d=>d[z]));
  const varPositions = createVarPositions(zLevels);

  /* --- colour maps ------------------------------------------------------- */
  const defaultPal = (n, key) => d3[key]?.slice(0,n) || d3.schemeSet3.slice(0,n);
  const zCol = zColors || Object.fromEntries(zLevels.map((v,i)=>[v,defaultPal(zLevels.length,"schemeSet3")[i]]));

  let groupLevels = [], gCol = {};
  if (group) {
    groupLevels = uniq(data.map(d=>d[group]));
    gCol = groupColors || Object.fromEntries(groupLevels.map((v,i)=>[v,defaultPal(groupLevels.length,"schemeSet2")[i]]));
  }

  /* --- ordering ---------------------------------------------------------- */
  const orderAxis = (vals, cluster, grpCol) => {
    if (cluster && grpCol) {
      const counts = d3.rollup(data, v=>v.length, d=>d[vals], d=>d[grpCol]);
      return Array.from(counts,([k,m])=>({k,v:Array.from(m.values()).reduce((a,b)=>a+b,0)}))
        .sort((a,b)=>d3.descending(a.v,b.v)||d3.ascending(a.k,b.k))
        .map(d=>d.k);
    }
    return byCount(data.map(d=>d[vals]));
  };

  const yOrder = (reverseOrdering? orderAxis(y,clusterRows,group).reverse():orderAxis(y,clusterRows,group));
  const xOrder = orderAxis(x,clusterCols,null);

  const xPos = new Map(xOrder.map((d,i)=>[d,i+1]));
  const yPos = new Map(yOrder.map((d,i)=>[d,i+1]));

  /* --- processed data ---------------------------------------------------- */
  const pts = data.map(d=>{
    const vp = varPositions.find(v=>v.var===d[z]);
    return { X:xPos.get(d[x])+vp.xOffset, Y:yPos.get(d[y])+vp.yOffset, z:d[z], grp:group?d[group]:null };
  });

  /* --- layout dims ------------------------------------------------------- */
  const legendSpace = showLegend?140:0;                  // reserved rhs space
  const margin = {top:30,right:20,bottom:60,left:60};
  const gridW  = width  - margin.left - margin.right - legendSpace;
  const gridH  = height - margin.top  - margin.bottom;

  /* --- svg & container --------------------------------------------------- */
  const svg = d3.select(container).append("svg")
    .attr("width", width)
    .attr("height", height);
  const g = svg.append("g").attr("transform",`translate(${margin.left},${margin.top})`);

  const xScale = d3.scaleLinear().domain([0.5,xOrder.length+0.5]).range([0,gridW]);
  const yScale = d3.scaleLinear().domain([0.5,yOrder.length+0.5]).range([gridH,0]);

  /* --- background boxes -------------------------------------------------- */
  const boxes = group?
    d3.rollups(data,v=>v[0][group],d=>d[x],d=>d[y]).flatMap(([cx,rows])=>rows.map(([cy,grp])=>({cx,cy,grp}))):
    d3.cross(xOrder,yOrder).map(([cx,cy])=>({cx,cy,grp:null}));

  g.selectAll("rect")
    .data(boxes)
    .join("rect")
      .attr("x",d=>xScale(xPos.get(d.cx))-gridW/xOrder.length/2)
      .attr("y",d=>yScale(yPos.get(d.cy))-gridH/yOrder.length/2)
      .attr("width",gridW/xOrder.length)
      .attr("height",gridH/yOrder.length)
      .attr("fill",d=>group?d3.color(gCol[d.grp]).copy({opacity:groupAlpha}):"#fff")
      .attr("stroke","#333")
      .attr("stroke-width",1);

  /* --- points ------------------------------------------------------------ */
  g.selectAll("circle")
    .data(pts)
    .join("circle")
      .attr("cx",d=>xScale(d.X))
      .attr("cy",d=>yScale(d.Y))
      .attr("r",dotRadius)
      .attr("fill",d=>zCol[d.z])
      .attr("stroke","#000");

  /* --- axes -------------------------------------------------------------- */
  g.append("g").attr("transform",`translate(0,${gridH})`)  
    .call(d3.axisBottom(d3.scalePoint().domain(xOrder).range([0,gridW])))
    .selectAll("text")
      .style("text-anchor","end")
      .attr("transform","rotate(-45)");

  g.append("g")
    .call(d3.axisLeft(d3.scalePoint().domain(yOrder).range([gridH,0])));

  /* --- legend ------------------------------------------------------------ */
  if(!showLegend) return svg.node();
  const legend = svg.append("g")
    .attr("transform",`translate(${margin.left+gridW+30},${margin.top})`);

  zLevels.forEach((v,i)=>{
    legend.append("circle").attr("cx",0).attr("cy",i*18).attr("r",5).attr("fill",zCol[v]).attr("stroke","#000");
    legend.append("text").attr("x",10).attr("y",i*18+4).text(v).style("font-size","11px");
  });

  if(group){
    const offset = zLevels.length*20;
    groupLevels.forEach((v,i)=>{
      legend.append("rect").attr("x",-5).attr("y",offset+i*18-6).attr("width",12).attr("height",12)
        .attr("fill",gCol[v]).attr("stroke","#555").attr("opacity",groupAlpha);
      legend.append("text").attr("x",10).attr("y",offset+i*18+4).text(v).style("font-size","11px");
    });
  }

  return svg.node();
}
