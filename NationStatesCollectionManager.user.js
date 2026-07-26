// ==UserScript==
// @name         NationStates Collection Manager
// @namespace    Orks
// @version      15.2
// @description  Intelligent Trading Card portfolio manager. Tracks value, protects investments, detects genuine sells and duplicate opportunities.
// @author       Orks
// @match        https://www.nationstates.net/page=deck/value_deck=1*
// @match        https://www.nationstates.net/page=deck/collection*
// @grant        none
// ==/UserScript==


(() => {

"use strict";


const VERSION="v15.2";



const colours={

sell:{
bg:"rgba(0,255,120,.25)",
border:"#00ff66"
},

premium:{
bg:"rgba(255,215,0,.25)",
border:"#ffd700"
},

duplicate:{
bg:"rgba(0,180,255,.25)",
border:"#0099ff"
},

junk:{
bg:"rgba(255,50,50,.25)",
border:"#ff3333"
}

};



function money(v){

if(!v) return NaN;

return Number(
v
.replace(/,/g,"")
.replace(/[^\d.]/g,"")
);

}



function decorate(row,type,label){

row.style.backgroundColor=colours[type].bg;
row.style.outline=`2px solid ${colours[type].border}`;

let first=row.querySelector("td");

if(first && !first.innerText.includes("★")){

first.innerHTML=
`<b>★ ${label}</b><br>`+
first.innerHTML;

}

}




function findTable(){


for(const table of document.querySelectorAll("table")){


let text=table.innerText.toLowerCase();


if(
text.includes("ask") &&
text.includes("bid") &&
text.includes("value") &&
text.includes("copies")
){

return table;

}

}


return null;

}




function run(){



if(document.querySelector("#ns-manager-dashboard"))
return;



const table=findTable();



if(!table){

setTimeout(run,1000);
return;

}





let rows=[
...table.querySelectorAll("tr")
];




let stats={

sell:0,
premium:0,
duplicate:0,
junk:0,
other:0,
cards:0,
mv:0,
bid:0

};




rows.forEach(row=>{


let cells=[
...row.querySelectorAll("td")
];


if(cells.length<5)
return;



let text=row.innerText;



let rarity=
text.match(
/(COMMON|UNCOMMON|RARE|ULTRA-RARE|EPIC|LEGENDARY)/
);


if(!rarity)
return;


stats.cards++;



let numbers=
cells.map(x=>money(x.innerText));



/*
NationStates layout:

Auction
Card
Ask
Bid
Value
Copies

*/

let ask=numbers[1];
let bid=numbers[2];
let value=numbers[3];
let copies=numbers[4]||1;




if(isNaN(value))
return;



stats.mv+=value*copies;


if(!isNaN(bid))
stats.bid+=bid*copies;




/*
SELL RULE

Only if someone is genuinely paying
above market.
*/

if(
!isNaN(bid)
&&
bid>value
&&
bid>=1
&&
bid/value>=1.5
){

stats.sell++;

decorate(
row,
"sell",
`SELL OPPORTUNITY ${bid.toFixed(2)} (${Math.round(bid/value*100)}% MV)`
);

return;

}





/*
PREMIUM

*/

if(value>=10){

stats.premium++;

decorate(
row,
"premium",
`PREMIUM MV ${value.toFixed(2)}`
);

return;

}





/*
DUPLICATES

Only valuable stacks.
*/

if(
copies>=5
&&
value>=0.50
){

stats.duplicate++;

decorate(
row,
"duplicate",
`DUPLICATE INVESTMENT x${copies}`
);

return;

}





if(
value<=0.01
&&
copies<=1
){

stats.junk++;

decorate(
row,
"junk",
`JUNK REVIEW MV ${value.toFixed(2)}`
);

return;

}



stats.other++;



});






let dash=document.createElement("div");

dash.id="ns-manager-dashboard";


dash.style.cssText=
`
padding:12px;
margin:12px 0;
background:#111;
color:white;
border:2px solid #333;
font-family:Arial;
`;



dash.innerHTML=

`

<h3>📊 NationStates Collection Manager ${VERSION}</h3>

🟢 Sell opportunities:
<b>${stats.sell}</b><br>

🟣 Premium cards:
<b>${stats.premium}</b><br>

🔷 Duplicate investments:
<b>${stats.duplicate}</b><br>

🔴 Junk review:
<b>${stats.junk}</b><br>

⚪ Other cards:
<b>${stats.other}</b>

<hr>

📦 Cards scanned:
<b>${stats.cards}</b>

<br>

💰 Visible Page MV:
<b>${stats.mv.toFixed(2)}</b> bank

<br>

💵 Visible bids:
<b>${stats.bid.toFixed(2)}</b> bank


<hr>

Rules:

<ul>
<li>Never sell below Market Value</li>
<li>Premium cards are protected</li>
<li>Duplicates require meaningful value</li>
<li>Only strong bids create sell alerts</li>
<li>Totals are for the visible page</li>
</ul>

`;



table.parentNode.insertBefore(
dash,
table
);



}



setTimeout(run,1500);



})();
