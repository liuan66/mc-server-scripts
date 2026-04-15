const scriptName = "全自动寻怪" // 1.12.2兼容版
GlobalVars.toggleBoolean(scriptName);
if (isEnabled()) {
    Chat.log(`§7[§b${scriptName}§7] §2Enabled`);
} else {
    // Chat.log(`§7[§b${scriptName}§7] §4Disabled`);
}

const BaritoneAPI = Java.type("baritone.api.BaritoneAPI");
const GoalBlock = Java.type("baritone.api.pathing.goals.GoalBlock");

// 配置
const maxDistance = 100; // 最大检测与跟随范围（格）
const attackRange = 5; // 攻击有效范围（格）
const followStopDistance = 3; // 跟随停止距离
const targetKeywords = ["冰霜龙母", "亚格鲁斯", "5c副本传送"]; // 关键词数组

// 变量 
let currentTarget = null;
let scriptControlled = false;


function cleanText(text) {
    return text.replace(/§./g, '').replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '');
}

function hasAnyKeyword(text, keywords) {
    return keywords.some(keyword => text.includes(keyword));
}

function isEnabled() {
    return GlobalVars.getBoolean(scriptName);
}

// 监听器
if (isEnabled()) {
    const tickListener = JsMacros.on("Tick", JavaWrapper.methodToJava(() => {
        currentTarget = null;

        const player = Player.getPlayer();
        if (!player) return;
        const playerPos = player.getPos();

        const allEntities = World.getEntities();
        for (let i = 0; i < allEntities.length; i++) {
            const entity = allEntities[i];
            if (entity === player) continue;

            const entityPos = entity.getPos();
            const distance = Math.sqrt(
                Math.pow(entityPos.x - playerPos.x, 2) +
                Math.pow(entityPos.y - playerPos.y, 2) +
                Math.pow(entityPos.z - playerPos.z, 2)
            );

            if (distance <= maxDistance) {
                const rawName = entity.getName().getString();
                const cleanName = cleanText(rawName);

                if (hasAnyKeyword(cleanName, targetKeywords) &&
                    (!currentTarget || distance < currentTarget.distance)) {
                    currentTarget = {
                        entity: entity,
                        distance: distance,
                        pos: entityPos,
                        cleanName: cleanName
                    };
                }
            }
        }
    }));

    const Close = JsMacros.on("Key", JavaWrapper.methodToJava(event => {
        Client.waitTick(1)
        if (!isEnabled()) {
            Chat.log(`§7[§b${scriptName}§7] §4Disabled`);
            JsMacros.off(tickListener)
            JsMacros.off(Close)
            const baritone = BaritoneAPI.getProvider().getPrimaryBaritone();
            if (baritone) baritone.getPathingBehavior().cancelEverything();
            // JavaWrapper.stop();
        }
    }));

    Chat.actionbar(`实体攻击+跟随脚本已启动，搜索含关键词[${targetKeywords.join(', ')}]的实体.`);
}

const baritone = BaritoneAPI.getProvider().getPrimaryBaritone();
while (isEnabled()) {
    try {
        if (currentTarget) {

            scriptControlled = true;
            const target = currentTarget;


            if (!target.entity.isAlive()) {
                currentTarget = null;
                scriptControlled = false;
                Client.waitTick(10);
                continue;
            }

            if (target.distance <= attackRange) {
                // 攻击范围内，停止移动并攻击
                if (baritone.getPathingBehavior().isPathing()) {
                    baritone.getPathingBehavior().cancelEverything();
                }

                const eyeHeight = target.entity.getEyeHeight();
                Player.getPlayer().lookAt(
                    target.pos.x,
                    target.pos.y + eyeHeight,
                    target.pos.z
                );

                Player.getInteractionManager().attack(target.entity);
                Client.waitTick(10); // 攻击频率
            }

            else if (target.distance > followStopDistance) {

                baritone.getCustomGoalProcess().setGoalAndPath(
                    new GoalBlock(
                        Math.floor(target.pos.x),
                        Math.floor(target.pos.y),
                        Math.floor(target.pos.z)
                    )
                );
                Client.waitTick(20); // 路径更新频率
            } else {
                // 在停止距离内，停止移动
                if (baritone.getPathingBehavior().isPathing()) {
                    baritone.getPathingBehavior().cancelEverything();
                }
                Client.waitTick(1);
            }
        } else {

            if (scriptControlled) {
                if (baritone.getPathingBehavior().isPathing()) {
                    baritone.getPathingBehavior().cancelEverything();
                }
                scriptControlled = false; // 重置标记
            }
            Client.waitTick(10);
        }
    } catch (e) {
        Chat.log("主逻辑出错: " + e.message + "，堆栈: " + e.stack);
        Client.waitTick(500);
    }
}
