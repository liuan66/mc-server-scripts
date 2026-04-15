JsMacros.assertEvent(event, "Service");

// === 配置参数 ===
const maxDistance = 25; // 玩家检测范围（格）
const attackRange = 8; // 有效攻击范围（格）
const targetPlayerNames = ["幻界魔化营长", "目标玩家2"]; // 需攻击的玩家名（支持带颜色）


let currentTarget = null; // 当前攻击目标
const isAutoAttacking = true; // 始终开启自动攻击


const d2d = Hud.createDraw2D();
let tpsDisplay = null;
let playerTitle = null;
let attackStatusDisplay = null; // 显示攻击状态
let nearbyPlayers = [];
let playerTextObjects = [];


const screenWidth = d2d.getWidth();
const baseY = 20; // 起始Y坐标
const hudX = screenWidth - 750; // 距右边缘距离


function cleanText(text) {
    return text.replace(/§./g, '').replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '');
}


d2d.setOnInit(JavaWrapper.methodToJava(() => {
   
    tpsDisplay = d2d.addText('TPS: 0', hudX, baseY, 0xFFFFFF, true);
    
    
    attackStatusDisplay = d2d.addText(
        `自动攻击: 已开启`, 
        hudX, baseY + 20, 0xFF0000, true 
    );
    
    
    playerTitle = d2d.addText(`附近玩家（${maxDistance}格内）:`, hudX, baseY + 40, 0xFFFF00, true);
}));


const tickListener = JsMacros.on("Tick", JavaWrapper.methodToJava(() => {
    
    const tps = World.getServerTPS();
    tpsDisplay.setText('TPS: ' + tps);
    
    
    playerTextObjects.forEach(text => d2d.removeText(text));
    playerTextObjects = [];
    nearbyPlayers = [];
    currentTarget = null;
    
    // 获取本地玩家
    const player = Player.getPlayer();
    if (!player) return;
    const playerPos = player.getPos();
    
   
    const allEntities = World.getEntities();
    for (let i = 0; i < allEntities.length; i++) {
        const entity = allEntities[i];
      
        if (entity.getType() === 'minecraft:player' && entity !== player) {
            
            const entityPos = entity.getPos();
            const distance = Math.sqrt(
                Math.pow(entityPos.x - playerPos.x, 2) +
                Math.pow(entityPos.y - playerPos.y, 2) +
                Math.pow(entityPos.z - playerPos.z, 2)
            );
            
            
            if (distance <= maxDistance) {
                const rawName = entity.getPlayerName();
                const cleanName = cleanText(rawName); 
                nearbyPlayers.push({ 
                    rawName: rawName,
                    cleanName: cleanName,
                    distance: Math.round(distance * 10) / 10 
                });
                
                
                if (targetPlayerNames.includes(cleanName) && distance <= attackRange) {
                    currentTarget = entity;
                }
            }
        }
    }

    
    nearbyPlayers.sort((a, b) => a.distance - b.distance);
    nearbyPlayers.forEach((player, index) => {
        
        const color = targetPlayerNames.includes(player.cleanName) ? 0xFF0000 : 0xFFFFFF;
        const yPos = baseY + 60 + (index * 15); 
        const text = d2d.addText(
            `${player.rawName} - 距离: ${player.distance}格`,
            hudX,
            yPos,
            color,
            true
        );
        playerTextObjects.push(text);
    });
}));

JavaWrapper.methodToJavaAsync(() => {
    
    const interactionManager = Player.getInteractionManager();
    if (!interactionManager) {
        Chat.log("无法获取交互管理器，攻击功能无法启动");
        return;
    }
    
    while (true) {
        try {
            if (currentTarget && interactionManager) {
               
                const targetPos = currentTarget.getPos();
                Player.getPlayer().lookAt(
                    targetPos.x, 
                    targetPos.y + 1.62, 
                    targetPos.z
                );
                
                
                interactionManager.attack(currentTarget);
                Client.waitTick(10); 
            }
            Client.waitTick(1); 
        } catch (e) {
            Chat.log("攻击出错: " + e.message);
            Client.waitTick(500); 
        }
    }
}).run();


d2d.register();


event.stopListener = JavaWrapper.methodToJava(() => {
    d2d.unregister();
    JsMacros.off(tickListener);
    Chat.log("自动攻击脚本已停止");
});


Chat.actionbar("自动攻击已启动，始终处于开启状态");
