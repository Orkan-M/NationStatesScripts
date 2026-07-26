// ==UserScript==
// @name         NationStates Collection Manager
// @namespace    Orks
// @version      15.1
// @description  Intelligent Trading Card portfolio manager. Tracks value, protects investments, detects genuine sells and duplicate opportunities.
// @author       Orks
// @match        https://www.nationstates.net/page=deck/value_deck=1*
// @match        https://www.nationstates.net/page=deck/collection=*
// @grant        none
// ==/UserScript==


(() => {

"use strict";


const VERSION="v15.1";


const colours={

sell:{
bg:"rgba(0,255,120,0.25)",
border:"#00ff66"
},

premium:{
bg:"rgba(255,215,0,0.25)",
border:"#ffd700"
},

duplicate:{
bg:"rgba(0,150,255,0.25)",
border:"#0099ff"
},

junk:{
bg:"rgba(255,50,50,0.20)",
border:"#ff3333"
}

};



function money(v){

if(!v) return NaN;

let x=v
.replace(/,/g,"")
.replace(/[^\d.]/g,"");

return Number(x);

}



function mark(row,type,text){

row.style.backgroundColor=colours[type].bg;
row.style.outline=`2px solid ${colours[type].border}`;

let first=row.querySelector("td");

if(first && !first.innerHTML.includes("★")){

first.innerHTML=
`<b>★ ${text}</b><br>`+
first.innerHTML;

}

}




/*
 FIND CARD TABLE
*/


let table=null;


for(const t of document.querySelectorAll("table")){

let h=t.innerText.toLowerCase();

if(
h.includes("ask") &&
h.includes("bid") &&
h.includes("value") &&
h.includes("copies")
){

table=t;
break;

}

}


if(!table) return;



/*
 COLUMN MAP
*/


let map={
ask:2,
bid:3,
value:4,
copies:5
};



const stats={

sell:0,
premium:0,
duplicate:0,
junk:0,
other:0,
mv:0,
bid:0,
cards:0

};



/*
 SCAN
*/


[...table.querySelectorAll("tr")].forEach(row=>{


let cells=[...row.querySelectorAll("td")];

if(cells.length<5)return;



let text=row.innerText;


if(
!/(COMMON|UNCOMMON|RARE|ULTRA-RARE|EPIC|LEGENDARY)/.test(text)
)
return;



let mv=money(cells[map.value]?.innerText);

let bid=money(cells[map.bid]?.innerText);

let copies=money(cells[map.copies]?.innerText)||1;



if(isNaN(mv))return;



stats.cards++;

stats.mv+=mv*copies;


if(!isNaN(bid))
stats.bid+=bid*copies;



/*
 SELL
*/


if(
!isNaN(bid)
&&
bid>mv
&&
bid>=1
&&
bid<=(mv*10)
){

stats.sell++;

mark(
row,
"sell",
`SELL OPPORTUNITY ${bid.toFixed(2)} (${Math.round((bid/mv)*100)}% MV)`
);

return;

}




/*
 PREMIUM
*/


if(mv>=10){

stats.premium++;

mark(
row,
"premium",
`PREMIUM MV ${mv.toFixed(2)}`
);

return;

}




/*
 DUPLICATES

 Only protect meaningful stacks
*/


if(
copies>=5
&&
mv>=0.50
){

stats.duplicate++;

mark(
row,
"duplicate",
`DUPLICATE INVESTMENT x${copies}`
);

return;

}




/*
 JUNK

 Much stricter
*/


if(
mv<=0.01
&&
copies===1
&&
isNaN(bid)
){

stats.junk++;

if(stats.junk<=10){

mark(
row,
"junk",
`JUNK REVIEW MV ${mv.toFixed(2)}`
);

}

return;

}



stats.other++;



});






/*
 DASHBOARD
*/


let box=document.createElement("div");


box.style.padding="10px";
box.style.margin="10px 0";
box.style.background="#111";
box.style.color="white";
box.style.border="2px solid #333";



box.innerHTML=`

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
box,
table
);



})();
