// ==UserScript==
// @name         NationStates Collection Manager
// @namespace    Orks
// @version      13.2
// @description  Intelligent Trading Card portfolio manager. Protects value, tracks duplicates, identifies real opportunities and avoids bad sells.
// @author       Orks
// @match        https://www.nationstates.net/page=deck*
// @grant        none
// ==/UserScript==

(() => {

"use strict";


const VERSION = "v13";


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


    return Number(
        v
        .replace(/,/g,"")
        .replace(/[^\d.]/g,"")
    );

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
            `<b>★ ${text}</b><br>`+
            first.innerHTML;

    }

}



let stats = {

    opportunity:0,
    premium:0,
    duplicate:0,
    junk:0,
    hold:0,
    mv:0,
    bids:0

};



const table =
    document.querySelector("table");


if(!table)
    return;



const rows =
[...table.querySelectorAll("tr")]
.slice(1);



rows.forEach(row=>{


    const cells =
        [...row.querySelectorAll("td")];

    if(cells.length < 5)
        return;


    const txt =
        row.innerText;


    const rarity =
        txt.match(
        /(COMMON|UNCOMMON|RARE|ULTRA-RARE|EPIC|LEGENDARY)/
        )?.[1];


    const ask =
        money(cells[2]?.innerText);


    const bid =
        money(cells[3]?.innerText);


    const mv =
        money(cells[4]?.innerText);


    const copies =
        money(
            cells[5]?.innerText
        ) || 1;


    if(isNaN(mv))
        return;


    stats.mv += mv * copies;


    if(!isNaN(bid))
        stats.bids += bid * copies;


    /*
        TRUE SELL OPPORTUNITY

        Only sell when somebody
        actually values it above MV.

        Equality is ignored.
    */


    if(
        !isNaN(bid)
        &&
        bid > mv
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
        PREMIUM HOLDINGS

        Important cards.
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
        DUPLICATE INVESTMENTS

        More copies = more upside.
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
        MARKET FLOOR

        Cards around common pricing
        are not sell targets.
    */


    if(
        mv <= 0.50
    ){

        stats.hold++;

        decorate(
            row,
            "floor",
            `MARKET FLOOR MV ${mv.toFixed(2)}`
        );

        return;

    }



    /*
        JUNK REVIEW

        Only genuinely dead cards.
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



    stats.hold++;

    decorate(
        row,
        "hold",
        `HOLD MV ${mv.toFixed(2)}`
    );


});




/*
    Dashboard
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

💰 Current Page MV:
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
<li>Duplicates are investments</li>
<li>Market growth rewards collectors</li>
</ul>

`;


table.parentNode.insertBefore(
    box,
    table
);

})();
