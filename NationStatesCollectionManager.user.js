// ==UserScript==
// @name         NationStates Collection Manager
// @namespace    Orks
// @version      15.0
// @description  Intelligent Trading Card portfolio manager. Tracks value, protects investments, detects genuine sells and duplicate opportunities.
// @author       Orks
// @match        https://www.nationstates.net/page=deck/value_deck=1*
// @match        https://www.nationstates.net/page=deck/collection=*
// @grant        none
// ==/UserScript==


(() => {

"use strict";


const VERSION = "v15.0";



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

    hold:{
        bg:"rgba(180,180,180,0.15)",
        border:"#999"
    }

};





function money(value){

    if(!value)
        return NaN;


    value =
        value
        .replace(/,/g,"")
        .replace(/[^\d.]/g,"");


    if(value==="")
        return NaN;


    return Number(value);

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
FIND CARD TABLE
================================================
*/


let table = null;


for(const t of document.querySelectorAll("table")){


    const text =
        t.innerText.toLowerCase();



    if(
        text.includes("card")
        &&
        text.includes("ask")
        &&
        text.includes("bid")
        &&
        text.includes("value")
        &&
        text.includes("copies")
    ){

        table=t;
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


let columns = {

    ask:null,
    bid:null,
    value:null,
    copies:null

};



const headerRows =
[
    ...table.querySelectorAll("tr")
];



for(const row of headerRows){


    [...row.children].forEach((cell,index)=>{


        const text =
            cell.innerText
            .trim()
            .toLowerCase();



        if(text==="ask")
            columns.ask=index;


        if(text==="bid")
            columns.bid=index;


        if(text==="value")
            columns.value=index;


        if(text==="copies")
            columns.copies=index;


    });


}




/*
Fallback
NationStates layout
*/


if(columns.value===null){

    columns = {

        ask:2,
        bid:3,
        value:4,
        copies:5

    };

}





const stats = {

    opportunity:0,
    premium:0,
    duplicate:0,
    junk:0,
    hold:0,

    mv:0,
    bids:0

};








/*
================================================
ANALYSE ROWS
================================================
*/


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
        ) || 1;





    if(
        isNaN(mv)
        ||
        mv<=0
    )
        return;





    stats.mv += mv * copies;



    if(!isNaN(bid))
        stats.bids += bid * copies;









    /*
    =============================================
    REAL SELL OPPORTUNITY
    =============================================

    Only:
    - real bid
    - bid above value
    - not absurd

    */


    if(

        !isNaN(bid)

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
    PREMIUM
    */


    if(mv>=10){


        stats.premium++;


        decorate(
            row,
            "premium",
            `PREMIUM MV ${mv.toFixed(2)}`
        );


        return;

    }








    /*
    DUPLICATES

    Only valuable stacks
    */


    if(
        copies>=5
        &&
        mv>=0.50
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
    JUNK
    */


    if(

        mv < 0.25

        &&

        copies <=2

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
<b>${stats.opportunity}</b><br>


🟣 Premium cards:
<b>${stats.premium}</b><br>


🔷 Duplicate investments:
<b>${stats.duplicate}</b><br>


🔴 Junk review:
<b>${stats.junk}</b><br>


⚪ Other cards:
<b>${stats.hold}</b>


<hr>


💰 Collection MV:
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

<li>Only meaningful bids trigger sell alerts</li>

<li>Only visible collection pages are analysed</li>

</ul>

`;




table.parentNode.insertBefore(
    box,
    table
);



})();
