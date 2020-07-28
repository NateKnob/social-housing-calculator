defaults = {
  renter_data: [
    {name:"High Subsidy", ami:30, count:30},
    {name:"Low Subsidy", ami:70, count:30},
    {name:"Cost Rents", ami:90, count:30},
    {name:"Low Market", ami:70, count:30},
    {name:"High Market", ami:80, count:60},
  ],
  market_rent: 1300,
  cost_rent: 1000,
}

function set_defaults() {
  [...Array(3).keys()].forEach(i => {
    $("#renter-name-"+(i+1)).val(defaults.renter_data[i].name);
    $("#renter-ami-"+(i+1)).val(defaults.renter_data[i].ami);
    $("#renter-count-"+(i+1)).val(defaults.renter_data[i].count);
  });

  $("#calculator-form").click(function(e){
      e.preventDefault();
      create_chart();
  });
}

function create_chart() {

  market_rent = defaults.market_rent;
  cost_rent = defaults.cost_rent;

  renter_data = [];
  [...Array(3).keys()].forEach(i => {
    ami = Math.min(Math.max($("#renter-ami-"+(i+1)).val(), 0), 100);
    rent = ami*market_rent/100;

    p = Math.max(rent-cost_rent, 0);
    fp = market_rent - cost_rent - p;
    rbc = Math.min(rent, cost_rent);
    ls = cost_rent - rbc;

    renter_data.push({
      name: $("#renter-name-"+(i+1)).val(),
      fp: fp,
      p: p,
      rbc: rbc,
      ls: ls,
      ami: ami,
      rent: rent,
      count: $("#renter-count-"+(i+1)).val(),
    })
  });

  renter_data.sort((a,b) => a.rent - b.rent);

  rent_levels = [
    {name: "Foregone Profit", key: "fp"},
    {name: "Profit", key: "p"},
    {name: "Loss from Subsidy", key: "ls"},
    {name: "Rent Below Cost", key: "rbc"}
  ]

  renter_data_seg = []

  renter_data.forEach(row => {
    rent_levels.forEach(rl => {
      renter_data_seg.push({
        renter_name: row.name,
        count: row.count,
        key: rl.key,
        value: row[rl.key],
        rent_name: rl.name
      })
    })
  });


  margin = ({top: 10, right: 10, bottom: 20, left: 40})
  height = 200
  width = 400
  formatValue = x => isNaN(x) ? "N/A" : x.toLocaleString("en")



  y = d3.scaleLinear()
    .domain([0, 1300])
    .range([height - margin.bottom, margin.top])

  x = d3.scaleLinear()
    .domain(renter_data.map(d => d.name))
    .range([margin.left, width - margin.right])

  yAxis = g => g
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).ticks(null, "s"))
    .call(g => g.selectAll(".domain").remove())

  xAxis = g => g
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).tickSizeOuter(0))
    .call(g => g.selectAll(".domain").remove())

  color = d3.scaleOrdinal(d3.schemeCategory10)



  const svg = d3.select("#chart-zone")
    .html("")
    .append("svg")
    .attr("viewBox", [0, 0, width, height]);

  treemap = data => d3.treemap()
    .tile(d3.treemapSliceDice)
    .size([
      width - margin.left - margin.right,
      height - margin.top - margin.bottom
    ])
  (d3.hierarchy(
    {
      values: d3.nest()
          .key(d => d.renter_name)
          .key(d => d.key)
        .entries(renter_data_seg)
    },
    d => d.values
  ).sum(d => d.value*d.count))
  .each(d => {
    d.x0 += margin.left;
    d.x1 += margin.left;
    d.y0 += margin.top;
    d.y1 += margin.top;
  })

  format = d3.format(",d")

  const root = treemap(renter_data_seg);

  const node = svg.selectAll("g")
    .data(root.descendants())
    .join("g")
      .attr("transform", d => `translate(${d.x0},${d.y0})`);

  const cell = node.filter(d => d.depth === 2);

  cell.append("rect")
      .attr("fill", d => color(d.data.key))
      .attr("fill-opacity", 0.5)
      .attr("width", d => d.x1 - d.x0)
      .attr("height", d => d.y1 - d.y0)
      .each((d, i, nodes) => {
        d3.select(nodes[i])
          .classed("rl_"+d.data.key, true)
          .on("mouseover", () => d3.selectAll(".rl_"+d.data.key).transition().style('fill-opacity',0.8))
          .on("mouseout", () => d3.selectAll(".rl_"+d.data.key).transition().style('fill-opacity',0.5))
      })

  rent_levels.forEach(rl => {
    d3.selectAll(".rl_"+rl.rent_name)
      .on("mouseover", (d,i)=> { d3.select('#elementname'+i).style('fill','red');});
  })

  svg.append("g")
    .call(xAxis);

  svg.append("g")
    .call(yAxis);

  // return svg.node();
}

d3.select(window).on("load", () => {
  set_defaults();
  create_chart();
});
