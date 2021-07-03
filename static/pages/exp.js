//expcalc index.html
function calculator(){
	var rarityValue = document.getElementById("rarity");
	var mapName = document.getElementById("mapName");
	var switchHotTime = document.getElementById("switchHotTime");
  
	var currentLevel = document.getElementById("currentLvl");
	var currentXp = document.getElementById("currentXp");
	var goalLvl = document.getElementById("goalLvl");
	
	// Child Exp for each rarity.
	var childXp = [
    [30,33,36,39,42,46,50,55,60],
    [46,50,55,60,66,71,76,82,88,95,102,110,118,127,137,147,158,170,183],
    [91,99,106,114,123,132,142,153,164,177,187,198,209,221,234,248,262,277,293,310,328,347,367,389,412,436,462,489,518],
    [275,262,277,293,310,328,347,367,389,412,436,462,489,518,549,576,604,634,665,698,732,768,806,846,888,932,978,1026,1077,1130,1186,1245,1307,1372,1440,1512,1587,1666,1749],
    [815,768,806,846,888,932,978,1026,1077,1130,1186,1245,1307,1372,1440,1512,1587,1666,1749,1836,1900,1966,2034,2105,2178,2254,2332,2413,2497,2584,2674,2767,2863,2963,3066,3173,3284,3398,3516,3639,3766,3897,4033,4174,4320,4471,4627,4788,4955],
    [1100,1036,1088,1142,1198,1258,1320,1385,1453,1525,1601,1680,1764,1852,1944,2041,2142,2249,2361,2478,2565,2654,2745,2841,2940,3042,3148,3257,3370,3488,3609,3735,3865,4000,4139,4283,4433,4587,4746,4912,5084,5260,5444,5634,5832,6035,6246,6463,6689,6922,7164,7414,7673,7941,8218,8505,8802,9110,9420]
  ]
  
  	// Map Name, Exp, Stamina
	var mapArray = [
	["Chapter One 4-6-#",76,9],
	["Chapter One 5-8-#",99,11],
	["Chapter One 6-8-#",134,13],
	["Chapter One 7-8-#",192,15],
	["Chapter One 8-8-#",227,17],
	["Chapter Two 1-4-#",351,25],
	["Chapter Two 2-2-3",366,25],
	["Chapter Two 3-2-3",381,25],
	["Chapter Two 4-2-3",401,25],
	["Chapter Two Int. Ch. 2 III-5",406,25],
	["Chapter Two Int. Ch. 2 III-6",406,25],
	["Chapter Two Int. Ch. 2 IV-7",452,25],
	["Chapter Two Int. Ch. 2 IV-8",452,25],
	["Chapter 4 - 1-III-5",504,25],
	["Chapter 4 - 1-III-6",504,25],
	["Chapter 4 - 1-IV-7",560,25],
	["Chapter 4 - 1-IV-8",560,25]
	]
  
	var calculateButton = document.getElementById("calculateBtn");
	var resultBox = document.getElementById("result");
	calculateButton.addEventListener("click", calculate);
	
  
	function totalRequiredXp(rarity,startlvl,endlvl,currentxp){
		var totalrequiredxp = 0;
		var requiredXpArray = childXp[rarity].slice(startlvl-1,endlvl-1);
		requiredXpArray.forEach(i=>{
				totalrequiredxp += i;
			})
		return totalrequiredxp-currentxp;
	}
  
	function calculate(){
		var rarity = rarityValue.selectedIndex-1;
		var mapNumber = mapName.selectedIndex-1;
		var boolht = switchHotTime.checked;
		var currentlvl = parseFloat(currentLevel.value)||0;
		var currentxp = parseFloat(currentXp.value)||0;
		var goallvl = parseFloat(goalLvl.value)||0;
		var caplvl;
		
    
		switch (rarity){
			case 0:
				caplvl=10;
				break;
			case 1:
				caplvl=20;
				break;
			  case 2:
				caplvl=30;
				break;
			  case 3:
				caplvl=40;
				break;
			  case 4:
				caplvl=50;
				break;
			  case 5:
				caplvl=60; 
				break;
		}
    
    //Field Validation
	if (rarity<0){
		alert("Please input a Rarity");
		return;
	}
	if (mapNumber<0){
		alert("Please select a Map");
		return;
	}
	if (rarity==0&&currentlvl<1){
		alert("Please enter a Current Level between 1 through 9");
		return;
	} else if(rarity==1&&currentlvl<1){
		alert("Please enter a Current Level between 1 through 19");
		return;
	} else if(rarity==2&&currentlvl<1){
		alert("Please enter a Current Level between 1 through 29");
		return;
	} else if(rarity==3&&currentlvl<1){
		alert("Please enter a Current Level between 1 through 39");
		return;
	} else if(rarity==4&&currentlvl<1){
		alert("Please enter a Current Level between 1 through 49");
		return;
	} else if(rarity==5&&currentlvl<1){
		alert("Please enter a Current Level between 1 through 59");
		return;
	}
	if (currentxp<0){
		alert("Please enter a Current Exp value higher than or equal to 0");
		return;
	}
    if (goallvl<=currentlvl||goallvl>caplvl||currentxp>=childXp[rarity][currentlvl-1]){
		alert("Please verify input fields");
		return;
	}
    
    //exp calculations
    var mapname = mapArray[mapNumber][0];
    var mapxp = mapArray[mapNumber][1];
    var mapstam = mapArray[mapNumber][2];
    if (boolht){
      mapxp=mapxp*2;
    }
    var requiredxp = totalRequiredXp(rarity, currentlvl, goallvl, currentxp);
    var runs = Math.ceil(requiredxp/mapxp);
    var totalstam = runs*mapstam
    var xpperstam = Number.parseFloat(mapxp/mapstam).toPrecision(4);
    

    
    resultBox.placeholder=`To get your ${rarity+1}★ Child from Lv${currentlvl} to Lv${goallvl}, you'll need...
	
Exp Required:\t\t${requiredxp}
Runs Required:\t\t${runs}
Stamina Required:\t${totalstam}💖

${mapname} gives ${mapxp} Exp and consumes ${mapstam} Stamina (${xpperstam} exp/stam)`;
    
		resultBox.style.display="block";
  }
}

//--------------------------------------------------------------------------------------------------------------------------------------
//page railroad switch
var pageId;
switch (pageId){
	case 0:
		index();
		break;
}