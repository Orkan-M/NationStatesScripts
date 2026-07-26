// ==UserScript==
// @name         NationStates Collection Manager
// @namespace    Orks
// @version      13.4
// @description  Intelligent Trading Card portfolio manager. Tracks value, protects investments, detects genuine sells and duplicate opportunities.
// @author       Orks
// @match        https://www.nationstates.net/page=deck/value_deck=1*
// @match        https://www.nationstates.net/page=deck/collection=*
// @grant        none
// ==/UserScript==


(() => {

"use strict";


const VERSION = "v13.4";



const colours = {

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
    }

};





function money(v){

    if(!v)
        return NaN;


    const n =
        Number(
            v
            .replace(/,/g,"")
            .replace(/[^\d.]/g,"")
        );


    return isNaN(n) ? NaN : n;

}





function decorate(row,type,text){

    row.style.backgroundColor =
        colours[type].bg;


    row.style.outline =
        `2px solid ${colours[type].border}`;


    const first =
        row.querySelector("td");


    if(first && !first.innerHTML.includes("★")){

        first.innerHTML =
            `<b>★ ${text}</b><br>` +
            first.innerHTML;

    }

}







/*
================================================
FIND THE CORRECT TABLE
================================================
*/


const tables =
[
    ...document.querySelectorAll("table")
];



let table = null;



for(const t of tables){


    const headers =
    [...t.querySelectorAll("th")]
    .map(x=>x.innerText.trim().toLowerCase());


    if(
        headers.includes("bid") &&
        headers.includes("value") &&
        headers.includes("copies")
    ){

        table = t;
        break;

    }

}



if(!table)
    return;









/*
================================================
MAP COLUMNS BY HEADER
================================================
*/


const headerCells =
[
    ...table.querySelectorAll("tr:first-child th")
];


const columns = {};



headerCells.forEach((h,i)=>{

    columns[
        h.innerText
        .trim()
        .toLowerCase()
    ] = i;

});






/*
================================================
STATS
================================================
*/


const stats = {

    opportunity:0,
    premium:0,
    duplicate:0,
    junk:0,
    mv:0,
    bids:0

};








const rows =
[
    ...table.querySelectorAll("tr")
]
.slice(1);







rows.forEach(row=>{


    const cells =
    [
        ...row.querySelectorAll("td")
    ];



    if(cells.length < 5)
        return;





    const txt =
        row.innerText;





    const rarity =
        txt.match(
        /(COMMON|UNCOMMON|RARE|ULTRA-RARE|EPIC|LEGENDARY)/
        )?.[1];



    if(!rarity)
        return;





    const ask =
        money(
            cells[columns["ask"]]?.innerText
        );



    const bid =
        money(
            cells[columns["bid"]]?.innerText
        );



    const mv =
        money(
            cells[columns["value"]]?.innerText
        );



    const copies =
        money(
            cells[columns["copies"]]?.innerText
        ) || 1;






    /*
        Ignore broken data
    */


    if(
        isNaN(mv)
        ||
        mv <= 0
    )
        return;






    stats.mv += mv * copies;



    if(!isNaN(bid))
        stats.bids += bid * copies;









    /*
    ================================================
    SELL OPPORTUNITY

    Only:
    - real buyer exists
    - buyer pays above MV
    - not corrupted data
    ================================================
    */


    if(
        !isNaN(bid)
        &&
        bid > mv
        &&
        bid < mv * 10
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
    ================================================
    PREMIUM HOLDINGS

    Valuable cards only.
    ================================================
    */


    if(
        mv >= 10
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
    ================================================
    DUPLICATE INVESTMENTS

    Multiple copies create upside.
    ================================================
    */


    if(
        copies >= 5
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
    ================================================
    JUNK REVIEW

    Only genuine dead cards.
    ================================================
    */


    if(
        mv < 0.25
        &&
        copies <= 2
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



});









/*
================================================
DASHBOARD
================================================
*/


const box =
document.createElement("div");



box.style.padding="10px";
box.style.margin="10px 0";
box.style.border="2px solid #333";
box.style.background="#111";
box.style.color="white";



box.innerHTML = `

<h3>📊 Orks' NationStates Collection Manager ${VERSION}</h3>


🟢 Sell opportunities:
<b>${stats.opportunity}</b>
<br>


🟣 Premium cards:
<b>${stats.premium}</b>
<br>


🔷 Duplicate investments:
<b>${stats.duplicate}</b>
<br>


🔴 Junk review:
<b>${stats.junk}</b>


<hr>


💰 Collection MV:
<b>${stats.mv.toFixed(2)}</b> bank


<br>


💵 Current bids:
<b>${stats.bids.toFixed(2)}</b> bank


<hr>


Rules:

<ul>
<li>Never sell at Market Value</li>
<li>Never sell at junk value</li>
<li>Only sell when buyers exceed MV</li>
<li>Duplicates are investments</li>
<li>Only actionable cards are highlighted</li>
</ul>

`;





table.parentNode.insertBefore(
    box,
    table
);



})();
