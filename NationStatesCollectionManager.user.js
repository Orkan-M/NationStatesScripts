// ==UserScript==
// @name         Orks' NationStates Collection Manager
// @namespace    Orks
// @version      13.3
// @description  Intelligent Trading Card portfolio manager. Tracks value, protects holdings, finds real sell opportunities and manages duplicates.
// @author       Orks
// @match        https://www.nationstates.net/page=deck/value_deck=1*
// @match        https://www.nationstates.net/page=deck/collection=*
// @grant        none
// ==/UserScript==


(() => {

"use strict";


const VERSION = "v13.3";



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


    const result =
        Number(
            v
            .replace(/,/g,"")
            .replace(/[^\d.]/g,"")
        );


    return isNaN(result)
        ? NaN
        : result;

}






function decorate(row,type,text){

    row.style.backgroundColor =
        colours[type].bg;


    row.style.outline =
        `2px solid ${colours[type].border}`;


    const first =
        row.querySelector("td");


    if(
        first &&
        !first.innerHTML.includes("★")
    ){

        first.innerHTML =
            `<b>★ ${text}</b><br>` +
            first.innerHTML;

    }

}






let stats = {

    opportunity:0,
    premium:0,
    duplicate:0,
    junk:0,

    mv:0,
    bids:0

};






const table =
    document.querySelector(
        "table"
    );


if(!table)
    return;







const rows =
    [...table.querySelectorAll("tr")]
    .slice(1);






rows.forEach(row=>{


    const cells =
        [...row.querySelectorAll("td")];



    /*
        Collection page format:

        0 = Season
        1 = Card
        2 = Ask
        3 = Bid
        4 = Value
        5 = Copies
    */


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



    const copies =
        money(
            cells[5]?.innerText
        ) || 1;




    /*
        Ignore broken rows.

        Prevents:
        Infinity%
        Fake sell opportunities
        Auction pages being detected
    */


    if(
        isNaN(mv)
        ||
        mv <= 0
    ){

        return;

    }





    stats.mv +=
        mv * copies;



    if(!isNaN(bid))
        stats.bids +=
            bid * copies;







    /*
    ================================================
    TRUE SELL OPPORTUNITY
    ================================================

    Only sell if:

    - Someone is bidding above MV
    - MV exists
    - The premium is real

    */


    if(
        !isNaN(bid)
        &&
        bid > mv
    ){

        stats.opportunity++;


        const gain =
            ((bid-mv)/mv)*100;



        decorate(
            row,
            "opportunity",
            `SELL OPPORTUNITY ${bid.toFixed(2)} (+${gain.toFixed(0)}%)`
        );


        return;

    }







    /*
    ================================================
    PREMIUM COLLECTION
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
    ================================================

    Multiple copies increase exposure
    to future MV growth.

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



box.style.padding =
"10px";


box.style.margin =
"10px 0";


box.style.border =
"2px solid #333";


box.style.background =
"#111";


box.style.color =
"white";



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
<li>Sell only when buyers exceed MV</li>
<li>Duplicates are long-term investments</li>
<li>Market Value increases reward collectors</li>
</ul>

`;





table.parentNode.insertBefore(
    box,
    table
);



})();
