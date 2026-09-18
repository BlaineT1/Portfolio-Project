// Volume settings
let volume;
if (JSON.parse(localStorage.getItem("volumeData")) == undefined) {
    volume = {
        master: 100 / 100,
        bgm: (80 / 100) / 2,
        sfx: 100 / 100
    }
} else {
    volume = JSON.parse(localStorage.getItem("volumeData"));
}


// BGM
let bgmDungeon;
let bgmBattleMain;
let bgmBattleBoss;
let bgmBattleGuardian;

// SFX
let sfxEncounter;
let sfxEnemyDeath;
let sfxAttack;
let sfxLvlUp;
let sfxConfirm;
let sfxDecline;
let sfxDeny;
let sfxEquip;
let sfxUnequip;
let sfxOpen;
let sfxPause;
let sfxUnpause;
let sfxSell;
let sfxItem;
let sfxBuff;

const setVolume = () => {
    // ===== BGM =====
    bgmDungeon = new Howl({
        src: ['./assets/bgm/dungeon.mp3'],
        volume: volume.bgm * volume.master,
        loop: true
    });

    bgmBattleMain = new Howl({
        src: ['./assets/bgm/battle_main.mp3'],
        volume: volume.bgm * volume.master,
        loop: true
    });

    bgmBattleBoss = new Howl({
        src: ['./assets/bgm/battle_boss.mp3'],
        volume: volume.bgm * volume.master,
        loop: true
    });

    bgmBattleGuardian = new Howl({
        src: ['./assets/bgm/battle_guardian.mp3'],
        volume: volume.bgm * volume.master,
        loop: true
    });

    // ===== SFX =====
    sfxEncounter = new Howl({
        src: ['./assets/sfx/encounter.mp3'],
        volume: volume.sfx * volume.master
    });

    sfxCombatEnd = new Howl({
        src: ['./assets/sfx/combat_end.mp3'],
        volume: volume.sfx * volume.master
    });

    sfxAttack = new Howl({
        src: ['./assets/sfx/attack.mp3'],
        volume: volume.sfx * volume.master
    });

    sfxLvlUp = new Howl({
        src: ['./assets/sfx/level_up.mp3'],
        volume: volume.sfx * volume.master
    });

    sfxConfirm = new Howl({
        src: ['./assets/sfx/confirm.mp3'],
        volume: volume.sfx * volume.master
    });

    sfxDecline = new Howl({
        src: ['./assets/sfx/decline.mp3'],
        volume: volume.sfx * volume.master
    });

    sfxDeny = new Howl({
        src: ['./assets/sfx/denied.mp3'],
        volume: volume.sfx * volume.master
    });

    sfxEquip = new Howl({
        src: ['./assets/sfx/equip.mp3'],
        volume: volume.sfx * volume.master
    });

    sfxUnequip = new Howl({
        src: ['./assets/sfx/unequip.mp3'],
        volume: volume.sfx * volume.master
    });

    sfxOpen = new Howl({
        src: ['./assets/sfx/hover.mp3'],
        volume: volume.sfx * volume.master
    });

    sfxPause = new Howl({
        src: ['./assets/sfx/pause.mp3'],
        volume: volume.sfx * volume.master
    });

    sfxUnpause = new Howl({
        src: ['./assets/sfx/unpause.mp3'],
        volume: volume.sfx * volume.master
    });

    sfxSell = new Howl({
        src: ['./assets/sfx/sell.mp3'],
        volume: volume.sfx * volume.master
    });

    sfxItem = new Howl({
        src: ['./assets/sfx/item_use.mp3'],
        volume: volume.sfx * volume.master
    });

    sfxBuff = new Howl({
        src: ['./assets/sfx/buff.mp3'],
        volume: volume.sfx * volume.master
    });
}

document.querySelector("#title-screen").addEventListener("click", function () {
    setVolume();
    sfxOpen.play();
});
