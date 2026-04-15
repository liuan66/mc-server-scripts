const height = 300;
const ground = -60;
const posx = 1000000;
const posz = 1000000;
const threshold = ground + 60;
const firework_slot = 7;//0-8
const totem_slot = 8;
const bottle_slot = 2;
const end_distance = 2500;

Hud.clearDraw3Ds();
var closeKey = "key.keyboard.f12";
JsMacros.on("Key", JavaWrapper.methodToJava((e, ctx) => {
    if (e.key == closeKey) {
        Chat.log('脚本关闭了。');
        JavaWrapper.stop();
    };
}));
function distance(nowx,nowz){
    return Math.sqrt((nowx-posx)*(nowx-posx) + (nowz-posz)*(nowz-posz) );
}
function flight(){
    const player = Player.getPlayer();
    const inter = Player.getInteractionManager();
    const inv = Player.openInventory();
    let angle = distance(player.getX(),player.getY() );
    if (inv.getSlot(6).getItemId()!="minecraft:elytra") {
        Chat.log('§c没有装备鞘翅！');
        return;
    }
    inv.setSelectedHotbarSlotIndex(firework_slot);
    Client.waitTick(3);
    Chat.actionbar("§e自动飞行脚本已开始！，预定高度："+height);
    Client.waitTick(3);
    player.lookAt(posx,angle,posz);
    Client.waitTick(3);
    //player.lookAt(0.0,-45);
    Client.waitTick(3);
    KeyBind.pressKeyBind("key.jump");
    Client.waitTick(3);
    KeyBind.releaseKeyBind("key.jump");
    Client.waitTick(3);
    KeyBind.pressKeyBind("key.jump");
    Client.waitTick(3);
    KeyBind.releaseKeyBind("key.jump");
    while(player.getY()<height&&player.getMainHand().getItemId()=="minecraft:firework_rocket" ) {
        angle = distance(player.getX(),player.getY() );
        player.lookAt(posx,angle,posz);
        inter.interact();
        Client.waitTick(80);
    }
    Client.waitTick(5);
    angle = distance(player.getX(),player.getY() );
    while(player.getY()>threshold) {
        angle = distance(player.getX(),player.getY() );
        player.lookAt(posx,-angle,posz);
        Client.waitTick(10);
    } 
    angle = distance(player.getX(),player.getY() );
    player.lookAt(posx,-angle/2.5,posz);
    inv.setSelectedHotbarSlotIndex(totem_slot);
    Chat.actionbar("§e自动飞行脚本已结束！");
    while(player.getY()>ground+1);
    return;
}
function check_elytra(){
    const intera = Player.getInteractionManager();
    const myinv = Player.openInventory();
    Player.getPlayer().lookAt(0,90);
    Client.waitTick(3);
    myinv.setSelectedHotbarSlotIndex(bottle_slot);
    while(myinv.getSlot(6).getDurability() < myinv.getSlot(6).getMaxDurability() ) {
        intera.interact();
        Client.waitTick(3);
    }
    if(Player.getPlayer().getMainHand().getItemId()!="minecraft:experience_bottle"){
        JavaWrapper.stop();
    }
}
function main(){
    const myself = Player.getPlayer();
    while(distance(myself.getX(),myself.getZ() )>end_distance) {
        check_elytra();
        flight();
    }
}
main();