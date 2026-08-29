(() => {
  const boardEl = document.getElementById("board");
  const kbEl = document.getElementById("keyboard");
  const streakEl = document.getElementById("streak");
  const bestEl = document.getElementById("best");
  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlay-title");
  const overlayMsg = document.getElementById("overlay-msg");
  const overlayBtn = document.getElementById("overlay-btn");

  const WORDS = ("about,above,actor,admit,adopt,after,again,agent,agree,ahead,alarm,album,alert,alien,alike,alive,allow,alone,along,anger,angle,angry,apart,apple,apply,arena,argue,arise,armor,aroma,array,arrow,aside,audio,avoid,awake,award,aware,badge,baker,basic,batch,beach,began,begin,being,below,bench,berry,birth,black,blade,blame,blank,blast,blaze,blend,bless,blind,block,blood,bloom,board,boast,bonus,boost,booth,bound,brain,brand,brave,bread,break,brick,bride,brief,bring,broad,brook,brown,brush,build,bunch,burst,cabin,cable,candy,cargo,carry,catch,cause,chain,chair,chalk,charm,chart,chase,cheap,check,cheer,chess,chest,chief,child,chill,chose,civil,claim,clash,class,clean,clear,clerk,click,cliff,climb,clock,close,cloth,cloud,coach,coast,color,comet,coral,couch,count,court,cover,crack,craft,crane,crash,cream,crime,crisp,cross,crowd,crown,curve,cycle,daily,dance,death,debut,delay,delta,dense,depth,digit,diner,dirty,donor,doubt,dozen,draft,drain,drama,dream,dress,drift,drink,drive,eager,eagle,early,earth,eight,elbow,elder,elect,empty,enemy,enjoy,enter,entry,equal,error,event,every,exact,exist,extra,fable,faith,false,fancy,fault,favor,feast,fence,fever,field,fifth,fifty,fight,final,first,flame,flash,fleet,flesh,float,flock,floor,flour,fluid,focus,force,forge,forth,forty,forum,found,frame,fresh,front,frost,fruit,fully,funny,ghost,giant,given,glass,globe,glory,glove,grace,grade,grain,grand,grant,grape,grasp,grass,grave,great,green,greet,grill,gross,group,grove,guard,guess,guest,guide,habit,happy,harsh,heart,heavy,hedge,hello,honey,honor,horse,hotel,house,human,humor,hurry,ideal,image,imply,index,inner,input,issue,ivory,jelly,joint,judge,juice,label,labor,large,laser,later,laugh,layer,learn,lease,least,leave,legal,lemon,level,light,limit,liver,local,logic,loose,lower,loyal,lucky,lunch,magic,major,maker,maple,march,match,maybe,mayor,medal,media,melon,mercy,merge,merit,metal,meter,micro,might,minor,minus,mixed,model,money,month,moral,motor,mount,mouse,mouth,movie,music,naval,nerve,never,newly,night,noble,noise,north,noted,novel,nurse,ocean,offer,often,olive,onion,opera,orbit,order,organ,other,ought,ounce,outer,owner,paint,panel,paper,party,patch,pause,peace,pearl,penny,phase,phone,photo,piano,piece,pilot,pitch,pizza,place,plain,plane,plant,plate,plaza,point,polar,pound,power,press,price,pride,prime,print,prize,proof,proud,prove,pulse,punch,pupil,queen,quick,quiet,quite,quota,quote,radar,radio,raise,rally,ranch,range,rapid,ratio,reach,react,ready,realm,rebel,refer,relax,reply,rider,ridge,rifle,right,rigid,risky,river,roast,robot,rocky,round,route,royal,rural,salad,scale,scene,scope,score,sense,serve,seven,shade,shaft,shake,shall,shape,share,sharp,sheep,sheet,shelf,shell,shift,shine,shirt,shock,shore,short,shout,sight,silly,since,sixth,skill,skirt,slate,sleep,slice,slide,small,smart,smile,smoke,snack,snake,solar,solid,solve,sorry,sound,south,space,spare,spark,speak,speed,spend,spice,spike,spine,split,sport,squad,stack,staff,stage,stair,stake,stand,stare,start,state,steam,steel,steep,stick,still,stock,stone,store,storm,story,strip,study,style,sugar,suite,sunny,super,surge,sweet,swift,swing,sword,table,taste,teach,thank,theme,there,thick,thing,think,third,three,throw,thumb,tiger,tight,title,toast,today,token,total,touch,tower,trace,track,trade,trail,train,treat,trend,trial,tribe,trick,troop,truck,truly,trust,truth,tutor,twist,ultra,uncle,under,union,unite,unity,upper,urban,usage,usual,valid,value,vapor,vault,venue,video,vigor,virus,visit,vital,vivid,vocal,voice,vowel,wagon,waste,watch,water,weigh,weird,whale,wheat,wheel,where,which,while,white,whole,widow,width,windy,witch,world,worry,worse,worth,wound,woven,wrist,write,wrong,yield,young,youth").split(",");

  const ROWS = 6;
  const KB_ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
  const STREAK_KEY = "neon-arcade-word-streak";

  let answer, row, col, guesses, done, revealing;
  const tiles = [];
  const keyEls = {};

  bestEl.textContent = Arcade.getBest("word");
  streakEl.textContent = localStorage.getItem(STREAK_KEY) || "0";

  for (let r = 0; r < ROWS; r++) {
    const rowEl = document.createElement("div");
    rowEl.className = "word-row";
    const rowTiles = [];
    for (let c = 0; c < 5; c++) {
      const t = document.createElement("div");
      t.className = "wtile";
      rowEl.appendChild(t);
      rowTiles.push(t);
    }
    boardEl.appendChild(rowEl);
    tiles.push(rowTiles);
  }

  KB_ROWS.forEach((letters, i) => {
    const rowEl = document.createElement("div");
    rowEl.className = "kb-row";
    if (i === 2) rowEl.appendChild(makeKey("ENTER", "enter"));
    for (const ch of letters) rowEl.appendChild(makeKey(ch, ch));
    if (i === 2) rowEl.appendChild(makeKey("DEL", "del"));
    kbEl.appendChild(rowEl);
  });

  function makeKey(label, value) {
    const b = document.createElement("button");
    b.className = "kb-key" + (value === "enter" || value === "del" ? " wide" : "");
    b.textContent = label;
    b.addEventListener("click", () => input(value));
    if (value.length === 1) keyEls[value] = b;
    return b;
  }

  function newGame() {
    answer = WORDS[Math.floor(Math.random() * WORDS.length)];
    row = 0;
    col = 0;
    guesses = [];
    done = false;
    revealing = false;
    overlay.classList.add("hidden");
    tiles.flat().forEach((t) => {
      t.textContent = "";
      t.className = "wtile";
    });
    Object.values(keyEls).forEach((k) => (k.className = "kb-key"));
  }

  function input(value) {
    if (done || revealing) return;
    if (value === "enter") return submit();
    if (value === "del") {
      if (col > 0) {
        col -= 1;
        tiles[row][col].textContent = "";
        tiles[row][col].classList.remove("filled");
      }
      return;
    }
    if (col < 5) {
      tiles[row][col].textContent = value;
      tiles[row][col].classList.add("filled");
      col += 1;
      Sound.click();
    }
  }

  function grade(guess) {
    const res = Array(5).fill("gray");
    const remain = {};
    for (let i = 0; i < 5; i++) {
      if (guess[i] === answer[i]) res[i] = "green";
      else remain[answer[i]] = (remain[answer[i]] || 0) + 1;
    }
    for (let i = 0; i < 5; i++) {
      if (res[i] !== "green" && remain[guess[i]] > 0) {
        res[i] = "yellow";
        remain[guess[i]] -= 1;
      }
    }
    return res;
  }

  function submit() {
    if (col < 5) return;
    const guess = tiles[row].map((t) => t.textContent).join("");
    const res = grade(guess);
    revealing = true;
    const thisRow = row;

    res.forEach((state, i) => {
      setTimeout(() => {
        tiles[thisRow][i].classList.add(state);
        Sound.flip();
        const k = keyEls[guess[i]];
        if (k) {
          const rank = { green: 3, yellow: 2, gray: 1 };
          const cur = ["green", "yellow", "gray"].find((s) => k.classList.contains(s));
          if (!cur || rank[state] > rank[cur]) {
            k.classList.remove("green", "yellow", "gray");
            k.classList.add(state);
          }
        }
      }, i * 130);
    });

    setTimeout(() => {
      revealing = false;
      if (guess === answer) return endGame(true);
      row += 1;
      col = 0;
      if (row === ROWS) endGame(false);
    }, 5 * 130 + 60);
  }

  function endGame(won) {
    done = true;
    let streak = Number(localStorage.getItem(STREAK_KEY)) || 0;
    if (won) {
      streak += 1;
      Sound.win();
      overlayTitle.textContent = "SOLVED!";
      const isBest = Arcade.saveBest("word", streak);
      overlayMsg.innerHTML =
        "Got it in " + (row + 1) + (row === 0 ? " try" : " tries") +
        " · streak " + streak + (isBest ? "<br>🏆 New best streak!" : "");
    } else {
      streak = 0;
      Sound.die();
      overlayTitle.textContent = "OUT OF TRIES";
      overlayMsg.textContent = "The word was “" + answer.toUpperCase() + "”.";
    }
    localStorage.setItem(STREAK_KEY, String(streak));
    streakEl.textContent = String(streak);
    bestEl.textContent = Arcade.getBest("word");
    overlay.classList.remove("hidden");
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") input("enter");
    else if (e.key === "Backspace") input("del");
    else if (/^[a-zA-Z]$/.test(e.key)) input(e.key.toLowerCase());
  });

  overlayBtn.addEventListener("click", newGame);
  newGame();
})();
