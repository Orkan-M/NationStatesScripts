// ==UserScript==
// @name         NationStates Collection Manager
// @namespace    Orks
// @version      15.3
// @description  Restored v13.5 logic with corrected parsing and portfolio protection.
// @author       Orks
// @match        https://www.nationstates.net/page=deck/value_deck=1*
// @grant        none
// ==/UserScript==


(() => {

"use strict";


const VERSION="v15.3";



const colours={


opportunity:{
bg:"rgba(0,255,120,0.25)",
border:"#00ff66"
},


premium:{
bg:"rgba(255,215,0,0.30)",
border:"#ffd700"
},


duplicate:{
bg:"rgba(0,180,255,0.25)",
border:"#0099ff"
},


junk:{
bg:"rgba(255,60,60,0.25)",
border:"#ff3333"
},


floor:{
bg:"rgba(150,150,150,0.20)",
border:"#888"
},


hold:{
bg:"rgba(180,180,180,0.15)",
border:"#999"
}


};





function money(v){

if(!v)
return NaN;


v=v.trim();


if(
v==="—" ||
v==="-" ||
v===""
)
return NaN;


let n =
v
.replace(/,/g,"")
.match(/[\d.]+/);


return n ? Number(n[0]) : NaN;

}





function decorate(row,type,text){


row.style.backgroundColor=
colours[type].bg;


row.style.outline=
`2px solid ${colours[type].border}`;



let first =
row.querySelector("td");


if(
first &&
!first.innerHTML.includes("★")
){

first.innerHTML=
`<b>★ ${text}</b><br>`+
first.innerHTML;

}


}






let stats={

opportunity:0,
premium:0,
duplicate:0,
junk:0,
floor:0,
hold:0,
mv:0,
bids:0,
cards:0

};





const table =
[...document.querySelectorAll("table")]
.find(t=>{

let txt=t.innerText.toLowerCase();

return(
txt.includes("ask") &&
txt.includes("bid") &&
txt.includes("value") &&
txt.includes("copies")
);

});



if(!table)
return;





const rows =
[
...table.querySelectorAll("tr")
];





rows.forEach(row=>{


const cells =
[
...row.querySelectorAll("td")
];



/*
Ignore headers/footer
*/

if(cells.length<6)
return;



const txt =
row.innerText;



const rarity =
txt.match(
/(COMMON|UNCOMMON|RARE|ULTRA-RARE|EPIC|LEGENDARY)/
);



if(!rarity)
return;




/*

NationStates layout:

0 Auction
1 Card
2 Ask
3 Bid
4 Value
5 Copies

*/


const ask =
money(cells[2].innerText);


const bid =
money(cells[3].innerText);


const mv =
money(cells[4].innerText);


const copies =
money(cells[5].innerText) || 1;



if(
isNaN(mv)
)
return;



stats.cards++;


stats.mv += mv * copies;



if(!isNaN(bid))
stats.bids += bid * copies;






/*
================================
SELL OPPORTUNITY
================================

Real buyers only.

Bid must exceed MV.

*/


if(
!isNaN(bid)
&&
bid>mv
&&
mv>0
){

stats.opportunity++;


decorate(
row,
"opportunity",
`SELL OPPORTUNITY ${bid.toFixed(2)} (${Math.round((bid/mv)*100)}% MV)`
);


return;

}






/*
================================
PREMIUM HOLD
================================
*/


if(
mv>=10
){

stats.premium++;


decorate(
row,
"premium",
`PREMIUM MV ${mv.toFixed(2)}`
);


return;

}







/*
================================
DUPLICATE INVESTMENT
================================
*/


if(
copies>=5
){

stats.duplicate++;


decorate(
row,
"duplicate",
`DUPLICATE INVESTMENT x${copies}`
);


return;

}







/*
================================
MARKET FLOOR
================================
*/


if(
mv<=0.50
){

stats.floor++;


decorate(
row,
"floor",
`MARKET FLOOR MV ${mv.toFixed(2)}`
);


return;

}






/*
================================
JUNK
================================
*/


if(
mv<0.25
&&
copies<=2
&&
isNaN(bid)
){

stats.junk++;


decorate(
row,
"junk",
`JUNK REVIEW MV ${mv.toFixed(2)}`
);


return;

}







stats.hold++;


decorate(
row,
"hold",
`HOLD MV ${mv.toFixed(2)}`
);



});







/*
================================
DASHBOARD
================================
*/


const box =
document.createElement("div");


box.style.cssText=
`
padding:12px;
margin:12px 0;
background:#111;
color:white;
border:2px solid #333;
font-family:Arial;
`;




box.innerHTML=

`

<h3>📊 NationStates Collection Manager ${VERSION}</h3>


🟢 Sell opportunities:
<b>${stats.opportunity}</b><br>


🟣 Premium cards:
<b>${stats.premium}</b><br>


🔷 Duplicate investments:
<b>${stats.duplicate}</b><br>


🔴 Junk review:
<b>${stats.junk}</b><br>


⚪ Hold:
<b>${stats.hold}</b>


<hr>


📦 Cards scanned:
<b>${stats.cards}</b>


<br>


💰 Current Page MV:
<b>${stats.mv.toFixed(2)}</b> bank


<br>


💵 Current bids:
<b>${stats.bids.toFixed(2)}</b> bank



<hr>


Rules:

<ul>

<li>Never sell below Market Value</li>

<li>Premium cards are protected</li>

<li>Duplicates are treated as investments</li>

<li>Only genuine bids create sell alerts</li>

<li>Low value cards are not automatically sold</li>

</ul>

`;




table.parentNode.insertBefore(
box,
table
);



})();
