// ==UserScript==
// @name         NationStates Collection Manager
// @namespace    Orks
// @version      13.7
// @description  Intelligent Trading Card portfolio manager. Tracks value, protects investments, detects genuine sells and duplicate opportunities.
// @author       Orks
// @match        https://www.nationstates.net/page=deck/value_deck=1*
// @match        https://www.nationstates.net/page=deck/collection=*
// @grant        none
// ==/UserScript==


(() => {

"use strict";


const VERSION = "v13.7";



const colours = {

    opportunity:{
        bg:"rgba(0,255,120,0.30)",
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


    const cleaned =
        v
        .replace(/,/g,"")
        .replace(/[^\d.]/g,"");


    return Number(cleaned);

}







function decorate(row,type,text){


    row.style.backgroundColor =
        colours[type].bg;


    row.style.outline =
        `2px solid ${colours[type].border}`;


    row.style.opacity = "1";
    row.style.filter = "none";



    const first =
        row.querySelector("td");


    if(
        first
        &&
        !first.innerHTML.includes("★")
    ){

        first.innerHTML =
            `<b>★ ${text}</b><br>` +
            first.innerHTML;

    }

}








function fade(row){

    row.style.opacity = "0.25";
    row.style.filter = "grayscale(80%)";

}









/*
================================================
FIND NATIONSTATES CARD TABLE
================================================
*/


let table = null;



for(
    const t of document.querySelectorAll("table")
){

    const text =
        t.innerText.toLowerCase();


    if(
        text.includes("ask")
        &&
        text.includes("bid")
        &&
        text.includes("value")
        &&
        text.includes("copies")
    ){

        table = t;
        break;

    }

}



if(!table)
    return;









/*
================================================
COLUMN DETECTION
================================================
*/


let columnMap = {

    ask:2,
    bid:3,
    value:4,
    copies:5

};



const headerRows =
[
    ...table.querySelectorAll("tr")
]
.slice(0,5);



for(
    const row of headerRows
){

    [...row.children].forEach(
    (cell,index)=>{


        const text =
            cell.innerText
            .trim()
            .toLowerCase();



        if(
            text === "ask"
            ||
            text === "bid"
            ||
            text === "value"
            ||
            text === "copies"
        ){

            columnMap[text] = index;

        }

    });

}










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
];






rows.forEach(row=>{


    const cells =
    [
        ...row.querySelectorAll("td")
    ];



    if(cells.length < 5)
        return;





    const text =
        row.innerText;





    const rarity =
        text.match(
        /(COMMON|UNCOMMON|RARE|ULTRA-RARE|EPIC|LEGENDARY)/
        )?.[1];



    if(!rarity)
        return;







    const bid =
        money(
            cells[columnMap.bid]?.innerText
        );



    const mv =
        money(
            cells[columnMap.value]?.innerText
        );



    const copies =
        money(
            cells[columnMap.copies]?.innerText
        )
        ||
        1;







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
    =================================================
    SELL OPPORTUNITY

    Only meaningful opportunities:

    - MV must be at least 1
    - Buyer must exceed MV
    - Ignore unrealistic spikes
    =================================================
    */


    if(
        !isNaN(bid)
        &&
        mv >= 1
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
    =================================================
    PREMIUM CARDS

    High-value holdings.
    =================================================
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
    =================================================
    DUPLICATE INVESTMENTS

    Only flag meaningful stacks.
    =================================================
    */


    if(
        copies >= 5
        &&
        mv >= 1
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
    =================================================
    JUNK REVIEW

    Genuine low-value dead cards.
    =================================================
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







    /*
    =================================================
    EVERYTHING ELSE

    Fade irrelevant cards.
    =================================================
    */


    fade(row);



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

<h3>📊 NationStates Collection Manager ${VERSION}</h3>

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
<li>Only actionable cards stay highlighted</li>
<li>Cards below MV are ignored</li>
<li>Sell alerts require meaningful value</li>
<li>Duplicate alerts require valuable stacks</li>
<li>Everything else is faded</li>
</ul>

`;





table.parentNode.insertBefore(
    box,
    table
);



})();
