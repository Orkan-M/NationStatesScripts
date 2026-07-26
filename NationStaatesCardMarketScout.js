// ==UserScript==
// @name         NationStates Card Market Scout
// @namespace    Orks
// @version      5.0
// @description  Smart NationStates card market scanner. Highlights only actionable opportunities and fades irrelevant listings.
// @author       Orks
// @match        https://*.nationstates.net/*show_market=cards*
// @match        https://*.nationstates.net/*show_market=auctions*
// @grant        none
// ==/UserScript==

(() => {

'use strict';



const colours = {

buy:{
    bg:'rgba(0,255,100,0.30)',
    border:'#00ff66'
},

premium:{
    bg:'rgba(255,215,0,0.35)',
    border:'#ffd700'
},

junk:{
    bg:'rgba(0,170,255,0.30)',
    border:'#0099ff'
},

avoid:{
    bg:'rgba(255,70,70,0.30)',
    border:'#ff4444'
}

};



const junkValues = {

COMMON:0.01,
UNCOMMON:0.05,
RARE:0.10,
'ULTRA-RARE':0.20,
EPIC:0.50,
LEGENDARY:1.00

};





function money(value){

if(!value)
return 0;

return Number(
value
.replace(/,/g,'')
.replace(/[^\d.]/g,'')
) || 0;

}





function fade(row){

row.style.opacity = "0.25";
row.style.filter = "grayscale(80%)";

row.addEventListener(
'mouseenter',
()=>{
row.style.opacity="1";
row.style.filter="none";
}
);

row.addEventListener(
'mouseleave',
()=>{
row.style.opacity="0.25";
row.style.filter="grayscale(80%)";
}
);

}





function mark(row,type,message){

row.style.opacity="1";
row.style.filter="none";

row.style.background =
colours[type].bg;

row.style.outline =
`2px solid ${colours[type].border}`;


const first =
row.querySelector('td:first-child');


if(first && !first.innerHTML.includes('★')){

first.innerHTML =
`★ ${message}<br>` +
first.innerHTML;

}

}





const table =
document.querySelector(
'.auctionstopcardstable, .auctionslisttable'
);


if(!table)
return;







[...table.querySelectorAll('tr')]
.slice(1)
.forEach(row=>{


const cells =
row.querySelectorAll('td');


if(cells.length < 4)
return;



const text =
row.innerText;



const rarity =
text.match(
/(COMMON|UNCOMMON|RARE|ULTRA-RARE|EPIC|LEGENDARY)/
)?.[1];


if(!rarity){

fade(row);
return;

}





const ask =
money(
cells[2]?.innerText
);



const bid =
money(
cells[3]?.innerText
);



const mv =
money(
cells[4]?.innerText
);



if(!ask || !mv){

fade(row);
return;

}







/*
================================================
JUNK FLOOR BUY
================================================
*/


const junk =
junkValues[rarity] || 0;


if(
ask <= junk
){

mark(
row,
'junk',
`JUNK FLOOR BUY ${junk.toFixed(2)}`
);

return;

}







/*
================================================
NO FALSE SIGNALS

If market is already paying MV,
there is no buying edge.
================================================
*/


if(
bid >= mv
){

fade(row);
return;

}







/*
================================================
PREMIUM BUY
================================================
*/


if(
mv >= 10 &&
ask <= mv * 0.60
){

mark(
row,
'premium',
`PREMIUM BUY MV ${mv.toFixed(2)}`
);

return;

}







/*
================================================
NORMAL BUY
================================================
*/


if(
mv < 10 &&
ask <= mv * 0.50
){

mark(
row,
'buy',
`BUY OPPORTUNITY MV ${mv.toFixed(2)}`
);

return;

}







/*
================================================
OVERPRICED
================================================
*/


if(
ask >= mv * 5 &&
bid < mv
){

mark(
row,
'avoid',
`OVERPRICED MV ${mv.toFixed(2)}`
);

return;

}






// Everything else is noise
fade(row);



});

})();
