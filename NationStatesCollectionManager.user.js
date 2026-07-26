// ==UserScript==
// @name         NationStates Collection Manager
// @namespace    Orks
// @version      13.8
// @description  Intelligent Trading Card portfolio manager. Tracks value, protects investments, detects genuine sells and duplicate opportunities.
// @author       Orks
// @match        https://www.nationstates.net/page=deck/value_deck=1*
// @match        https://www.nationstates.net/page=deck/collection=*
// @grant        none
// ==/UserScript==


(() => {

"use strict";


const VERSION = "v13.8";



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
        bg:"rgba(0,180,255,0.30)",
        border:"#0099ff"
    },

    junk:{
        bg:"rgba(255,60,60,0.30)",
        border:"#ff3333"
    }

};






function money(value){

    if(!value)
        return NaN;


    const cleaned =
        value
        .replace(/,/g,"")
        .replace(/[^\d.]/g,"");


    return Number(cleaned);

}







function fade(row){

    row.style.opacity = "0.25";
    row.style.filter = "grayscale(80%)";

}








function decorate(row,type,label){


    row.style.opacity = "1";
    row.style.filter = "none";


    row.style.backgroundColor =
        colours[type].bg;


    row.style.outline =
        `2px solid ${colours[type].border}`;



    const first =
        row.querySelector("td");



    if(
        first
        &&
        !first.innerHTML.includes("★")
    ){

        first.innerHTML =
            `<b>★ ${label}</b><br>`+
            first.innerHTML;

    }

}









/*
================================================
FIND CARD TABLE
================================================
*/


let table = null;



for(
    const t of document.querySelectorAll("table")
){

    const headers =
        t.innerText
        .toLowerCase();



    if(
        headers.includes("ask")
        &&
        headers.includes("bid")
        &&
        headers.includes("value")
        &&
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
COLUMN FINDER
================================================
*/


let columns = {

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



headerRows.forEach(row=>{


    [...row.children]
    .forEach((cell,index)=>{


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

            columns[text]=index;

        }


    });


});









const stats = {

    opportunity:0,
    premium:0,
    duplicate:0,
    junk:0,
    mv:0,
    bids:0

};









/*
================================================
PROCESS ROWS
================================================
*/


[
    ...table.querySelectorAll("tr")
]
.forEach(row=>{


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
        );



    if(!rarity)
        return;







    const bid =
        money(
            cells[columns.bid]?.innerText
        );



    const mv =
        money(
            cells[columns.value]?.innerText
        );



    const copies =
        money(
            cells[columns.copies]?.innerText
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
    ================================================
    SELL OPPORTUNITY

    Requires meaningful value.

    ================================================
    */


    if(
        !isNaN(bid)
        &&
        mv >= 1
        &&
        bid > mv
        &&
        bid < mv * 5
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
    PREMIUM
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
    DUPLICATES

    Only valuable stacks.

    ================================================
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
    ================================================
    JUNK
    ================================================
    */


    if(
        mv < 0.25
        &&
        copies <= 2
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
    ================================================
    EVERYTHING ELSE
    ================================================
    */


    fade(row);



});









/*
================================================
DASHBOARD
================================================
*/


const dashboard =
document.createElement("div");



dashboard.style.padding="10px";
dashboard.style.margin="10px 0";
dashboard.style.background="#111";
dashboard.style.color="white";
dashboard.style.border="2px solid #333";



dashboard.innerHTML = `

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

💰 Page MV:
<b>${stats.mv.toFixed(2)}</b> bank

<br>

💵 Page bids:
<b>${stats.bids.toFixed(2)}</b> bank

<hr>

Rules:

<ul>
<li>Only actionable cards stay visible</li>
<li>Cheap duplicates ignored</li>
<li>High-value stacks highlighted</li>
<li>Sell alerts require real demand</li>
<li>Pagination supported</li>
</ul>

`;




table.parentNode.insertBefore(
    dashboard,
    table
);



})();
