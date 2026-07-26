// ==UserScript==
// @name         NationStates Collection Manager
// @namespace    Orks
// @version      14.0
// @description  Intelligent Trading Card portfolio manager. Scans the entire collection, tracks value, protects investments, detects genuine sells and duplicate opportunities.
// @author       Orks
// @match        https://www.nationstates.net/page=deck/value_deck=1*
// @match        https://www.nationstates.net/page=deck/collection=*
// @grant        GM_xmlhttpRequest
// @connect      nationstates.net
// ==/UserScript==


(() => {

"use strict";


const VERSION = "v14.0";



const colours = {

    opportunity:{
        bg:"rgba(0,255,120,0.35)",
        border:"#00ff66"
    },

    premium:{
        bg:"rgba(255,215,0,0.35)",
        border:"#ffd700"
    },

    duplicate:{
        bg:"rgba(0,180,255,0.35)",
        border:"#0099ff"
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







function request(url){

    return new Promise(resolve=>{

        GM_xmlhttpRequest({

            method:"GET",
            url:url,

            onload(response){

                resolve(response.responseText);

            },

            onerror(){

                resolve("");

            }

        });


    });

}







function parsePage(html){

    const parser =
        new DOMParser();


    const doc =
        parser.parseFromString(
            html,
            "text/html"
        );


    let table=null;



    for(
        const t of doc.querySelectorAll("table")
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

            table=t;
            break;

        }

    }



    if(!table)
        return [];





    const cards=[];



    table.querySelectorAll("tr")
    .forEach(row=>{


        const cells =
        [
            ...row.querySelectorAll("td")
        ];



        if(cells.length < 6)
            return;



        const rarity =
            row.innerText.match(
            /(COMMON|UNCOMMON|RARE|ULTRA-RARE|EPIC|LEGENDARY)/
            )?.[1];



        if(!rarity)
            return;



        cards.push({

            rowText:row.innerText,

            ask:money(cells[2].innerText),

            bid:money(cells[3].innerText),

            mv:money(cells[4].innerText),

            copies:money(cells[5].innerText) || 1,

            rarity

        });


    });



    return cards;

}










async function loadCollection(){


    let all=[];


    for(
        let start=0;
        start<2000;
        start+=50
    ){


        const url =
        `https://www.nationstates.net/page=deck/value_deck=1?start=${start}`;



        const html =
            await request(url);



        if(!html)
            break;



        const cards =
            parsePage(html);



        if(cards.length===0)
            break;



        all.push(...cards);



        if(cards.length < 50)
            break;


    }



    return all;


}










function createDashboard(stats){


    const box =
        document.createElement("div");



    box.style.padding="10px";
    box.style.margin="10px 0";
    box.style.background="#111";
    box.style.color="white";
    box.style.border="2px solid #333";



    box.innerHTML = `

<h3>📊 NationStates Collection Manager ${VERSION}</h3>

🌍 Full Collection Scan

<hr>

🟢 Sell opportunities:
<b>${stats.sell}</b>

<br>

🟣 Premium cards:
<b>${stats.premium}</b>

<br>

🔷 Duplicate investments:
<b>${stats.duplicates}</b>

<hr>

💰 Total Collection MV:
<b>${stats.mv.toFixed(2)}</b> bank

<br>

💵 Total bids:
<b>${stats.bid.toFixed(2)}</b> bank

<hr>

Pages scanned:
<b>${stats.pages}</b>

`;



    document.body.prepend(box);

}









async function main(){


    const loading =
        document.createElement("div");


    loading.innerHTML =
    `
    <b>📊 NationStates Collection Manager ${VERSION}</b>
    <br>
    Scanning entire collection...
    `;


    loading.style.padding="10px";
    loading.style.background="#111";
    loading.style.color="white";


    document.body.prepend(loading);




    const cards =
        await loadCollection();




    loading.remove();





    const stats={

        sell:0,
        premium:0,
        duplicates:0,
        mv:0,
        bid:0,
        pages:Math.ceil(cards.length/50)

    };




    cards.forEach(card=>{


        if(
            !isNaN(card.mv)
        ){

            stats.mv +=
                card.mv *
                card.copies;

        }



        if(
            !isNaN(card.bid)
        ){

            stats.bid +=
                card.bid *
                card.copies;

        }




        if(
            !isNaN(card.bid)
            &&
            card.mv >= 1
            &&
            card.bid > card.mv
            &&
            card.bid < card.mv*5
        ){

            stats.sell++;

        }




        if(
            card.mv >= 10
        ){

            stats.premium++;

        }




        if(
            card.mv >= 1
            &&
            card.copies >= 5
        ){

            stats.duplicates++;

        }



    });





    createDashboard(stats);


}





main();



})();
